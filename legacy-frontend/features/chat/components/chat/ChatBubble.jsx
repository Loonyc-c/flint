import React, { memo } from "react";
import { Check, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChatBubble = memo(({ from, text, read, readAt, timestamp }) => {
  const { t } = useTranslation();

  if (from === "system") {
    return (
      <div className="self-center text-xs sm:text-[13px] px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
        {text}
      </div>
    );
  }

  const isMe = from === "me";

  // Format time
  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
      <div
        className={[
          "max-w-[80%] w-fit px-3 py-2 rounded-2xl text-sm",
          isMe
            ? "self-end bg-brand text-white rounded-br-md"
            : "self-start bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-md",
        ].join(" ")}
      >
        {text}
      </div>

      {/* Show seen status for own messages */}
      {isMe && (
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
          {read ? (
            <>
              <CheckCheck className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              <span className="text-blue-500 dark:text-blue-400">
                {t("chat.seen")} {readAt && formatTime(readAt)}
              </span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3" />
              <span>
                {t("chat.sent")} {timestamp && formatTime(timestamp)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

ChatBubble.displayName = "ChatBubble";

export default ChatBubble;
