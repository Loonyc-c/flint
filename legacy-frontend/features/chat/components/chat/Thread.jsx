import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ChevronLeft, Send, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatBubble from "./ChatBubble";
import ChatSettings from "../ChatSettings";
import { axiosInstance } from "@/core/lib/axios";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth";

const CALL_ROUTE = "/first-stage"; // <-- change if your staged-calls route differs

export default function Thread({ convo, match, onBack, onSend, onClose }) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { authUser } = useAuthStore();

  // Auto-scroll to bottom when messages change (optimized with requestAnimationFrame)
  useEffect(() => {
    if (!scrollRef.current) return;

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [convo?.messages?.length]); // Only depend on message count, not entire convo object

  // Mark messages as seen when viewing conversation
  useEffect(() => {
    if (!match?._id) return;

    axiosInstance.post(`/messages/${match._id}/seen`).catch((error) => {
      console.error("Error marking messages as seen:", error);
    });
  }, [match?._id]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleCall = useCallback(() => {
    navigate(CALL_ROUTE);
  }, [navigate]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed) return;
      onSend(trimmed);
      setText("");
    },
    [text, onSend]
  );

  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  // Compute turn status - memoized to prevent unnecessary re-renders
  const turnStatus = useMemo(() => {
    if (!match || !authUser) return null;

    const isTheirTurn = match.currentTurn === match.user?._id;

    console.log("🔍 Thread turn status computed:", {
      matchId: match._id,
      currentTurn: match.currentTurn,
      otherUserId: match.user?._id,
      authUserId: authUser?._id,
      isTheirTurn,
      timestamp: new Date().toISOString(),
    });

    return {
      isTheirTurn,
      otherUserName: match.user?.nickname || match.user?.fullName || "Unknown",
    };
  }, [match?.currentTurn, match?.user?._id, match?._id, authUser?._id]);

  // Debug: Log when turn status changes
  useEffect(() => {
    if (turnStatus) {
      console.log("✅ Turn status updated in Thread:", turnStatus);
    }
  }, [turnStatus]);

  if (!convo) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-10">
        <div className="text-neutral-500">Pick a conversation.</div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden flex flex-col h-[calc(100vh-160px)] sm:h-[calc(100svh-160px)] lg:border-l-0 lg:rounded-l-none">
      {/* scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
        {/* sticky header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-700">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* left: back + person */}
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="lg:hidden inline-flex items-center justify-center rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5 dark:text-white" />
              </button>
              <img
                src={convo.avatar}
                alt={convo.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <div className="font-semibold dark:text-white">
                  {convo.name}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                  {t("chat.activeNow")}
                </div>
              </div>
            </div>

            {/* right: actions */}
            <div className="flex items-center gap-2">
              {/* Call => staged calls */}
              <button
                type="button"
                onClick={handleCall}
                className="inline-flex items-center gap-2 rounded-full bg-brand text-white px-3 py-1.5"
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm">{t("chat.call")}</span>
              </button>

              {/* Chat Settings */}
              {match && <ChatSettings match={match} onBack={onBack} />}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden lg:inline-flex rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>

        {/* messages */}
        <div className="px-4 py-5 flex flex-col gap-3">
          {convo.messages.map((m) => (
            <ChatBubble
              key={m.id}
              from={m.from}
              text={m.text}
              read={m.read}
              readAt={m.readAt}
              timestamp={m.timestamp}
            />
          ))}

          {/* Turn notification inside chat - Bold and prominent */}
          {turnStatus && (
            <div className="flex justify-center mt-6 mb-2">
              <div className="px-6 py-3 rounded-full bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 shadow-sm">
                {turnStatus.isTheirTurn ? (
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    ⏳{" "}
                    {t("notification.theirTurn", {
                      name: turnStatus.otherUserName,
                    })}{" "}
                    ⌛
                  </span>
                ) : (
                  <span className="text-sm font-bold text-brand dark:text-[#D9776D]">
                    💬 {t("notification.yourTurn")} ✨
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-neutral-200 dark:border-neutral-700 px-3 py-3"
      >
        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-2">
          <input
            value={text}
            onChange={handleTextChange}
            placeholder={t("chat.typeMessage")}
            className="flex-1 bg-transparent outline-none text-sm px-2 dark:text-white dark:placeholder-neutral-400"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-brand text-white text-sm px-3 py-1.5 disabled:opacity-50"
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
            {t("chat.send")}
          </button>
        </div>
      </form>
    </section>
  );
}
