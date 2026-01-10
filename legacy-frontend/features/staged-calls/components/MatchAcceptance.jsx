import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/core/lib/axios";
import { Phone, Check, X, Clock, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function MatchAcceptance({
  callId,
  otherUser,
  matchScore,
  expiresAt,
}) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [waitingForOther, setWaitingForOther] = useState(false);
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    const expiryTime = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        toast.error("Match expired");
        navigate("/");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, navigate]);

  // Listen for Socket.IO events
  useEffect(() => {
    const handleAccepted = (event) => {
      console.log("[MatchAcceptance] Call accepted:", event.detail);
      const { call, agora, otherUser: other } = event.detail;

      // Navigate to FirstStage
      navigate("/first-stage", {
        state: {
          call,
          otherUser: other,
          agora,
          isStagedCall: true,
        },
      });
    };

    const handleRejected = () => {
      console.log("[MatchAcceptance] Call rejected by other user");
      toast.error("Match was declined");
      navigate("/");
    };

    const handleUserAccepted = () => {
      console.log("[MatchAcceptance] Other user accepted");
      toast.success(`${otherUser.nickname || otherUser.fullName} accepted!`);
    };

    window.addEventListener("staged-call-accepted", handleAccepted);
    window.addEventListener("staged-call-rejected", handleRejected);
    window.addEventListener("staged-call-user-accepted", handleUserAccepted);

    return () => {
      window.removeEventListener("staged-call-accepted", handleAccepted);
      window.removeEventListener("staged-call-rejected", handleRejected);
      window.removeEventListener(
        "staged-call-user-accepted",
        handleUserAccepted
      );
    };
  }, [navigate, otherUser]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await axiosInstance.post(`/staged-call/accept/${callId}`);

      if (res.data.callStarted) {
        // Both users accepted! Navigate to call
        const { call, agora, otherUser: other } = res.data;
        navigate("/first-stage", {
          state: {
            call,
            otherUser: other,
            agora,
            isStagedCall: true,
          },
        });
      } else if (res.data.waitingForOther) {
        // Waiting for other user to accept
        setWaitingForOther(true);
        toast.success("Waiting for the other person to accept...");
      }
    } catch (error) {
      console.error("Error accepting match:", error);
      toast.error(error.response?.data?.message || "Failed to accept match");
      navigate("/");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await axiosInstance.post(`/staged-call/reject/${callId}`);
      toast("Match declined");
      navigate("/");
    } catch (error) {
      console.error("Error rejecting match:", error);
      navigate("/");
    }
  };

  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-pink-50 to-rose-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full"
      >
        {/* Match Found Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="inline-block bg-gradient-to-br from-[#B33A2E] to-[#D9776D] p-4 rounded-full mb-4"
          >
            <Heart className="h-12 w-12 text-white" fill="white" />
          </motion.div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Match Found!
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            You've been matched with someone special
          </p>
        </div>

        {/* Profile Picture */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-brand shadow-xl"
            >
              <img
                src={
                  otherUser?.profilePic ||
                  "https://avatar.iran.liara.run/public"
                }
                alt={otherUser?.fullName || "User"}
                className="w-full h-full object-cover"
              />
            </motion.div>
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-4 border-brand/30 animate-ping"></div>
          </div>
        </div>

        {/* User Name */}
        <div className="text-center mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-1">
            {otherUser.nickname || otherUser.fullName}
          </h3>
          {otherUser.age && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {otherUser.age} years old
            </p>
          )}
        </div>

        {/* Match Score Badge */}
        {matchScore > 0 && (
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-r from-[#B33A2E]/10 to-[#D9776D]/10 px-8 py-3 rounded-full border-2 border-brand/20 shadow-md"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-brand" fill="currentColor" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Match Score:
                </span>
                <span className="text-2xl font-bold text-brand">
                  {matchScore}%
                </span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-[#B33A2E] dark:text-[#D9776D]" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            to respond
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-neutral-600 rounded-full h-2 mb-6">
          <motion.div
            className="bg-gradient-to-r from-[#B33A2E] to-[#D9776D] h-2 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / 15) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {waitingForOther ? (
          // Waiting State
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Phone className="h-12 w-12 text-[#B33A2E] dark:text-[#D9776D]" />
            </motion.div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Waiting for {otherUser.nickname || otherUser.fullName}...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              They need to accept the match too
            </p>
          </div>
        ) : (
          // Accept/Reject Buttons
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleReject}
              disabled={isRejecting || isAccepting}
              className="bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
              {isRejecting ? "Declining..." : "Decline"}
            </button>

            <button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="bg-gradient-to-r from-[#B33A2E] to-[#D9776D] hover:from-[#A33028] hover:to-[#C86860] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Check className="h-5 w-5" />
              {isAccepting ? "Accepting..." : "Accept"}
            </button>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          Both users must accept to start the call
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
