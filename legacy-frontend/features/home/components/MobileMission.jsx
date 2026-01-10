import React from "react";

export default function MobileMission() {
  return (
    <div className="flex flex-col md:hidden bg-black h-fit">
      <section className="flex flex-col flex-1 px-5 py-12 gap-6">
        <h2 className="text-3xl font-extrabold text-brand-300 text-center tracking-tight">
          OUR MISSION
        </h2>

        <p className="text-base leading-relaxed text-white/80 text-center">
          Tired of endless shallow swipes? We're flipping the script with real
          chats. Flint drops the superficial BS—it's all about vibes,
          personality, and values over looks or flexes. Our vibe: building lit,
          healthy connections through deep talks in a safe, no-drama zone.
        </p>

        <ul className="flex flex-col gap-3 text-white/80">
          <li className="flex items-start gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70 self-center" />
            <span>
              Start with voice to keep things genuine and low-pressure.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70 self-center" />
            <span>Move to video only when both feel ready.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70 self-center" />
            <span>
              Connect beyond Flint—because real stories continue offline.
            </span>
          </li>
        </ul>
      </section>

      <div className="flex justify-center bg-black pb-6">
        <a
          href="/download"
          className="rounded-full px-6 py-3 text-sm font-semibold
                     bg-[#B33A2E] text-white shadow-lg active:scale-95 transition"
        >
          Get Flint App today
        </a>
      </div>
    </div>
  );
}
