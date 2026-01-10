import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/core/lib/axios.js";
import { getSocket } from "@/core/lib/socket.js";
import {
  cacheMessages,
  getCachedMessages,
  addToMessageQueue,
} from "@/core/lib/indexedDB.js";
import {
  checkOnlineStatus,
  generateLocalId,
  initOfflineSync,
} from "@/core/lib/offlineSync.js";
import { useAuthStore } from "@/features/auth";
import { useMatchStore } from "@/features/chat/store/useMatchStore.js";

export const useMessageStore = create((set, get) => ({
  messages: {},
  isLoadingMessages: false,
  isSendingMessage: false,
  typingUsers: {},
  isOffline: !navigator.onLine,

  // Get messages for a match (cache-first strategy)
  getMessages: async (matchId) => {
    if (!matchId) {
      console.error(
        "[useMessageStore] getMessages called with invalid matchId"
      );
      return { success: false, error: "Invalid match ID" };
    }

    try {
      // 1. Try to load from cache first (instant display)
      try {
        const cachedMessages = await getCachedMessages(matchId);
        if (cachedMessages && cachedMessages.length > 0) {
          console.log(
            `[useMessageStore] Loaded ${cachedMessages.length} messages from cache for match ${matchId}`
          );
          set((state) => ({
            messages: {
              ...state.messages,
              [matchId]: cachedMessages,
            },
            isLoadingMessages: false, // Show cached messages immediately
          }));
        } else {
          set({ isLoadingMessages: true });
        }
      } catch (cacheError) {
        console.error("[useMessageStore] Cache read error:", cacheError);
        // Continue to fetch from server even if cache fails
        set({ isLoadingMessages: true });
      }

      // 2. Fetch fresh data from server in background
      const res = await axiosInstance.get(`/messages/${matchId}`);

      // 3. Update state with fresh data
      set((state) => ({
        messages: {
          ...state.messages,
          [matchId]: res.data,
        },
        isLoadingMessages: false,
      }));

      // 4. Update cache (don't await, run in background)
      cacheMessages(matchId, res.data).catch((cacheError) => {
        console.error("[useMessageStore] Cache write error:", cacheError);
        // Don't throw - cache failure shouldn't affect user experience
      });

      return { success: true, data: res.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load messages";

      // Only show error if we don't have cached data
      const hasCachedData = get().messages[matchId]?.length > 0;
      if (!hasCachedData) {
        toast.error(message);
      }

      set({ isLoadingMessages: false });
      return { success: false, error: message };
    }
  },

  // Send a message (with offline support)
  sendMessage: async (
    matchId,
    text,
    messageType = "text",
    voiceData = null
  ) => {
    set({ isSendingMessage: true });
    const isOnline = checkOnlineStatus();
    const localId = generateLocalId();

    // Get current user ID from auth store
    const authUser = useAuthStore.getState().authUser;
    const currentUserId = authUser?._id;

    try {
      // Create optimistic message with correct sender ID
      const optimisticMessage = {
        _id: localId,
        localId,
        matchId,
        messageType,
        text: messageType === "text" ? text : "",
        voiceUrl: voiceData?.voiceUrl || "",
        voiceDuration: voiceData?.voiceDuration || 0,
        status: isOnline ? "sent" : "pending",
        createdAt: new Date().toISOString(),
        sender: { _id: currentUserId }, // Use actual user ID for correct "from" detection
      };

      // Add to local state immediately
      set((state) => ({
        messages: {
          ...state.messages,
          [matchId]: [...(state.messages[matchId] || []), optimisticMessage],
        },
      }));

      if (!isOnline) {
        // Queue for later if offline
        await addToMessageQueue(optimisticMessage);
        toast.success("Message queued (offline)");
        set({ isSendingMessage: false });
        return { success: true, data: optimisticMessage, queued: true };
      }

      // Send to server if online
      const messageData = {
        matchId,
        localId,
        messageType,
      };

      if (messageType === "voice") {
        messageData.voiceUrl = voiceData.voiceUrl;
        messageData.voiceDuration = voiceData.voiceDuration;
      } else {
        messageData.text = text;
      }

      const res = await axiosInstance.post("/messages", messageData);

      // Log chat event (first message creates chat)
      const isFirstMessage = (get().messages[matchId] || []).length === 1;
      if (isFirstMessage) {
        console.log("[EVENT] chat_created", { matchId });
      }

      // ✅ OPTIMISTIC TURN UPDATE - Update match turn immediately
      // This ensures instant UI update without waiting for socket event
      const matchStore = useMatchStore.getState();
      const currentMatch = matchStore.matches.find((m) => m._id === matchId);

      if (currentMatch) {
        // Find the other user's ID
        // Note: currentMatch.users is an array of USER OBJECTS, not IDs
        const otherUser = currentMatch.users?.find(
          (user) => user._id?.toString() !== currentUserId
        );

        if (otherUser?._id) {
          const otherUserId = otherUser._id.toString();

          console.log("[useMessageStore] Optimistically updating turn:", {
            matchId,
            newTurn: otherUserId,
            currentUserId,
            otherUser: otherUser.nickname || otherUser.fullName,
          });

          // Update the match turn in the store
          matchStore.updateMatchTurn(matchId, otherUserId);
        } else {
          console.warn(
            "[useMessageStore] Could not find other user for turn update:",
            {
              matchId,
              currentUserId,
              users: currentMatch.users,
            }
          );
        }
      }

      // Log turn switch event
      console.log("[EVENT] turn_switched", {
        matchId,
        newTurn: res.data.currentTurn,
      });

      // Update with server response
      set((state) => ({
        messages: {
          ...state.messages,
          [matchId]: state.messages[matchId].map((msg) =>
            msg.localId === localId ? res.data : msg
          ),
        },
      }));

      // Cache message (don't await, run in background)
      cacheMessages(matchId, [res.data]).catch((cacheError) => {
        console.error("[useMessageStore] Cache write error:", cacheError);
      });

      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send message";
      toast.error(message);

      // Update message status to failed
      set((state) => ({
        messages: {
          ...state.messages,
          [matchId]: state.messages[matchId].map((msg) =>
            msg.localId === localId ? { ...msg, status: "failed" } : msg
          ),
        },
      }));

      return { success: false, error: message };
    } finally {
      set({ isSendingMessage: false });
    }
  },

  // Update local message with server response
  updateLocalMessage: (matchId, localId, serverMessage) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: state.messages[matchId]?.map((msg) =>
          msg.localId === localId ? serverMessage : msg
        ),
      },
    }));
  },

  // Initialize offline sync
  initSync: () => {
    initOfflineSync(get());

    // Update online status
    window.addEventListener("online", () => set({ isOffline: false }));
    window.addEventListener("offline", () => set({ isOffline: true }));
  },

  // Mark messages as read
  markAsRead: async (matchId) => {
    try {
      await axiosInstance.put(`/messages/${matchId}/read`);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  // Pass turn without sending a message
  passTurn: async (matchId) => {
    try {
      await axiosInstance.put(`/messages/${matchId}/pass-turn`);
      return { success: true };
    } catch (error) {
      console.error("Error passing turn:", error);
      return { success: false, error: error.response?.data?.message };
    }
  },

  // Add a new message (from socket)
  addMessage: (matchId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: [...(state.messages[matchId] || []), message],
      },
    }));
  },

  // Set typing status
  setTyping: (matchId, userId, isTyping) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [matchId]: isTyping ? userId : null,
      },
    }));
  },

  // Send typing indicator
  sendTypingIndicator: (matchId, isTyping) => {
    try {
      const socket = getSocket();
      socket.emit("typing", { matchId, isTyping });
    } catch (error) {
      console.log("Socket not available");
    }
  },

  // Join match room
  joinMatchRoom: (matchId) => {
    try {
      const socket = getSocket();
      socket.emit("join-match", matchId);
    } catch (error) {
      console.log("Socket not available");
    }
  },

  // Leave match room
  leaveMatchRoom: (matchId) => {
    try {
      const socket = getSocket();
      socket.emit("leave-match", matchId);
    } catch (error) {
      console.log("Socket not available");
    }
  },

  // Update messages as seen
  updateMessagesSeen: (matchId, seenBy, seenAt) => {
    set((state) => {
      const matchMessages = state.messages[matchId];
      if (!matchMessages) return state;

      // Update all messages that were sent by current user and not yet read
      const updatedMessages = matchMessages.map((msg) => {
        const { authUser } = useAuthStore.getState();
        if (msg.sender?._id === authUser._id && !msg.read) {
          return {
            ...msg,
            read: true,
            readAt: seenAt,
            status: "read",
          };
        }
        return msg;
      });

      return {
        messages: {
          ...state.messages,
          [matchId]: updatedMessages,
        },
      };
    });
  },
}));
