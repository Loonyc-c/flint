// Info.jsx
import { Cake, MapPin, Heart } from "lucide-react";
import ShortInfo from "@/features/profile/components/ShortInfo";

// allow consuming page to pass the SAME width class as your pink header container
export default function Info({
  maxWidthClass = "max-w-3xl",
  name = "Anonymous",
  age,
  location,
  bio,
}) {
  return (
    <div
      className={`w-full ${maxWidthClass} border-accent dark:border-[#D9776D] border-2 rounded-2xl p-4 sm:p-5 bg-white dark:bg-neutral-800`}
    >
      {/* Name and Age */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">
          {name}
          {age && `, ${age}`}
        </h2>
      </div>

      {/* Location */}
      {location && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="text-sm sm:text-base">{location}</span>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <div className="mb-3 sm:mb-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            {bio}
          </p>
        </div>
      )}
    </div>
  );
}
