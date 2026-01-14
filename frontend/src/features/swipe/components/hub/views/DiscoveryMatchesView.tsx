"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { MatchesList } from "../lists/MatchesList";
import { type ChatConversation } from "@shared/types";
import { useTranslations } from "next-intl";

interface DiscoveryMatchesViewProps {
  matches: ChatConversation[];
  onSelect: (matchId: string) => void;
  onClose: () => void;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const DiscoveryMatchesView = ({
  matches,
  onSelect,
  onClose,
}: DiscoveryMatchesViewProps) => {
  const t = useTranslations("chat");
  const th = useTranslations("swipe.hub");
  const matchCount = matches.length;

  return (
    <motion.div
      key="matches"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="h-full w-full flex flex-col sm:rounded-3xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl shadow-neutral-200/30 dark:shadow-neutral-950/30 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-white/90 to-white/70 dark:from-neutral-900/90 dark:to-neutral-900/70 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </motion.button>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t("matches")}
            </h2>
            <p className="text-xs text-neutral-500">
              {th('matchCount', { count: matchCount })}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MatchesList matches={matches} onSelect={onSelect} />
      </div>
    </motion.div>
  );
};
