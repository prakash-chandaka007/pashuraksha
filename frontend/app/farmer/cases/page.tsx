import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getHealthCasesByFarmer } from "@/lib/services/cases";
import { getFarmerProfile } from "@/lib/services/farmer";
import { cookies } from "next/headers";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import TranslatedText from "@/components/TranslatedText";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "N/A";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function FarmerCasesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get localized language
  const cookieStore = await cookies();
  const lang = (cookieStore.get("pashuraksha_lang")?.value || "en") as SupportedLanguage;

  let cases = [];
  let farmerId = "";
  try {
    const farmer = await getFarmerProfile(session.user.id);
    farmerId = farmer.farmerId;
    
    const rawCases = await getHealthCasesByFarmer(session.user.id);
    // Format dates and relations for client component serialization
    cases = rawCases.map((c) => ({
      id: c.id,
      caseId: c.caseId,
      symptoms: c.symptoms,
      symptomStartDate: formatDate(c.symptomStartDate),
      location: c.location || "N/A",
      status: c.status,
      species: c.species || "Cattle",
      createdAt: formatDate(c.createdAt),
      aiAnalysis: c.aiAnalysis ? true : false,
      vetAssessmentsCount: c.vetAssessments.length,
      assignedVetName: c.assignedVet ? c.assignedVet.name : null,
    }));
  } catch (err) {
    console.error("Failed to load farmer cases:", err);
    redirect("/farmer/profile");
  }

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-stone-100 text-stone-700 border-stone-200/80";
      case "AI_ANALYZED":
        return "bg-blue-50 text-blue-800 border-blue-200/50";
      case "VET_ASSESSED":
        return "bg-emerald-light text-emerald-primary border-emerald-accent/20";
      case "RESOLVED":
        return "bg-emerald-light text-emerald-primary border-emerald-accent/20";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200/80";
    }
  };

  const getSpeciesEmoji = (species: string) => {
    switch (species?.toLowerCase()) {
      case "cattle":
        return "🐄";
      case "buffalo":
        return "🐃";
      case "sheep":
        return "🐑";
      case "goat":
        return "🐐";
      case "poultry":
        return "🐓";
      default:
        return "🐾";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-12 font-sans">
      {/* Header section */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-stone-900 uppercase">
              {translate("reported_cases", lang)}
            </h1>
            <p className="mt-1.5 text-xs text-stone-450 uppercase tracking-wider font-extrabold">
              {translate("monitor_progress", lang)}
            </p>
          </div>
          <Link
            href="/farmer/cases/new"
            className="px-5 py-3 rounded-xl font-bold bg-emerald-primary hover:bg-emerald-800 text-white shadow-md hover:shadow-lg transition duration-200 active:scale-98 text-xs uppercase tracking-wider cursor-pointer"
          >
            {translate("report_issue", lang)}
          </Link>
        </div>

        {/* Prominent Farmer ID Display Banner */}
        {farmerId && (
          <div className="mb-8 p-4 rounded-2xl bg-white border border-stone-200/85 text-stone-800 text-xs font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm glass-card">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-accent rounded-full animate-pulse-ring" />
              <span className="text-stone-500 font-black uppercase tracking-wider">
                {translate("farmer_id", lang)}: 
              </span>
              <span className="font-mono text-sm font-black text-stone-900 bg-stone-100 border border-stone-200 px-3.5 py-1 rounded-xl shadow-inner">
                {farmerId}
              </span>
            </div>
          </div>
        )}

        {cases.length === 0 ? (
          // Empty state block
          <div className="p-12 text-center border-2 border-dashed border-stone-250 rounded-2xl bg-white max-w-lg mx-auto flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-4xl mb-4">🐑</span>
            <h3 className="text-sm font-black uppercase text-stone-850">
              {translate("no_cases", lang)}
            </h3>
            <Link
              href="/farmer/cases/new"
              className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-light hover:bg-emerald-100 text-emerald-primary border border-emerald-accent/20 transition uppercase tracking-wider"
            >
              {translate("report_first", lang)}
            </Link>
          </div>
        ) : (
          // Cases Grid List
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cases.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between glass-card glass-card-hover"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-5 border-b border-stone-150 pb-3">
                    <div>
                      <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                        {translate("case_ref", lang)}
                      </span>
                      <span className="font-mono text-sm font-black text-stone-900">{c.caseId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" title={c.species}>
                        {getSpeciesEmoji(c.species)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl mb-5">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider block mb-1.5">
                      {translate("symptoms", lang)}
                    </span>
                    <p className="text-stone-700 text-xs font-bold leading-relaxed line-clamp-3 italic">
                      &ldquo;<TranslatedText text={c.symptoms} lang={lang} />&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[10px] font-black text-stone-450 border-t border-stone-150 pt-4 mb-6">
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-stone-400 block mb-0.5">
                        {translate("reported_on", lang)}
                      </span>
                      <span className="text-stone-850 font-bold">{c.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-stone-400 block mb-0.5">
                        {translate("assigned_doctor", lang)}
                      </span>
                      <span className="text-emerald-primary font-bold">
                        {c.assignedVetName ? (c.assignedVetName.startsWith("Dr. ") ? c.assignedVetName : `Dr. ${c.assignedVetName}`) : "Assigning..."}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-stone-400 block mb-0.5">
                        {translate("ai_status", lang)}
                      </span>
                      <span className={c.aiAnalysis ? "text-emerald-primary font-extrabold" : "text-stone-400"}>
                        {c.aiAnalysis ? (lang === "te" ? "విశ్లేషణ సిద్ధంగా ఉంది" : lang === "hi" ? "विश्लेषण तैयार" : lang === "ta" ? "பகுப்பாய்வு தயார்" : lang === "kn" ? "ವಿಶ್ಲೇಷಣೆ ಸಿದ್ಧ" : "Analysis Ready") : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-widest text-stone-400 block mb-0.5">
                        {translate("vet_assessments", lang)}
                      </span>
                      <span className={c.vetAssessmentsCount > 0 ? "text-emerald-primary font-extrabold" : "text-stone-400"}>
                        {c.vetAssessmentsCount > 0 ? `${c.vetAssessmentsCount} Logged` : "Waiting"}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/farmer/cases/${c.caseId}`}
                  className="w-full text-center py-2.5 rounded-xl text-[10px] font-black border border-stone-300 hover:bg-stone-50 text-stone-700 transition uppercase tracking-wider"
                >
                  {translate("view_details", lang)}
                </Link>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
