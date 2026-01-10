"use client";
import { Smile, Flame, Heart, Brain } from "lucide-react";
import { CometCard } from "@/shared/components/ui/comet-card";
import { useTranslation } from "react-i18next";

const Move = ({ name, personality, description }) => (
  <div className="flex flex-col text-center">
    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{name}</p>
    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
      {personality}
    </p>
    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
      {description}
    </p>
  </div>
);

export default function AiWingmanCard() {
  const { t } = useTranslation();

  const aiWingmen = [
    {
      name: t("wingman.aiMike"),
      personality: t("wingman.funnyGuy"),
      icon: Smile,
      color: "#00C85F",
      description: t("wingman.mikeDesc"),
    },
    {
      name: t("wingman.aiLila"),
      personality: t("wingman.spicyOne"),
      icon: Flame,
      color: "#EE36A9",
      description: t("wingman.lilaDesc"),
    },
    {
      name: t("wingman.aiEmma"),
      personality: t("wingman.deepThinker"),
      icon: Brain,
      color: "#4379FF",
      description: t("wingman.emmaDesc"),
    },
  ];

  return (
    <div className="px-16 w-full flex flex-wrap justify-around gap-6">
      {aiWingmen.map(
        ({ name, personality, icon: Icon, description, color }) => (
          <CometCard key={name} className="w-full sm:w-[45%] lg:w-[30%]">
            <div className="h-fit flex flex-col gap-5 items-center p-5 rounded-2xl">
              {/* Icon with preserved color in both light and dark mode */}
              <div
                className="rounded-full p-5 w-fit h-fit"
                style={{ backgroundColor: color }}
              >
                <Icon className="h-10 w-10 text-white" />
              </div>
              <Move
                name={name}
                personality={personality}
                description={description}
              />
            </div>
          </CometCard>
        )
      )}
    </div>
  );
}
