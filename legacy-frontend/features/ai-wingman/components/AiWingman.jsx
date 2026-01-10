import { Sparkles } from "lucide-react";
import React from "react";

/**
 * Props (all optional):
 * - onChoose(), onPlayful(), onDeep(), onCasual()
 * - live: boolean
 * - selected: { name: string, tone: "Playful"|"Deep"|"Casual" } | null
 */
export default function AiWingman({
  onChoose,
  onPlayful,
  onDeep,
  onCasual,
  live = true,
  selected = null,
}) {
  return (
    <div className="wingman-reset w-full min-w-0 bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="text-brand w-5 h-5 shrink-0" />
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-base sm:text-lg truncate">
            AI Wingman
          </h2>
        </div>

        {live ? (
          <span
            className="shrink-0 text-white bg-brand px-3 py-1 rounded-lg text-xs sm:text-sm"
            aria-live="polite"
          >
            Live
          </span>
        ) : (
          <span className="shrink-0 text-xs sm:text-sm rounded-lg px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300">
            Offline
          </span>
        )}
      </div>

      {/* Selection / status */}
      <div className="bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl p-4 flex flex-col items-center gap-3 text-center">
        {selected ? (
          <>
            <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
              Wingman selected:{" "}
              <span className="font-medium">{selected.name}</span> (
              {selected.tone})
            </p>
            <button
              type="button"
              onClick={onChoose}
              className="bg-brand text-white rounded-xl w-full py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              Change Wingman
            </button>
          </>
        ) : (
          <>
            <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
              No Wingman selected for this stage
            </p>
            <button
              type="button"
              onClick={onChoose}
              className="bg-brand text-white rounded-xl w-full py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              Choose Wingman
            </button>
          </>
        )}
      </div>

      {/* Manual question buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onPlayful}
          className="w-full bg-white dark:bg-neutral-800 border border-accent dark:border-[#D9776D] rounded-xl p-3 text-gray-900 dark:text-gray-100 text-sm sm:text-base text-center break-words focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          Manual Playful Questions
        </button>
        <button
          type="button"
          onClick={onDeep}
          className="w-full bg-white dark:bg-neutral-800 border border-accent dark:border-[#D9776D] rounded-xl p-3 text-gray-900 dark:text-gray-100 text-sm sm:text-base text-center break-words focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          Manual Deep Questions
        </button>
        <button
          type="button"
          onClick={onCasual}
          className="w-full bg-white dark:bg-neutral-800 border border-accent dark:border-[#D9776D] rounded-xl p-3 text-gray-900 dark:text-gray-100 text-sm sm:text-base text-center break-words focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          Manual Casual Questions
        </button>
      </div>
    </div>
  );
}
