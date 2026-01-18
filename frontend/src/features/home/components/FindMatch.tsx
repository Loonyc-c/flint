"use client";

import { useRouter } from "@/i18n/routing";
import {
  Phone,
  Users,
  Sparkles,
  Smile,
  Brain,
  Coffee,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LiveCallOverlay } from "./LiveCallOverlay";
import { useSocket } from "@/features/realtime";
import { useUser } from "@/features/auth/context/UserContext";
import { cn } from "@/lib/utils";
import { IncompleteProfileModal } from "@/features/profile/components/modals/IncompleteProfileModal";
import { calculateProfileCompleteness, type MissingField } from "@shared/lib";

// =============================================================================
// Sub-Components
// =============================================================================

interface LiveCallCardProps {
  onClick: () => void;
  disabled?: boolean;
}

const LiveCallCard = ({ onClick, disabled }: LiveCallCardProps) => {
  const t = useTranslations("home.findMatch");
  const tc = useTranslations("chat");

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "p-6 border-2 shadow-sm bg-card rounded-2xl flex flex-col items-center gap-4 transition-all relative overflow-hidden",
        disabled
          ? "border-neutral-200 dark:border-neutral-800 opacity-80 cursor-not-allowed"
          : "border-border hover:border-brand hover:shadow-lg group cursor-pointer"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-16 h-16 transition-colors rounded-full",
        disabled ? "bg-neutral-200 text-neutral-400" : "bg-brand text-brand-foreground group-hover:bg-brand-300"
      )}>
        <Phone className="w-8 h-8" />
      </div>
      <div className="text-center">
        <h4 className="mb-2 text-lg font-semibold text-foreground">
          {t("liveCall.title")}
        </h4>
        <p className="text-sm text-muted-foreground">
          {disabled ? tc("userBusy") : t("liveCall.description")}
        </p>
      </div>
      <div className={cn(
        "w-full px-5 py-2.5 rounded-2xl font-medium text-center text-sm transition-colors",
        disabled
          ? "bg-neutral-100 text-neutral-400"
          : "bg-brand group-hover:bg-brand-300 text-brand-foreground"
      )}>
        {t("liveCall.button")}
      </div>

      {disabled && (
        <div className="absolute top-2 right-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
        </div>
      )}
    </button>
  );
};

interface SwipeCardProps {
  onNavigate: () => void;
}

const SwipeCard = ({ onNavigate }: SwipeCardProps) => {
  const t = useTranslations("home.findMatch");

  return (
    <div
      className="cursor-pointer bg-card border-2 border-border hover:border-black dark:hover:border-white rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-lg group"
      onClick={onNavigate}
    >
      <div className="flex items-center justify-center w-16 h-16 transition-colors rounded-full bg-black dark:bg-white text-white dark:text-black group-hover:bg-black-200 dark:group-hover:bg-neutral-200">
        <Users className="w-8 h-8" />
      </div>
      <div className="text-center">
        <h4 className="mb-2 text-lg font-semibold text-foreground">
          {t("swipe.title")}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t("swipe.description")}
        </p>
      </div>
      <div className="w-full px-5 py-2.5 rounded-2xl bg-black dark:bg-white font-medium text-white dark:text-black text-center text-sm transition-colors group-hover:bg-black-200 dark:group-hover:bg-neutral-200">
        {t("swipe.button")}
      </div>
    </div>
  );
};

const AIWingmanCard = () => {
  const t = useTranslations("home.findMatch");
  const hasSubscription = false; // Mocked for UI

  return (
    <Card className="relative w-full overflow-hidden border-0 shadow-lg sm:w-11/12 lg:w-3/4 bg-linear-to-br from-card to-muted">
      <div className="relative z-0 flex flex-col items-center gap-4 px-5 py-5 text-center sm:px-7 sm:py-6">
        {!hasSubscription && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm rounded-none">
            <Lock className="w-12 h-12 text-white" />
            <p className="text-lg font-semibold text-white">
              {t("aiWingman.premiumTitle")}
            </p>
            <p className="text-sm text-white/80 max-w-xs">
              {t("aiWingman.premiumDescription")}
            </p>
            <Button className="rounded-lg transition-colors bg-brand hover:bg-brand/90 text-brand-foreground">
              {t("aiWingman.viewPlans")}
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 text-foreground">
          <div className="flex items-center justify-center w-12 h-12 shadow-lg rounded-full sm:w-14 sm:h-14 bg-brand/90 text-brand-foreground">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold">
            {t("aiWingman.title")}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground max-w-184">
          {t("aiWingman.description")}
        </p>

        <div className="grid w-full grid-cols-3 gap-3 sm:gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full sm:w-14 sm:h-14 bg-accent-pink text-accent-pink-foreground">
              <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              {t("aiWingman.playful")}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full sm:w-14 sm:h-14 bg-info text-info-foreground">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              {t("aiWingman.thoughtful")}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-full sm:w-14 sm:h-14 bg-success text-success-foreground">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground">
              {t("aiWingman.chill")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// =============================================================================
// Main Component
// =============================================================================

/**
 * Find Match page section with matching style options and AI wingman feature.
 */
const FindMatch = () => {
  const router = useRouter();
  const t = useTranslations("home.findMatch");
  const { user } = useUser();
  const { isUserBusy } = useSocket();
  const [showLiveCall, setShowLiveCall] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  const isMeBusy = isUserBusy(user?.id || "");

  // Calculate completeness on the fly for the guard
  const completeness = user?.profile
    ? calculateProfileCompleteness(user.profile)
    : { score: 0, isFeatureUnlocked: false, missingFields: [] as MissingField[] };

  const checkGate = (action: () => void) => {
    if (!completeness.isFeatureUnlocked) {
      setShowIncompleteModal(true);
      return;
    }
    action();
  };

  return (
    <div className="w-full flex justify-center">
      <section className="w-full max-w-[1200px] px-4 md:px-6 lg:px-8 flex flex-col items-center gap-6 sm:gap-8">
        {/* Header Block */}
        <div className="w-full flex flex-col items-center gap-2 text-center">
          <div className="text-2xl font-bold text-brand">{t("title")}</div>
          <h2 className="text-neutral-700 dark:text-neutral-300 font-light text-xs sm:text-sm md:text-base leading-relaxed max-w-200">
            {t("subtitle")}
          </h2>
        </div>

        {/* Start Matching Section */}
        <div className="w-full sm:w-4/5 md:w-3/4 lg:w-2/3 flex flex-col items-center gap-4">
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {t("chooseStyle")}
          </h3>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiveCallCard
              onClick={() => checkGate(() => setShowLiveCall(true))}
              disabled={isMeBusy}
            />
            <SwipeCard onNavigate={() => checkGate(() => router.push("/swipe"))} />
          </div>
        </div>

        {/* AI Wingman Card */}
        <div className="w-full flex justify-center">
          <AIWingmanCard />
        </div>

        <LiveCallOverlay
          isOpen={showLiveCall}
          onClose={() => setShowLiveCall(false)}
        />

        <IncompleteProfileModal
          isOpen={showIncompleteModal}
          onClose={() => setShowIncompleteModal(false)}
          score={completeness.score}
          missingFields={completeness.missingFields}
        />
      </section>
    </div>
  );
};

export default FindMatch;
