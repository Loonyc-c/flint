"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./sidebar/Sidebar";
import { cn } from "@/lib/utils";
import { StagedCallProvider } from "@/features/video";
import { useMatches } from "@/features/swipe/hooks/useMatches";
import { useLikes } from "@/features/swipe/hooks/useLikes";
import { useRouter, usePathname } from "@/i18n/routing";
import { DiscoveryMobileNav } from "./layout/DiscoveryMobileNav";

interface DiscoveryHubLayoutProps {
  children: ReactNode;
}

export const DiscoveryHubLayout = ({ children }: DiscoveryHubLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { matches, isLoading: isLoadingMatches, refreshMatches } = useMatches();
  const { likeCount, isLoading: isLoadingLikes } = useLikes();

  // Extract matchId from pathname if in chat
  const matchIdMatch = pathname.match(/\/swipe\/chat\/([^/]+)/);
  const activeMatchId = (matchIdMatch ? matchIdMatch[1] : null) as string | null;

  const handleSelectMatch = (matchId: string) => {
    router.push(`/swipe/chat/${matchId}`);
  };

  const handleOpenMatches = () => {
    router.push("/swipe/matches");
  };

  const handleOpenLikes = () => {
    router.push("/swipe/likes");
  };

  const isSwipeView = pathname === "/swipe";

  return (
    <div className="w-full flex justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-[1200px] px-0 sm:px-4 md:px-6 lg:px-8 py-0 sm:py-6">
        <StagedCallProvider
          matches={matches}
          activeMatchId={activeMatchId}
          onStageComplete={() => refreshMatches()}
        >
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside
              className={cn(
                "w-full lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-8rem)]",
                "bg-background/80 backdrop-blur-xl sm:rounded-3xl overflow-hidden shadow-xl hidden lg:block"
              )}
            >
              <Sidebar
                conversations={matches}
                activeMatchId={activeMatchId}
                matchCount={matches.length}
                likeCount={likeCount}
                onPick={handleSelectMatch}
                onOpenMatches={handleOpenMatches}
                onOpenLikes={handleOpenLikes}
                isLoading={isLoadingMatches || isLoadingLikes}
              />
            </aside>

            <main className="min-w-0 w-full flex flex-col relative h-[calc(100dvh-6rem)] lg:h-[calc(100vh-8rem)] overflow-hidden">
              <DiscoveryMobileNav
                isSwipeView={isSwipeView}
                matchCount={matches.length}
                unreadCount={matches.filter((m) => m.unreadCount > 0).length}
              />
              <div className="flex-1 min-h-0 flex flex-col">{children}</div>
            </main>
          </div>
        </StagedCallProvider>
      </div>
    </div>
  );
};
