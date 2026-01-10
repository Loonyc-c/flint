import React from "react";
import { motion } from "framer-motion";
import { Phone, Heart, Sparkles, Users } from "lucide-react";

export default function SearchingAnimation({ message = "Searching for your match..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-pink-50 to-rose-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="flex flex-col items-center gap-8 px-4">
        {/* Animated Pulse Rings */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          {/* Outer Ring 1 */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-brand/30"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Outer Ring 2 */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-brand/40"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />

          {/* Center Circle with Phone Icon */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-brand to-[#B33A2E] flex items-center justify-center shadow-2xl">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Phone className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Floating Icons Around */}
          <FloatingIcon
            icon={Heart}
            delay={0}
            className="text-pink-500"
            position="top-0 left-0"
          />
          <FloatingIcon
            icon={Sparkles}
            delay={0.5}
            className="text-yellow-500"
            position="top-0 right-0"
          />
          <FloatingIcon
            icon={Users}
            delay={1}
            className="text-blue-500"
            position="bottom-0 left-0"
          />
          <FloatingIcon
            icon={Heart}
            delay={1.5}
            className="text-rose-500"
            position="bottom-0 right-0"
          />
        </div>

        {/* Animated Text */}
        <div className="flex flex-col items-center gap-4">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white text-center"
            animate={{
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {message}
          </motion.h2>

          {/* Animated Dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-brand"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 text-center max-w-md px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Finding someone special for you...
          </motion.p>
        </div>

        {/* Connecting Wave Animation */}
        <div className="flex items-center gap-1">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 sm:w-1.5 bg-brand rounded-full"
              animate={{
                height: ["20px", "40px", "20px"],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Floating Icon Component
function FloatingIcon({ icon: Icon, delay, className, position }) {
  return (
    <motion.div
      className={`absolute ${position} w-8 h-8 sm:w-10 sm:h-10 ${className}`}
      animate={{
        y: [-10, 10, -10],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <Icon className="w-full h-full" />
    </motion.div>
  );
}

