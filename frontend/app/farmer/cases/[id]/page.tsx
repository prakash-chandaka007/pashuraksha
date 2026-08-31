import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getHealthCaseDetails } from "@/lib/services/cases";
import { cookies } from "next/headers";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import TranslatedText from "@/components/TranslatedText";
import DeleteCaseButton from "@/components/DeleteCaseButton";
import ResolveCaseButton from "@/components/ResolveCaseButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FarmerCaseDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  // Localized language cookie
  const cookieStore = await cookies();
  const lang = (cookieStore.get("pashuraksha_lang")?.value || "en") as SupportedLanguage;

  let detail = null;
  try {
    detail = await getHealthCaseDetails(session.user.id, id);
  } catch (err) {
    console.error("Failed to load case details:", err);
    redirect("/farmer/cases");
  }

  if (!detail) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-center bg-white border border-stone-200 rounded-3xl shadow-sm mt-10 font-sans glass-card">
        <span className="text-3xl mb-4 block">🔍</span>
        <h2 className="text-lg font-black uppercase text-stone-850">Case Not Found</h2>
        <p className="text-xs text-stone-500 mt-2 font-bold uppercase tracking-wider">
          The requested case could not be located or you do not have permission to view it.
        </p>
        <Link
          href="/farmer/cases"
          className="mt-6 inline-block px-5 py-2.5 rounded-xl font-bold bg-stone-900 hover:bg-stone-950 text-white transition text-xs uppercase tracking-wider cursor-pointer shadow-sm"
        >
          &larr; Back to Cases
        </Link>
      </div>
    );
  }

  // Formatting helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-stone-100 text-stone-700 border-stone-200";
      case "AI_ANALYZED":
        return "bg-blue-50 text-blue-800 border-blue-200/50";
      case "VET_ASSESSED":
        return "bg-emerald-light text-emerald-primary border-emerald-accent/20";
      case "RESOLVED":
        return "bg-emerald-light text-emerald-primary border-emerald-accent/20";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toUpperCase()) {
      case "HIGH":
      case "CRITICAL":
        return "bg-red-50 text-red-800 border-red-200/60";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 border-amber-200/60";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const predictedDiseases = (detail.aiAnalysis?.predictedDiseases || []) as {
    disease: string;
    confidence: number;
    urgency: string;
  }[];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-12 space-y-8 font-sans">
      {/* Navigation & Header */}
        <div>
          <Link
            href="/farmer/cases"
            className="inline-flex items-center text-xs font-black text-emerald-primary uppercase hover:underline mb-4 tracking-wider gap-1.5"
          >
            &larr; {translate("back", lang)}
          </Link>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl md:text-2xl font-black text-stone-900">
                  {detail.caseId}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getStatusBadge(detail.status)}`}>
                  {detail.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-stone-450 mt-2.5 uppercase font-bold tracking-wider">
                {translate("reported_on", lang)} {formatDate(detail.createdAt)} &bull; {translate("location", lang)}: <TranslatedText text={detail.location || "N/A"} lang={lang} />
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Veterinarian Banner */}
        {detail.assignedVet && (
          <div className="p-4 rounded-2xl bg-white border border-stone-200 text-stone-800 text-xs font-bold flex justify-between items-center shadow-sm glass-card">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-accent rounded-full animate-pulse" />
              <div>
                <span className="text-stone-455 font-black uppercase tracking-wider">{translate("assigned_doctor", lang)}: </span>
                <span className="text-stone-900 ml-1">
                  {detail.assignedVet.name.startsWith("Dr. ") ? detail.assignedVet.name : `Dr. ${detail.assignedVet.name}`} ({detail.assignedVet.email})
                </span>
              </div>
            </div>
            <span className="text-[9px] bg-emerald-light text-emerald-primary border border-emerald-accent/20 px-2.5 py-0.5 rounded-lg uppercase font-black tracking-wider">
              {lang === "te" ? "కేటాయించబడింది" : lang === "hi" ? "नियुक्त" : lang === "ta" ? "ஒதுக்கப்பட்டது" : lang === "kn" ? "ನಿಯೋಜಿಸಲಾಗಿದೆ" : "Assigned"}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Case Inputs & Symptoms */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section: Symptoms Report */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6 glass-card">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-850 border-b border-stone-150 pb-3">
                {translate("reported_symptoms_media", lang)}
              </h2>
              
              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl">
                <div className="text-[10px] text-stone-400 font-black uppercase tracking-wider mb-2">
                  {lang === "te" ? "రైతు గమనింపులు" : lang === "hi" ? "किसान अवलोकन" : lang === "ta" ? "விவசாயி அவதானிப்புகள்" : lang === "kn" ? "ರೈತರ ವೀಕ್ಷಣೆಗಳು" : "Farmer Observations"}
                </div>
                <p className="text-xs font-bold text-stone-700 leading-relaxed italic">
                  &ldquo;<TranslatedText text={detail.symptoms} lang={lang} />&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs font-bold border-t border-stone-100 pt-4">
                <div>
                  <span className="text-stone-400 block mb-0.5 uppercase text-[8px] tracking-widest">{translate("species", lang)}</span>
                  <span className="text-stone-850 font-black">{detail.species}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5 uppercase text-[8px] tracking-widest">{translate("sick_count", lang)}</span>
                  <span className="text-stone-850 font-black">{detail.affectedCount}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5 uppercase text-[8px] tracking-widest">{translate("onset_date", lang)}</span>
                  <span className="text-stone-850 font-black">
                    {formatDate(detail.symptomStartDate)}
                  </span>
                </div>
              </div>

              {/* Render case media attachments if present */}
              {detail.images && detail.images.length > 0 && (
                <div className="space-y-3.5 pt-4 border-t border-stone-150">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                    {translate("photos_lesions", lang)}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detail.images.map((imgUrl, idx) => (
                      <a
                        key={idx}
                        href={imgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block aspect-square rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 hover:border-emerald-primary/45 transition shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Livestock attachment ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute bottom-2 right-2 bg-stone-900/80 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-lg">
                          View
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Render respiratory sound recordings if present */}
              {detail.audio && (
                <div className="space-y-3.5 pt-4 border-t border-stone-150">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                    {translate("respiratory_sound", lang)}
                  </span>
                  <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-2xl flex items-center gap-3">
                    <span className="text-xl">🔊</span>
                    <audio src={detail.audio} controls className="w-full max-w-sm h-8" />
                  </div>
                </div>
              )}
            </div>

            {/* Section: Veterinary Prescriptions & Cure instructions */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 glass-card">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-850 border-b border-stone-150 pb-3">
                {translate("vet_prescription", lang)}
              </h2>

              {detail.vetAssessments.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-stone-250 bg-stone-50/50 rounded-2xl flex flex-col items-center justify-center min-h-[160px]">
                  <span className="text-2xl mb-2">🩺</span>
                  <h3 className="text-xs font-black uppercase text-stone-700">{translate("awaiting_vet", lang)}</h3>
                  <p className="text-[10px] text-stone-500 mt-1 max-w-[280px] font-bold uppercase tracking-wider leading-relaxed">
                    {translate("awaiting_vet_desc", lang)}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {detail.vetAssessments.map((vet) => (
                    <div key={vet.id} className="space-y-5">
                      <div className="flex justify-between items-start gap-4 flex-wrap border-b border-stone-100 pb-3">
                        <div>
                          <div className="text-xs font-black text-stone-850">
                            {vet.vetUser?.name ? (vet.vetUser.name.startsWith("Dr. ") ? vet.vetUser.name : `Dr. ${vet.vetUser.name}`) : "Registered Veterinarian"}
                          </div>
                          <div className="text-[9px] text-stone-450 font-bold uppercase tracking-wider">
                            Email: {vet.vetUser?.email || "N/A"}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-black text-stone-400 block uppercase tracking-widest">
                            Assessed On
                          </span>
                          <span className="text-xs font-black text-stone-750">
                            {formatDate(vet.assessedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-3 shadow-inner">
                        <div>
                          <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                            {translate("clinical_diagnosis", lang)}
                          </span>
                          <p className="text-xs font-black text-emerald-primary uppercase">
                            <TranslatedText text={vet.diagnosis} lang={lang} />
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold pt-2 border-t border-stone-200">
                          <div>
                            <span className="text-stone-450 block mb-0.5 uppercase text-[8px] tracking-widest">{translate("clinical_severity", lang)}</span>
                            <span className="text-stone-850 font-black">{vet.severity}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">
                          {translate("prescribed_treatment", lang)}
                        </span>
                        <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-xs text-stone-700 leading-relaxed font-semibold whitespace-pre-line border-l-4 border-l-emerald-primary shadow-inner">
                          <TranslatedText text={vet.treatmentPlan} lang={lang} />
                        </div>
                      </div>

                      {vet.notes && (
                        <div className="space-y-3">
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                            {translate("additional_advice", lang)}
                          </span>
                          <p className="text-xs text-stone-600 font-bold italic bg-amber-50/20 border border-amber-200/50 p-3.5 rounded-2xl shadow-sm">
                            &ldquo;<TranslatedText text={vet.notes.replace(/\[FIELD_VISIT\]:.*/, "")} lang={lang} />&rdquo;
                          </p>

                          {/* Field Visit Scheduled Card */}
                          {vet.notes.includes("[FIELD_VISIT]:") && (
                            <div className="p-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md space-y-2.5">
                              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">🚑</span>
                                  <span className="text-xs font-black uppercase tracking-wider">Scheduled Farm Visit (Field Doctor Dispatch)</span>
                                </div>
                                <span className="text-[9px] bg-red-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Confirmed On-Site Visit
                                </span>
                              </div>
                              <div className="text-xs font-bold space-y-1 text-emerald-100">
                                <div>
                                  <span className="text-stone-400 text-[9px] uppercase tracking-wider block">Assigned Doctor & Clinic</span>
                                  <span className="text-white font-black">{vet.vetUser?.name || "State Veterinary Officer"} ({detail.location || "Jurisdiction Headquarters"})</span>
                                </div>
                                <div className="text-[11px] pt-1 font-semibold text-stone-300">
                                  📋 {vet.notes.slice(vet.notes.indexOf("[FIELD_VISIT]:"))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Real-Life Animal Cure & Home Recovery Protocol */}
                      <div className="p-5 bg-gradient-to-br from-stone-50 to-emerald-50/40 border border-stone-200/90 rounded-2xl space-y-3 shadow-inner">
                        <div className="flex items-center gap-2 border-b border-stone-200/70 pb-2">
                          <span className="text-base">🛡️</span>
                          <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                            Real-Life Livestock Cure & Recovery Protocol
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-bold text-stone-700">
                          <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                            <span className="text-emerald-800 font-black block text-[10px] uppercase">1. Quarantine & Isolation</span>
                            <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                              Isolate sick animal 50m away from healthy flock in a dry, shaded area to prevent disease spread.
                            </p>
                          </div>
                          <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                            <span className="text-emerald-800 font-black block text-[10px] uppercase">2. Antiseptic Wound Washing</span>
                            <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                              Clean mouth/foot lesions 3x daily using warm saline or Potassium Permanganate solution.
                            </p>
                          </div>
                          <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                            <span className="text-emerald-800 font-black block text-[10px] uppercase">3. Soft Feeding & Hydration</span>
                            <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                              Provide fresh clean water mixed with oral electrolytes and soft warm gruel (rice/ragi water).
                            </p>
                          </div>
                          <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1">
                            <span className="text-emerald-800 font-black block text-[10px] uppercase">4. Medicine Administration</span>
                            <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                              Administer prescribed antibiotics, anti-inflammatory bolus, or injections strictly after feeding.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Case Recovery & Resolution Action */}
              <div className="pt-4 border-t border-stone-150">
                <ResolveCaseButton
                  caseDbId={detail.id}
                  caseRefId={detail.caseId}
                  currentStatus={detail.status}
                />
              </div>
            </div>

          </div>

          {/* Right Column: AI Triage Assistance */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6 sticky top-24 glass-card">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-stone-850">
                  {lang === "te" ? "ఏఐ నిర్ణయ మద్దతు" : lang === "hi" ? "एआई निर्णय सहायता" : "AI Decision Support"}
                </h2>
                <p className="text-[9px] text-stone-400 mt-1 leading-relaxed font-black uppercase tracking-widest">
                  {lang === "te" ? "రోగలక్షణాల నమోదు వెంటనే విశ్లేషించబడిన ప్రాథమిక ఫలితాలు" : lang === "hi" ? "लक्षण प्रविष्टि पर तुरंत विश्लेषित प्रारंभिक परिणाम" : "Preliminary triage processed on symptom entry."}
                </p>
              </div>

              {detail.aiAnalysis ? (
                <div className="space-y-6">
                  
                  {/* Predicted Conditions */}
                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block border-b border-stone-150 pb-1.5">
                      {translate("possible_conditions", lang)}
                    </span>
                    
                    <div className="space-y-3.5">
                      {predictedDiseases.map((pred, index) => {
                        const confPct = Math.round(Number(pred.confidence) > 1 ? Number(pred.confidence) : Number(pred.confidence) * 100);
                        return (
                          <div
                            key={index}
                            className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2 shadow-inner"
                          >
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-stone-850 font-black"><TranslatedText text={pred.disease} lang={lang} /></span>
                              <span className="text-emerald-primary font-black">{confPct}%</span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${confPct}%` }}
                              />
                            </div>

                            <div className="flex justify-between items-center text-[8px] font-black pt-1">
                              <span className="text-stone-400 uppercase tracking-widest">{translate("triage_urgency", lang)}</span>
                              <span className={`px-1.5 py-0.5 rounded border uppercase tracking-wider font-extrabold ${getUrgencyBadge(pred.urgency)}`}>
                                {translate("urgency_" + pred.urgency.toLowerCase(), lang)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Safety Warning Block */}
                  <div className="p-4 bg-amber-50 border border-amber-250/50 rounded-2xl space-y-2 shadow-sm">
                    <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                      {translate("safety_notice", lang)}
                    </div>
                    <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
                      <TranslatedText text={detail.aiAnalysis.disclaimer} lang={lang} />
                    </p>
                  </div>

                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-stone-300 rounded-2xl text-stone-400 flex flex-col items-center justify-center min-h-[160px]">
                  <span className="text-2xl mb-1">📭</span>
                  <p className="text-xs font-black uppercase text-stone-700">No AI Triage Logged</p>
                  <p className="text-[9px] text-stone-500 mt-1 uppercase font-bold tracking-wider">
                    AI analysis could not be generated for this case.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
