import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, from, to } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ translatedText: "" });
    }
    const fromLang = from || "auto";
    const toLang = to || "en";

    if (fromLang === toLang) {
      return NextResponse.json({ translatedText: text });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(fromLang)}&tl=${encodeURIComponent(toLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ translatedText: text });
    }

    const data = await res.json();
    if (data && data[0]) {
      const translatedText = data[0].map((x: any) => x[0]).join("");
      return NextResponse.json({ translatedText });
    }

    return NextResponse.json({ translatedText: text });
  } catch (error) {
    console.error("Translation API route error:", error);
    return NextResponse.json({ translatedText: text });
  }
}
