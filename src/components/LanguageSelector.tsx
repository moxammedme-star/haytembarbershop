import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Globe, Check, ChevronDown } from "lucide-react";

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "fr", label: "Français", dir: "ltr" },
    { code: "ar", label: "العربية", dir: "rtl" },
    { code: "en", label: "English", dir: "ltr" }
  ];

  const currentLangObj = languages.find((l) => l.code === currentLanguage) || languages[0];

  useEffect(() => {
    // Apply body direction based on language
    document.body.dir = currentLangObj.dir;
    document.body.style.fontFamily = currentLanguage === "ar" ? "'Cairo', sans-serif" : "inherit";
  }, [currentLanguage, currentLangObj]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="lang-selector-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-none border border-white/10 bg-[#0a0a0a]/60 text-neutral-300 text-xs font-semibold uppercase tracking-widest hover:text-accent hover:border-accent/40 transition-all duration-300"
        id="lang-selector-btn"
      >
        <Globe className="w-3.5 h-3.5 text-accent" />
        <span>{currentLangObj.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-accent ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${currentLangObj.dir === "rtl" ? "left-0" : "right-0"} mt-2 w-40 rounded-none border border-white/10 bg-[#0a0a0a] p-1 shadow-2xl backdrop-blur-xl z-50`}
          id="lang-selector-dropdown"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any);
                setIsOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 text-xs text-neutral-300 rounded-none hover:bg-white/5 hover:text-accent transition-all duration-200 ${
                currentLanguage === lang.code ? "bg-white/5 text-accent font-semibold" : ""
              }`}
              style={{ direction: lang.dir as any }}
            >
              <span>{lang.label}</span>
              {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
