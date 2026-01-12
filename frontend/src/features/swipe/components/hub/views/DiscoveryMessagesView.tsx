"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "../sidebar/Sidebar";
import { type ChatConversation } from "@shared/types";
import { useTranslations } from "next-intl";

interface DiscoveryMessagesViewProps {
  matches: ChatConversation[];
  activeMatchId: string | null;
  matchCount: number;
  likeCount: number;
  onSelect: (matchId: string) => void;
  onOpenMatches: () => void;
  onOpenLikes: () => void;
  onClose: () => void;
  isLoading: boolean;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const DiscoveryMessagesView = ({
  matches,
  activeMatchId,
  matchCount,
  likeCount,
  onSelect,
  onOpenMatches,
  onOpenLikes,
  onClose,
  isLoading,
}: DiscoveryMessagesViewProps) => {
  const t = useTranslations("chat");

  return (
    <motion.div
      key="messages"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="h-full w-full flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl overflow-hidden lg:hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-b from-white/90 to-white/70 dark:from-neutral-900/90 dark:to-neutral-900/70 backdrop-blur-xl shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </motion.button>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          {t("messages")}
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <Sidebar
          conversations={matches}
          activeMatchId={activeMatchId}
          matchCount={matchCount}
          likeCount={likeCount}
          onPick={onSelect}
          onOpenMatches={onOpenMatches}
          onOpenLikes={onOpenLikes}
          isLoading={isLoading}
        />
      </div>
    </motion.div>
  );
};
