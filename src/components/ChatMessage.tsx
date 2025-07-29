import React from 'react';
import { TypingAnimation } from './TypingAnimation';
import LinkButton from './LinkButton';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: Message;
  typingMessageId: string | null;
  onTypingComplete: (id: string) => void;
}

const renderTextWithLinks = (text: string) => {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <LinkButton key={match.index} href={linkUrl} icon="🔗">
        {linkText}
      </LinkButton>
    );
    lastIndex = markdownLinkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    const urlParts: React.ReactNode[] = [];
    let urlLastIndex = 0;
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = urlRegex.exec(remainingText)) !== null) {
      if (urlMatch.index > urlLastIndex) {
        urlParts.push(remainingText.slice(urlLastIndex, urlMatch.index));
      }
      const url = urlMatch[1];
      urlParts.push(
        <LinkButton key={`url-${urlMatch.index}`} href={url}>
          <span>🌐</span>
          <span className="truncate max-w-[150px]">{url.replace(/^https?:\/\//, '')}</span>
          <span className="text-xs opacity-60">↗</span>
        </LinkButton>
      );
      urlLastIndex = urlRegex.lastIndex;
    }
    if (urlLastIndex < remainingText.length) {
      urlParts.push(remainingText.slice(urlLastIndex));
    }
    parts.push(...urlParts);
  }

  return parts.length > 0 ? parts : [text];
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, typingMessageId, onTypingComplete }) => (
  <div className={`flex items-start gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}> 
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${message.isUser ? 'bg-slate-800 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}
    >
      {message.isUser ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ) : (
        'AI'
      )}
    </div>
    <div className={`max-w-[80%] ${message.isUser ? 'text-right' : 'text-right'}`}> 
      <div
        className={`relative px-4 py-3 max-w-xs sm:max-w-sm md:max-w-md ${message.isUser ? 'bg-slate-800 text-white rounded-[18px] ml-auto' : 'bg-white text-slate-800 border border-slate-200 rounded-[18px] shadow-sm mr-auto'} ${message.isUser ? 'message-tail-right' : 'message-tail-left'}`}
      >
        <div
          className="text-sm leading-relaxed break-words"
          dir="rtl"
          style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', unicodeBidi: 'embed' }}
        >
          {message.isUser ? (
            message.text
          ) : message.isTyping && typingMessageId === message.id ? (
            <TypingAnimation
              text={message.text}
              speed={30}
              onComplete={() => onTypingComplete(message.id)}
            />
          ) : (
            renderTextWithLinks(message.text)
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1 px-2">
        {message.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
);

export default ChatMessage;
