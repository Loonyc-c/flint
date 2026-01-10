import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import HeaderStage from "@/features/staged-calls/components/HeaderStage";
import { useNavigate, useLocation } from "react-router-dom";
import { FloatingDockComp } from "@/shared/components/ui/FloatingDockComp";
import StageDecision from "../components/StageDecision";
import AiWingman from "@/features/ai-wingman/components/AiWingman";
import Main from "@/assets/main.jpg";
import { AnimatePresence, motion } from "motion/react";
import { axiosInstance } from "@/core/lib/axios";
import PermissionErrorModal from "@/features/staged-calls/components/PermissionErrorModal";
import toast from "react-hot-toast";
import { agoraClient } from "@/core/lib/agoraClient";

export default function SecondStage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if this is a staged call
  const { isStagedCall, call, otherUser, agora } = location.state || {};
  const [stagedCallData, setStagedCallData] = useState(
    isStagedCall ? { call, otherUser } : null
  );

  const [showModal, setShowModal] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isRemoteCamOn, setIsRemoteCamOn] = useState(true);
  const [isRemoteVideoReady, setIsRemoteVideoReady] = useState(false);
  const [isLocalVideoReady, setIsLocalVideoReady] = useState(false);
  const [wingOpen, setWingOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);
  const [isNavigatingToStage3, setIsNavigatingToStage3] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    localVideo: false,
    remoteVideo: false,
    localAudio: false,
    remoteAudio: false,
  });

  const leftVideoRefMobile = useRef(null); // Local video PiP on mobile
  const rightVideoRefMobile = useRef(null); // Remote video (big) on mobile
  const leftVideoRefDesktop = useRef(null); // Remote video on desktop (left)
  const rightVideoRefDesktop = useRef(null); // Local video on desktop (right)
  const isNavigatingToStage3Ref = useRef(false); // Use ref to avoid closure issues
  const remoteVideoTrackRef = useRef(null); // Store remote video track for resize handling
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

  const toggleCam = async () => {
    try {
      const newState = await agoraClient.toggleCamera();
      setIsCamOn(newState);
    } catch (err) {
      console.error("Error toggling camera:", err);
      toast.error("Failed to toggle camera");
    }
  };

  const endCall = async (decision = "end") => {
    // Leave Agora channel
    try {
      await agoraClient.leave();
      console.log("✅ [SecondStage] Left Agora channel");
    } catch (err) {
      console.error("Error leaving Agora:", err);
    }

    setIsMicOn(false);
    setIsCamOn(false);

    // If this is a staged call, send decision to backend
    if (isStagedCall && call) {
      try {
        const res = await axiosInstance.post("/staged-call/end", {
          callId: call._id,
          decision, // "continue" or "end"
          stage: 2,
        });

        if (res.data.action === "continue") {
          // Both chose continue, go to Stage 3
          navigate("/third-stage", {
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
      console.log("👋 [SecondStage] Remote user ended the call");
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
        console.log("⚠️ [SecondStage] Already initializing, skipping...");
        return;
      }
      isInitializingRef.current = true;

      // If we don't have Agora credentials, fetch them
      if (!agoraCredentials && call) {
        console.log("📡 [SecondStage] Fetching Agora credentials...");
        try {
          const res = await axiosInstance.get("/staged-call/active");
          if (res.data.success && res.data.agora) {
            agoraCredentials = res.data.agora;
            console.log("✅ [SecondStage] Agora credentials fetched");
          } else {
            console.error("❌ [SecondStage] No active call found");
            setIsConnecting(false);
            toast.error("No active call found");
            navigate("/main");
            return;
          }
        } catch (err) {
          console.error(
            "❌ [SecondStage] Error fetching Agora credentials:",
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
        console.log("📹 [SecondStage] Initializing Agora video call...");

        // Join Agora channel (with video)
        const result = await agoraClient.join(
          agoraCredentials.appId,
          call.channelName,
          agoraCredentials.token,
          agoraCredentials.uid,
          true // enableVideo = true for video call
        );

        if (!mounted) {
          await agoraClient.leave();
          return;
        }

        console.log("✅ [SecondStage] Successfully joined Agora channel");

        // Play local video on local video elements
        const localVideoTrack = agoraClient.getLocalVideoTrack();
        if (localVideoTrack) {
          console.log("📹 [SecondStage] Playing local video track");

          // Detect if we're on mobile or desktop based on screen width
          const isDesktop = window.innerWidth >= 1024; // lg breakpoint
          console.log(`📱 [SecondStage] Screen mode: ${isDesktop ? 'desktop' : 'mobile'}, width: ${window.innerWidth}px`);

          // Only play on the VISIBLE container to avoid AbortError
          const targetRef = isDesktop ? rightVideoRefDesktop : leftVideoRefMobile;
          const targetName = isDesktop ? "desktop-right" : "mobile-pip";

          if (targetRef.current) {
            try {
              console.log(`🎬 [SecondStage] Playing local video on ${targetName}`);
              localVideoTrack.play(targetRef.current, { fit: "cover" });
              console.log(`✅ [SecondStage] Local video playing on ${targetName}`);

              setTimeout(() => {
                setIsLocalVideoReady(true);
                console.log(`✅ [SecondStage] Local video ready on ${targetName}`);
              }, 500);
            } catch (err) {
              console.error(
                `❌ [SecondStage] Error playing local video on ${targetName}:`,
                err
              );
            }
          } else {
            console.warn(
              `⚠️ [SecondStage] Local video ref ${targetName} not ready`
            );
          }

          setDebugInfo((prev) => ({
            ...prev,
            localVideo: true,
            localAudio: true,
          }));
        } else {
          console.warn("⚠️ [SecondStage] No local video track found");
        }

        setIsConnecting(false);
        toast.success("Connected to video call");

        // Set up remote user listeners
        console.log("🎧 [SecondStage] Setting up remote user listeners...");

        agoraClient.onUserJoined = (uid) => {
          console.log("👤 [SecondStage] Remote user joined channel:", uid);
          setRemoteUserConnected(true);
        };

        agoraClient.onUserLeft = (uid) => {
          console.log("👋 [SecondStage] Remote user left channel:", uid);
          setRemoteUserConnected(false);
          setIsRemoteCamOn(false);
          setDebugInfo((prev) => ({ ...prev, remoteVideo: false }));
        };

        agoraClient.onRemoteVideoAdded = (uid, remoteVideoTrack) => {
          console.log("📹 [SecondStage] Remote video added:", uid);

          // Detect if we're on mobile or desktop
          const isDesktop = window.innerWidth >= 1024;
          console.log(`📱 [SecondStage] Remote video - Screen mode: ${isDesktop ? 'desktop' : 'mobile'}`);

          setRemoteUserConnected(true);
          setIsRemoteCamOn(true);
          setDebugInfo((prev) => ({ ...prev, remoteVideo: true }));

          // Store remote video track for resize handling
          remoteVideoTrackRef.current = remoteVideoTrack;

          // Only play on the VISIBLE container to avoid AbortError
          const targetRef = isDesktop ? leftVideoRefDesktop : rightVideoRefMobile;
          const targetName = isDesktop ? "desktop-left" : "mobile-big";

          const playRemoteVideo = (attempt = 1) => {
            const maxAttempts = 10;
            const retryDelay = 300;

            console.log(`🎬 [SecondStage] Attempting to play remote video on ${targetName} (attempt ${attempt}/${maxAttempts})`);

            if (targetRef.current) {
              try {
                console.log(`🎬 [SecondStage] Playing remote video on ${targetName}`);
                remoteVideoTrack.play(targetRef.current, { fit: "cover" });
                console.log(`✅ [SecondStage] Remote video playing on ${targetName}`);

                setTimeout(() => {
                  setIsRemoteVideoReady(true);
                  console.log(`✅ [SecondStage] Remote video ready`);
                }, 500);
              } catch (err) {
                console.error(`❌ [SecondStage] Error playing remote video:`, err);
                if (attempt < maxAttempts) {
                  setTimeout(() => playRemoteVideo(attempt + 1), retryDelay);
                }
              }
            } else {
              console.warn(`⚠️ [SecondStage] Remote video ref ${targetName} not ready (attempt ${attempt})`);
              if (attempt < maxAttempts) {
                setTimeout(() => playRemoteVideo(attempt + 1), retryDelay);
              }
            }
          };

          setTimeout(() => playRemoteVideo(1), 300);
        };

        agoraClient.onRemoteVideoRemoved = (uid) => {
          console.log("📹 [SecondStage] Remote video removed:", uid);
          setIsRemoteCamOn(false);
          setIsRemoteVideoReady(false);
          setDebugInfo((prev) => ({ ...prev, remoteVideo: false }));
          remoteVideoTrackRef.current = null;
        };

        agoraClient.onUserLeft = (uid) => {
          console.log("👋 [SecondStage] Remote user left:", uid);
          setRemoteUserConnected(false);
          setIsRemoteCamOn(false);
          setIsRemoteVideoReady(false);
          setDebugInfo((prev) => ({
            ...prev,
            remoteVideo: false,
            remoteAudio: false,
          }));

          // Don't show toast if we're navigating to Stage 3
          if (!isNavigatingToStage3Ref.current) {
            toast.error("Other user disconnected");
          } else {
            console.log(
              "ℹ️ [SecondStage] Suppressing disconnect toast - navigating to Stage 3"
            );
          }
        };
      } catch (err) {
        console.error("❌ [SecondStage] Error joining Agora:", err);
        if (!mounted) return;

        setIsConnecting(false);

        // Handle specific permission errors
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.code === "PERMISSION_DENIED"
        ) {
          setPermissionError("camera");
          toast.error("Camera/Microphone access denied");
        } else if (
          err.name === "NotFoundError" ||
          err.code === "DEVICE_NOT_FOUND"
        ) {
          setPermissionError("no-device");
          toast.error("No camera or microphone found");
        } else if (
          err.name === "NotReadableError" ||
          err.code === "NOT_READABLE"
        ) {
          setPermissionError("no-device");
          toast.error("Camera/Microphone is being used by another application");
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

      // Only cleanup Agora if NOT navigating to Stage 3
      // If navigating to Stage 3, ThirdStage will handle cleanup
      if (!isNavigatingToStage3Ref.current) {
        console.log("🧹 [SecondStage] Cleaning up Agora on unmount");
        agoraClient.leave().catch((err) => {
          console.error("Error leaving Agora channel:", err);
        });
      } else {
        console.log(
          "ℹ️ [SecondStage] Skipping Agora cleanup - navigating to Stage 3"
        );
      }
    };
  }, [agora, call]);

  const gridCols = wingOpen
    ? "lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]"
    : "lg:grid-cols-1";

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <HeaderStage
        onTimeUp={() => setShowModal(true)}
        expiresAt={call?.currentStageExpiresAt}
        name={2}
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
              Connecting to video call...
            </p>
          </div>
        </div>
      )}

      {/* Debug Info Overlay - Remove this after testing */}
      {!isConnecting && !permissionError && (
        <div className="fixed top-20 right-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs font-mono">
          <div className="font-bold mb-2">Debug Info:</div>
          <div
            className={debugInfo.localVideo ? "text-green-400" : "text-red-400"}
          >
            📹 Local Video: {debugInfo.localVideo ? "✓" : "✗"}
          </div>
          <div
            className={debugInfo.localAudio ? "text-green-400" : "text-red-400"}
          >
            🎤 Local Audio: {debugInfo.localAudio ? "✓" : "✗"}
          </div>
          <div
            className={
              debugInfo.remoteVideo ? "text-green-400" : "text-yellow-400"
            }
          >
            📹 Remote Video: {debugInfo.remoteVideo ? "✓" : "Waiting..."}
          </div>
          <div
            className={
              debugInfo.remoteAudio ? "text-green-400" : "text-yellow-400"
            }
          >
            🔊 Remote Audio: {debugInfo.remoteAudio ? "✓" : "Waiting..."}
          </div>
          <div className="mt-2 text-gray-400">
            Remote User: {remoteUserConnected ? "Connected" : "Not connected"}
          </div>
        </div>
      )}

      {showModal && isStagedCall && (
        <StageDecision
          callId={call?._id}
          stage={2}
          otherUser={otherUser}
          call={call}
          expiresAt={call?.decisions?.stage2?.decisionExpiresAt}
          onNavigatingToStage3={() => {
            console.log("🚀 [SecondStage] Setting isNavigatingToStage3 flag");
            setIsNavigatingToStage3(true);
            isNavigatingToStage3Ref.current = true;
          }}
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
        className={`flex-1 grid grid-cols-1 ${gridCols} gap-4 px-4 sm:px-6 lg:px-8 pb-6 overflow-y-auto`}
      >
        <section className="flex flex-col gap-4 sm:gap-6 bg-cover bg-center rounded-md p-4 sm:p-6 md:p-8">
          {/* MOBILE Video */}
          <div className="relative w-full aspect-video overflow-hidden rounded-md border-2 border-brand shadow-lg bg-neutral-900 lg:hidden grid grid-cols-1 grid-rows-1">
            {/* Remote big - Profile picture fallback - DISABLED FOR DEBUGGING */}
            {/* {(!isRemoteCamOn || !isRemoteVideoReady) &&
              otherUser?.profilePic && (
                <div className="row-start-1 col-start-1 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 z-10">
                  <img
                    src={otherUser.profilePic}
                    alt={otherUser.fullName || otherUser.nickname}
                    className="w-32 h-32 rounded-full object-cover border-4 border-brand/50"
                  />
                </div>
              )} */}
            {/* Remote big - Video Container */}
            <div
              ref={rightVideoRefMobile}
              className="row-start-1 col-start-1 w-full h-full"
              style={{
                opacity: 1, // Always show video for debugging
                transition: "opacity 0.3s",
              }}
            />

            {/* Local PiP */}
            <div className="row-start-1 col-start-1 justify-self-end self-start m-4 w-32 sm:w-40 md:w-56 aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-neutral-900 backdrop-blur z-20">
              {/* Local PiP - Profile picture fallback - DISABLED FOR DEBUGGING */}
              {/* {(!isCamOn || !isLocalVideoReady) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 z-10">
                  <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center border-2 border-brand/50">
                    <span className="text-2xl">📷</span>
                  </div>
                </div>
              )} */}
              {/* Local PiP - Video Container */}
              <div
                ref={leftVideoRefMobile}
                className="h-full w-full"
                style={{
                  opacity: 1, // Always show for debugging
                  transition: "opacity 0.3s",
                }}
              />
            </div>
          </div>

          {/* DESKTOP Video */}
          <div className="hidden lg:flex w-full gap-6 aspect-video max-h-[60vh]">
            {/* Remote video (left) */}
            <div className="relative w-full h-full bg-neutral-900 rounded-md border-2 border-brand shadow-lg overflow-hidden">
              {/* Profile picture fallback - DISABLED FOR DEBUGGING */}
              {/* {(!isRemoteCamOn || !isRemoteVideoReady) &&
                otherUser?.profilePic && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 z-10">
                    <img
                      src={otherUser.profilePic}
                      alt={otherUser.fullName || otherUser.nickname}
                      className="w-32 h-32 rounded-full object-cover border-4 border-brand/50"
                    />
                  </div>
                )} */}
              {/* Video Container - Agora will create video element inside */}
              <div
                ref={leftVideoRefDesktop}
                className="absolute inset-0 w-full h-full"
                style={{
                  opacity: 1, // Always show video for debugging
                  transition: "opacity 0.3s",
                }}
              />
            </div>

            {/* Local video (right) */}
            <div className="relative w-full h-full bg-neutral-900 rounded-md border-2 border-brand shadow-lg overflow-hidden">
              {/* Profile picture fallback - DISABLED FOR DEBUGGING */}
              {/* {(!isCamOn || !isLocalVideoReady) && otherUser?.profilePic && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 z-10">
                  <div className="w-32 h-32 rounded-full bg-brand/20 flex items-center justify-center border-4 border-brand/50">
                    <span className="text-4xl text-brand">📷</span>
                  </div>
                </div>
              )} */}
              {/* Video Container - Agora will create video element inside */}
              <div
                ref={rightVideoRefDesktop}
                className="absolute inset-0 w-full h-full"
                style={{
                  opacity: 1, // Always show for debugging
                  transition: "opacity 0.3s",
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-4 mt-auto">
            <button
              onClick={() => setWingOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-3"
              aria-label="Open AI Wingman"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI Wingman</span>
            </button>

            <div className="flex justify-center w-full">
              <FloatingDockComp
                className=""
                micOn={isMicOn}
                camOn={isCamOn}
                onMicClick={toggleMic}
                onCamClick={toggleCam}
                onHangup={endCall}
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

      <AnimatePresence>
        {wingOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            className="lg:hidden px-4 sm:px-6 lg:px-8 pb-6"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
