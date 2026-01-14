"use client";

import { DiscoveryMatchesView } from "@/features/swipe/components/hub/views/DiscoveryMatchesView";
import { useMatches } from "@/features/swipe/hooks/useMatches";
import { useRouter } from "@/i18n/routing";

const MatchesPage = () => {
  const router = useRouter();
  const { matches } = useMatches();

  return (
    <DiscoveryMatchesView
      matches={matches}
      onSelect={(id) => router.push(`/swipe/chat/${id}`)}
      onClose={() => router.push("/swipe")}
    />
  );
};

export default MatchesPage;