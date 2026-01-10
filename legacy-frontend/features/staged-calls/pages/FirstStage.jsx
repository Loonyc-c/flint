import React, { useEffect, useRef, useState } from "react";
import { AudioLines, Sparkles } from "lucide-react";
import Logo from "@/assets/logo.svg";
import { useNavigate, useLocation } from "react-router-dom";
import AiWingman from "@/features/ai-wingman/components/AiWingman";
import StageDecision from "../components/StageDecision";
import HeaderStage from "@/features/staged-calls/components/HeaderStage";
import { FloatingDockComp } from "@/shared/components/ui/FloatingDockComp";
import { axiosInstance } from "@/core/lib/axios";
import PermissionErrorModal from "@/features/staged-calls/components/PermissionErrorModal";
import toast from "react-hot-toast";
import { agoraClient } from "@/core/lib/agoraClient";

export default function FirstStage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if this is a staged call (Omegle-style) or regular swipe-based call
  const { isStagedCall, call, otherUser, agora } = location.state || {};
  const [stagedCallData, setStagedCallData] = useState(
    isStagedCall ? { call, otherUser } : null
  );

  const [showModal, setShowModal] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [wingOpen, setWingOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const mediaStreamRef = useRef(null);
  const isInitializingRef = useRef(false); // Prevent double initialization in React Strict Mode

  const toggleMic = async () => {
    try {
      const newState = await agoraClient.toggleMicrophone();
      setIsMicOn(newState);
    } catch (err) {
      console.error("Error toggling microphone:", err);
      toast.error("Failed to toggle microphone");
    }
  };

  const endCall = async (decision = "end") => {
    // Leave Agora channel
    try {
      await agoraClient.leave();
      console.log("✅ [FirstStage] Left Agora channel");
    } catch (err) {
      console.error("Error leaving Agora:", err);
    }
    setIsMicOn(false);

    // If this is a staged call, send decision to backend
    if (isStagedCall && call) {
      try {
        const res = await axiosInstance.post("/staged-call/end", {
          callId: call._id,
          decision, // "continue" or "end"
          stage: 1,
        });

        if (res.data.action === "continue") {
          // Both chose continue, go to Stage 2
          navigate("/second-stage", {
            state: {
              call: res.data.call,
              otherUser: stagedCallData.otherUser,
              isStagedCall: true,
            },
          });
          return;
        }
      } catch (error) {
        console.error("Error ending staged call:", error);
      }
    }

    navigate("/main");
  };

  // Handle when remote user ends the call
  useEffect(() => {
    const handleRemoteUserEnded = () => {
      console.log("👋 [FirstStage] Remote user ended the call");
      toast.error("Your date has ended - the other person left", {
        duration: 4000,
      });

      // Leave Agora and navigate to main
      agoraClient.leave().catch((err) => {
        console.error("Error leaving Agora:", err);
      });

      setTimeout(() => {
        navigate("/main");
      }, 2000);
    };

    window.addEventListener("staged-call-ended", handleRemoteUserEnded);

    return () => {
      window.removeEventListener("staged-call-ended", handleRemoteUserEnded);
    };
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    let agoraCredentials = agora;

    const initializeCall = async () => {
      // Prevent double initialization in React Strict Mode
      if (isInitializingRef.current) {
        console.log("⚠️ [FirstStage] Already initializing, skipping...");
        return;
      }
      isInitializingRef.current = true;

      // If we don't have Agora credentials, fetch them
      if (!agoraCredentials && call) {
        console.log("📡 [FirstStage] Fetching Agora credentials...");
        try {
          const res = await axiosInstance.get("/staged-call/active");
          if (res.data.success && res.data.agora) {
            agoraCredentials = res.data.agora;
            console.log("✅ [FirstStage] Agora credentials fetched");
          } else {
            console.error("❌ [FirstStage] No active call found");
            setIsConnecting(false);
            toast.error("No active call found");
            navigate("/main");
            return;
          }
        } catch (err) {
          console.error(
            "❌ [FirstStage] Error fetching Agora credentials:",
            err
          );
          setIsConnecting(false);
          toast.error("Failed to get call credentials");
          navigate("/main");
          return;
        }
      }

      // Check if we have Agora credentials
      if (!agoraCredentials || !call) {
        console.warn("No Agora credentials or call data provided");
        setIsConnecting(false);
        return;
      }

      try {
        setIsConnecting(true);
        console.log("🎤 [FirstStage] Initializing Agora voice call...");

        // Join Agora channel (voice only)
        const result = await agoraClient.join(
          agoraCredentials.appId,
          call.channelName,
          agoraCredentials.token,
          agoraCredentials.uid,
          false // enableVideo = false for voice-only
        );

        if (!mounted) {
          await agoraClient.leave();
          return;
        }

        console.log("✅ [FirstStage] Successfully joined Agora channel");
        setIsConnecting(false);
        toast.success("Connected to voice call");

        // Set up remote user listeners
        agoraClient.onUserLeft = (uid) => {
          console.log("👋 [FirstStage] Remote user left:", uid);
          toast.error("Other user disconnected");
          // Optionally end call
        };
      } catch (err) {
        console.error("❌ [FirstStage] Error joining Agora:", err);
        if (!mounted) return;

        setIsConnecting(false);

        // Handle specific permission errors
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.code === "PERMISSION_DENIED"
        ) {
          setPermissionError("microphone");
          toast.error("Microphone access denied");
        } else if (
          err.name === "NotFoundError" ||
          err.code === "DEVICE_NOT_FOUND"
        ) {
          setPermissionError("no-device");
          toast.error("No microphone found");
        } else if (
          err.name === "NotReadableError" ||
          err.code === "NOT_READABLE"
        ) {
          setPermissionError("no-device");
          toast.error("Microphone is being used by another application");
        } else {
          setPermissionError("connection");
          toast.error("Failed to connect to call");
        }
      }
    };

    initializeCall();

    return () => {
      mounted = false;
      isInitializingRef.current = false; // Reset for next mount
      // Leave Agora channel on unmount
      agoraClient.leave().catch((err) => {
        console.error("Error leaving Agora channel:", err);
      });
    };
  }, [agora, call]);

  const gridCols = wingOpen
    ? "lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]"
    : "lg:grid-cols-1";

  return (
    <div className="w-full">
      <HeaderStage
        onTimeUp={() => setShowModal(true)}
        expiresAt={call?.currentStageExpiresAt}
        name={1}
      />

      {/* Permission Error Modal */}
      {permissionError && (
        <PermissionErrorModal
          type={permissionError}
          onExit={() => navigate("/main")}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Connecting State */}
      {isConnecting && !permissionError && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold">
              Connecting to microphone...
            </p>
          </div>
        </div>
      )}

      {showModal && isStagedCall && (
        <StageDecision
          callId={call?._id}
          stage={1}
          otherUser={otherUser}
          call={call}
          expiresAt={call?.decisions?.stage1?.decisionExpiresAt}
        />
      )}

      <div className="hidden lg:flex justify-end px-4">
        {!wingOpen && (
          <button
            onClick={() => setWingOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand text-white px-4 py-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Wingman
          </button>
        )}
      </div>

      <div
        className={`grid grid-cols-1 ${gridCols} gap-4 px-4 sm:px-6 lg:px-8 pb-6`}
      >
        <section className="min-h-[calc(100vh-160px)] flex flex-col justify-between items-center">
          <div className="flex flex-col items-center gap-6 pt-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-brand shadow-xl">
                <img
                  src={
                    stagedCallData?.otherUser?.profilePic ||
                    "https://avatar.iran.liara.run/public"
                  }
                  alt={stagedCallData?.otherUser?.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Animated pulse ring */}
              <div className="absolute inset-0 rounded-full border-4 border-brand animate-ping opacity-20"></div>
            </div>

            {/* Audio indicator */}
            <div className="flex items-center gap-3 bg-brand/10 px-6 py-3 rounded-full">
              <AudioLines className="text-brand w-6 h-6 animate-pulse" />
              <span className="text-brand font-semibold text-sm">
                Voice Call Active
              </span>
            </div>

            {/* User info */}
            <div className="flex flex-col items-center gap-2">
              <div className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-gray-100">
                {stagedCallData?.otherUser?.fullName || "User"}
              </div>
              <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Connected
              </div>
              {stagedCallData?.otherUser?.age && (
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {stagedCallData.otherUser.age} years old
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-4 pb-6 sm:pb-7">
            <button
              onClick={() => setWingOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-3 text-sm sm:text-base"
              aria-label="Open AI Wingman"
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Wingman</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                Live
              </span>
            </button>

            <div className="flex justify-center w-full">
              <FloatingDockComp
                className=""
                micOn={isMicOn}
                onMicClick={toggleMic}
                onHangup={endCall}
                stage={1}
              />
            </div>
          </div>
        </section>

        {wingOpen && (
          <div className="hidden lg:block h-full">
            <div className="h-full bg-neutral-50 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 text-brand" />
                  AI Wingman
                  <span className="rounded-full bg-brand/15 text-brand px-2 py-0.5 text-xs">
                    Live
                  </span>
                </div>
                <button
                  onClick={() => setWingOpen(false)}
                  className="rounded-full px-3 py-1 text-sm bg-neutral-200 dark:bg-neutral-800"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 sm:p-5">
                <div className="wingman-reset flex flex-col gap-3">
                  <AiWingman />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {wingOpen && (
        <div className="lg:hidden px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-brand" />
                AI Wingman
                <span className="rounded-full bg-brand/15 text-brand px-2 py-0.5 text-xs">
                  Live
                </span>
              </div>
              <button
                onClick={() => setWingOpen(false)}
                className="rounded-full px-3 py-1 text-sm bg-neutral-200 dark:bg-neutral-800"
              >
                Close
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <div className="wingman-reset flex flex-col gap-3">
                <AiWingman />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
