"use client";

import { useCallback } from "react";
import { Sidebar } from "./sidebar/Sidebar";
import { cn } from "@/lib/utils";
import { DiscoveryMainContent } from "./layout/DiscoveryMainContent";
import { useStagedCallContext } from "@/features/video";
import { type ChatConversation } from "@shared/types";

interface DiscoveryHubContentProps {
  activeView: "swipe" | "chat" | "matches" | "likes" | "messages";
  setActiveView: (view: "swipe" | "chat" | "matches" | "likes" | "messages") => void;
  matches: ChatConversation[];
  activeMatchId: string | null;
  likeCount: number;
  isLoading: boolean;
  handleSelectMatch: (matchId: string) => void;
  handleCloseView: () => void;
}

export const DiscoveryHubContent = ({
  activeView,
  setActiveView,
  matches,
  activeMatchId,
  likeCount,
  isLoading,
  handleSelectMatch,
  handleCloseView,
}: DiscoveryHubContentProps) => {
  const { initiateCall } = useStagedCallContext();
  const activeConversation = matches.find((m) => m.matchId === activeMatchId);

  const handleVideoCall = useCallback(() => {
    if (activeConversation) {
      // Stage 1 for fresh matches (audio), Stage 2 for progressed matches (video)
      const stage = activeConversation.stage === "fresh" ? 1 : 2;
      initiateCall(
        activeConversation.matchId,
        activeConversation.otherUser.id,
        stage as 1 | 2
      );
    }
  }, [activeConversation, initiateCall]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside
        className={cn(
          "w-full lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-8rem)]",
          "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl sm:rounded-3xl overflow-hidden shadow-xl hidden lg:block"
        )}
      >
        <Sidebar
          conversations={matches}
          activeMatchId={activeMatchId}
          matchCount={matches.length}
          likeCount={likeCount}
          onPick={handleSelectMatch}
          onOpenMatches={() => setActiveView("matches")}
          onOpenLikes={() => setActiveView("likes")}
          isLoading={isLoading}
        />
      </aside>

      <DiscoveryMainContent
        activeView={activeView}
        setActiveView={setActiveView}
        matches={matches}
        activeConversation={activeConversation}
        activeMatchId={activeMatchId}
        likeCount={likeCount}
        isLoading={isLoading}
        handleSelectMatch={handleSelectMatch}
        handleCloseView={handleCloseView}
        handleVideoCall={handleVideoCall}
      />
    </div>
  );
};
