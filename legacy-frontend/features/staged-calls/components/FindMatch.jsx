"use client";

import React, { useState } from "react";
import { MainTypeWriter } from "@/features/home";
import {
  Heart,
  Sparkles,
  Smile,
  Brain,
  Coffee,
  Phone,
  Users,
  Lock,
} from "lucide-react";
import { CometCard } from "@/shared/components/ui/comet-card";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth";
import { axiosInstance } from "@/core/lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function FindMatch() {
  const { t } = useTranslation();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const hasSubscription =
    authUser?.subscription?.isActive &&
    authUser?.subscription?.plan &&
    authUser?.subscription?.plan !== "free";

  const handleLiveCall = async (e) => {
    e.preventDefault();
    setIsJoiningQueue(true);

    try {
      console.log("📞 [FindMatch] Sending join-queue request...");
      // Join the queue directly - backend will handle duplicates
      const res = await axiosInstance.post("/staged-call/join-queue");

      console.log("📦 [FindMatch] Response received:", res.data);

      if (res.data.matched && res.data.pending) {
        console.log(
          "🎉 [FindMatch] Match found! Navigating with pendingMatch state..."
        );
        console.log("📦 [FindMatch] pendingMatch data:", {
          callId: res.data.callId,
          otherUser: res.data.otherUser,
          matchScore: res.data.matchScore,
          expiresAt: res.data.expiresAt,
        });

        // Match found! Navigate to matching queue which will show acceptance UI
        navigate("/matching-queue", {
          state: {
            pendingMatch: {
              callId: res.data.callId,
              otherUser: res.data.otherUser,
              matchScore: res.data.matchScore,
              expiresAt: res.data.expiresAt,
            },
          },
        });
        console.log("✅ [FindMatch] Navigation complete");
      } else {
        console.log("⏳ [FindMatch] No match yet, navigating to queue...");
        // Added to queue, show waiting screen
        navigate("/matching-queue");
      }
    } catch (error) {
      console.error("Error joining queue:", error);
      console.error("Error response:", error.response?.data);

      const errorData = error.response?.data;
      let errorMessage =
        errorData?.message || "Failed to join queue. Please try again.";

      // Handle specific error cases
      if (errorMessage === "Already in active call") {
        toast.error(
          "You have an active call. Please end it first or refresh the page."
        );
      } else if (errorMessage === "Already in queue") {
        toast.error(
          "You're already in the queue. Please wait or refresh the page."
        );
      } else if (errorData?.requiresContactInfo) {
        // User needs to add contact information
        toast.error(
          "Please add at least one contact method in your profile before joining live calls. This is required for Stage 3 (contact exchange).",
          { duration: 6000 }
        );
        // Navigate to profile settings after 2 seconds
        setTimeout(() => {
          navigate("/profile?tab=contact");
        }, 2000);
      } else if (error.response?.status === 403) {
        toast.error("Please complete your profile before joining live calls.");
      } else if (!error.response) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsJoiningQueue(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      {/* smaller overall paddings + gaps */}
      <section className="w-full max-w-[1200px] px-4 md:px-6 lg:px-8  sm: flex flex-col items-center gap-6 sm:gap-8">
        {/* header block */}
        <div className="w-full flex flex-col items-center gap-2 text-center">
          <MainTypeWriter />
          <h2 className="text-neutral-700 dark:text-neutral-300 font-light text-xs sm:text-sm md:text-base leading-relaxed max-w-[50rem]">
            {t("main.journey")}
          </h2>
        </div>

        {/* Start Matching section with two cards */}
        <div className="w-full sm:w-4/5 md:w-3/4 lg:w-2/3 flex flex-col items-center gap-4">
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {t("main.chooseMatchingStyle")}
          </h3>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Call Card */}
            <button
              onClick={handleLiveCall}
              disabled={isJoiningQueue}
              className="bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 hover:border-[#B33A2E] dark:hover:border-[#B33A2E] rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="rounded-full bg-[#B33A2E] group-hover:bg-[#8B2E24] w-16 h-16 text-white flex justify-center items-center transition-colors">
                <Phone className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2 dark:text-white">
                  {t("main.liveCall")}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("main.liveCallDesc")}
                </p>
              </div>
              <div className="w-full px-5 py-2.5 rounded-2xl bg-[#B33A2E] group-hover:bg-[#8B2E24] font-medium text-white text-center text-sm transition-colors">
                {isJoiningQueue ? t("main.joining") : t("main.startCall")}
              </div>
            </button>

            {/* Swipe Card */}
            <Link
              to="/swipe"
              className="bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 hover:border-[#2E2E2E] dark:hover:border-[#2E2E2E] rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:shadow-lg group"
            >
              <div className="rounded-full bg-[#2E2E2E] group-hover:bg-[#272727] w-16 h-16 text-white flex justify-center items-center transition-colors">
                <Users className="h-8 w-8" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2 dark:text-white">
                  {t("main.swipe")}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("main.swipeDesc")}
                </p>
              </div>
              <div className="w-full px-5 py-2.5 rounded-2xl bg-[#2E2E2E] group-hover:bg-[#272727] font-medium text-white text-center text-sm transition-colors">
                {t("main.startSwiping")}
              </div>
            </Link>
          </div>
        </div>

        {/* AI Wingman card: subscription required */}
        <div className="w-full flex justify-center">
          <CometCard className="w-full sm:w-11/12 lg:w-3/4">
            <div className="w-full px-5 sm:px-7 py-5 sm:py-6 flex flex-col items-center gap-4 text-center relative">
              {!hasSubscription && (
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 z-10">
                  <Lock className="w-12 h-12 text-white" />
                  <p className="text-white font-semibold text-lg">
                    Premium Feature
                  </p>
                  <p className="text-white/80 text-sm max-w-xs">
                    Upgrade to access AI Wingman and get personalized
                    conversation help
                  </p>
                  <button
                    onClick={() => navigate("/subscription")}
                    className="px-6 py-2 bg-brand hover:bg-brand/90 text-white rounded-lg transition-colors"
                  >
                    View Plans
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#B33A2E]/90 text-white flex items-center justify-center">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  {t("wingman.ready")}
                </h3>
              </div>

              <p className="text-[#2c2c2c] text-sm leading-relaxed max-w-[46rem]">
                {t("wingman.readyDesc")}
              </p>

              {/* tighter grid + smaller icons */}
              <div className="w-full grid grid-cols-3 gap-3 sm:gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="rounded-full bg-[#EE36A9] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center">
                    <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[11px] sm:text-xs text-[#2c2c2c]">
                    Playful
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="rounded-full bg-[#4379FF] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[11px] sm:text-xs text-[#2c2c2c]">
                    Thoughtful
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="rounded-full bg-[#00C85F] w-12 h-12 sm:w-14 sm:h-14 text-white flex items-center justify-center">
                    <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[11px] sm:text-xs text-[#2c2c2c]">
                    Chill
                  </span>
                </div>
              </div>
            </div>
          </CometCard>
        </div>
      </section>
    </div>
  );
}
