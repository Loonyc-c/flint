"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar/Sidebar";
import { useMatches } from "@/features/swipe/hooks/useMatches";
import { useLikes } from "@/features/swipe/hooks/useLikes";
import { useVideoCall } from "@/features/realtime";
import { StagedCallProvider } from "@/features/video";
import { cn } from "@/lib/utils";
import { DiscoveryMainContent } from "./layout/DiscoveryMainContent";
import { DiscoveryVideoCallManager } from "./managers/DiscoveryVideoCallManager";

export const DiscoveryHub = () => {
  const { matches, isLoading: isLoadingMatches, refreshMatches } = useMatches();
  const { likeCount, isLoading: isLoadingLikes, refreshLikes } = useLikes();
  const [activeView, setActiveView] = useState<"swipe" | "chat" | "matches" | "likes" | "messages">("swipe");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [videoCallChannel, setVideoCallChannel] = useState<string | null>(null);
  const [videoCallMatchId, setVideoCallMatchId] = useState<string | null>(null);

  const { incomingCall, initiateCall, acceptCall, declineCall, endCall } = useVideoCall({
    onCallAccepted: (data) => {
      setIsVideoCallOpen(true);
      setVideoCallChannel(data.channelName);
      setVideoCallMatchId(data.matchId);
    },
    onCallDeclined: () => setIsVideoCallOpen(false),
  });

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

  const activeConversation = matches.find((m) => m.matchId === activeMatchId);

  const handleVideoCall = useCallback(() => {
    if (activeConversation) {
      initiateCall(activeConversation.matchId, activeConversation.otherUser.id);
    }
  }, [activeConversation, initiateCall]);

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      acceptCall(incomingCall.matchId);
      setVideoCallChannel(incomingCall.channelName);
      setVideoCallMatchId(incomingCall.matchId);
      setIsVideoCallOpen(true);
    }
  }, [incomingCall, acceptCall]);

  const handleEndVideoCall = useCallback(() => {
    if (videoCallMatchId) endCall(videoCallMatchId);
    setIsVideoCallOpen(false);
    setVideoCallChannel(null);
    setVideoCallMatchId(null);
  }, [videoCallMatchId, endCall]);

  return (
    <div className="w-full flex justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-[1200px] px-0 sm:px-4 md:px-6 lg:px-8 py-0 sm:py-6">
        <StagedCallProvider matches={matches} activeMatchId={activeMatchId} onStageComplete={() => refreshMatches()}>
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className={cn(
              "w-full lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-8rem)]",
              "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl sm:rounded-3xl overflow-hidden shadow-xl hidden lg:block"
            )}>
              <Sidebar
                conversations={matches}
                activeMatchId={activeMatchId}
                matchCount={matches.length}
                likeCount={likeCount}
                onPick={handleSelectMatch}
                onOpenMatches={() => setActiveView("matches")}
                onOpenLikes={() => setActiveView("likes")}
                isLoading={isLoadingMatches || isLoadingLikes}
              />
            </aside>

            <DiscoveryMainContent
              activeView={activeView}
              setActiveView={setActiveView}
              matches={matches}
              activeConversation={activeConversation}
              activeMatchId={activeMatchId}
              likeCount={likeCount}
              isLoading={isLoadingMatches || isLoadingLikes}
              handleSelectMatch={handleSelectMatch}
              handleCloseView={handleCloseView}
              handleVideoCall={handleVideoCall}
            />
          </div>

          <DiscoveryVideoCallManager
            incomingCall={incomingCall}
            incomingCallMatch={incomingCall ? matches.find((m) => m.matchId === incomingCall.matchId) : undefined}
            videoCallChannel={videoCallChannel}
            videoCallMatchId={videoCallMatchId}
            isVideoCallOpen={isVideoCallOpen}
            activeConversation={activeConversation}
            handleAcceptCall={handleAcceptCall}
            handleDeclineCall={() => incomingCall && declineCall(incomingCall.matchId)}
            handleEndVideoCall={handleEndVideoCall}
          />
        </StagedCallProvider>
      </div>
    </div>
  );
};
