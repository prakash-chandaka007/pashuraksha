"use client";

import { LANGUAGES, SupportedLanguage } from "@/lib/services/i18n";

interface LanguageSelectorProps {
  currentLang: SupportedLanguage;
}

export default function LanguageSelector({ currentLang }: LanguageSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    // Set cookie
    document.cookie = `pashuraksha_lang=${newLang}; path=/; max-age=31536000`;
    // Refresh page to apply new translations
    window.location.reload();
  };

  return (
    <div className="relative">
      <select
        value={currentLang}
        onChange={handleChange}
        className="bg-slate-50 border border-slate-300 text-slate-800 text-[10px] font-extrabold uppercase tracking-wider rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-slate-850 bg-white">
            {lang.nativeName} ({lang.code.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
}
