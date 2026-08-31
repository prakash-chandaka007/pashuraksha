// Service for translating dynamic user input (symptoms, diagnoses, treatment plans)
// Uses Google Translate's free API endpoint client-side

const SEPARATOR = " ---";

/**
 * Call Google Translate API to translate text.
 */
export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (!text || text.trim() === "") return "";
  if (fromLang === toLang) return text;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, from: fromLang, to: toLang }),
    });

    if (!res.ok) {
      return text;
    }

    const data = await res.json();
    return data.translatedText || text;
  } catch (error) {
    console.error("Translation service error:", error);
    return text;
  }
}

/**
 * Combines English translation and original text with language code.
 * Format: "English Text ---hi:Original Hindi Text"
 */
export function formatTranslatableField(englishText: string, originalText: string, langCode: string): string {
  const cleanEnglish = (englishText || "").trim();
  const cleanOriginal = (originalText || "").trim();

  if (langCode === "en" || !cleanOriginal) {
    return cleanEnglish;
  }
  return `${cleanEnglish}${SEPARATOR}${langCode}:${cleanOriginal}`;
}

/**
 * Parses a combined translatable field and returns the text for the target language.
 * If target translation is not found embedded, it automatically translates it on-the-fly.
 */
export async function getTranslatedField(combinedText: string, targetLang: string): Promise<string> {
  if (!combinedText) return "";

  const parts = combinedText.split(SEPARATOR);
  const englishPart = parts[0].trim();

  if (targetLang === "en") {
    return englishPart;
  }

  // 1. Look for pre-embedded translation
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.startsWith(`${targetLang}:`)) {
      return part.slice(targetLang.length + 1).trim();
    }
  }

  // 2. Identify the original language if we need to translate from it
  let originalLangCode = "";
  let originalText = "";
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    const colonIndex = part.indexOf(":");
    if (colonIndex > 0) {
      originalLangCode = part.slice(0, colonIndex);
      originalText = part.slice(colonIndex + 1);
      break;
    }
  }

  // If the target language matches the original language, return the original text directly
  if (originalLangCode === targetLang && originalText) {
    return originalText;
  }

  // 3. Fallback: Translate the English part to the target language on-the-fly
  return translateText(englishPart, "en", targetLang);
}
