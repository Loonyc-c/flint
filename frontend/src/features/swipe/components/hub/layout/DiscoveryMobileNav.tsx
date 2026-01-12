"use client";

import { motion } from "framer-motion";
import { Sparkles, Heart, MessageSquare } from "lucide-react";

interface DiscoveryMobileNavProps {
  activeView: string;
  setActiveView: (view: "swipe" | "chat" | "matches" | "likes" | "messages") => void;
  matchCount: number;
  unreadCount: number;
}

export const DiscoveryMobileNav = ({
  activeView,
  setActiveView,
  matchCount,
  unreadCount,
}: DiscoveryMobileNavProps) => {
  if (activeView !== "swipe") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shrink-0"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-black text-transparent bg-gradient-to-r from-brand to-brand-300 bg-clip-text">
          Flint
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveView("matches")}
          className="relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Heart className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          {matchCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-brand to-brand-300 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-brand/30"
            >
              {matchCount}
            </motion.span>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveView("messages")}
          className="relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-red-500/30"
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
