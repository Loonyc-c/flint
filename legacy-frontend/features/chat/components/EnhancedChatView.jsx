import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ArrowLeft,
  Mic,
  Send,
  WifiOff,
  Wifi,
  SkipForward,
  MessageCircle,
  Clock,
} from "lucide-react";
import ChatMessage from "./ChatMessage";
import VoiceRecorder from "./VoiceRecorder";
import ChatSettings from "./ChatSettings";
import MessageSkeleton from "./chat/MessageSkeleton";
import { useMessageStore } from "@/features/chat";
import { useMatchStore } from "@/features/chat";
import { useAuthStore } from "@/features/auth";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const EnhancedChatView = ({ match: matchProp, onBack }) => {
  const [messageText, setMessageText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    messages,
    getMessages,
    sendMessage,
    markAsRead,
    passTurn,
    joinMatchRoom,
    leaveMatchRoom,
    isOffline,
    isSendingMessage,
    isLoadingMessages,
  } = useMessageStore();

  const { matches } = useMatchStore();
  const { authUser } = useAuthStore();

  // Get the latest match data from store (for real-time turn updates)
  const match = useMemo(() => {
    const storeMatch = matches.find((m) => m._id === matchProp._id);
    // If match found in store, use it (has latest currentTurn)
    // Otherwise fallback to prop
    return storeMatch || matchProp;
  }, [matches, matchProp]);

  const matchMessages = messages[match._id] || [];
  const otherUser = match.user;

  // Determine whose turn it is
  // If currentTurn is null, no one has messaged yet - both can start
  const isMyTurn =
    match.currentTurn === null || match.currentTurn === authUser?._id;
  const isTheirTurn = match.currentTurn === otherUser?._id;
  const isFirstMessage = match.currentTurn === null;

  // Debug logging for turn-based chat
  useEffect(() => {
    console.log("[Turn Debug]", {
      matchId: match._id,
      currentTurn: match.currentTurn,
      authUserId: authUser?._id,
      otherUserId: otherUser?._id,
      isMyTurn,
      isTheirTurn,
      isFirstMessage,
    });
  }, [
    match.currentTurn,
    authUser?._id,
    otherUser?._id,
    isMyTurn,
    isTheirTurn,
    isFirstMessage,
    match._id,
  ]);

  useEffect(() => {
    if (match._id) {
      joinMatchRoom(match._id);
      getMessages(match._id);
      markAsRead(match._id);

      return () => {
        leaveMatchRoom(match._id);
      };
    }
  }, [match._id, joinMatchRoom, leaveMatchRoom, getMessages, markAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [matchMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSendText = useCallback(
    async (e) => {
      e.preventDefault();
      if (!messageText.trim() || isSendingMessage) return;

      const text = messageText.trim();
      setMessageText("");

      try {
        await sendMessage(match._id, text, "text");
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message. Please try again.");
        setMessageText(text); // Restore message on error
      }
    },
    [messageText, isSendingMessage, sendMessage, match._id]
  );

  const handleSendVoice = useCallback(
    async (voiceData) => {
      try {
        await sendMessage(match._id, "", "voice", voiceData);
        setShowVoiceRecorder(false);
      } catch (error) {
        console.error("Failed to send voice message:", error);
        toast.error("Failed to send voice message. Please try again.");
      }
    },
    [sendMessage, match._id]
  );

  const handlePassTurn = useCallback(async () => {
    const result = await passTurn(match._id);
    if (result.success) {
      toast.success(
        "Turn passed to " + (otherUser.nickname || otherUser.fullName)
      );
    } else {
      toast.error(result.error || "Failed to pass turn");
    }
  }, [passTurn, match._id, otherUser.nickname, otherUser.fullName]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#D9776D]/10 via-[#CF5144]/10 to-[#B33A2E]/5">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <img
          src={otherUser.profilePic || "/default-avatar.png"}
          alt={otherUser.nickname || otherUser.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">
            {otherUser.nickname || otherUser.fullName}
          </h2>
          <div className="flex items-center gap-2">
            {/* Turn indicator - More prominent */}
            {isFirstMessage ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                <MessageCircle className="w-3 h-3" />
                Start the conversation
              </span>
            ) : isMyTurn ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#B33A2E] bg-[#D9776D]/20 px-3 py-1 rounded-full border border-[#CF5144]/30">
                <MessageCircle className="w-3 h-3" />
                Your turn to message
              </span>
            ) : isTheirTurn ? (
              <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-300">
                <Clock className="w-3 h-3" />
                Waiting for their reply
              </span>
            ) : null}

            {/* Online status */}
            {isOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-500">Online</span>
              </>
            )}
          </div>
        </div>

        {/* Settings Button */}
        <ChatSettings match={match} onBack={onBack} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        {isLoadingMessages && matchMessages.length === 0 ? (
          <MessageSkeleton />
        ) : matchMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#B33A2E] to-[#CF5144] rounded-full flex items-center justify-center">
              <span className="text-3xl">👋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Say hello to {otherUser.nickname || otherUser.fullName}!
              </h3>
              <p className="text-sm text-gray-600">
                Start the conversation with a message or voice note
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 will-change-scroll">
            {matchMessages.map((message, index) => {
              // Check if message is from current user
              const isOwn =
                message.sender?._id?.toString() === authUser?._id?.toString() ||
                message.sender?.toString() === authUser?._id?.toString();

              const showAvatar =
                index === 0 ||
                matchMessages[index - 1].sender?._id !== message.sender?._id;

              return (
                <ChatMessage
                  key={message._id || message.localId}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  otherUser={otherUser}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              You're offline. Messages will be sent when you reconnect.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      {showVoiceRecorder ? (
        <VoiceRecorder
          onSend={handleSendVoice}
          onCancel={() => setShowVoiceRecorder(false)}
          disabled={!isMyTurn}
        />
      ) : (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          {/* Not your turn message */}
          {!isMyTurn && (
            <div className="mb-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-2">
                Waiting on {otherUser.nickname || otherUser.fullName}...
              </p>
              <p className="text-xs text-gray-500">
                It's their turn to respond
              </p>
            </div>
          )}

          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              disabled={!isMyTurn}
              className="p-3 bg-gradient-to-br from-[#B33A2E] to-[#CF5144] text-white rounded-full hover:shadow-lg transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                isMyTurn ? "Type a message..." : "Wait for your turn..."
              }
              disabled={!isMyTurn}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#B33A2E] focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {isMyTurn && (
              <>
                <button
                  type="button"
                  onClick={handlePassTurn}
                  className="p-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-all flex-shrink-0"
                  title="Pass turn"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  type="submit"
                  disabled={!messageText.trim() || isSendingMessage}
                  className="p-3 bg-gradient-to-br from-[#B33A2E] to-[#CF5144] text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isSendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatView;
