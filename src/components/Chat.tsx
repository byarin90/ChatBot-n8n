import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ulid } from 'ulid';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { type Message } from './ChatMessage';

const STORAGE_KEYS = {
  SESSION_ID: 'chat_session_id',
  MESSAGES: 'chat_messages',
};

export const Chat = () => {
  const getOrCreateSessionId = useCallback(() => {
    let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (!sessionId) {
      sessionId = ulid();
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    return sessionId;
  }, []);

  const loadMessages = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: Message) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
    return [
      {
        id: '1',
        text: 'שלום! אני כאן לעזור לך. איך אני יכול לסייע?',
        isUser: false,
        timestamp: new Date(),
      },
    ];
  }, []);

  const [sessionId] = useState(() => getOrCreateSessionId());
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const saveMessages = useCallback((newMessages: Message[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateMessages = useCallback(
    (newMessages: Message[]) => {
      setMessages(newMessages);
      saveMessages(newMessages);
    },
    [saveMessages]
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: ulid(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    const newMessagesWithUser = [...messages, userMessage];
    updateMessages(newMessagesWithUser);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('https://n8n.srv862915.hstgr.cloud/webhook/5dbfb8fd-fad3-4634-8638-d89222f12e2b/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: inputValue, sessionId, action: 'sendMessage' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botResponseText = data.response || data.message || data.output || data.text || (typeof data === 'string' ? data : 'מצטער, לא הצלחתי לעבד את ההודעה. נסה שוב.');

      const botMessage: Message = {
        id: ulid(),
        text: botResponseText,
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
      };

      const finalMessages = [...newMessagesWithUser, botMessage];
      updateMessages(finalMessages);
      setTypingMessageId(botMessage.id);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: ulid(),
        text: 'מצטער, יש בעיה בחיבור. נסה שוב מאוחר יותר.',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
      };
      const finalMessages = [...newMessagesWithUser, errorMessage];
      updateMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTypingComplete = (id: string) => {
    setTypingMessageId(null);
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, isTyping: false } : msg)));
  };

  return (
    <>
      <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end w-full sm:w-auto max-w-full">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-slate-800 cursor-pointer hover:bg-slate-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[calc(100vw-1rem)] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[calc(100vh-4rem)] sm:h-[500px] md:h-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            <ChatHeader onClose={() => setIsOpen(false)} />
            <ChatMessages
              messages={messages}
              typingMessageId={typingMessageId}
              onTypingComplete={handleTypingComplete}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
            />
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={sendMessage}
              loading={isLoading}
              inputRef={inputRef}
              onKeyPress={handleKeyPress}
            />
          </div>
        )}
      </div>
    </>
  );
};
