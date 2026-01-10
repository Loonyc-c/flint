import React, { useState } from "react";
import { FloatingDock } from "@/shared/components/ui/floating-dock";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

export function FloatingDockComp({
  micOn,
  camOn,
  onMicClick,
  onCamClick,
  onHangup,
  stage,
  className = "",
}) {
  let links = [
    {
      title: micOn ? "Mic off" : "Mic on",
      icon: micOn ? (
        <Mic className="h-full w-full text-white dark:text-neutral-300 " />
      ) : (
        <MicOff className="h-full w-full text-white dark:text-neutral-300" />
      ),
      onClick: onMicClick,
    },
    {
      title: "End Call",
      icon: (
        <PhoneOff className="h-full w-full text-white dark:text-neutral-300" />
      ),
      href: "/main",
      onClick: onHangup,
    },
  ];

  // Only show video controls if stage is NOT 1
  if (stage !== 1) {
    links.push({
      title: camOn ? "Video off" : "Video on",
      icon: camOn ? (
        <Video className="h-full w-full text-white dark:text-neutral-300" />
      ) : (
        <VideoOff className="h-full w-full text-white dark:text-neutral-300" />
      ),
      onClick: onCamClick,
    });
  }

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
