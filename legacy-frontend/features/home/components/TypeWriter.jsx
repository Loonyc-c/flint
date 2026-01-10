"use client";
import { TypewriterEffect } from "@/shared/components/ui/typewriter-effect.jsx";

export function TypeWriter() {
  const words = [
    {
      text: "Find",
    },
    {
      text: "Your",
    },
    {
      text: "Spark",
    },
    {
      text: "in",
    },
    {
      text: "Three Stages.",
      className: "text-brand dark:text-blue-500",
    },
  ];
  return (
    <div className="flex flex-col items-center justify-center  ">
      <TypewriterEffect words={words} />
    </div>
  );
}
