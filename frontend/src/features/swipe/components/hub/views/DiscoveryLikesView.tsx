"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface DiscoveryLikesViewProps {
  onClose: () => void;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const DiscoveryLikesView = ({ onClose }: DiscoveryLikesViewProps) => {
  const t = useTranslations("chat");
  const th = useTranslations("swipe.hub");

  return (
    <motion.div
      key="likes"
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
              {t("likes")}
            </h2>
            <p className="text-xs text-neutral-500">{th('comingSoon')}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          {th('likesTitle')}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-xs">
          {th('likesSubtitle')}
        </p>
      </div>
    </motion.div>
  );
};
