// src/pages/Chat.jsx
import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "@/features/chat/components/chat/SideBar";
import Thread from "@/features/chat/components/chat/Thread";
import { useParams } from "react-router-dom";
import { useMatchStore } from "@/features/chat";
import { useMessageStore } from "@/features/chat";
import { useAuthStore } from "@/features/auth";
import { axiosInstance } from "@/core/lib/axios";

export default function Chat() {
  const { matches, getMatches, isLoadingMatches } = useMatchStore();
  const { messages, getMessages, sendMessage, joinMatchRoom, leaveMatchRoom } =
    useMessageStore();
  const { authUser } = useAuthStore();
  const [activeId, setActiveId] = useState(null);
  const [mobileView, setMobileView] = useState("list");

  const params = useParams();

  // Load matches on mount
  useEffect(() => {
    getMatches();
  }, [getMatches]);

  // Set active match from URL
  useEffect(() => {
    if (params?.id) setActiveId(params.id);
  }, [params?.id]);

  // Join/leave match room when active match changes
  useEffect(() => {
    if (activeId) {
      // Join room and get messages immediately
      joinMatchRoom(activeId);
      getMessages(activeId);

      // Mark messages as read in background (don't wait)
      axiosInstance.post(`/matches/${activeId}/read`).catch((error) => {
        console.error("Error marking as read:", error);
      });

      // Optimistically update unread count in local state
      // (instead of refetching all matches)
      const matchStore = useMatchStore.getState();
      matchStore.updateUnreadCount(activeId, 0);

      return () => {
        leaveMatchRoom(activeId);
      };
    }
  }, [activeId, joinMatchRoom, leaveMatchRoom, getMessages]);

  // Convert matches to conversations format
  const conversations = useMemo(() => {
    console.log("[Chat.jsx] Converting matches to conversations:", {
      matchesCount: matches.length,
      authUserId: authUser?._id,
      matchesWithTurns: matches.map((m) => ({
        id: m._id,
        currentTurn: m.currentTurn,
      })),
    });

    return matches.map((match) => {
      // Backend returns match.user (singular) as the other user
      // Fallback to finding from users array if needed
      let otherUser = match.user;

      if (!otherUser && match.users && Array.isArray(match.users)) {
        otherUser = match.users.find(
          (u) => u?._id?.toString() !== authUser?._id
        );
      }

      const matchMessages = messages[match._id] || [];

      return {
        id: match._id,
        name: otherUser?.nickname || otherUser?.fullName || "Unknown",
        age: otherUser?.age,
        avatar: otherUser?.profilePic || otherUser?.photos?.[0],
        currentTurn: match.currentTurn, // ✅ ADD THIS - needed for turn-based chat
        unreadCount: match.unreadCount || 0, // ✅ ADD THIS - for unread indicators
        messages: matchMessages.map((msg) => ({
          id: msg._id,
          from: msg.sender?._id === authUser?._id ? "me" : "them",
          text: msg.text,
          timestamp: msg.createdAt,
          read: msg.read || false,
          readAt: msg.readAt,
        })),
      };
    });
  }, [matches, messages, authUser]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  const activeMatch = useMemo(() => {
    const match = matches.find((m) => m._id === activeId) || null;

    if (match) {
      console.log("[Chat.jsx] Active match updated:", {
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

  if (isLoadingMatches) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside
              className={[
                "lg:block",
                mobileView === "list" ? "block" : "hidden",
                "sticky top-0 self-start",
                "rounded-2xl border border-neutral-200 bg-white",
              ].join(" ")}
            >
              <Sidebar
                conversations={conversations}
                activeId={activeId}
                onPick={(id) => {
                  setActiveId(id);
                  setMobileView("thread"); // on mobile, go to thread
                }}
              />
            </aside>

            {/* Thread */}
            <div
              className={[
                mobileView === "thread" ? "block" : "hidden",
                "lg:block",
              ].join(" ")}
            >
              <Thread
                convo={active}
                match={activeMatch}
                onBack={() => setMobileView("list")} // back button only shows on mobile
                onSend={handleSend}
                // no onClose here on the /chat page
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
