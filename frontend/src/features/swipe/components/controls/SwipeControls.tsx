"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, RotateCcw, Star, Sparkles } from "lucide-react";
import { type SwipeAction } from '@shared/types'
import { useTranslations } from 'next-intl'

interface SwipeControlsProps {
  onSwipe: (type: SwipeAction) => void;
  onUndo: () => void;
  canUndo: boolean;
  isSwiping: boolean;
}

// Button component with enhanced animations
const ActionButton = ({
  onClick,
  disabled,
  variant,
  size = "large",
  ariaLabel,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: "pass" | "like" | "superlike" | "undo";
  size?: "small" | "large";
  ariaLabel: string;
  children: React.ReactNode;
}) => {
  const variants = {
    pass: {
      bg: "bg-card",
      border: "border-2 border-border",
      text: "text-muted-foreground",
      hoverText: "group-hover:text-destructive",
      shadow: "shadow-lg shadow-muted/50",
      hoverShadow: "hover:shadow-xl hover:shadow-destructive/20",
      ring: "focus:ring-destructive/40",
      glow: "group-hover:bg-destructive/5",
    },
    like: {
      bg: "bg-linear-to-br from-brand via-brand to-brand-300",
      border: "",
      text: "text-brand-foreground",
      hoverText: "",
      shadow: "shadow-lg shadow-brand/40",
      hoverShadow: "hover:shadow-xl hover:shadow-brand/50",
      ring: "focus:ring-brand",
      glow: "",
    },
    superlike: {
      bg: "bg-linear-to-br from-info to-info/80",
      border: "",
      text: "text-info-foreground",
      hoverText: "",
      shadow: "shadow-lg shadow-info/40",
      hoverShadow: "hover:shadow-xl hover:shadow-info/50",
      ring: "focus:ring-info/40",
      glow: "",
    },
    undo: {
      bg: "bg-linear-to-br from-warning to-warning/80",
      border: "",
      text: "text-warning-foreground",
      hoverText: "",
      shadow: "shadow-lg shadow-warning/40",
      hoverShadow: "hover:shadow-xl hover:shadow-warning/50",
      ring: "focus:ring-warning/40",
      glow: "",
    },
  };

  const sizeClasses = {
    small: "w-11 h-11 sm:w-12 sm:h-12",
    large: "w-14 h-14 sm:w-16 sm:h-16",
  };

  const v = variants[variant];

  return (
    <motion.button
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative ${sizeClasses[size]} rounded-full ${v.bg} ${v.border} ${v.shadow} ${v.hoverShadow}
        flex items-center justify-center ${v.text} ${v.hoverText}
        transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none
        cursor-pointer focus:outline-none focus:ring-2 ${v.ring} focus:ring-offset-2
        overflow-hidden
      `}
      aria-label={ariaLabel}
    >
      {/* Glow effect on hover for pass button */}
      <div
        className={`absolute inset-0 ${v.glow} transition-colors duration-300`}
      />

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <span className="relative z-10 transition-transform duration-200 group-active:scale-90">
        {children}
      </span>
    </motion.button>
  );
};

// Keyboard hint badge
const KeyHint = ({
  keys,
  label,
  color,
}: {
  keys: string;
  label: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2"
  >
    <kbd
      className={`
      px-2 py-0.5 text-[10px] font-mono font-bold rounded-md
      bg-muted text-muted-foreground
      border border-border
      shadow-sm
    `}
    >
      {keys}
    </kbd>
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  </motion.div>
);

export const SwipeControls = ({
  onSwipe,
  onUndo,
  canUndo,
  isSwiping,
}: SwipeControlsProps) => {
  const t = useTranslations('swipe.controls')

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Main Action Buttons */}
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        {/* Undo button */}
        <AnimatePresence mode="popLayout">
          {canUndo && (
            <motion.div
              initial={{ scale: 0, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <ActionButton
                onClick={onUndo}
                disabled={isSwiping}
                variant="undo"
                size="small"
                ariaLabel={t('undoAria')}
              >
                <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pass button */}
        <ActionButton
          onClick={() => onSwipe("pass")}
          disabled={isSwiping}
          variant="pass"
          ariaLabel={t('passAria')}
        >
          <X className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={3} />
        </ActionButton>

        {/* Super button */}
        <motion.div className="relative">
          <ActionButton
            onClick={() => onSwipe("super")}
            disabled={isSwiping}
            variant="superlike"
            size="small"
            ariaLabel={t('superAria')}
          >
            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </ActionButton>

          {/* Sparkle decoration */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 15, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          </motion.div>
        </motion.div>

        {/* Smash button */}
        <motion.div className="relative">
          <ActionButton
            onClick={() => onSwipe("smash")}
            disabled={isSwiping}
            variant="like"
            ariaLabel={t('smashAria')}
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
          </ActionButton>

          {/* Pulse ring animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-brand"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>
      </div>

      {/* Keyboard Hints - Desktop only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden sm:flex justify-center gap-6"
      >
        <KeyHint keys="←" label={t('pass')} color="bg-muted-foreground" />
        <KeyHint keys="↑" label={t('super')} color="bg-info" />
        <KeyHint keys="→" label={t('smash')} color="bg-brand" />
        {canUndo && <KeyHint keys="Z" label={t('undo')} color="bg-warning" />}
      </motion.div>
    </div>
  );
};
