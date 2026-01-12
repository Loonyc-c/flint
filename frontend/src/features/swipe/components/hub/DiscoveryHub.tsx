"use client";

import { useState } from "react";
import { useMatches } from "@/features/swipe/hooks/useMatches";
import { useLikes } from "@/features/swipe/hooks/useLikes";
import { StagedCallProvider } from "@/features/video";
import { DiscoveryHubContent } from "./DiscoveryHubContent";

export const DiscoveryHub = () => {
  const { matches, isLoading: isLoadingMatches, refreshMatches } = useMatches();
  const { likeCount, isLoading: isLoadingLikes, refreshLikes } = useLikes();
  const [activeView, setActiveView] = useState<"swipe" | "chat" | "matches" | "likes" | "messages">("swipe");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  const handleSelectMatch = (matchId: string) => {
    setActiveMatchId(matchId);
    setActiveView("chat");
  };

  const handleCloseView = () => {
    setActiveMatchId(null);
    setActiveView("swipe");
    refreshMatches();
    refreshLikes();
  };

  return (
    <div className="w-full flex justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-[1200px] px-0 sm:px-4 md:px-6 lg:px-8 py-0 sm:py-6">
        <StagedCallProvider
          matches={matches}
          activeMatchId={activeMatchId}
          onStageComplete={() => refreshMatches()}
        >
          <DiscoveryHubContent
            activeView={activeView}
            setActiveView={setActiveView}
            matches={matches}
            activeMatchId={activeMatchId}
            likeCount={likeCount}
            isLoading={isLoadingMatches || isLoadingLikes}
            handleSelectMatch={handleSelectMatch}
            handleCloseView={handleCloseView}
          />
        </StagedCallProvider>
      </div>
    </div>
  );
};