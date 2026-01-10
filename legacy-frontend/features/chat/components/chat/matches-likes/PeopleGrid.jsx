import React from "react";
import { Heart, MessageCircle, X, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PeopleGrid({
  people = [],
  onChat = () => {},
  onLike = () => {},
  onUndoLike,
  onOpenProfile,
  title,
  emptyMessage = "Nothing to show yet",
  emptyCTA,
  onEmptyCTAClick,
  showLikeButton = true, // Show like button by default
  showMatchedBadge = false, // Show "Matched" badge for matches page
}) {
  return (
    <div className="w-full flex flex-col gap-4">
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}

      {/* Auto-wrap with a comfortable min width per card */}
      <div
        className="grid gap-4 w-full"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        {people.map((p) => {
          const img =
            p.photo || p.avatar || p.image || p.img || p.picture || "";

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Profile Image - Clickable */}
              <button
                onClick={() => onOpenProfile?.(p)}
                className="w-full aspect-[3/4] bg-center bg-cover relative group"
                style={{
                  backgroundImage: img ? `url("${img}")` : "none",
                  backgroundColor: img ? undefined : "#e5e5e5",
                }}
                aria-label={`View ${p.name}'s profile`}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <User className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>

              <div className="px-3 py-2 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                    {p.name}
                  </span>
                  {p.age != null && (
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {p.age}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                {showMatchedBadge && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Heart className="w-3 h-3" fill="currentColor" />
                    Matched
                  </span>
                )}
                {!showMatchedBadge && p.likedMe && !p.likedByMe && (
                  <span className="text-xs text-rose-600 font-medium">
                    Liked you!
                  </span>
                )}
                {!showMatchedBadge && p.likedMe && p.likedByMe && (
                  <span className="text-xs text-green-600 font-medium">
                    Mutual like
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div
                className={`grid gap-2 px-2 pb-3 ${
                  showLikeButton ? "grid-cols-3" : "grid-cols-1"
                }`}
              >
                {/* Smash button - only show if showLikeButton is true */}
                {showLikeButton && (
                  <motion.button
                    onClick={() => onLike(p)}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white px-2 py-1.5 text-xs font-medium hover:shadow-md transition-shadow"
                    aria-label={`Smash ${p.name}`}
                  >
                    <Heart className="h-3.5 w-3.5" fill="white" />
                    <span className="hidden sm:inline">Smash</span>
                  </motion.button>
                )}

                {/* Undo button (if available) */}
                {showLikeButton && onUndoLike && p.likedByMe && (
                  <motion.button
                    onClick={() => onUndoLike(p)}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1.5 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    aria-label={`Undo like for ${p.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Undo</span>
                  </motion.button>
                )}

                {/* Chat button */}
                <motion.button
                  onClick={() => onChat(p)}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white px-3 py-2 text-sm font-medium hover:shadow-md transition-shadow"
                  aria-label={`Chat with ${p.name}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced empty state */}
      {people.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-8 text-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {emptyMessage}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Start swiping to find your perfect match
            </p>
          </div>
          {emptyCTA && onEmptyCTAClick && (
            <motion.button
              onClick={onEmptyCTAClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
            >
              {emptyCTA}
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
}
