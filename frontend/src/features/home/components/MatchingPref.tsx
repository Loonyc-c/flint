"use client";

import { Target, MapPin } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/features/auth/context/UserContext";
import { getReference, updateReference } from "../api/reference";
import { LOOKING_FOR, type UserPreferences } from "@shared/types";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// =============================================================================
// Constants
// =============================================================================

const MAX_DISTANCE = 50;

// =============================================================================
// Component
// =============================================================================

/**
 * Matching preferences section for configuring match criteria.
 * Saves changes when the user navigates away (unmounts).
 */
const MatchingPref = () => {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs to track state for cleanup function
  const preferencesRef = useRef<UserPreferences | null>(null);
  const initialPreferencesRef = useRef<UserPreferences | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);

  // Sync refs with state/props
  useEffect(() => {
    preferencesRef.current = preferences;
    userIdRef.current = user?.id;
  }, [preferences, user?.id]);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) return;
      try {
        const data = await getReference(user.id);
        setPreferences(data);
        initialPreferencesRef.current = data;
        preferencesRef.current = data;
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

  // Save on unmount
  useEffect(() => {
    return () => {
      const currentPrefs = preferencesRef.current;
      const initialPrefs = initialPreferencesRef.current;
      const userId = userIdRef.current;

      if (!userId || !currentPrefs || !initialPrefs) return;

      // Check if dirty
      const isDirty =
        currentPrefs.ageRange !== initialPrefs.ageRange ||
        currentPrefs.lookingFor !== initialPrefs.lookingFor;

      if (isDirty) {
        // Fire and forget with keepalive
        updateReference(
          userId,
          {
            ageRange: currentPrefs.ageRange,
            lookingFor: currentPrefs.lookingFor,
          },
          { keepalive: true }
        ).catch((err) => {
          console.error("Failed to save preferences on exit:", err);
        });
      }
    };
  }, []);

  /**
   * Updates local state immediately.
   */
  const handleUpdate = (updates: Partial<UserPreferences>) => {
    if (!preferences) return;
    setPreferences({ ...preferences, ...updates });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col w-full gap-8 p-6 bg-white border border-gray-200 shadow-sm max-w-160 dark:bg-neutral-800 dark:border-neutral-700 rounded-2xl sm:p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
            <Target className="w-6 h-6 text-brand" />
            <h2 className="text-xl font-bold sm:text-2xl">Matching Range</h2>
          </div>
        </div>

        {/* Age Range Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-base font-medium sm:text-lg text-neutral-800 dark:text-neutral-200">
              Age range
            </label>
            <span className="font-semibold text-brand">
              {preferences?.ageRange ?? 30} years
            </span>
          </div>
          <div className="w-full px-2">
            <input
              type="range"
              min="18"
              max="60"
              value={preferences?.ageRange ?? 30}
              onChange={(e) =>
                handleUpdate({ ageRange: parseInt(e.target.value) })
              }
              className="w-full h-1 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#D9776D]"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>18</span>
              <span>60</span>
            </div>
          </div>
        </div>

        {/* Gender Preference Section */}
        <div className="flex flex-col justify-between w-full gap-4 pt-2 pb-4 border-b border-gray-200 sm:flex-row sm:items-center dark:border-neutral-700">
          <span className="text-base font-medium sm:text-lg text-neutral-800 dark:text-neutral-200">
            Interested In
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Everyone", value: LOOKING_FOR.ALL },
              { label: "Men", value: LOOKING_FOR.MALE },
              { label: "Women", value: LOOKING_FOR.FEMALE },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleUpdate({ lookingFor: option.value })}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  preferences?.lookingFor === option.value
                    ? "bg-brand text-white"
                    : "bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Distance Section (UI Only) */}
        <div className="flex flex-col gap-4 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
            <MapPin className="w-5 h-5 text-brand" />
            <span className="text-base font-medium sm:text-lg">
              Maximum Distance (Coming Soon)
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm sm:text-base text-neutral-800 dark:text-neutral-200">
              <span>Distance</span>
              <span className="font-semibold text-brand">
                {MAX_DISTANCE} km
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="500"
              disabled
              defaultValue={MAX_DISTANCE}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-not-allowed accent-gray-400"
            />

            <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Location-based matching is being implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingPref;
