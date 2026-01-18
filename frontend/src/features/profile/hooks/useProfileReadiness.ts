"use client";

import { useState, useEffect, useCallback } from "react";
import { getProfile } from "../api/profile";
import {
  calculateProfileCompleteness,
  type ProfileCompletenessResult,
} from "@shared/lib/profile/calculator";
import { useUser } from "@/features/auth/context/UserContext";

export const useProfileReadiness = () => {
  const { user } = useUser();
  const [readiness, setReadiness] = useState<ProfileCompletenessResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkReadiness = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile (which now includes nested contact info)
      const profileRes = await getProfile(user.id);

      console.log("profileRes", profileRes);

      const profileData = profileRes.profile || {};

      console.log("profileData", profileData);

      const result = calculateProfileCompleteness(profileData);
      console.log("result", result);
      setReadiness(result);
    } catch (err) {
      console.error("Failed to check profile readiness:", err);
      setError("Could not verify profile completeness");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkReadiness();
  }, [checkReadiness]);

  return {
    score: readiness?.score || 0,
    missingFields: readiness?.missingFields || [],
    isReady: (readiness?.score || 0) >= 80,
    isLoading,
    error,
    refresh: checkReadiness,
  };
};
