import React, { useState, useMemo } from "react";
import { Settings, Heart, MessageSquare, ChevronDown } from "lucide-react";
import ThreadGroup from "./ThreadGroup";
import HiddenInfo from "./HiddenInfo";
import { useAuthStore } from "@/features/auth";
import { useTranslation } from "react-i18next";

export default function SideBar({
  conversations,
  activeId,
  onPick,
  matchCount = 0,
  likeCount = 0,
  hiddenCount = 0,
  onOpenMatches,
  onOpenLikes,
  variant = "card",
  className = "",
}) {
  const [openYourTurn, setOpenYourTurn] = useState(true);
  const [openTheirTurn, setOpenTheirTurn] = useState(true);
  const { authUser } = useAuthStore();
  const { t } = useTranslation();

  // Filter conversations by turn
  const { yourTurnConvos, theirTurnConvos } = useMemo(() => {
    if (!authUser?._id || !conversations) {
      return { yourTurnConvos: [], theirTurnConvos: [] };
    }

    const yourTurn = conversations.filter(
      (convo) =>
        convo.currentTurn === authUser._id || convo.currentTurn === null
    );
    const theirTurn = conversations.filter(
      (convo) => convo.currentTurn && convo.currentTurn !== authUser._id
    );

    return { yourTurnConvos: yourTurn, theirTurnConvos: theirTurn };
  }, [conversations, authUser]);

  const container =
    variant === "card"
      ? "w-full min-w-0 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4"
      : "w-full min-w-0 p-4 flex flex-col gap-4 dark:bg-neutral-900";

  return (
    <aside className={`${container} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold dark:text-white">
          {t("chat.messages")}
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-sm dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">{t("chat.settings")}</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full min-w-0">
        <StatCard
          icon={Heart}
          label={t("chat.matches")}
          value={matchCount}
          active
          onClick={onOpenMatches}
        />
        <StatCard
          icon={MessageSquare}
          label={t("chat.likes")}
          value={likeCount}
          onClick={onOpenLikes}
        />
      </div>

      {/* Groups */}
      <Section
        title={t("chat.yourTurn")}
        open={openYourTurn}
        onToggle={() => setOpenYourTurn((v) => !v)}
      >
        {yourTurnConvos.length > 0 ? (
          <ThreadGroup
            title={null}
            items={yourTurnConvos}
            activeId={activeId}
            onPick={onPick}
          />
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            <p>No chats waiting for you</p>
            <p className="text-xs mt-1">Start swiping to find matches!</p>
          </div>
        )}
      </Section>

      <Section
        title={t("chat.theirTurn")}
        open={openTheirTurn}
        onToggle={() => setOpenTheirTurn((v) => !v)}
      >
        {theirTurnConvos.length > 0 ? (
          <ThreadGroup
            title={null}
            items={theirTurnConvos}
            activeId={activeId}
            onPick={onPick}
          />
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            <p>All caught up!</p>
            <p className="text-xs mt-1">Waiting for replies...</p>
          </div>
        )}
      </Section>

      <HiddenInfo hiddenCount={hiddenCount} />
    </aside>
  );
}

function StatCard({ icon: Icon, label, value, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full min-w-0 flex flex-col gap-2 rounded-2xl px-4 py-3 border transition-colors",
        active
          ? "bg-brand text-white border-brand"
          : "bg-neutral-100 border-neutral-200 text-neutral-900 hover:bg-neutral-200/80",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="font-medium text-sm sm:text-base">{label}</span>
        </span>
        {/* keep this empty spot for balance if you ever add a chevron/badge */}
      </div>
      <div className="text-xl sm:text-2xl font-semibold leading-none">
        {value}
      </div>
    </button>
  );
}

function Section({ title, open, onToggle, children }) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between"
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-semibold">{title}</span>
        <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}
