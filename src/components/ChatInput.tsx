import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  loading,
  inputRef,
  onKeyPress,
}) => (
  <div className="p-2 sm:p-4 border-t border-slate-200 bg-white">
    <div className="flex gap-2 sm:gap-3 items-end">
      <div className="flex-1 relative">
        <input
          dir="rtl"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="הקלד הודעה..."
          disabled={loading}
          className="w-full border border-slate-300 hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-right disabled:bg-slate-50 disabled:border-slate-200 transition-all duration-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <button
        onClick={onSend}
        disabled={!value.trim() || loading}
        className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-colors duration-200 flex-shrink-0 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
    <p className="text-xs text-slate-500 mt-2 text-center">לחץ Enter לשליחה</p>
  </div>
);

export default ChatInput;
