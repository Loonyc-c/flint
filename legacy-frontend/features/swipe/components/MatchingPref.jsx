import React, { useState, useEffect } from "react";
import { Target, MapPin } from "lucide-react";
import AgeSlider from "@/features/profile/components/AgeSlider";
import GenderToggle from "@/features/profile/components/GenderToggle";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/features/profile";
import { useAuthStore } from "@/features/auth";
import toast from "react-hot-toast";
import { Slider } from "@mui/material";

export default function MatchingPref() {
  const { t } = useTranslation();
  const { authUser } = useAuthStore();
  const { updateProfile } = useProfileStore();

  const [maxDistance, setMaxDistance] = useState(
    authUser?.preferences?.maxDistance || 50
  );

  // Update maxDistance when authUser changes
  useEffect(() => {
    if (authUser?.preferences?.maxDistance) {
      setMaxDistance(authUser.preferences.maxDistance);
    }
  }, [authUser]);

  const handleDistanceChange = (_, newValue) => {
    setMaxDistance(newValue);
  };

  const handleDistanceChangeCommitted = async (_, newValue) => {
    try {
      await updateProfile({
        preferences: {
          ...authUser?.preferences,
          maxDistance: newValue,
        },
      });
      toast.success("Max distance updated!");
    } catch (error) {
      toast.error("Failed to update max distance");
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[640px] bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-sm p-6 sm:p-8 md:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100 pb-2 border-b border-gray-200 dark:border-neutral-700">
          <Target className="w-6 h-6 text-brand" />
          <h2 className="text-xl sm:text-2xl font-bold">
            {t("profile.range")}
          </h2>
        </div>

        {/* Age Range Section */}
        <div className="flex flex-col gap-4">
          <AgeSlider />
        </div>

        {/* Gender Preference Section */}
        <div className="w-full flex items-center justify-between pt-2 pb-4 border-b border-gray-200 dark:border-neutral-700">
          <span className="text-base sm:text-lg font-medium text-neutral-800 dark:text-neutral-200">
            {t("profile.interestedIn")}
          </span>
          <GenderToggle />
        </div>

        {/* Max Distance Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
            <MapPin className="w-5 h-5 text-brand" />
            <span className="text-base sm:text-lg font-medium">
              Maximum Distance
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm sm:text-base text-neutral-800 dark:text-neutral-200">
              <span>Distance</span>
              <span className="font-semibold text-brand">
                {maxDistance === 500 ? "Unlimited" : `${maxDistance} km`}
              </span>
            </div>

            <Slider
              value={maxDistance}
              onChange={handleDistanceChange}
              onChangeCommitted={handleDistanceChangeCommitted}
              valueLabelDisplay="auto"
              min={1}
              max={500}
              step={5}
              valueLabelFormat={(value) =>
                value === 500 ? "Unlimited" : `${value} km`
              }
              sx={{
                mt: 1,
                "& .MuiSlider-thumb": {
                  color: "#D9776D",
                  width: 20,
                  height: 20,
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 8px rgba(217,119,109,0.16)",
                  },
                },
                "& .MuiSlider-track": {
                  color: "#D9776D",
                  height: 5,
                },
                "& .MuiSlider-rail": {
                  color: "rgba(217,119,109,0.2)",
                  height: 5,
                },
                "& .MuiSlider-valueLabel": {
                  borderRadius: 1,
                  fontSize: 12,
                  backgroundColor: "#D9776D",
                },
              }}
            />

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Show me people within{" "}
              {maxDistance === 500 ? "unlimited" : maxDistance + " km"} from my
              location
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
