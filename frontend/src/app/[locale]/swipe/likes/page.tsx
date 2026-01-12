"use client";

import { DiscoveryLikesView } from "@/features/swipe/components/hub/views/DiscoveryLikesView";
import { useRouter } from "@/i18n/routing";

const LikesPage = () => {
  const router = useRouter();

  return (
    <DiscoveryLikesView
      onClose={() => router.push("/swipe")}
    />
  );
};

export default LikesPage;
