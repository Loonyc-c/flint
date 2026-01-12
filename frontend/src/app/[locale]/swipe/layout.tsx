"use client";

import { DiscoveryHubLayout } from "@/features/swipe/components/hub/DiscoveryHubLayout";

interface SwipeLayoutProps {
  children: React.ReactNode;
}

const SwipeLayout = ({ children }: SwipeLayoutProps) => {
  return <DiscoveryHubLayout>{children}</DiscoveryHubLayout>;
};

export default SwipeLayout;
