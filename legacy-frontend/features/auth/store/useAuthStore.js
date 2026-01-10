import { axiosInstance } from "@/core/lib/axios.js";
import { create } from "zustand";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,

  // Manually set authUser (for updates from other stores)
  setAuthUser: (user) => {
    console.log("Setting authUser:", {
      userId: user?._id,
      email: user?.email,
      name: user?.fullName,
    });
    set({ authUser: user });
  },

  // Check authentication status
  checkAuth: async () => {
    try {
      console.log("🔐 [Auth] Checking authentication...");
      console.log("🍪 [Auth] Document cookies:", document.cookie);
      const res = await axiosInstance.get("/auth/check");
      console.log("✅ [Auth] Auth check successful:", res.data?.email);
      set({ authUser: res.data });
    } catch (error) {
      console.log("❌ [Auth] Auth check failed:", error.response?.status, error.response?.data?.message);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Signup with email/password
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data.user });
      toast.success(res.data.message || "Account created successfully!");
      return { success: true, message: res.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isSigningUp: false });
    }
  },

  // Login with email/password
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data.user });
      toast.success("Logged in successfully!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      const emailNotVerified = error.response?.data?.emailNotVerified || false;
      toast.error(message);
      return { success: false, error: message, emailNotVerified };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Login with Google
  loginWithGoogle: async (googleData) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/google", googleData);
      set({ authUser: res.data.user });
      toast.success("Logged in with Google!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Google login failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed");
    }
  },

  // Update profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data.user });
      toast.success("Profile updated!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const res = await axiosInstance.post("/auth/verify-email", { token });
      set({ authUser: res.data.user });
      toast.success(res.data.message || "Email verified successfully!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Verification failed";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Resend verification email
  resendVerificationEmail: async (email) => {
    try {
      const res = await axiosInstance.post("/auth/resend-verification", {
        email,
      });
      toast.success(res.data.message || "Verification email sent!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send email";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const res = await axiosInstance.post("/auth/request-password-reset", {
        email,
      });
      toast.success(res.data.message || "Password reset email sent!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send reset email";
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const res = await axiosInstance.post("/auth/reset-password", {
        token,
        newPassword,
      });
      toast.success(res.data.message || "Password reset successfully!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Password reset failed";
      toast.error(message);
      return { success: false, error: message };
    }
  },
}));
