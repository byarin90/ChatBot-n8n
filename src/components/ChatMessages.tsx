import React from 'react';
import ChatMessage, { type Message } from './ChatMessage';

interface ChatMessagesProps {
  messages: Message[];
  typingMessageId: string | null;
  onTypingComplete: (id: string) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  typingMessageId,
  onTypingComplete,
  isLoading,
  messagesEndRef,
}) => (
  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50/30">
    {messages.map((message) => (
      <ChatMessage key={message.id} message={message} typingMessageId={typingMessageId} onTypingComplete={onTypingComplete} />
    ))}
    {isLoading && (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-medium">
          AI
        </div>
        <div className="bg-white rounded-[18px] px-4 py-3 border border-slate-200 shadow-sm max-w-xs sm:max-w-sm md:max-w-md mr-auto message-tail-left">
          <div className="flex gap-1 items-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm text-slate-600 mr-2">מקליד...</span>
          </div>
        </div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </div>
);

export default ChatMessages;
