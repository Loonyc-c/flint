import React, { useEffect } from "react";
import { Tabs } from "@/shared/components/ui/tabs";
import FindMatch from "@/features/staged-calls/components/FindMatch";
import MatchingPref from "@/features/swipe/components/MatchingPref";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Component that navigates to subscription page
function SubscriptionRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/subscription");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#B33A2E] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to subscription page...</p>
      </div>
    </div>
  );
}

export default function Main() {
  const { t } = useTranslation();

  const tabs = [
    {
      title: t("tabs.findMatch"),
      value: "Find Match",
      content: <FindMatch />,
    },
    {
      title: t("tabs.matchingPreferences"),
      value: "Matching Preferences",
      content: <MatchingPref />,
    },
    {
      title: t("tabs.subscription"),
      value: "Subscription",
      content: <SubscriptionRedirect />,
    },
  ];
  return (
    <div className="flex justify-center justify-items-center">
      <div className="[perspective:1000px] relative flex flex-col items-center w-full max-w-7xl pt-6 px-4 pb-6">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}
