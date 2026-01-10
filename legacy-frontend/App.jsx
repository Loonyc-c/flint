// React & Router
import { useEffect } from "react";
import {
  useLocation,
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// App version for debugging deployments
const APP_VERSION = "2024.12.09.1";
console.log(`🚀 Flint App Version: ${APP_VERSION}`);
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

// Features
import { Home, Main } from "@/features/home";
import {
  Login,
  Onboarding,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
  ProtectedRoute,
  useAuthStore,
} from "@/features/auth";
import { Swipe } from "@/features/swipe";
import { Chat, useMatchStore, useMessageStore } from "@/features/chat";
import {
  FirstStage,
  SecondStage,
  ThirdStage,
  MatchingQueue,
} from "@/features/staged-calls";
import { ProfileSettings } from "@/features/profile";
import { SubscriptionPage } from "@/features/subscription";
import { OfflineDating } from "@/features/offline-dating";

// Shared
import { Header, ErrorBoundary } from "@/shared";

// Core
import { initializeSocket, disconnectSocket } from "@/core/lib/socket";

function App() {
  const location = useLocation();
  const { checkAuth, authUser, isCheckingAuth } = useAuthStore();
  const { addMatch, updateMatchTurn, fetchMatches } = useMatchStore();
  const { addMessage, setTyping } = useMessageStore();

  useEffect(() => {
    console.log("[App.jsx] 🔍 Running checkAuth...");
    checkAuth();
  }, [checkAuth]);

  // Initialize Socket.IO when user is authenticated
  useEffect(() => {
    console.log("[App.jsx] 🔍 Socket.IO useEffect triggered!", {
      authUserExists: !!authUser,
      authUserId: authUser?._id,
      authUserEmail: authUser?.email,
    });

    if (authUser) {
      console.log(
        "[App.jsx] ✅ Initializing Socket.IO for user:",
        authUser._id
      );
      const socket = initializeSocket();
      socket.connect();

      // Log connection status
      socket.on("connect", () => {
        console.log("[App.jsx] ✅ Socket.IO connected! Socket ID:", socket.id);
      });

      socket.on("disconnect", (reason) => {
        console.log("[App.jsx] ❌ Socket.IO disconnected. Reason:", reason);
      });

      // Listen for new matches
      socket.on("new-match", (match) => {
        console.log("[App.jsx] New match event received:", match);

        // Format the match to match the structure from getMatches()
        // Backend sends match with populated 'users' array, but we need 'user' (singular)
        const otherUser = match.users?.find(
          (user) => user._id.toString() !== authUser._id
        );

        const formattedMatch = {
          _id: match._id,
          user: otherUser, // Add the other user as 'user' field
          users: match.users, // Keep the users array
          stage: match.stage,
          stageHistory: match.stageHistory || [],
          lastMessageAt: match.lastMessageAt,
          unreadCount: 0, // New match has no unread messages
          currentTurn: match.currentTurn,
          lastTurnChangeAt: match.lastTurnChangeAt,
          mutedBy: match.mutedBy || [],
          blockedBy: match.blockedBy || [],
          reports: match.reports || [],
          status: match.status,
          createdAt: match.createdAt,
        };

        console.log("[App.jsx] Formatted match:", formattedMatch);
        addMatch(formattedMatch);

        // Show toast notification
        toast.success(
          `🎉 You matched with ${
            otherUser?.nickname || otherUser?.fullName || "someone"
          }!`,
          {
            duration: 4000,
          }
        );
      });

      // Listen for new messages
      socket.on("new-message", (message) => {
        addMessage(message.matchId, message);

        // Update unread count locally instead of refetching all matches
        // This improves performance significantly
        const matchStore = useMatchStore.getState();
        const matches = matchStore.matches;
        const matchIndex = matches.findIndex((m) => m._id === message.matchId);

        if (matchIndex !== -1) {
          const updatedMatches = [...matches];
          const currentUnread = updatedMatches[matchIndex].unreadCount || 0;
          updatedMatches[matchIndex] = {
            ...updatedMatches[matchIndex],
            unreadCount: currentUnread + 1,
            lastMessageAt: message.createdAt,
          };
          matchStore.matches = updatedMatches;
        }
      });

      // Listen for typing indicators
      socket.on("user-typing", ({ userId, isTyping }) => {
        setTyping(null, userId, isTyping);
      });

      // Listen for turn changes
      socket.on("turn-changed", ({ matchId, currentTurn, otherUserName }) => {
        console.log("[App.jsx] Turn changed event received:", {
          matchId,
          currentTurn,
          otherUserName,
          timestamp: new Date().toISOString(),
        });

        // Update match turn in store
        // This ensures both users stay in sync via socket events
        updateMatchTurn(matchId, currentTurn);

        // Show toast notification only if it's now YOUR turn
        // (Don't show notification when you send a message and it becomes their turn)
        if (currentTurn === authUser._id) {
          toast("💬 Now it's your turn to text!", {
            icon: "✨",
            duration: 3000,
          });
        }
        // Note: We don't show "their turn" notification when sender sends message
        // because that would be redundant (they just sent the message)
      });

      // Listen for messages seen
      socket.on("messages-seen", ({ matchId, seenBy, seenAt }) => {
        console.log("[App.jsx] Messages seen event received:", {
          matchId,
          seenBy,
          seenAt,
        });

        // Update message store to mark messages as seen
        const { updateMessagesSeen } = useMessageStore.getState();
        updateMessagesSeen(matchId, seenBy, seenAt);
      });

      // Listen for staged call match pending (new accept/reject flow)
      socket.on("staged-call-match-pending", (data) => {
        console.log(
          "🎯 [App.jsx] Socket.IO event received: staged-call-match-pending"
        );
        console.log("📦 [App.jsx] Event data:", data);
        console.log("👤 [App.jsx] Current user ID:", authUser._id);
        console.log("🔔 [App.jsx] Dispatching window CustomEvent...");

        // Dispatch custom event for MatchingQueue component to handle
        window.dispatchEvent(
          new CustomEvent("staged-call-match-pending", { detail: data })
        );

        console.log("✅ [App.jsx] Window CustomEvent dispatched successfully");
      });

      // Listen for staged call accepted (both users accepted)
      socket.on("staged-call-accepted", (data) => {
        console.log("[App.jsx] Staged call accepted:", data);

        // Dispatch custom event for MatchAcceptance component to handle
        window.dispatchEvent(
          new CustomEvent("staged-call-accepted", { detail: data })
        );
      });

      // Listen for staged call rejected
      socket.on("staged-call-rejected", (data) => {
        console.log("[App.jsx] Staged call rejected:", data);

        // Dispatch custom event for MatchAcceptance component to handle
        window.dispatchEvent(
          new CustomEvent("staged-call-rejected", { detail: data })
        );
      });

      // Listen for other user accepting
      socket.on("staged-call-user-accepted", (data) => {
        console.log("[App.jsx] Other user accepted:", data);

        // Dispatch custom event for MatchAcceptance component to handle
        window.dispatchEvent(
          new CustomEvent("staged-call-user-accepted", { detail: data })
        );
      });

      // Listen for stage decision made (one user decided)
      socket.on("stage-decision-made", (data) => {
        console.log("[App.jsx] Stage decision made:", data);

        // Dispatch custom event for StageDecision component to handle
        window.dispatchEvent(
          new CustomEvent("stage-decision-made", { detail: data })
        );
      });

      // Listen for both users accepting stage decision
      socket.on("stage-decision-both-accepted", (data) => {
        console.log("[App.jsx] Both users accepted stage decision:", data);

        // Dispatch custom event for StageDecision component to handle
        window.dispatchEvent(
          new CustomEvent("stage-decision-both-accepted", { detail: data })
        );
      });

      // Listen for stage decision rejected
      socket.on("stage-decision-rejected", (data) => {
        console.log("[App.jsx] Stage decision rejected:", data);

        // Dispatch custom event for StageDecision component to handle
        window.dispatchEvent(
          new CustomEvent("stage-decision-rejected", { detail: data })
        );
      });

      // Listen for stage decision mismatch
      socket.on("stage-decision-mismatch", (data) => {
        console.log("[App.jsx] Stage decision mismatch:", data);

        // Dispatch custom event for StageDecision component to handle
        window.dispatchEvent(
          new CustomEvent("stage-decision-mismatch", { detail: data })
        );
      });

      // Handle socket reconnection
      const handleReconnect = () => {
        console.log("🔄 Socket reconnected, rejoining match rooms...");
        // Rejoin all match rooms
        const { matches } = useMatchStore.getState();
        matches.forEach((match) => {
          socket.emit("join-match", match._id);
        });
        // Refresh matches and messages
        fetchMatches();
      };

      // Handle connection failure
      const handleConnectionFailed = () => {
        console.error("❌ Socket connection failed");
        toast.error("Connection lost. Please check your internet connection.");
      };

      window.addEventListener("socket-reconnected", handleReconnect);
      window.addEventListener(
        "socket-connection-failed",
        handleConnectionFailed
      );

      return () => {
        window.removeEventListener("socket-reconnected", handleReconnect);
        window.removeEventListener(
          "socket-connection-failed",
          handleConnectionFailed
        );
        disconnectSocket();
      };
    }
  }, [
    authUser,
    addMatch,
    addMessage,
    setTyping,
    updateMatchTurn,
    fetchMatches,
  ]);

  const showHeader =
    location.pathname !== "/profile-settings" &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/first-stage" &&
    location.pathname !== "/second-stage" &&
    location.pathname !== "/third-stage" &&
    location.pathname !== "/matching-queue" &&
    location.pathname !== "/subscription";

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div>
        <Toaster position="top-center" />
        {showHeader && <Header />}
        <Routes>
          <Route
            path="/"
            element={authUser ? <Navigate to="/main" replace /> : <Home />}
          />
          <Route
            path="/login"
            element={authUser ? <Navigate to="/main" replace /> : <Login />}
          />

          {/* Email Verification & Password Reset Routes */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/main"
            element={
              <ProtectedRoute>
                <Main />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-settings"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/swipe"
            element={
              <ProtectedRoute>
                <Swipe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching-queue"
            element={
              <ProtectedRoute>
                <MatchingQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/first-stage"
            element={
              <ProtectedRoute>
                <FirstStage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/second-stage"
            element={
              <ProtectedRoute>
                <SecondStage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/third-stage"
            element={
              <ProtectedRoute>
                <ThirdStage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <OfflineDating />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
