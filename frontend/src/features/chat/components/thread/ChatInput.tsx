'use client'

import { Send } from 'lucide-react'
import { type RefObject, type ChangeEvent, type FormEvent } from 'react'

interface ChatInputProps {
  inputText: string
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  stopTyping: () => void
  handleSend: (e?: FormEvent) => void
  isSending: boolean
  isConnected: boolean
  inputRef: RefObject<HTMLInputElement | null>
}

export const ChatInput = ({
  inputText,
  handleInputChange,
  stopTyping,
  handleSend,
  isSending,
  isConnected,
  inputRef,
}: ChatInputProps) => {
  return (
    <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
      <form onSubmit={handleSend} className="flex items-center gap-2 relative">
        <input
          ref={inputRef}
          value={inputText}
          onChange={handleInputChange}
          onBlur={stopTyping}
          placeholder="Type a message..."
          className="w-full h-12 pl-4 pr-12 rounded-full bg-neutral-100 dark:bg-neutral-800 border-transparent focus:border-brand focus:ring-0 transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
          disabled={isSending || !isConnected}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending || !isConnected}
          className="absolute right-2 w-8 h-8 flex items-center justify-center bg-brand hover:bg-brand-300 text-white rounded-full transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none cursor-pointer"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  )
}
