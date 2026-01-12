"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChatThread } from "@/features/chat/components/ChatThread";
import { SwipeFeature } from "@/features/swipe/components/SwipeFeature";
import { DiscoveryMobileNav } from "./DiscoveryMobileNav";
import { DiscoveryMatchesView } from "../views/DiscoveryMatchesView";
import { DiscoveryLikesView } from "../views/DiscoveryLikesView";
import { DiscoveryMessagesView } from "../views/DiscoveryMessagesView";
import { type ChatConversation } from "@shared/types";

interface DiscoveryMainContentProps {
  activeView: "swipe" | "chat" | "matches" | "likes" | "messages";
  setActiveView: (view: "swipe" | "chat" | "matches" | "likes" | "messages") => void;
  matches: ChatConversation[];
  activeConversation: ChatConversation | undefined;
  activeMatchId: string | null;
  likeCount: number;
  isLoading: boolean;
  handleSelectMatch: (matchId: string) => void;
  handleCloseView: () => void;
  handleVideoCall: () => void;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const DiscoveryMainContent = ({
  activeView,
  setActiveView,
  matches,
  activeConversation,
  activeMatchId,
  likeCount,
  isLoading,
  handleSelectMatch,
  handleCloseView,
  handleVideoCall,
}: DiscoveryMainContentProps) => {
  return (
    <main className="min-w-0 w-full flex flex-col relative min-h-[calc(100dvh-6rem)] lg:min-h-[800px]">
      <DiscoveryMobileNav
        activeView={activeView}
        setActiveView={setActiveView}
        matchCount={matches.length}
        unreadCount={matches.filter((m) => m.unreadCount > 0).length}
      />

      <AnimatePresence mode="wait">
        {activeView === "swipe" && (
          <motion.div
            key="swipe"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 min-h-0 w-full overflow-hidden bg-white/50 dark:bg-neutral-900/50 sm:rounded-3xl sm:shadow-xl"
          >
            <SwipeFeature />
          </motion.div>
        )}

        {activeView === "chat" && activeConversation && (
          <motion.div
            key="chat"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full w-full overflow-hidden sm:rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl"
          >
            <ChatThread
              conversation={activeConversation}
              onClose={handleCloseView}
              onVideoCall={handleVideoCall}
            />
          </motion.div>
        )}

        {activeView === "matches" && (
          <DiscoveryMatchesView
            matches={matches}
            onSelect={handleSelectMatch}
            onClose={handleCloseView}
          />
        )}

        {activeView === "likes" && (
          <DiscoveryLikesView onClose={handleCloseView} />
        )}

        {activeView === "messages" && (
          <DiscoveryMessagesView
            matches={matches}
            activeMatchId={activeMatchId}
            matchCount={matches.length}
            likeCount={likeCount}
            onSelect={handleSelectMatch}
            onOpenMatches={() => setActiveView("matches")}
            onOpenLikes={() => setActiveView("likes")}
            onClose={handleCloseView}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </main>
  );
};
