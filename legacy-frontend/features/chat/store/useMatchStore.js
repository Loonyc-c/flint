import { axiosInstance } from "@/core/lib/axios.js";
import { create } from "zustand";
import toast from "react-hot-toast";
import { getSocket } from "@/core/lib/socket";

export const useMatchStore = create((set) => ({
  matches: [],
  unconnectedMatches: [],
  isLoadingMatches: false,

  // Get all matches (with conversations)
  getMatches: async () => {
    set({ isLoadingMatches: true });
    try {
      const res = await axiosInstance.get("/matches");
      set({ matches: res.data });

      // Join all match rooms to receive turn-changed events
      try {
        const socket = getSocket();
        res.data.forEach((match) => {
          socket.emit("join-match", match._id);
          console.log(`[useMatchStore] Joined match room: ${match._id}`);
        });
      } catch (socketError) {
        console.log(
          "[useMatchStore] Socket not available for joining match rooms"
        );
      }

      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load matches";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isLoadingMatches: false });
    }
  },

  // Get unconnected matches (no messages ever sent)
  getUnconnectedMatches: async () => {
    set({ isLoadingMatches: true });
    try {
      const res = await axiosInstance.get("/matches?type=unconnected");
      set({ unconnectedMatches: res.data });
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load matches";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isLoadingMatches: false });
    }
  },

  // Unmatch with a user
  unmatch: async (matchId) => {
    try {
      await axiosInstance.delete(`/matches/${matchId}`);
      set((state) => ({
        matches: state.matches.filter((m) => m._id !== matchId),
      }));
      toast.success("Unmatched successfully");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to unmatch";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Add a new match (called from socket event)
  addMatch: (match) => {
    console.log("[useMatchStore] Adding new match:", {
      matchId: match._id,
      otherUser: match.user?.nickname || match.user?.fullName,
      currentTurn: match.currentTurn,
      timestamp: new Date().toISOString(),
    });

    set((state) => {
      // Check if match already exists
      const existingMatch = state.matches.find((m) => m._id === match._id);
      if (existingMatch) {
        console.warn(
          "[useMatchStore] Match already exists, skipping:",
          match._id
        );
        return state;
      }

      return {
        matches: [match, ...state.matches],
      };
    });

    // Join the new match room to receive turn-changed events
    try {
      const socket = getSocket();
      socket.emit("join-match", match._id);
      console.log(`[useMatchStore] Joined new match room: ${match._id}`);
    } catch (socketError) {
      console.log(
        "[useMatchStore] Socket not available for joining new match room"
      );
    }
  },

  // Update match turn (called from socket event or optimistic update)
  updateMatchTurn: (matchId, currentTurn) => {
    console.log("[useMatchStore] Updating match turn:", {
      matchId,
      currentTurn,
      timestamp: new Date().toISOString(),
    });

    set((state) => {
      // Find the match to update
      const matchIndex = state.matches.findIndex((m) => m._id === matchId);

      if (matchIndex === -1) {
        console.warn("[useMatchStore] Match not found:", matchId);
        return state; // No change if match not found
      }

      // Create a new matches array with the updated match
      const updatedMatches = [...state.matches];
      updatedMatches[matchIndex] = {
        ...updatedMatches[matchIndex],
        currentTurn,
        lastTurnChangeAt: new Date().toISOString(),
      };

      console.log("[useMatchStore] Match turn updated:", {
        matchId,
        oldTurn: state.matches[matchIndex].currentTurn,
        newTurn: currentTurn,
        matchIndex,
      });

      return { matches: updatedMatches };
    });
  },

  // Update unread count for a match (optimistic update)
  updateUnreadCount: (matchId, unreadCount) => {
    set((state) => {
      const matchIndex = state.matches.findIndex((m) => m._id === matchId);
      if (matchIndex === -1) return state;

      const updatedMatches = [...state.matches];
      updatedMatches[matchIndex] = {
        ...updatedMatches[matchIndex],
        unreadCount,
      };

      return { matches: updatedMatches };
    });
  },
}));
