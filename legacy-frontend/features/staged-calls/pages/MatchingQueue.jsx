import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchingAnimation from "@/features/staged-calls/components/SearchingAnimation";
import { axiosInstance } from "@/core/lib/axios";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function MatchingQueue() {
  const navigate = useNavigate();
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(null);

  // Listen for real-time match found event
  useEffect(() => {
    const handleMatchFound = (event) => {
      console.log("[MatchingQueue] Match found via Socket.IO:", event.detail);
      const { call, otherUser, agora } = event.detail;
      navigate("/first-stage", {
        state: {
          call,
          otherUser,
          agora,
          isStagedCall: true,
        },
      });
    };

    window.addEventListener("staged-call-match-found", handleMatchFound);
    return () => {
      window.removeEventListener("staged-call-match-found", handleMatchFound);
    };
  }, [navigate]);

  useEffect(() => {
    let pollInterval;
    let mounted = true;

    const pollQueueStatus = async () => {
      try {
        const res = await axiosInstance.get("/staged-call/queue-status");

        if (!mounted) return;

        if (res.data.matched) {
          // Match found! Navigate to first stage
          navigate("/first-stage", {
            state: {
              call: res.data.call,
              otherUser: res.data.otherUser,
              agora: res.data.agora,
              isStagedCall: true,
            },
          });
        } else if (res.data.inQueue) {
          // Still in queue, update position
          setQueuePosition(res.data.position);
          setEstimatedWait(res.data.estimatedWait);
        } else {
          // Not in queue anymore (maybe removed)
          navigate("/main");
        }
      } catch (error) {
        console.error("Error polling queue status:", error);
        if (error.response?.status === 404) {
          // Not in queue
          navigate("/main");
        }
      }
    };

    // Poll every 2 seconds
    pollQueueStatus();
    pollInterval = setInterval(pollQueueStatus, 2000);

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
      // Note: We don't auto-cleanup on unmount because React 18 Strict Mode
      // causes double-renders in development, which would immediately remove
      // users from the queue. Users can manually leave via the Cancel button.
    };
  }, [navigate]);

  const handleCancel = async () => {
    try {
      await axiosInstance.post("/staged-call/leave-queue");
      navigate("/main");
    } catch (error) {
      console.error("Error leaving queue:", error);
      navigate("/main");
    }
  };

  return (
    <div className="relative">
      <SearchingAnimation message="Searching for your match..." />

      {/* Cancel Button - Fixed at top right */}
      <motion.button
        onClick={handleCancel}
        className="fixed top-6 right-6 z-[60] flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 rounded-full shadow-lg hover:bg-white dark:hover:bg-neutral-800 transition-colors"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <X className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Cancel
        </span>
      </motion.button>

      {/* Queue Info - Fixed at bottom */}
      {queuePosition !== null && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 rounded-full shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Position in queue
            </span>
            <span className="text-2xl font-bold text-brand">
              #{queuePosition}
            </span>
            {estimatedWait && (
              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                ~{estimatedWait}s wait
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
