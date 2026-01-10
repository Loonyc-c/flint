import React from "react";

export default function ThreadItem({ convo, active, onClick }) {
  const hasUnread = convo.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={[
        "w-full rounded-xl border text-left px-3 py-3",
        active
          ? "border-brand/40 ring-1 ring-brand/40 bg-brand/5 dark:bg-brand/10"
          : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={convo.avatar}
            alt={convo.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`${
              hasUnread ? "font-bold" : "font-semibold"
            } dark:text-white`}
          >
            {convo.name}
          </div>
          <div
            className={`text-sm truncate ${
              hasUnread
                ? "text-gray-900 dark:text-gray-100 font-medium"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            {convo.messages[convo.messages.length - 1]?.text || "New chat"}
          </div>
        </div>
      </div>
    </button>
  );
}
