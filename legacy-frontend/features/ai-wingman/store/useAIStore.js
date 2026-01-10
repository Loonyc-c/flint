import { axiosInstance } from "@/core/lib/axios.js";
import { create } from "zustand";
import toast from "react-hot-toast";

export const useAIStore = create((set) => ({
  suggestions: [],
  analysis: null,
  openers: [],
  isLoadingSuggestions: false,
  isAnalyzing: false,
  isGeneratingOpeners: false,

  // Get wingman suggestions
  getWingmanSuggestions: async (conversationContext, userProfile, matchProfile) => {
    set({ isLoadingSuggestions: true });
    try {
      const res = await axiosInstance.post("/ai/wingman", {
        conversationContext,
        userProfile,
        matchProfile,
      });
      set({ suggestions: res.data.suggestions });
      return { success: true, data: res.data.suggestions };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to get suggestions";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isLoadingSuggestions: false });
    }
  },

  // Analyze conversation
  analyzeConversation: async (messages) => {
    set({ isAnalyzing: true });
    try {
      const res = await axiosInstance.post("/ai/analyze", { messages });
      set({ analysis: res.data });
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to analyze conversation";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isAnalyzing: false });
    }
  },

  // Generate conversation openers
  generateOpeners: async (matchProfile) => {
    set({ isGeneratingOpeners: true });
    try {
      const res = await axiosInstance.post("/ai/opener", { matchProfile });
      set({ openers: res.data.openers });
      return { success: true, data: res.data.openers };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to generate openers";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isGeneratingOpeners: false });
    }
  },

  // Clear suggestions
  clearSuggestions: () => {
    set({ suggestions: [] });
  },

  // Clear analysis
  clearAnalysis: () => {
    set({ analysis: null });
  },
}));

