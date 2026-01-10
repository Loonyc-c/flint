"use client";
import { TypewriterEffect } from "@/shared/components/ui/typewriter-effect.jsx";
import { useTranslation } from "react-i18next";

export function MainTypeWriter() {
  const { t } = useTranslation();

  const words = [
    {
      text: t("main.readyToFind"),
    },
    {
      text: t("main.to"),
    },
    {
      text: t("main.find"),
    },
    {
      text: t("main.your"),
    },
    {
      text: t("main.spark"),
      className: "text-brand dark:text-blue-500",
    },
  ];
  return (
    <div className="flex flex-col items-center justify-center  ">
      <TypewriterEffect words={words} />
    </div>
  );
}
