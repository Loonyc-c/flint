"use client";

import { Target, MapPin } from "lucide-react";

const MatchingPref = () => {
  // Logic commented out
  // const { t } = useTranslation();
  // const { authUser } = useAuthStore();
  // const { updateProfile } = useProfileStore();

  const maxDistance = 50;

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-160 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-sm p-6 sm:p-8 md:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100 pb-2 border-b border-gray-200 dark:border-neutral-700">
          <Target className="w-6 h-6 text-brand" />
          <h2 className="text-xl sm:text-2xl font-bold">Matching Range</h2>
        </div>

        {/* Age Range Section (Mocked) */}
        <div className="flex flex-col gap-4">
          <label className="text-base sm:text-lg font-medium text-neutral-800 dark:text-neutral-200">
            Age Range
          </label>
          <div className="w-full px-2">
            {/* Visual Mock of Slider */}
            <div className="relative w-full h-1 bg-gray-200 rounded-full">
              <div className="absolute left-1/4 right-1/4 h-full bg-[#D9776D] rounded-full"></div>
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#D9776D] rounded-full shadow border-2 border-white"></div>
              <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#D9776D] rounded-full shadow border-2 border-white"></div>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>18</span>
              <span>25 - 35</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Gender Preference Section (Mocked) */}
        <div className="w-full flex items-center justify-between pt-2 pb-4 border-b border-gray-200 dark:border-neutral-700">
          <span className="text-base sm:text-lg font-medium text-neutral-800 dark:text-neutral-200">
            Interested In
          </span>
          {/* Mocked Gender Toggle */}
          <div className="flex gap-2">
            <div className="px-3 py-1 rounded-full bg-brand text-white text-sm">
              Everyone
            </div>
            <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-700 text-sm text-gray-600 dark:text-gray-300">
              Men
            </div>
            <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-700 text-sm text-gray-600 dark:text-gray-300">
              Women
            </div>
          </div>
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
              <span className="font-semibold text-brand">{maxDistance} km</span>
            </div>

            {/* Mocked MUI Slider with standard HTML range for visual */}
            <input
              type="range"
              min="1"
              max="500"
              defaultValue={maxDistance}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#D9776D]"
            />

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Show me people within {maxDistance} km from my location
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingPref;
