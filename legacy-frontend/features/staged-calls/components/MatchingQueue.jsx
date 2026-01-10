import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosInstance } from "@/core/lib/axios";
import { Phone, Users, X, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MatchAcceptance from "./MatchAcceptance";

export default function MatchingQueue() {
  const location = useLocation();
  const [queueSize, setQueueSize] = useState(0);
  const [timeWaiting, setTimeWaiting] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [pendingMatch, setPendingMatch] = useState(
    location.state?.pendingMatch || null
  );
  const navigate = useNavigate();

  // Log component mount and initial state
  useEffect(() => {
    console.log("🚀 [MatchingQueue] Component mounted");
    console.log("📦 [MatchingQueue] location.state:", location.state);
    console.log("📦 [MatchingQueue] Initial pendingMatch:", pendingMatch);
  }, []);

  // Listen for real-time match pending event
  useEffect(() => {
    console.log(
      "🎧 [MatchingQueue] Setting up window event listener for staged-call-match-pending"
    );

    const handleMatchPending = (event) => {
      console.log("🔔 [MatchingQueue] Window CustomEvent received!");
      console.log("📦 [MatchingQueue] Event detail:", event.detail);
      const { callId, otherUser, matchScore, expiresAt } = event.detail;

      console.log("✅ [MatchingQueue] Setting pendingMatch state...");
      // Show acceptance UI
      setPendingMatch({
        callId,
        otherUser,
        matchScore,
        expiresAt,
      });
      console.log("✅ [MatchingQueue] pendingMatch state set successfully");
    };

    window.addEventListener("staged-call-match-pending", handleMatchPending);
    console.log("✅ [MatchingQueue] Event listener registered");

    return () => {
      console.log("🧹 [MatchingQueue] Cleaning up event listener");
      window.removeEventListener(
        "staged-call-match-pending",
        handleMatchPending
      );
    };
  }, [navigate]);

  // Poll queue status every 2 seconds (fallback if Socket.IO fails)
  useEffect(() => {
    // Don't poll if we have a pending match
    if (pendingMatch) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await axiosInstance.get("/staged-call/queue-status");

        if (res.data.matched && res.data.pending) {
          // Match found! Show acceptance UI
          setPendingMatch({
            callId: res.data.callId,
            otherUser: res.data.otherUser,
            matchScore: res.data.matchScore,
            expiresAt: res.data.expiresAt,
          });
        } else {
          setQueueSize(res.data.queueSize || 0);
        }
      } catch (error) {
        console.error("Error polling queue:", error);
        if (error.response?.status === 404) {
          // Not in queue anymore
          navigate("/");
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [navigate, pendingMatch]);

  // Timer for time waiting
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeWaiting((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Show stats after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStats(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Note: We don't auto-cleanup on unmount because React 18 Strict Mode
  // causes double-renders in development, which would immediately remove
  // users from the queue. Users can manually leave via the Cancel button.

  const handleLeaveQueue = async () => {
    setIsLeaving(true);
    try {
      await axiosInstance.post("/staged-call/leave-queue");
      navigate("/");
    } catch (error) {
      console.error("Error leaving queue:", error);
      navigate("/"); // Navigate anyway
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If we have a pending match, show the acceptance UI
  if (pendingMatch) {
    return (
      <MatchAcceptance
        callId={pendingMatch.callId}
        otherUser={pendingMatch.otherUser}
        matchScore={pendingMatch.matchScore}
        expiresAt={pendingMatch.expiresAt}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-pink-50 to-rose-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full"
      >
        {/* Animated Phone Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="bg-gradient-to-br from-[#B33A2E] to-[#D9776D] p-6 rounded-full"
          >
            <Phone className="h-12 w-12 text-white" />
          </motion.div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
          Finding Your Match
        </h2>
        <p className="text-sm sm:text-base text-center text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
          Our algorithm is searching for the perfect person for you...
        </p>

        {/* Loading Animation */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 bg-[#B33A2E] rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Queue Size */}
          <div className="bg-gray-50 dark:bg-neutral-700 rounded-xl p-3 sm:p-4 text-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#B33A2E] dark:text-[#D9776D] mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              {queueSize}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              In Queue
            </p>
          </div>

          {/* Time Waiting */}
          <div className="bg-gray-50 dark:bg-neutral-700 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {formatTime(timeWaiting)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Waiting
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-[#B33A2E]/10 to-[#D9776D]/10 dark:from-[#B33A2E]/20 dark:to-[#D9776D]/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center">
            💡 <strong>Tip:</strong> Make sure your microphone is enabled for
            the best experience!
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleLeaveQueue}
          disabled={isLeaving}
          className="w-full bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
          {isLeaving ? "Leaving..." : "Cancel Search"}
        </button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-3 sm:mt-4">
          We match you based on age, interests, and preferences
        </p>
      </motion.div>

      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-[#B33A2E]/5 dark:bg-[#B33A2E]/10 rounded-full blur-3xl"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Floating Icon Component
function FloatingIcon({ icon: Icon, delay, className, position }) {
  return (
    <motion.div
      className={`absolute ${position} w-6 h-6 sm:w-8 sm:h-8 ${className}`}
      animate={{
        y: [-10, 10, -10],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <Icon className="w-full h-full" />
    </motion.div>
  );
}
