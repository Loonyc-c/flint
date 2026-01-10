"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/core/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useAuthStore } from "@/features/auth";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

export default function LoginFormDemo() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoggingIn } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      navigate("/main");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Google OAuth login handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log("🔑 Google token response:", tokenResponse);

        // Get user info from Google
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        const userInfo = await userInfoResponse.json();
        console.log("👤 Google user info:", userInfo);

        // Prepare data to send to backend
        const googleData = {
          idToken: tokenResponse.access_token,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          googleId: userInfo.sub,
        };
        console.log("📤 Sending to backend:", googleData);

        // Send to backend
        const result = await loginWithGoogle(googleData);

        if (result.success) {
          navigate("/main");
        }
      } catch (error) {
        console.error("❌ Google login error:", error);
        toast.error("Google login failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("❌ Google OAuth error:", error);
      toast.error("Google login failed. Please try again.");
    },
  });

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-5 border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Log into Flint
      </h2>
      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="projectmayhem@fc.com"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </LabelInputContainer>

        {/* Forgot Password Link */}
        <div className="mb-4 text-right">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-brand hover:text-brand-600 font-medium"
          >
            Forgot Password?
          </button>
        </div>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Logging in..." : "Login →"}
          <BottomGradient />
        </button>
        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
        <div className="flex flex-col space-y-4">
          <button
            className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
          >
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {isLoggingIn ? "Logging in..." : "Continue with Google"}
            </span>
            <BottomGradient />
          </button>
        </div>
      </form>
    </div>
  );
}
const BottomGradient = () => {
  return (
    <>
      {" "}
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />{" "}
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-brand-300 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />{" "}
    </>
  );
};
const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {" "}
      {children}{" "}
    </div>
  );
};
