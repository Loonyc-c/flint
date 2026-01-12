"use client";

import { motion } from "framer-motion";
import { SwipeFeature } from "@/features/swipe/components/SwipeFeature";

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const SwipeIndexPage = () => {
  return (
    <motion.div
      key="swipe"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 min-h-0 w-full overflow-hidden bg-white/50 dark:bg-neutral-900/50 sm:rounded-3xl sm:shadow-xl"
    >
      <SwipeFeature />
    </motion.div>
  );
};

export default SwipeIndexPage;
