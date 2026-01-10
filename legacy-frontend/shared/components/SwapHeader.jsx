import { BadgeCheck } from "lucide-react";
import { Undo2 } from "lucide-react";
import { Dot } from "lucide-react";

export default function SwapHeader({ name = "Anonymous", isOnline = false }) {
  return (
    <header className="flex justify-between items-center w-full px-2 sm:px-0">
      <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
        <div className="flex gap-2 sm:gap-5 text-black dark:text-white items-center">
          <h1 className="font-bold text-lg sm:text-2xl truncate">{name}</h1>
          {isOnline && (
            <div className="flex items-center shrink-0">
              <Dot className="text-green-500 w-4 h-4 sm:w-6 sm:h-6" />
              <div className="text-xs text-green-500 hidden sm:block">
                Active Status
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <BadgeCheck className="text-brand w-3 h-3 sm:w-4 sm:h-4" />
          <div className="text-black dark:text-white text-xs">verified</div>
        </div>
      </div>
      <Undo2 className="text-black dark:text-white w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
    </header>
  );
}
