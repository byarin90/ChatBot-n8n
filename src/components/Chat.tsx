import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ulid } from 'ulid';
import { TypingAnimation } from './TypingAnimation';
import LinkButton from './LinkButton';

// Clean modern chat bubbles without tails - professional look

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    isTyping?: boolean;
}

const STORAGE_KEYS = {
    SESSION_ID: 'chat_session_id',
    MESSAGES: 'chat_messages'
};

// פונקציה לעיבוד טקסט עם לינקים
const renderTextWithLinks = (text: string) => {
    // תבנית לזיהוי לינקים בפורמט Markdown: [טקסט](URL)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // תבנית לזיהוי URLs רגילים
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    // עיבוד לינקים בפורמט Markdown
    while ((match = markdownLinkRegex.exec(text)) !== null) {
        // הוספת הטקסט לפני הלינק
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        // הוספת הלינק המעוצב
        const linkText = match[1];
        const linkUrl = match[2];
        parts.push(
            <LinkButton key={match.index} href={linkUrl} icon='🔗'>
                {linkText}
            </LinkButton>
        );

        lastIndex = markdownLinkRegex.lastIndex;
    }

    // הוספת שאר הטקסט
    if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);

        // עיבוד URLs רגילים בשאר הטקסט
        const urlParts = [];
        let urlLastIndex = 0;
        let urlMatch;

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

export const Chat = () => {
    // יצירת sessionId קבוע או טעינה מ-localStorage
    const getOrCreateSessionId = useCallback(() => {
        let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
        if (!sessionId) {
            sessionId = ulid();
            localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
        }
        return sessionId;
    }, []);

    // טעינת הודעות מ-localStorage
    const loadMessages = useCallback(() => {
        try {
            const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
            if (savedMessages) {
                const parsed = JSON.parse(savedMessages);
                return parsed.map((msg: Message) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
        return [
            {
                id: '1',
                text: 'שלום! אני כאן לעזור לך. איך אני יכול לסייע?',
                isUser: false,
                timestamp: new Date()
            }
        ];
    }, []);

    const [sessionId] = useState(() => getOrCreateSessionId());
    const [messages, setMessages] = useState<Message[]>(loadMessages);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // שמירת הודעות ב-localStorage
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

    // עדכון הודעות עם שמירה ב-localStorage
    const updateMessages = useCallback((newMessages: Message[]) => {
        setMessages(newMessages);
        saveMessages(newMessages);
    }, [saveMessages]);

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
            timestamp: new Date()
        };

        const newMessagesWithUser = [...messages, userMessage];
        updateMessages(newMessagesWithUser);
        setInputValue('');
        setIsLoading(true);

        try {
            console.log('Sending message with sessionId:', sessionId);
            const response = await fetch('https://n8n.srv862915.hstgr.cloud/webhook/5dbfb8fd-fad3-4634-8638-d89222f12e2b/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatInput: inputValue,
                    sessionId: sessionId,
                    action: 'sendMessage'
                })
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            // נסה מספר שדות אפשריים לתגובה
            const botResponseText = data.response || data.message || data.output || data.text ||
                (typeof data === 'string' ? data : 'מצטער, לא הצלחתי לעבד את ההודעה. נסה שוב.');

            const botMessage: Message = {
                id: ulid(),
                text: botResponseText,
                isUser: false,
                timestamp: new Date(),
                isTyping: true
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
                isTyping: true
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

    return (
        <>
            <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end w-full sm:w-auto max-w-full">
            {/* כפתור פתיחת הצ'אט */}
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

            {/* חלון הצ'אט */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[calc(100vw-1rem)] sm:w-[380px] md:w-[420px] lg:w-[450px] h-[calc(100vh-4rem)] sm:h-[500px] md:h-[600px] max-h-[90vh] flex flex-col overflow-hidden">
                    {/* כותרת */}
                    <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm2.07-7.75l-.9.92C11.45 10.9 11 11.5 11 13h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H6c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 text-sm">עוזר AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <p className="text-xs text-slate-600">מקוון</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* אזור ההודעות */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50/30">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-start gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${message.isUser
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}>
                                    {message.isUser ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    ) : 'AI'}
                                </div>
                                <div className={`max-w-[80%] ${message.isUser ? 'text-right' : 'text-right'
                                    }`}>
                                    <div className={`relative px-4 py-3 max-w-xs sm:max-w-sm md:max-w-md ${message.isUser
                                            ? 'bg-slate-800 text-white rounded-[18px] ml-auto'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-[18px] shadow-sm mr-auto'
                                        } ${message.isUser ? 'message-tail-right' : 'message-tail-left'}`}>
                                        <div
                                            className="text-sm leading-relaxed break-words"
                                            dir="rtl"
                                            style={{
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                whiteSpace: 'pre-wrap',
                                                unicodeBidi: 'embed'
                                            }}
                                        >
                                            {message.isUser ? (
                                                message.text
                                            ) : message.isTyping && typingMessageId === message.id ? (
                                                <TypingAnimation
                                                    text={message.text}
                                                    speed={30}
                                                    onComplete={() => {
                                                        setTypingMessageId(null);
                                                        setMessages(prev =>
                                                            prev.map(msg =>
                                                                msg.id === message.id
                                                                    ? { ...msg, isTyping: false }
                                                                    : msg
                                                            )
                                                        );
                                                    }}
                                                />
                                            ) : (
                                                renderTextWithLinks(message.text)
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 px-2">
                                        {message.timestamp.toLocaleTimeString('he-IL', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* אנימציית טעינה */}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-medium">
                                    AI
                                </div>
                                <div className="bg-white rounded-[18px] px-4 py-3 border border-slate-200 shadow-sm max-w-xs sm:max-w-sm md:max-w-md mr-auto message-tail-left">
                                    <div className="flex gap-1 items-center">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-sm text-slate-600 mr-2">מקליד...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* אזור הקלט */}
                    <div className="p-2 sm:p-4 border-t border-slate-200 bg-white">
                        <div className="flex gap-2 sm:gap-3 items-end">
                            <div className="flex-1 relative">
                                <input
                                    dir='rtl'
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="הקלד הודעה..."
                                    disabled={isLoading}
                                    className="w-full border border-slate-300 hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-right disabled:bg-slate-50 disabled:border-slate-200 transition-all duration-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!inputValue.trim() || isLoading}
                                className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-colors duration-200 flex-shrink-0 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">לחץ Enter לשליחה</p>
                    </div>
                </div>
            )}
            </div>
        </>
    );
};