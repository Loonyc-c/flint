"use client";

import { cn } from "@/core/lib/utils";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

export const FloatingDock = ({ items, className }) => {
  return <DockBar items={items} className={className} />;
};

const DockBar = ({ items, className }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        // same look on all screens (no md:hidden etc.)
        "mx-auto flex h-16 items-end gap-4 rounded-2xl bg-gray-50 px-4 pb-3 dark:bg-neutral-900",
        // keep it centered without margins elsewhere
        "justify-center",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({ mouseX, title, icon, href, onClick }) {
  const ref = useRef(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
    // negative: left side, positive: right side
  });

  const wT = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const hT = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const iwT = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const ihT = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

  const width = useSpring(wT, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(hT, { mass: 0.1, stiffness: 150, damping: 12 });

  const widthIcon = useSpring(iwT, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(ihT, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={href ?? "#"}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      role="button"
      aria-label={title}
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full bg-black text-white dark:bg-neutral-800"
      >
        {/* Hover label (hidden on small screens since there's no hover) */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 hidden w-fit rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white sm:block"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
