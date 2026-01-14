'use client'

import { Send } from 'lucide-react'
import { type RefObject, type ChangeEvent, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('chat')

  return (
    <div className="p-4 bg-background border-t border-border shrink-0">
      <form onSubmit={handleSend} className="flex items-center gap-2 relative">
        <input
          ref={inputRef}
          value={inputText}
          onChange={handleInputChange}
          onBlur={stopTyping}
          placeholder={t('placeholder')}
          className="w-full h-12 pl-4 pr-12 rounded-full bg-muted border-transparent focus:border-brand focus:ring-0 transition-all font-medium text-foreground placeholder:text-muted-foreground outline-none"
          disabled={isSending || !isConnected}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending || !isConnected}
          className="absolute right-2 w-8 h-8 flex items-center justify-center bg-brand hover:bg-brand-300 text-brand-foreground rounded-full transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none cursor-pointer"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  )
}
