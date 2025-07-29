# Multi-Tenant Chatbot Platform Architecture

This document outlines the proposed architecture and example code snippets for building a scalable multi-tenant chatbot platform on top of the existing n8n-based chatbot and MongoDB backend.

## Overview

The system leverages AWS serverless services for scalability and security:

- **API Gateway** to expose HTTPS endpoints.
- **AWS Lambda** (Node.js / TypeScript) for stateless compute.
- **MongoDB Atlas** for persistent data storage.
- **Amazon SQS/SNS** (optional) for asynchronous event handling.
- **Amazon CloudWatch** for logging and metrics.

The platform supports organizations (tenants) that can embed a branded chatbot into their web sites via an API key. Each organization has isolated data (chat sessions, logs, usage stats) stored in MongoDB collections.

## Components

1. **Authentication & Authorization**
   - M2M authentication via OAuth2 Client Credentials or signed JWTs.
   - Each organization has a client ID and a hashed secret stored in MongoDB.
   - API Gateway authorizer validates JWT tokens on every request.
   - Rate limiting is enforced per organization using API Gateway usage plans.

2. **API Gateway Routes**

   | Route                              | Method | Description                                |
   |------------------------------------|--------|--------------------------------------------|
   | `/auth/token`                      | POST   | Issue JWT using client credentials         |
   | `/chat/message`                    | POST   | Public chat endpoint for website script    |
   | `/admin/orgs`                      | GET    | List organizations (super admin)           |
   | `/admin/orgs`                      | POST   | Create new organization                    |
   | `/admin/orgs/{id}`                 | PATCH  | Update organization settings               |
   | `/admin/orgs/{id}`                 | DELETE | Delete organization                        |
   | `/admin/orgs/{id}/logs`            | GET    | View chat logs for organization            |
   | `/admin/orgs/{id}/usage`           | GET    | Retrieve usage statistics                  |

3. **MongoDB Collections**

   - `organizations` – stores tenant information and hashed API secrets.
   - `chatSessions` – records each chatbot session with organizationId, start/end timestamps, and metadata.
   - `chatLogs` – stores individual chat messages with sessionId and token usage.
   - `usageStats` – aggregated counters (per organization and period). Alternatively, compute stats on demand via aggregation pipelines.

4. **Frontend Embedding Script**

   - Small `<script>` tag loaded from CDN or S3.
   - Initializes React-based chat widget.
   - Sends authenticated requests using the organization’s API key.
   - Supports color/logo customization via inline configuration.

5. **CI/CD**

   - Use GitHub Actions to lint, test, and deploy via the Serverless Framework.
   - Separate stages for dev, staging, and prod.
   - Environment variables managed via AWS Secrets Manager or Parameter Store.

## Database Schemas (Mongoose/TypeScript)

```ts
// models/Organization.ts
import { Schema, model, Types } from 'mongoose'

export interface ApiKey {
  keyId: string // ulid
  hashedSecret: string
  createdAt: Date
}

export interface Organization {
  _id: Types.ObjectId
  name: string
  branding: {
    primaryColor: string
    logoUrl?: string
  }
  apiKeys: ApiKey[]
  createdAt: Date
  updatedAt: Date
}

const ApiKeySchema = new Schema<ApiKey>({
  keyId: { type: String, required: true, unique: true },
  hashedSecret: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const OrganizationSchema = new Schema<Organization>({
  name: { type: String, required: true },
  branding: {
    primaryColor: { type: String, default: '#000000' },
    logoUrl: String,
  },
  apiKeys: [ApiKeySchema],
}, { timestamps: true })

export default model<Organization>('Organization', OrganizationSchema)
```

```ts
// models/ChatSession.ts
import { Schema, model, Types } from 'mongoose'

export interface ChatSession {
  _id: Types.ObjectId
  organizationId: Types.ObjectId
  sessionId: string
  startedAt: Date
  endedAt?: Date
  metadata?: Record<string, unknown>
}

const ChatSessionSchema = new Schema<ChatSession>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  sessionId: { type: String, required: true, unique: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  metadata: Schema.Types.Mixed,
})

export default model<ChatSession>('ChatSession', ChatSessionSchema)
```

```ts
// models/ChatLog.ts
import { Schema, model, Types } from 'mongoose'

export interface ChatLog {
  _id: Types.ObjectId
  sessionId: string
  organizationId: Types.ObjectId
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
  tokenUsage?: number
}

const ChatLogSchema = new Schema<ChatLog>({
  sessionId: { type: String, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tokenUsage: Number,
})

export default model<ChatLog>('ChatLog', ChatLogSchema)
```

## API Key Generation & JWT Validation

```ts
// utils/apiKey.ts
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import Organization from '../models/Organization'

const JWT_SECRET = process.env.JWT_SECRET!

export async function createApiKey(orgId: string) {
  const keyId = uuidv4()
  const secret = crypto.randomBytes(32).toString('hex')
  const hashedSecret = await bcrypt.hash(secret, 12)
  await Organization.updateOne(
    { _id: orgId },
    { $push: { apiKeys: { keyId, hashedSecret, createdAt: new Date() } } },
  )
  return { keyId, secret }
}

export function signJwt(keyId: string, orgId: string) {
  return jwt.sign({ sub: orgId, kid: keyId }, JWT_SECRET, { expiresIn: '15m' })
}

export async function verifyJwt(token: string) {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
  const org = await Organization.findById(payload.sub)
  if (!org) throw new Error('Invalid org')
  const apiKey = org.apiKeys.find(k => k.keyId === payload.kid)
  if (!apiKey) throw new Error('Invalid key')
  return { org, keyId: payload.kid }
}
```

## Example Lambda Handlers

```ts
// handlers/authToken.ts
import { APIGatewayProxyHandler } from 'aws-lambda'
import Organization from '../models/Organization'
import bcrypt from 'bcryptjs'
import { signJwt } from '../utils/apiKey'

export const handler: APIGatewayProxyHandler = async (event) => {
  const { clientId, clientSecret } = JSON.parse(event.body || '{}')
  const org = await Organization.findOne({ 'apiKeys.keyId': clientId })
  if (!org) {
    return { statusCode: 401, body: 'Invalid credentials' }
  }
  const key = org.apiKeys.find(k => k.keyId === clientId)!
  const valid = await bcrypt.compare(clientSecret, key.hashedSecret)
  if (!valid) {
    return { statusCode: 401, body: 'Invalid credentials' }
  }
  const token = signJwt(clientId, org.id)
  return { statusCode: 200, body: JSON.stringify({ accessToken: token }) }
}
```

```ts
// handlers/chatMessage.ts
import { APIGatewayProxyHandler } from 'aws-lambda'
import { verifyJwt } from '../utils/apiKey'
import ChatSession from '../models/ChatSession'
import ChatLog from '../models/ChatLog'
import { v4 as uuidv4 } from 'uuid'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authHeader = event.headers.authorization
    if (!authHeader) return { statusCode: 401, body: 'Missing token' }
    const token = authHeader.replace('Bearer ', '')
    const { org } = await verifyJwt(token)

    const { message, sessionId } = JSON.parse(event.body || '{}')
    const sid = sessionId || uuidv4()

    await ChatSession.updateOne(
      { sessionId: sid },
      { $setOnInsert: { organizationId: org.id, startedAt: new Date() } },
      { upsert: true },
    )

    await ChatLog.create({
      sessionId: sid,
      organizationId: org.id,
      role: 'user',
      message,
    })

    // Call n8n workflow (or OpenAI API) to generate a response
    const workflowResp = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: org.id,
        sessionId: sid,
        message,
      }),
    })
    const { reply, tokenUsage } = await workflowResp.json()
    const assistantMessage = reply

    await ChatLog.create({
      sessionId: sid,
      organizationId: org.id,
      role: 'assistant',
      message: assistantMessage,
      tokenUsage,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: sid, message: assistantMessage }),
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Internal Error' }
  }
}
```

## Serverless Framework Structure

```
├── serverless.yml
├── src/
│   ├── handlers/
│   │   ├── authToken.ts
│   │   ├── chatMessage.ts
│   │   ├── admin/
│   │   │   ├── listOrgs.ts
│   │   │   ├── createOrg.ts
│   │   │   └── ...
│   ├── models/
│   │   ├── Organization.ts
│   │   ├── ChatSession.ts
│   │   └── ChatLog.ts
│   └── utils/
│       └── apiKey.ts
└── docs/
```

Example `serverless.yml` snippet:

```yaml
service: chatbot-platform
provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    MONGODB_URI: ${ssm:/chatbot/MONGODB_URI}
    JWT_SECRET: ${ssm:/chatbot/JWT_SECRET}
functions:
  authToken:
    handler: dist/handlers/authToken.handler
    events:
      - http:
          path: auth/token
          method: post
  chatMessage:
    handler: dist/handlers/chatMessage.handler
    events:
      - http:
          path: chat/message
          method: post
          authorizer: jwtAuthorizer
  adminListOrgs:
    handler: dist/handlers/admin/listOrgs.handler
    events:
      - http:
          path: admin/orgs
          method: get
          authorizer: jwtAuthorizer
plugins:
  - serverless-esbuild
```

The `jwtAuthorizer` is a Lambda authorizer that verifies the JWT token using `verifyJwt`.

## Embedding Script Example

```js
// public/widget.js
(function () {
  const orgKey = window.CHATBOT_ORG_KEY
  const apiBase = window.CHATBOT_API_BASE

  async function fetchToken() {
    const resp = await fetch(apiBase + '/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: orgKey.id, clientSecret: orgKey.secret }),
    })
    const { accessToken } = await resp.json()
    return accessToken
  }

  async function sendMessage(token, sessionId, message) {
    const resp = await fetch(apiBase + '/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId, message }),
    })
    return resp.json()
  }

  // Initialize React widget using the above helpers
  // ...
})()
```

Organizations embed the script using:

```html
<script src="https://cdn.example.com/widget.js"></script>
<script>
  window.CHATBOT_ORG_KEY = { id: 'API_KEY_ID', secret: 'API_SECRET' }
  window.CHATBOT_API_BASE = 'https://api.example.com'
  // Optionally customize colors
</script>
```

The script exchanges the API key for a short-lived JWT token and uses it for subsequent chat requests.

## Implementation Plan (Step-by-Step)

1. **Initialize Repository** – Set up TypeScript project with Serverless Framework, ESLint, and Prettier.
2. **Define MongoDB Models** – Implement Mongoose models as shown above.
3. **Authentication Utilities** – Create helper functions for API key generation, hashing, JWT signing/verification.
4. **Lambda Handlers** – Implement handlers for auth, chat messaging, and admin routes. Use n8n or OpenAI to process messages.
5. **Serverless Deployment** – Configure `serverless.yml` with environment variables, build steps, and Lambda authorizers.
6. **Frontend Widget** – Build a lightweight script to initialize the React chat widget and communicate with the API securely.
7. **Admin UI** – Optionally build a React-based admin dashboard to manage organizations and view analytics.
8. **CI/CD** – Configure GitHub Actions to run `npm ci`, `npm run lint`, tests, and `serverless deploy` to appropriate AWS accounts.
9. **Security Hardening** – Enforce HTTPS, store secrets in AWS Secrets Manager, hash API secrets, and implement rate limiting via API Gateway.
10. **Future Features** – Add vector DB (e.g., Pinecone) integration per organization for RAG-based responses.

---

This document provides the foundation for building a production-ready, multi-tenant chatbot platform on AWS. Additional operational concerns such as monitoring, log retention, and cost optimization should be incorporated as part of the deployment process.

