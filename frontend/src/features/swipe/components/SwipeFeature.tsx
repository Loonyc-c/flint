"use client";

import React from "react";
import { useSwipe } from "../hooks/useSwipe";
import { SwipeCard } from "./SwipeCard";
import { Loader2 } from "lucide-react";

export const SwipeFeature: React.FC = () => {
  const { nextCandidate, isLoading, handleSwipe, hasMore, fetchCandidates } = useSwipe();

  if (isLoading && !nextCandidate) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-12 h-12 animate-spin text-brand" />
      </div>
    );
  }

  if (!hasMore && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8">
        <h2 className="text-2xl font-bold mb-4">No more candidates!</h2>
        <p className="text-gray-600 mb-8">Try adjusting your preferences or come back later.</p>
        <button
          onClick={fetchCandidates}
          className="px-6 py-2 bg-brand text-white rounded-full hover:bg-brand-400 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4">
      {nextCandidate && (
        <SwipeCard
          key={nextCandidate.id}
          candidate={nextCandidate}
          onSwipe={handleSwipe}
        />
      )}
    </div>
  );
};
