import React, { useMemo, useState, useEffect } from "react";
import ProfileSwipe from "@/features/swipe/components/ProfileSwipe";
import Sidebar from "@/features/chat/components/chat/SideBar";
import Thread from "@/features/chat/components/chat/Thread";
import MatchesPage from "@/features/chat/components/chat/matches-likes/MatchesPage";
import LikesPage from "@/features/chat/components/chat/matches-likes/LikesPage";
import { useMatchStore } from "@/features/chat";
import { useMessageStore } from "@/features/chat";
import { useSwipeStore } from "@/features/swipe";
import { useAuthStore } from "@/features/auth";
import { useTranslation } from "react-i18next";

export default function FrontPage() {
  const { t } = useTranslation();
  const { matches, getMatches } = useMatchStore();
  const { messages, getMessages, sendMessage, joinMatchRoom, leaveMatchRoom } =
    useMessageStore();
  const { likes, getLikes } = useSwipeStore();
  const { authUser } = useAuthStore();
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState("swipe");

  // Load data on mount
  useEffect(() => {
    getMatches();
    getLikes();
  }, [getMatches, getLikes]);

  // Join/leave match room
  useEffect(() => {
    if (activeId && view === "thread") {
      joinMatchRoom(activeId);
      getMessages(activeId);
      return () => leaveMatchRoom(activeId);
    }
  }, [activeId, view, joinMatchRoom, leaveMatchRoom, getMessages]);

  // Calculate active match count (exclude hidden/inactive matches)
  const activeMatchCount = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return matches.filter((match) => {
      const lastMessageTime = match.lastMessageAt
        ? new Date(match.lastMessageAt)
        : new Date(match.createdAt);
      return lastMessageTime >= sevenDaysAgo;
    }).length;
  }, [matches]);

  const matchCount = activeMatchCount; // Use active count instead of total
  const likeCount = likes.length;

  // Convert matches to conversations
  const conversations = useMemo(() => {
    console.log("[FrontPage] Conversations useMemo re-running:", {
      matchesCount: matches?.length || 0,
      authUserId: authUser?._id,
      timestamp: new Date().toISOString(),
    });

    if (!matches || !Array.isArray(matches)) {
      console.log("[Conversations Debug] No matches:", matches);
      return [];
    }

    console.log("[Conversations Debug] Processing matches:", {
      matchesCount: matches.length,
      authUserId: authUser?._id,
      matchesWithTurns: matches.map((m) => ({
        id: m._id,
        currentTurn: m.currentTurn,
      })),
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = matches
      .filter((match) => match && match.users && Array.isArray(match.users))
      .map((match) => {
        // Backend returns match.user (singular) as the other user
        // Fallback to finding from users array if needed
        let otherUser = match.user;

        if (!otherUser && match.users && Array.isArray(match.users)) {
          otherUser = match.users.find(
            (u) => u?._id?.toString() !== authUser?._id
          );
        }

        const matchMessages = messages[match._id] || [];

        // Determine if chat is hidden (no activity for 7+ days)
        const lastMessageTime = match.lastMessageAt
          ? new Date(match.lastMessageAt)
          : new Date(match.createdAt);
        const isHidden = lastMessageTime < sevenDaysAgo;

        return {
          id: match._id,
          name: otherUser?.nickname || otherUser?.fullName || "Unknown",
          age: otherUser?.age,
          avatar: otherUser?.profilePic || otherUser?.photos?.[0],
          isHidden,
          lastActivity: lastMessageTime,
          currentTurn: match.currentTurn, // ADD THIS - needed for SideBar filtering
          messages: matchMessages.map((msg) => ({
            id: msg._id,
            from: msg.sender?._id === authUser?._id ? "me" : "them", // FIXED: .id → ._id
            text: msg.text,
            timestamp: msg.createdAt,
          })),
        };
      });

    console.log("[Conversations Debug] Result:", {
      conversationsCount: result.length,
      conversations: result,
    });

    return result;
  }, [matches, messages, authUser]);

  // Filter active and hidden conversations
  const activeConversations = useMemo(() => {
    const active = conversations.filter((c) => !c.isHidden);
    console.log("[Active Conversations Debug]", {
      totalConversations: conversations.length,
      activeCount: active.length,
      active,
    });
    return active;
  }, [conversations]);

  const hiddenCount = useMemo(
    () => conversations.filter((c) => c.isHidden).length,
    [conversations]
  );

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  const activeMatch = useMemo(() => {
    const match = matches.find((m) => m._id === activeId) || null;

    if (match) {
      console.log("[FrontPage] Active match updated:", {
        matchId: match._id,
        currentTurn: match.currentTurn,
        otherUser: match.user?.nickname || match.user?.fullName,
        timestamp: new Date().toISOString(),
      });
    }

    return match;
  }, [matches, activeId]);

  const handleSend = async (text) => {
    if (!text.trim() || !activeId) return;
    await sendMessage(activeId, text.trim());
  };

  return (
    <div className="w-full">
      {/* same container width as Chat page */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
          {/* Mobile: single column. Desktop: sidebar + content */}
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* SIDEBAR — visible on mobile only when view === 'swipe'; always visible on lg */}
            <aside
              className={[
                "min-w-0 w-full",
                view === "swipe" ? "block" : "hidden",
                "lg:block",
                "lg:sticky lg:top-0 lg:self-start",
              ].join(" ")}
            >
              <Sidebar
                conversations={activeConversations}
                activeId={activeId}
                matchCount={matchCount}
                likeCount={likeCount}
                hiddenCount={hiddenCount}
                onPick={(id) => {
                  setActiveId(id);
                  setView("thread"); // mobile switches to thread
                }}
                onOpenMatches={() => setView("matches")}
                onOpenLikes={() => setView("likes")}
                variant="card"
              />
            </aside>

            {/* CONTENT — visible on mobile when NOT 'swipe'; always visible on lg */}
            <main className="min-w-0 w-full flex flex-col gap-6">
              {/* Thread */}
              {view === "thread" && (
                <Thread
                  convo={active}
                  match={activeMatch}
                  onBack={() => setView("swipe")}
                  onClose={() => setView("swipe")} // <-- add this
                  onSend={handleSend}
                />
              )}

              {/* Matches */}
              {view === "matches" && (
                <>
                  <div className="w-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold dark:text-white">
                      {t("chat.matches")}
                    </h2>
                    <button
                      onClick={() => setView("swipe")}
                      className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm"
                    >
                      Close
                    </button>
                  </div>
                  <MatchesPage
                    onPickChat={(id) => {
                      setActiveId(id);
                      setView("thread");
                    }}
                  />
                </>
              )}

              {/* Likes */}
              {view === "likes" && (
                <>
                  <div className="w-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold dark:text-white">
                      {t("chat.likes")}
                    </h2>
                    <button
                      onClick={() => setView("swipe")}
                      className="rounded-full border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-sm dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {t("common.close")}
                    </button>
                  </div>
                  <LikesPage
                    onPickChat={(id) => {
                      setActiveId(id);
                      setView("thread");
                    }}
                  />
                </>
              )}

              {/* SWIPE content — show on mobile AND desktop */}
              {view === "swipe" && <ProfileSwipe />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
