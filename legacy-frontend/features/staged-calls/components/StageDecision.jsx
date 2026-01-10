import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/core/lib/axios";
import {
  Check,
  X,
  Clock,
  Video,
  VideoOff,
  Camera,
  CameraOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "@/features/auth";

export default function StageDecision({
  callId,
  stage,
  otherUser,
  call,
  onDecision,
  expiresAt: initialExpiresAt,
  onNavigatingToStage3,
}) {
  const { authUser } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(15);
  const [isDeciding, setIsDeciding] = useState(false);
  const [waitingForOther, setWaitingForOther] = useState(false);
  const [otherUserDecided, setOtherUserDecided] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(null);
  const [checkingCamera, setCheckingCamera] = useState(false);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const navigate = useNavigate();

  // Get match score from call object
  const matchScore = call?.matchScore || 0;

  // Check camera availability if moving to stage 2
  useEffect(() => {
    if (stage === 1) {
      checkCameraPermission();
    }
  }, [stage]);

  const checkCameraPermission = async () => {
    setCheckingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Camera is available
      setCameraAvailable(true);
      // Stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error("Camera permission error:", error);
      setCameraAvailable(false);
    } finally {
      setCheckingCamera(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    // If expiresAt is provided from backend, use it for synchronized countdown
    // Otherwise, start a local 15-second countdown
    const calculateTimeLeft = () => {
      if (expiresAt) {
        const now = Date.now();
        const expiry = new Date(expiresAt).getTime();
        const remaining = Math.max(0, Math.ceil((expiry - now) / 1000)); // Use ceil to show full 15 seconds
        return remaining;
      }
      return timeLeft; // Use local state if no server timestamp
    };

    // Initialize time
    if (expiresAt) {
      setTimeLeft(calculateTimeLeft());
    } else {
      // Start with 15 seconds if no server timestamp yet
      setTimeLeft(15);
    }

    const interval = setInterval(() => {
      if (expiresAt) {
        // Server-synchronized countdown
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          handleTimeout();
        }
      } else {
        // Local countdown (fallback)
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            clearInterval(interval);
            handleTimeout();
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Listen for Socket.IO events
  useEffect(() => {
    const handleDecisionMade = (event) => {
      console.log("[StageDecision] Other user made decision:", event.detail);
      setOtherUserDecided(true);

      // Sync countdown with server timestamp
      if (event.detail.expiresAt) {
        setExpiresAt(event.detail.expiresAt);
      }

      toast.success(
        `${
          event.detail.decidedBy.nickname || event.detail.decidedBy.fullName
        } wants to continue!`,
        { icon: "✨" }
      );
    };

    const handleBothAccepted = (event) => {
      console.log("[StageDecision] Both accepted:", event.detail);
      const { nextStage, call } = event.detail;

      toast.success("Both accepted! Moving to next stage 🎉");

      // Get fresh otherUser data from the updated call object
      const updatedOtherUser =
        call.users?.find(
          (u) => u._id !== authUser?._id // Find the user that's not the current user
        ) || otherUser;

      // Navigate to next stage
      // Note: The flag is already set in handleDecision before the API call
      if (nextStage === 2) {
        navigate("/second-stage", {
          state: {
            call,
            otherUser: updatedOtherUser,
            isStagedCall: true,
          },
        });
      } else if (nextStage === 3) {
        navigate("/third-stage", {
          state: {
            call,
            otherUser: updatedOtherUser,
            isStagedCall: true,
          },
        });
      }
    };

    const handleRejected = (event) => {
      console.log("[StageDecision] Other user rejected:", event.detail);
      const { rejectedBy } = event.detail;

      toast.error(
        `${
          rejectedBy.nickname || rejectedBy.fullName
        } decided not to continue — you got rejected bro 😅`,
        { duration: 5000 }
      );

      setTimeout(() => {
        navigate("/main");
      }, 2000);
    };

    const handleMismatch = () => {
      console.log("[StageDecision] Decision mismatch");
      toast.error("Looks like you two weren't on the same page 🤷‍♂️");
      setTimeout(() => {
        navigate("/main");
      }, 2000);
    };

    window.addEventListener("stage-decision-made", handleDecisionMade);
    window.addEventListener("stage-decision-both-accepted", handleBothAccepted);
    window.addEventListener("stage-decision-rejected", handleRejected);
    window.addEventListener("stage-decision-mismatch", handleMismatch);

    return () => {
      window.removeEventListener("stage-decision-made", handleDecisionMade);
      window.removeEventListener(
        "stage-decision-both-accepted",
        handleBothAccepted
      );
      window.removeEventListener("stage-decision-rejected", handleRejected);
      window.removeEventListener("stage-decision-mismatch", handleMismatch);
    };
  }, [navigate, otherUser]);

  const handleTimeout = () => {
    toast.error("Time's up! Decision period expired ⏰");
    setTimeout(() => {
      navigate("/main");
    }, 1500);
  };

  const handleDecision = async (decision) => {
    if (isDeciding || waitingForOther) return;

    // Show warning if camera is not available (but still allow to continue)
    if (decision === "continue" && stage === 1 && cameraAvailable === false) {
      toast(
        "Camera not available - you'll join with audio only",
        { icon: "📹", duration: 3000 }
      );
      // Allow to continue without camera
    }

    setIsDeciding(true);

    // IMPORTANT: Set the flag BEFORE making the API call
    // This ensures the flag is set before any navigation happens
    if (stage === 2 && decision === "continue" && onNavigatingToStage3) {
      console.log(
        "[StageDecision] Setting isNavigatingToStage3 flag BEFORE API call"
      );
      onNavigatingToStage3();
    }

    try {
      const res = await axiosInstance.post("/staged-call/decide", {
        callId,
        decision,
        stage,
      });

      if (res.data.action === "end") {
        // User chose to end or other user ended
        if (decision === "end") {
          toast("You ended the call");
        }
        setTimeout(() => {
          navigate("/main");
        }, 1000);
      } else if (res.data.action === "continue") {
        // Both users chose continue
        const { nextStage, call } = res.data;

        toast.success("Both accepted! Moving to next stage 🎉");

        // Get fresh otherUser data from the updated call object
        const updatedOtherUser =
          call.users?.find(
            (u) => u._id !== authUser?._id // Find the user that's not the current user
          ) || otherUser;

        if (nextStage === 2) {
          navigate("/second-stage", {
            state: {
              call,
              otherUser: updatedOtherUser,
              isStagedCall: true,
            },
          });
        } else if (nextStage === 3) {
          navigate("/third-stage", {
            state: {
              call,
              otherUser: updatedOtherUser,
              isStagedCall: true,
            },
          });
        }
      } else if (res.data.action === "waiting") {
        // Waiting for other user - set the expiry time from backend
        setWaitingForOther(true);

        // Update expiresAt from backend response
        if (res.data.expiresAt) {
          setExpiresAt(res.data.expiresAt);
        }

        toast.success("Waiting for the other person...", { icon: "⏳" });
      }
    } catch (error) {
      console.error("Error making decision:", error);
      toast.error(error.response?.data?.message || "Failed to make decision");
      navigate("/main");
    } finally {
      setIsDeciding(false);
    }
  };

  const getStageInfo = () => {
    if (stage === 1) {
      return {
        title: "Continue This Date?",
        description: `Would you like to continue your online date with ${
          otherUser?.nickname || otherUser?.fullName || "them"
        }?`,
        subtitle: "Next stage: Video call (camera required) 📹",
        icon: Video,
        cameraNote: "Make sure your camera is ready for the next stage",
      };
    } else if (stage === 2) {
      return {
        title: "Exchange Contacts?",
        description: `Want to stay in touch with ${
          otherUser?.nickname || otherUser?.fullName || "them"
        } after this date?`,
        subtitle: "Share your contact info and keep the connection going 💬",
        icon: Check,
        cameraNote: null,
      };
    }
    return {
      title: "Continue?",
      description: "Keep going with this connection?",
      subtitle: null,
      icon: Check,
      cameraNote: null,
    };
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full"
      >
        {/* Profile Picture */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-brand shadow-lg">
              <img
                src={
                  otherUser?.profilePic ||
                  "https://avatar.iran.liara.run/public"
                }
                alt={otherUser?.fullName || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-4 border-brand/30 animate-ping"></div>
          </div>
        </div>

        {/* Match Score */}
        {matchScore > 0 && (
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-[#B33A2E]/10 to-[#D9776D]/10 px-6 py-2 rounded-full border-2 border-brand/20">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Match Score:
                </span>
                <span className="text-xl font-bold text-brand">
                  {matchScore}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
          {stageInfo.title}
        </h2>
        <p className="text-base sm:text-lg text-center text-gray-700 dark:text-gray-300 mb-1 font-medium">
          {stageInfo.description}
        </p>
        {stageInfo.subtitle && (
          <p className="text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
            {stageInfo.subtitle}
          </p>
        )}

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            animate={{ scale: timeLeft <= 5 ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
          >
            <Clock
              className={`h-6 w-6 ${
                timeLeft <= 5
                  ? "text-red-500"
                  : "text-[#B33A2E] dark:text-[#D9776D]"
              }`}
            />
          </motion.div>
          <span
            className={`text-3xl font-bold ${
              timeLeft <= 5 ? "text-red-500" : "text-gray-800 dark:text-white"
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-neutral-600 rounded-full h-2 mb-6">
          <motion.div
            className={`h-2 rounded-full ${
              timeLeft <= 5
                ? "bg-red-500"
                : "bg-gradient-to-r from-[#B33A2E] to-[#D9776D]"
            }`}
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / 15) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Camera Note (Stage 1 only) - Subtle and Secondary */}
        {stage === 1 && stageInfo.cameraNote && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-3 rounded-lg ${
              cameraAvailable === false
                ? "bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700"
                : "bg-gray-50 dark:bg-neutral-700/50 border border-gray-200 dark:border-neutral-600"
            }`}
          >
            <div className="flex items-center gap-2">
              {checkingCamera ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Camera className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </motion.div>
              ) : cameraAvailable === false ? (
                <CameraOff className="h-4 w-4 text-red-500 dark:text-red-400" />
              ) : (
                <Camera className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
              <p
                className={`text-xs ${
                  cameraAvailable === false
                    ? "text-red-700 dark:text-red-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {checkingCamera
                  ? "Checking camera..."
                  : cameraAvailable === false
                  ? "⚠️ Camera not available - you'll continue with audio only"
                  : stageInfo.cameraNote}
              </p>
            </div>
          </motion.div>
        )}

        {waitingForOther ? (
          // Waiting State
          <div className="text-center py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Clock className="h-12 w-12 text-[#B33A2E] dark:text-[#D9776D]" />
            </motion.div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Waiting for {otherUser?.nickname || otherUser?.fullName}...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {otherUserDecided
                ? "They're thinking about it..."
                : "They need to decide too"}
            </p>
          </div>
        ) : (
          // Decision Buttons
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDecision("end")}
              disabled={isDeciding}
              className="bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
              End Call
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDecision("continue")}
              disabled={isDeciding}
              className="bg-gradient-to-r from-[#B33A2E] to-[#D9776D] hover:from-[#A33028] hover:to-[#C86860] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Check className="h-5 w-5" />
              Continue
            </motion.button>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          Both users must choose "Continue" to proceed
        </p>
      </motion.div>
    </div>
  );
}
