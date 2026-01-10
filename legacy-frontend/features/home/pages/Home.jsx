import Header from "@/shared/components/Header";
import { Video, Mic, Users, Sparkles, Bot } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { useState, useEffect } from "react";
import { useScroll, useTransform } from "motion/react";
import React from "react";
import { GoogleGeminiEffect } from "@/shared/components/ui/google-gemini-effect";
import { TypeWriter } from "@/features/home/components/TypeWriter";
import { CometCard } from "@/shared/components/ui/comet-card"; // <-- keep for the single AI Wingman info card
import FounderCard from "@/features/home/components/FounderCard";
import bilguun from "@/assets/bilguunProfile.jpg";
import erdek from "@/assets/erdekProfile.jpg";
import AiWingmanCard from "@/features/ai-wingman/components/AiWingmanCard";
import MobileMission from "@/features/home/components/MobileMission";

const Step = ({ title, content }) => {
  return (
    <div>
      <p className="text-base md:text-lg font-semibold mt-1">{title}</p>
      <p className="text-sm md:text-base leading-relaxed text-black/70">
        {content}
      </p>
    </div>
  );
};

const features = [
  {
    key: 1,
    icon: <Mic className="h-10 w-10 relative text-white" />,
    title: "Stage 1: Voice",
    content:
      "Connect anonymously through a 90-second voice call. No photos, no profiles—just pure conversation.",
  },
  {
    key: 2,
    icon: <Video className="h-10 w-10 relative text-white" />,
    title: "Stage 2: Video",
    content:
      "If both agree to continue, reveal your cameras for a face-to-face video conversation.",
  },
  {
    key: 3,
    icon: <Users className="h-10 w-10 relative text-white" />,
    title: "Stage 3: Connect",
    content:
      "Exchange contact information and social media to continue your connection beyond Flint.",
  },
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [health, setHealth] = useState(null);

  console.log("API_URL:", import.meta.env.VITE_API_URL);

  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

  return (
    <div>
      <main className="w-full flex flex-col gap-10 md:gap-16 pb-12 md:pb-20 transition-all duration-500 bg-white">
        {/* Hero */}
        <div className="flex flex-col gap-10">
          <h1
            className={cn(
              "text-2xl md:text-4xl lg:text-5xl font-semibold leading-snug md:leading-tight tracking-tight text-center",
              isScrolled ? "text-white" : "text-black"
            )}
          >
            <TypeWriter />
          </h1>
          <h2
            className={cn(
              "mx-auto max-w-3xl text-sm md:text-base text-center",
              isScrolled ? "text-white/80" : "text-black/70"
            )}
          >
            Experience authentic connection through our unique 3-stage matching
            process.
            <br /> From anonymous voice chats to meaningful relationships.
          </h2>
          <h1>{JSON.stringify(health)}</h1>
        </div>

        <div className="w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature) => (
                <div
                  key={feature.key}
                  className="h-full rounded-2xl border-2 border-gray-200 bg-white"
                >
                  <div className="h-full flex flex-col items-start sm:items-center text-left sm:text-center gap-4 p-6 rounded-xl">
                    <div className="bg-brand rounded-full p-4 sm:p-5">
                      {React.cloneElement(feature.icon, {
                        className: "h-8 w-8 sm:h-10 sm:w-10 text-white",
                      })}
                    </div>
                    <Step title={feature.title} content={feature.content} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center">
          <CometCard className="w-full max-w-[380px] sm:max-w-[460px]">
            <div className="w-full rounded-2xl border-2 border-red-900 px-6 sm:px-8 py-6 sm:py-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="size-12 sm:size-14 rounded-full bg-[#B33A2E] text-white flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl">AI Wingman</h3>
                <p className="text-sm sm:text-base text-black/80">
                  Get conversation starters from our AI personalities — Playful,
                  Deep, or Casual.
                </p>
                <span className="inline-flex rounded bg-black/5 px-2 py-0.5 text-xs font-medium">
                  Premium Feature
                </span>
              </div>
            </div>
          </CometCard>
        </div>

        <div className="flex justify-center">
          <button className="px-6 py-3 rounded bg-[#B33A2E] font-medium text-white">
            Start Your Journey
          </button>
        </div>
      </main>

      <MobileMission />

      <div className="hidden md:block">
        <div
          className="h-[500vh] bg-[#000000] text-black w-full dark:border dark:border-white/[0.1] overflow-clip"
          ref={ref}
        >
          <GoogleGeminiEffect
            title="OUR MISSION"
            className="flex flex-col px-5 justify-start gap-10"
            description="Tired of endless shallow swipes? We're flipping the script with real chats. Flint drops the superficial BS—it's all about vibes, personality, and values over looks or flexes. Our vibe: Building lit, healthy connections through deep talks in a safe, no-drama zone."
            pathLengths={[
              pathLengthFirst,
              pathLengthSecond,
              pathLengthThird,
              pathLengthFourth,
              pathLengthFifth,
            ]}
          />
        </div>
      </div>

      {/* Story + Founders */}
      <div className="w-full flex justify-center">
        <section className="w-full max-w-[1200px] px-5 md:px-8 lg:px-10 py-12 sm:py-16 flex flex-col gap-16 sm:gap-20 lg:gap-24">
          {/* Title */}
          <div className="flex flex-wrap items-baseline justify-start gap-x-3 gap-y-2">
            <span className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-black">
              The Story of
            </span>
            <span className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-brand-100">
              Flint
            </span>
          </div>

          {/* Story copy (width-limited for laptop readability) */}
          <div className="w-full flex flex-col items-start gap-12 sm:gap-14">
            <div className="w-full max-w-[880px] flex flex-col gap-6 sm:gap-8 text-black">
              <p className="text-base sm:text-lg leading-relaxed">
                We noticed a problem with modern dating: it had become a game of
                instant judgments based on a handful of photos. Meaningful
                conversation, the cornerstone of any real relationship, was
                lost. We asked ourselves, “What if we could build a space where
                people connect with their minds and hearts before their eyes?”
              </p>
              <p className="text-base sm:text-lg leading-relaxed">
                That question sparked the idea for Flint. We envisioned a
                journey—a staged process that encourages vulnerability,
                curiosity, and genuine interest. From an anonymous voice call to
                a face-to-face video chat, each step is designed to build trust
                and connection organically.
              </p>
              <p className="text-base sm:text-lg leading-relaxed">
                We believe everyone deserves to find a connection that’s real.
                Flint is our answer to the swipe-fatigue epidemic, a return to
                what truly matters: who you are, not just what you look like.
              </p>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-200 text-center">
            Founders
          </h2>

          {/* Founders (NO CometCard; bordered boxes) */}
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-14 sm:gap-16 place-items-stretch">
              <div className="rounded-2xl p-3 sm:p-4">
                <FounderCard
                  image={bilguun}
                  name="Bilguun Batsukh"
                  role="Co-Founder & Co-CEO"
                  description="Tech visionary focused on creating safe, innovative platforms. Dedicated to using AI and technology to enhance human connection, not replace it."
                />
              </div>
              <div className="rounded-2xl bg-white p-3 sm:p-4">
                <FounderCard
                  image={erdek}
                  name="Erdemmunkh Boldoo"
                  role="Co-Founder & Co-CEO"
                  description="Passionate about building technology that brings people together authentically. Believes in the power of genuine conversation to create lasting connections."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-12 sm:gap-16">
            <div className="flex flex-col items-center gap-6 sm:gap-8">
              <div className="flex flex-wrap text-center gap-2">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-brand-300" />
                <span className="text-black text-3xl sm:text-4xl md:text-5xl font-bold">
                  Meet Your
                </span>
                <span className="text-brand-300 text-3xl sm:text-4xl md:text-5xl font-bold">
                  AI Wingmen
                </span>
              </div>

              <p className="w-full max-w-[900px] text-sm sm:text-base md:text-lg text-black/80 text-center leading-relaxed">
                Our AI Wingman is your personal conversation booster during each
                dating stage. Choose from different AI personalities—funny,
                flirty, thoughtful, or curious—that create engaging questions to
                keep the chat flowing…
              </p>
            </div>

            <div className="w-full">
              <AiWingmanCard />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
