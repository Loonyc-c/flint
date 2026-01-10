import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/core/lib/axios.js";
import { useAuthStore } from "@/features/auth";

export const useProfileStore = create((set, get) => ({
  profile: null,
  isLoadingProfile: false,
  isUpdatingProfile: false,
  isUploadingPhoto: false,

  // Get current user profile
  getMyProfile: async () => {
    set({ isLoadingProfile: true });
    try {
      const res = await axiosInstance.get("/profile/me");
      set({ profile: res.data });
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load profile";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  // Update profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/profile/update", data);
      set({ profile: res.data });

      // Update authUser in auth store
      useAuthStore.setState({ authUser: res.data });

      toast.success("Profile updated successfully!");
      return { success: true, data: res.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Upload profile picture
  uploadProfilePic: async (imageData) => {
    set({ isUploadingPhoto: true });
    try {
      const res = await axiosInstance.put("/profile/upload-profile-pic", {
        profilePic: imageData,
      });
      set({ profile: res.data });

      // Update authUser in auth store
      useAuthStore.setState({ authUser: res.data });

      toast.success("Profile picture updated!");
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to upload photo";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isUploadingPhoto: false });
    }
  },

  // Upload audio recording
  uploadAudio: async (audioData) => {
    try {
      console.log("Uploading audio, data length:", audioData?.length);
      const res = await axiosInstance.post("/profile/upload-audio", {
        audioData,
      });
      console.log("Audio upload response:", res.data);
      return { success: true, audioUrl: res.data.audioUrl };
    } catch (error) {
      console.error("Audio upload error:", error);
      console.error("Error response:", error.response?.data);
      const message = error.response?.data?.message || "Failed to upload audio";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Upload additional photo
  uploadPhoto: async (imageData) => {
    set({ isUploadingPhoto: true });
    try {
      const res = await axiosInstance.post("/profile/upload-photo", {
        image: imageData,
      });
      set({ profile: res.data });
      toast.success("Photo uploaded!");
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to upload photo";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isUploadingPhoto: false });
    }
  },

  // Delete photo
  deletePhoto: async (photoUrl) => {
    try {
      const res = await axiosInstance.delete("/profile/delete-photo", {
        data: { photoUrl },
      });
      set({ profile: res.data });
      toast.success("Photo deleted!");
      return { success: true, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete photo";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Update subscription
  updateSubscription: async (plan) => {
    try {
      console.log("Updating subscription to:", plan);
      const res = await axiosInstance.put("/profile/update-subscription", {
        plan,
      });
      console.log("Subscription update response:", res.data);
      useAuthStore.getState().setAuthUser(res.data);
      toast.success(`Subscription updated to ${plan}!`);
      return { success: true, user: res.data };
    } catch (error) {
      console.error("Subscription update error:", error);
      console.error("Error response:", error.response?.data);
      const message =
        error.response?.data?.message || "Failed to update subscription";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Update contact info
  updateContactInfo: async (contactInfo) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put(
        "/profile/update-contact-info",
        contactInfo
      );
      set({ profile: res.data.user });

      // Update authUser in auth store
      useAuthStore.setState({ authUser: res.data.user });

      const { contactMethodsCount, isContactVerified, isStage3Eligible } =
        res.data;

      let message = "Contact info updated successfully!";
      if (isContactVerified) {
        message += " ✨ You're now verified with 3+ contact methods!";
      } else if (isStage3Eligible) {
        message += ` You're eligible for Stage 3! (${contactMethodsCount} contact${
          contactMethodsCount > 1 ? "s" : ""
        })`;
      }

      toast.success(message);
      return { success: true, data: res.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update contact info";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Delete account
  deleteAccount: async () => {
    try {
      await axiosInstance.delete("/profile/delete-account");
      set({ profile: null });
      toast.success("Account deleted");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete account";
      toast.error(message);
      return { success: false, error: message };
    }
  },
}));
