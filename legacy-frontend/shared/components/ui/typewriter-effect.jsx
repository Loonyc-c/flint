"use client";

import { cn } from "@/core/lib/utils";
import { motion, stagger, useAnimate, useInView } from "motion/react";
import { useEffect } from "react";

/**
 * words: [{ text: "Find Your Spark in" }, { text: "Three", className: "text-brand" }, { text: "Stages", className: "text-brand" }]
 */
export const TypewriterEffect = ({ words, className, cursorClassName }) => {
  const wordsArray = words.map((w) => ({ ...w, text: w.text.split("") }));

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);

  useEffect(() => {
    if (!isInView) return;
    animate(
      "span",
      { display: "inline-block", opacity: 1 },
      { duration: 0.3, delay: stagger(0.06), ease: "easeInOut" }
    );
  }, [isInView, animate]);

  return (
    <div
      className={cn(
        "inline-flex items-center whitespace-nowrap",
        "text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-semibold",
        "leading-snug md:leading-tight tracking-tight",
        className
      )}
      ref={scope}
      role="text"
      aria-label={words.map((w) => w.text).join(" ")}
    >
      {/* words */}
      <motion.div className="inline-flex items-baseline gap-2">
        {wordsArray.map((word, idx) => (
          <span key={`word-${idx}`} className="inline-block">
            {word.text.map((char, i) => (
              <motion.span
                key={`char-${idx}-${i}`}
                initial={{ opacity: 0, display: "none" }}
                className={cn("text-black dark:text-white", word.className)}
              >
                {char}
              </motion.span>
            ))}
          </span>
        ))}
      </motion.div>

      {/* caret */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className={cn(
          "ml-1 inline-block align-middle rounded-sm w-[3px] h-[0.9em] bg-brand",
          cursorClassName
        )}
      />
    </div>
  );
};

export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}) => {
  const wordsArray = words.map((w) => ({ ...w, text: w.text.split("") }));

  return (
    <div className={cn("flex items-center gap-1 my-4", className)}>
      <motion.div
        className="overflow-hidden pb-1"
        initial={{ width: "0%" }}
        whileInView={{ width: "fit-content" }}
        transition={{ duration: 2, ease: "linear", delay: 0.6 }}
      >
        <div className="whitespace-nowrap font-semibold tracking-tight leading-snug text-sm sm:text-base md:text-2xl lg:text-3xl xl:text-5xl">
          {wordsArray.map((word, idx) => (
            <span key={`w-${idx}`} className="inline-block mr-2">
              {word.text.map((char, i) => (
                <span
                  key={`c-${idx}-${i}`}
                  className={cn("text-black dark:text-white", word.className)}
                >
                  {char}
                </span>
              ))}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className={cn(
          "block w-[3px] h-[1em] rounded-sm bg-brand",
          cursorClassName
        )}
      />
    </div>
  );
};
