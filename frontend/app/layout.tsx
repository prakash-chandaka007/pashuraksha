import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pashuraksha CDSS • Livestock Health Surveillance & Triage",
  description: "Official Clinical Decision Support System and Livestock Disease Surveillance Platform by the Department of Animal Husbandry, Government of Andhra Pradesh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700;800&family=Noto+Sans+Kannada:wght@400;600;700;800&family=Noto+Sans+Tamil:wght@400;600;700;800&family=Noto+Sans+Telugu:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-stone-50 text-stone-900 selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
