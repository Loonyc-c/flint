"use client";

import { useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChatThread } from "@/features/chat/components/ChatThread";
import { useMatches } from "@/features/swipe/hooks/useMatches";
import { useRouter } from "@/i18n/routing";
import { useStagedCallContext } from "@/features/video";

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const ChatPage = () => {
  const params = useParams();
  const router = useRouter();
  const { matches } = useMatches();
  const { initiateCall } = useStagedCallContext();

  const matchId = params.matchId as string;
  const conversation = useMemo(
    () => matches.find((m) => m.matchId === matchId),
    [matches, matchId]
  );

  const handleVideoCall = useCallback(() => {
    if (conversation) {
      const stage = conversation.stage === "fresh" ? 1 : 2;
      initiateCall(
        conversation.matchId,
        conversation.otherUser.id,
        stage as 1 | 2
      );
    }
  }, [conversation, initiateCall]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <p className="text-neutral-500">Conversation not found</p>
          <button 
            onClick={() => router.push("/swipe")}
            className="text-brand font-bold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="chat"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full w-full overflow-hidden sm:rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl"
    >
      <ChatThread
        conversation={conversation}
        onClose={() => router.push("/swipe")}
        onVideoCall={handleVideoCall}
        matchStage={conversation.stage}
      />
    </motion.div>
  );
};

export default ChatPage;
