import React from "react";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import { motion } from "framer-motion";

const ChatMessage = React.memo(
  ({ message, isOwn, showAvatar = true, otherUser }) => {
    const getStatusIcon = () => {
      if (!isOwn) return null;

      switch (message.status) {
        case "pending":
          return <Clock className="w-3 h-3 text-gray-400" />;
        case "sent":
          return <Check className="w-3 h-3 text-gray-400" />;
        case "delivered":
          return <CheckCheck className="w-3 h-3 text-gray-400" />;
        case "read":
          return <CheckCheck className="w-3 h-3 text-[#B33A2E]" />;
        case "failed":
          return <AlertCircle className="w-3 h-3 text-red-500" />;
        default:
          return message.read ? (
            <CheckCheck className="w-3 h-3 text-[#B33A2E]" />
          ) : (
            <Check className="w-3 h-3 text-gray-400" />
          );
      }
    };

    const getStatusText = () => {
      if (!isOwn) return null;

      switch (message.status) {
        case "pending":
          return "Sending...";
        case "failed":
          return "Failed to send";
        default:
          return null;
      }
    };

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`flex gap-2 mb-4 ${
          isOwn ? "flex-row-reverse justify-start" : "flex-row justify-start"
        }`}
        style={{ willChange: "opacity, transform" }}
      >
        {/* Avatar */}
        {showAvatar && !isOwn && otherUser && (
          <img
            src={otherUser.profilePic || "/default-avatar.png"}
            alt={otherUser.nickname || otherUser.fullName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            loading="lazy"
          />
        )}
        {showAvatar && !isOwn && !otherUser && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
        )}

        <div
          className={`flex flex-col ${
            isOwn ? "items-end" : "items-start"
          } max-w-[70%]`}
        >
          {/* Message bubble */}
          <div
            className={`relative ${
              message.status === "pending" ? "opacity-70" : "opacity-100"
            }`}
          >
            {message.messageType === "voice" ? (
              <VoiceMessagePlayer
                voiceUrl={message.voiceUrl}
                duration={message.voiceDuration}
                isOwn={isOwn}
              />
            ) : (
              <div
                className={`px-4 py-3 rounded-2xl shadow-lg ${
                  isOwn
                    ? "bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white rounded-br-sm shadow-[#D9776D]/50"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm shadow-gray-200"
                }`}
              >
                <p
                  className={`text-sm whitespace-pre-wrap break-words ${
                    isOwn ? "font-medium" : "font-normal"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            {/* Offline indicator */}
            {message.status === "pending" && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" />
            )}
          </div>

          {/* Timestamp and status */}
          <div
            className={`flex items-center gap-1 mt-1 px-1 ${
              isOwn ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
            {getStatusIcon()}
            {getStatusText() && (
              <span className="text-xs text-gray-500">{getStatusText()}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
