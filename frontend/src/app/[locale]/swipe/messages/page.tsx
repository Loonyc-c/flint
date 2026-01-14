"use client";

import { DiscoveryMessagesView } from "@/features/swipe/components/hub/views/DiscoveryMessagesView";
import { useMatches } from "@/features/swipe/hooks/useMatches";
import { useLikes } from "@/features/swipe/hooks/useLikes";
import { useRouter, usePathname } from "@/i18n/routing";

const MessagesPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { matches, isLoading: isLoadingMatches } = useMatches();
  const { likeCount, isLoading: isLoadingLikes } = useLikes();

  // Extract matchId from pathname if in chat
  const matchIdMatch = pathname.match(/\/swipe\/chat\/([^/]+)/);
  const activeMatchId = (matchIdMatch ? matchIdMatch[1] : null) as string | null;

  return (
    <DiscoveryMessagesView
      matches={matches}
      activeMatchId={activeMatchId}
      matchCount={matches.length}
      likeCount={likeCount}
      onSelect={(id) => router.push(`/swipe/chat/${id}`)}
      onOpenMatches={() => router.push("/swipe/matches")}
      onOpenLikes={() => router.push("/swipe/likes")}
      onClose={() => router.push("/swipe")}
      isLoading={isLoadingMatches || isLoadingLikes}
    />
  );
};

export default MessagesPage;
