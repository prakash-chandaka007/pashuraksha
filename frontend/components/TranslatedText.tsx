"use client";

import { useState, useEffect } from "react";
import { getTranslatedField, translateText } from "@/lib/services/translation";
import { translate, SupportedLanguage } from "@/lib/services/i18n";

interface TranslatedTextProps {
  text: string;
  lang: SupportedLanguage;
  className?: string;
  fallback?: string;
}

const translationCache: Record<string, string> = {};

// Helper to check if text contains Indian regional scripts (Telugu, Devanagari, Tamil, Kannada)
function containsRegionalScript(str: string): boolean {
  return /[\u0C00-\u0C7F\u0900-\u097F\u0B80-\u0BFF\u0C80-\u0CFF]/.test(str);
}

export default function TranslatedText({ text, lang, className, fallback = "" }: TranslatedTextProps) {
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslated(fallback);
      return;
    }

    const cleanText = text.trim();
    // Remove legacy delimiter if present
    const parts = cleanText.split(" ---");
    let baseText = parts[0].trim();

    // Check embedded language tag if legacy formatted
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.startsWith(`${lang}:`)) {
        const embeddedVal = part.slice(lang.length + 1).trim();
        setTranslated(embeddedVal);
        return;
      }
    }

    const cacheKey = `${lang}:${baseText}`;

    // 1. If cached, return immediately
    if (translationCache[cacheKey]) {
      setTranslated(translationCache[cacheKey]);
      return;
    }

    // 2. Check if static translation dictionary has this exact string (e.g. disease names, species, disclaimers)
    const staticTranslation = translate(baseText, lang);
    if (staticTranslation && staticTranslation.toLowerCase() !== baseText.toLowerCase()) {
      translationCache[cacheKey] = staticTranslation;
      setTranslated(staticTranslation);
      return;
    }

    // 3. If English selected and text is already standard English (no regional scripts)
    if (lang === "en" && !containsRegionalScript(baseText)) {
      setTranslated(baseText);
      return;
    }

    // 4. Live on-the-fly translation for non-English active language OR legacy non-English stored text
    setLoading(true);
    
    // If English selected but baseText is in regional script, translate to English live
    const fromLang = containsRegionalScript(baseText) ? "auto" : "en";
    const targetLang = lang;

    translateText(baseText, fromLang, targetLang)
      .then((res) => {
        const finalVal = res || baseText;
        translationCache[cacheKey] = finalVal;
        setTranslated(finalVal);
      })
      .catch((err) => {
        console.error("Live translation error:", err);
        setTranslated(baseText);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [text, lang, fallback]);

  if (loading) {
    return (
      <span className="inline-block animate-pulse bg-emerald-100/60 rounded px-1.5 py-0.5 text-[10px] text-emerald-800 select-none">
        translating...
      </span>
    );
  }

  return <span className={className}>{translated}</span>;
}
