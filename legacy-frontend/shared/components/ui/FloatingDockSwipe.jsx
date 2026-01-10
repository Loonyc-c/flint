import React from "react";
import { FloatingDock } from "@/shared/components/ui/floating-dock";
import { Heart, X, Star } from "lucide-react";

export function FloatingDockSwipe({
  className = "",
  onLike,
  onDislike,
  onSuperlike,
  disabled = false,
}) {
  const links = [
    {
      title: "Pass",
      icon: <X className="h-full w-full text-white dark:text-neutral-300" />,
      href: "#",
      onClick: (e) => {
        e.preventDefault();
        if (!disabled) onDislike?.();
      },
    },
    {
      title: "Superlike",
      icon: <Star className="h-full w-full text-white dark:text-neutral-300" />,
      href: "#",
      onClick: (e) => {
        e.preventDefault();
        if (!disabled) onSuperlike?.();
      },
    },
    {
      title: "Smash",
      icon: (
        <Heart className="h-full w-full text-white dark:text-neutral-300" />
      ),
      href: "#",
      onClick: (e) => {
        e.preventDefault();
        if (!disabled) onLike?.();
      },
    },
  ];

  return (
    <div
      className={`flex items-center justify-center h-fit w-auto ${className}`}
    >
      <FloatingDock
        items={links}
        desktopClassName="ml-auto"
        mobileClassName="translate-y-20"
      />
    </div>
  );
}
