"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/core/lib/utils";

export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}) => {
  const [active, setActive] = useState(propTabs[0]);

  return (
    <>
      <div
        className={cn(
          "flex w-full items-center justify-center gap-2 sm:gap-4 md:gap-6",
          containerClassName
        )}
      >
        {propTabs.map((tab) => {
          const isActive = active.value === tab.value;
          return (
            <button
              key={tab.value ?? tab.title}
              onClick={() => setActive(tab)}
              data-tab={tab.value}
              className={cn(
                "relative flex-1 min-w-0 inline-flex items-center justify-center",
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full",
                "text-center",
                tabClassName
              )}
              style={{ transformStyle: "preserve-3d" }}
            >
              {isActive && (
                <motion.div
                  layoutId="clickedbutton"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  className={cn(
                    "absolute inset-0 rounded-full bg-gray-200 dark:bg-zinc-800",
                    activeTabClassName
                  )}
                />
              )}

              <span
                className={cn(
                  "relative z-10 font-medium text-black dark:text-white leading-none",
                  "text-[clamp(11px,3.2vw,16px)]"
                )}
              >
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>

      <FadeInDiv
        active={active}
        className={cn("pt-6 sm:pt-8 w-full", contentClassName)}
      />
    </>
  );
};

export const FadeInDiv = ({ className, active }) => {
  return (
    <div className={cn("w-full", className)}>
      <motion.div
        key={active.value}
        layoutId={active.value}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
        className="w-full"
      >
        {active.content}
      </motion.div>
    </div>
  );
};
