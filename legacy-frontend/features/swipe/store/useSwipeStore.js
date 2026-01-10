import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/core/lib/axios.js";
import { cacheProfiles, getCachedProfiles } from "@/core/lib/indexedDB.js";
import { checkOnlineStatus } from "@/core/lib/offlineSync.js";
import { useMatchStore } from "@/features/chat";

export const useSwipeStore = create((set, get) => ({
  candidates: [],
  currentIndex: 0,
  likes: [],
  savedProfiles: [],
  swipeHistory: [],
  lastSwipe: null, // Store last swipe for undo
  isLoadingCandidates: false,
  isSwiping: false,
  isOffline: !navigator.onLine,

  // Get candidates for swiping (with offline support)
  getCandidates: async () => {
    set({ isLoadingCandidates: true });
    const isOnline = checkOnlineStatus();

    try {
      if (!isOnline) {
        // Load from cache if offline
        const cached = await getCachedProfiles();
        if (cached.length > 0) {
          set({ candidates: cached, currentIndex: 0 });
          toast.success("Loaded cached profiles (offline)");
          return { success: true, data: cached, cached: true };
        } else {
          toast.error("No cached profiles available");
          return { success: false, error: "Offline and no cache" };
        }
      }

      const res = await axiosInstance.get("/swipe/candidates");
      set({ candidates: res.data, currentIndex: 0 });

      // Cache for offline use
      await cacheProfiles(res.data);

      return { success: true, data: res.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load candidates";
      toast.error(message);

      // Try loading from cache on error
      const cached = await getCachedProfiles();
      if (cached.length > 0) {
        set({ candidates: cached, currentIndex: 0 });
        toast.success("Loaded cached profiles");
        return { success: true, data: cached, cached: true };
      }

      return { success: false, error: message };
    } finally {
      set({ isLoadingCandidates: false });
    }
  },

  // Swipe on a user
  swipeUser: async (targetUserId, action) => {
    set({ isSwiping: true });
    try {
      const res = await axiosInstance.post("/swipe", {
        targetUserId,
        action, // "like", "dislike", "superlike", "save"
      });

      // Store last swipe for undo (before match state changes)
      const { currentIndex, candidates } = get();
      const swipedCandidate = candidates[currentIndex];

      set({
        lastSwipe: {
          candidate: swipedCandidate,
          action,
          index: currentIndex,
          wasMatch: res.data.isMatch,
        },
        currentIndex: currentIndex + 1,
      });

      // Log swipe event
      console.log(`[EVENT] swipe_${action}`, {
        userId: targetUserId,
        action,
        isMatch: res.data.isMatch,
      });

      // If it's a match, show notification
      if (res.data.isMatch) {
        console.log("[EVENT] match_created", {
          matchId: res.data.match?._id,
          userId: targetUserId,
          source: "card",
        });
        toast.success("🎉 It's a match!");

        // Note: Match is automatically added via socket event (new-match)
        // No need to manually refresh matches here

        // Refresh likes list (remove the matched user from likes)
        get().getLikes();

        return { success: true, isMatch: true, match: res.data.match };
      }

      return { success: true, isMatch: false };
    } catch (error) {
      console.error("[Swipe Error]", error);

      // Network error (no response)
      if (!error.response) {
        toast.error("Network error. Please check your connection.");
        return {
          success: false,
          error: "Network error",
          limitReached: false,
        };
      }

      const message = error.response?.data?.message || "Swipe failed";

      // Special handling for daily limit error (429)
      if (error.response?.status === 429) {
        const { limit, used } = error.response.data;
        // Don't show toast - modal will be shown instead
        return {
          success: false,
          error: message,
          limitReached: true,
          limit: limit || 5,
          used: used || 5,
        };
      }

      // Duplicate swipe error (400)
      if (
        error.response?.status === 400 &&
        message.includes("already swiped")
      ) {
        toast.error("You've already swiped on this person");
        // Move to next candidate
        const { currentIndex } = get();
        set({ currentIndex: currentIndex + 1 });
        return {
          success: false,
          error: message,
          limitReached: false,
        };
      }

      // User not found error (404)
      if (error.response?.status === 404) {
        toast.error("This user is no longer available");
        // Move to next candidate
        const { currentIndex } = get();
        set({ currentIndex: currentIndex + 1 });
        return {
          success: false,
          error: message,
          limitReached: false,
        };
      }

      // Generic error
      toast.error(message);
      return {
        success: false,
        error: message,
        limitReached: false,
      };
    } finally {
      set({ isSwiping: false });
    }
  },

  // Undo last swipe
  undoSwipe: () => {
    const { lastSwipe, currentIndex } = get();

    if (!lastSwipe) {
      toast.error("No swipe to undo");
      return { success: false };
    }

    // Don't allow undo if it was a match
    if (lastSwipe.wasMatch) {
      toast.error("Cannot undo a match");
      return { success: false };
    }

    // Log undo event
    console.log("[EVENT] undo_swipe", {
      userId: lastSwipe.candidate?._id,
      action: lastSwipe.action,
    });

    // Go back to previous card
    set({
      currentIndex: lastSwipe.index,
      lastSwipe: null,
    });

    toast.success("Swipe undone");
    return { success: true };
  },

  // Get users who liked you
  getLikes: async () => {
    try {
      const res = await axiosInstance.get("/swipe/likes");
      set({ likes: res.data });
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load likes";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Get swipe history
  getSwipeHistory: async () => {
    try {
      const res = await axiosInstance.get("/swipe/history");
      set({ swipeHistory: res.data });
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load history";
      return { success: false, error: message };
    }
  },

  // Get saved profiles
  getSavedProfiles: async () => {
    try {
      const res = await axiosInstance.get("/swipe/saved");
      set({ savedProfiles: res.data });
      return { success: true, data: res.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load saved profiles";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Get current candidate
  getCurrentCandidate: () => {
    const { candidates, currentIndex } = get();
    return candidates[currentIndex] || null;
  },

  // Check if there are more candidates
  hasMoreCandidates: () => {
    const { candidates, currentIndex } = get();
    return currentIndex < candidates.length;
  },
}));
