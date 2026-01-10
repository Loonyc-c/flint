import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "mn" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      aria-label="Toggle language"
    >
      {i18n.language === "en" ? (
        <>
          <span className="text-base">🇲🇳</span>
          <span className="hidden sm:inline">MN</span>
        </>
      ) : (
        <>
          <span className="text-base">🇬🇧</span>
          <span className="hidden sm:inline">EN</span>
        </>
      )}
    </button>
  );
}

