'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { type ChatConversation, type Message } from '@shared/types'
import { getMessages } from '@/features/chat/api/chat'
import { useUser } from '@/features/auth/context/UserContext'
import { useChat, useSocket, type RealtimeMessage } from '@/features/realtime'
import { toast } from 'react-toastify'

interface UseChatThreadProps {
  conversation: ChatConversation
}

export const useChatThread = ({ conversation }: UseChatThreadProps) => {
  const { user } = useUser()
  const { isConnected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleNewMessage = useCallback((msg: RealtimeMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  const {
    sendMessage: sendRealtimeMessage,
    startTyping,
    stopTyping,
    markAsRead,
    isPartnerOnline,
    isPartnerTyping,
  } = useChat({
    matchId: conversation.matchId,
    onNewMessage: handleNewMessage,
  })

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const data = await getMessages(conversation.matchId)
        setMessages(data)
        markAsRead()
      } catch (error) {
        console.error(error)
        toast.error('Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [conversation.matchId, markAsRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPartnerTyping])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    if (e.target.value.trim()) {
      startTyping()
    } else {
      stopTyping()
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || !user?.id || isSending) return

    const messageText = inputText.trim()
    setInputText('')
    setIsSending(true)
    stopTyping()

    try {
      sendRealtimeMessage(messageText)
    } catch (error) {
      console.error(error)
      toast.error('Failed to send message')
      setInputText(messageText)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const lastMessage = messages[messages.length - 1]
  const isMyTurn = lastMessage ? lastMessage.senderId !== user?.id : true

  return {
    user,
    messages,
    inputText,
    isLoading,
    isSending,
    messagesEndRef,
    inputRef,
    handleInputChange,
    handleSend,
    stopTyping,
    isConnected,
    isPartnerOnline,
    isPartnerTyping,
    isMyTurn,
  }
}
