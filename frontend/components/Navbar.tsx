import Link from "next/link";
import { auth } from "@/auth";
import LogoutButton from "./LogoutButton";
import { cookies } from "next/headers";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import LanguageSelector from "./LanguageSelector";
import { ensureDatabaseEmailsCorrect } from "@/lib/services/vet-db-fix";

export default async function Navbar() {
  const session = await auth();
  
  // Repair veterinarian emails on the fly
  await ensureDatabaseEmailsCorrect();
  
  // Read current language from cookies
  const cookieStore = await cookies();
  const lang = (cookieStore.get("pashuraksha_lang")?.value || "en") as SupportedLanguage;

  // Localized roles helper
  const getLocalizedRole = (role: string) => {
    switch (role) {
      case "gov":
        return lang === "te" ? "ప్రభుత్వ అధికారి" : lang === "hi" ? "सरकारी अधिकारी" : lang === "ta" ? "அரசு அதிகாரி" : lang === "kn" ? "ಸರ್ಕಾರಿ ಅಧಿಕಾರಿ" : "Gov Official";
      case "vet":
        return lang === "te" ? "పశువైద్యుడు" : lang === "hi" ? "पशु चिकित्सक" : lang === "ta" ? "கால்நடை மருத்துவர்" : lang === "kn" ? "ಪಶುವೈದ್ಯರು" : "Veterinarian";
      default:
        return lang === "te" ? "రైతు" : lang === "hi" ? "किसान" : lang === "ta" ? "விவசாயி" : lang === "kn" ? "ರೈತ" : "Farmer";
    }
  };

  return (
    <nav className="bg-white/85 backdrop-blur-md border-b border-stone-200/80 py-3 px-6 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-emerald-light border border-emerald-accent/30 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-emerald-50">
            <svg className="w-4 h-4 text-emerald-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M2 12h20" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-black text-lg text-stone-850 tracking-tight transition-colors group-hover:text-emerald-primary">
            {translate("brand_title", lang)}
          </span>
        </Link>

        {/* Portal Switcher & Session Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-5 text-xs font-bold text-stone-500 uppercase tracking-wider">
            {session?.user?.role === "farmer" && (
              <>
                <Link href="/farmer/cases" className="hover:text-emerald-primary transition relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-emerald-accent after:transition-all hover:after:w-full">
                  {translate("my_cases", lang)}
                </Link>
                <Link href="/farmer/settings" className="hover:text-emerald-primary transition relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-emerald-accent after:transition-all hover:after:w-full">
                  {translate("settings_livestock", lang)}
                </Link>
              </>
            )}
            {session?.user?.role === "vet" && (
              <Link href="/vet/queue" className="hover:text-emerald-primary transition relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-emerald-accent after:transition-all hover:after:w-full">
                {translate("vet_queue", lang)}
              </Link>
            )}
            {session?.user?.role === "gov" && (
              <Link href="/government" className="hover:text-emerald-primary transition relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-emerald-accent after:transition-all hover:after:w-full">
                {translate("surveillance_command", lang)}
              </Link>
            )}
            {!session?.user && (
              <>
                <Link href="/farmer/cases" className="hover:text-emerald-primary transition py-1">
                  {translate("farmer_portal", lang)}
                </Link>
                <Link href="/vet/queue" className="hover:text-emerald-primary transition py-1">
                  {translate("vet_portal", lang)}
                </Link>
                <Link href="/government" className="hover:text-emerald-primary transition py-1">
                  {translate("command_center", lang)}
                </Link>
              </>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="scale-95">
            <LanguageSelector currentLang={lang} />
          </div>

          {session?.user && (
            <div className="flex items-center gap-4 border-l border-stone-200 pl-5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-black text-stone-800">{session.user.name || "User"}</div>
                <div className="text-[10px] text-emerald-primary font-black uppercase tracking-wider mt-0.5">
                  {getLocalizedRole(session.user.role)}
                </div>
              </div>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
