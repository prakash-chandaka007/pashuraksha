"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import { translateText, formatTranslatableField } from "@/lib/services/translation";
import TranslatedText from "@/components/TranslatedText";
import LanguageSelector from "@/components/LanguageSelector";
import AndhraPradeshMap from "@/components/AndhraPradeshMap";
import VetJurisdictionMap from "@/components/maps/VetJurisdictionMap";

interface HealthCase {
  id: string;
  caseId: string;
  species: string;
  affectedCount: number;
  symptoms: string;
  symptomStartDate: string | null;
  location: string | null;
  status: string;
  images: string[];
  audio: string | null;
  assignedVetId: string | null;
  createdAt: string;
  farmer: {
    name: string;
    phone: string;
    district: string;
    state: string;
  };
  aIAnalysis?: {
    predictedDiseases: { disease: string; confidence: number; urgency: string }[];
    disclaimer: string;
  } | null;
  vetAssessments: {
    id: string;
    diagnosis: string;
    severity: string;
    treatmentPlan: string;
    notes?: string | null;
    assessedAt: string;
    vetUser?: {
      name: string;
      email: string;
    };
  }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "N/A";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface QueueDashboardProps {
  vetUserId: string;
  vetRegion: string;
  vetName?: string;
  vetEmail?: string;
  initialCases: HealthCase[];
}

export default function QueueDashboard({
  vetUserId,
  vetRegion,
  vetName = "Doctor",
  vetEmail = "vet@pashuraksha.org",
  initialCases,
}: QueueDashboardProps) {
  const router = useRouter();
  const [cases, setCases] = useState<HealthCase[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<HealthCase | null>(null);

  // Tab & Modal States
  const [viewMode, setViewMode] = useState<"queue" | "history" | "map">("queue");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dutyStatus, setDutyStatus] = useState<"ON_DUTY" | "ON_CALL">("ON_DUTY");

  // Localization state
  const [lang, setLang] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )pashuraksha_lang=([^;]*)/);
    if (match && match[1]) {
      setLang(match[1] as SupportedLanguage);
    }
  }, []);

  // Form State for Clinical Assessment
  const [diagnosis, setDiagnosis] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");

  // Field Visit Dispatch State
  const [fieldVisitRequired, setFieldVisitRequired] = useState(false);
  const [fieldVisitDate, setFieldVisitDate] = useState("");
  const [fieldVisitPriority, setFieldVisitPriority] = useState("EMERGENCY_DISPATCH");
  const [fieldVisitPurpose, setFieldVisitPurpose] = useState("On-site sample collection, IV fluid therapy, and herd quarantine setup.");

  const VET_MEDICINES = [
    { name: "Oxytetracycline LA Injection", dosage: "1 ml / 10 kg IM, single dose" },
    { name: "Meloxicam & Paracetamol Bolus", dosage: "1 bolus BD after food for 3 days" },
    { name: "Potassium Permanganate 1% Solution", dosage: "Wash mouth & hoof sores 3x daily" },
    { name: "Fly Repellent & Antiseptic Spray", dosage: "Topical application on open wounds 2x daily" },
    { name: "Oral Electrolytes & B-Complex Liquid", dosage: "50 ml mixed with warm gruel daily" },
    { name: "Ivermectin 1% Injection", dosage: "1 ml / 50 kg SC for parasite control" },
  ];

  const handleAddMedicine = (med: { name: string; dosage: string }) => {
    const line = `💊 ${med.name} — Dosage: ${med.dosage}`;
    setTreatmentPlan((prev) => (prev ? `${prev}\n${line}` : line));
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");

  // Load details to input form when a case is clicked
  const handleOpenAssessment = (c: HealthCase) => {
    setSelectedCase(c);
    setError(null);
    setSuccess(null);

    if (c.vetAssessments && c.vetAssessments.length > 0) {
      const existing = c.vetAssessments[0];
      setDiagnosis(existing.diagnosis);
      setSeverity(existing.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL");
      setTreatmentPlan(existing.treatmentPlan);
      
      const cleanNotes = (existing.notes || "").replace(/\[FIELD_VISIT\]:.*/, "").trim();
      setNotes(cleanNotes);

      if (existing.notes && existing.notes.includes("[FIELD_VISIT]:")) {
        setFieldVisitRequired(true);
        const matchDate = existing.notes.match(/Date:\s*([^|]+)/);
        const matchPriority = existing.notes.match(/Priority:\s*([^|]+)/);
        const matchPurpose = existing.notes.match(/Purpose:\s*(.*)/);

        if (matchDate) setFieldVisitDate(matchDate[1].trim());
        if (matchPriority) setFieldVisitPriority(matchPriority[1].trim());
        if (matchPurpose) setFieldVisitPurpose(matchPurpose[1].trim());
      } else {
        setFieldVisitRequired(false);
        setFieldVisitDate("");
        setFieldVisitPriority("EMERGENCY_DISPATCH");
        setFieldVisitPurpose("On-site sample collection, IV fluid therapy, and herd quarantine setup.");
      }
    } else {
      setDiagnosis("");
      setSeverity("MEDIUM");
      setTreatmentPlan("");
      setNotes("");
      setFieldVisitRequired(false);
      setFieldVisitDate("");
      setFieldVisitPriority("EMERGENCY_DISPATCH");
      setFieldVisitPurpose("On-site sample collection, IV fluid therapy, and herd quarantine setup.");
    }
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let englishDiagnosis = diagnosis;
      if (lang !== "en") {
        englishDiagnosis = await translateText(diagnosis, lang, "en");
      }

      let englishTreatmentPlan = treatmentPlan;
      if (lang !== "en") {
        englishTreatmentPlan = await translateText(treatmentPlan, lang, "en");
      }

      let englishNotes = notes;
      if (notes && lang !== "en") {
        englishNotes = await translateText(notes, lang, "en");
      }

      if (fieldVisitRequired) {
        const visitTag = `[FIELD_VISIT]: Date: ${fieldVisitDate || "Tomorrow 10:00 AM"} | Priority: ${fieldVisitPriority} | Purpose: ${fieldVisitPurpose}`;
        englishNotes = englishNotes ? `${englishNotes}\n\n${visitTag}` : visitTag;
      }

      const res = await fetch(`/api/vet/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCase.id,
          diagnosis: englishDiagnosis || diagnosis,
          severity,
          treatmentPlan: englishTreatmentPlan || treatmentPlan,
          notes: englishNotes || undefined,
        }),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(text || `Server returned status ${res.status}`);
        }
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assessment.");
      }

      setSuccess("Clinical assessment committed & logged successfully.");

      const updatedCases = cases.map((c) => {
        if (c.id === selectedCase.id) {
          return {
            ...c,
            status: "VET_ASSESSED",
            vetAssessments: [
              {
                id: data.assessment?.id || `ass-${Date.now()}`,
                diagnosis: combinedDiagnosis,
                severity,
                treatmentPlan: combinedTreatmentPlan,
                notes: combinedNotes,
                assessedAt: new Date().toISOString(),
              },
            ],
          };
        }
        return c;
      });
      setCases(updatedCases);
      setSelectedCase(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save assessment.");
    } finally {
      setLoading(false);
    }
  };

  // Filter cases strictly to jurisdiction (Queue view) vs Past Assessed Cases (History view)
  const activeQueueCases = cases.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const pastAssessedCases = cases.filter(
    (c) => c.status === "VET_ASSESSED" || (c.vetAssessments && c.vetAssessments.length > 0)
  );

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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toUpperCase()) {
      case "CRITICAL":
      case "HIGH":
        return "bg-red-50 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
  };

  const cleanDocName = vetName.startsWith("Dr. ") ? vetName : `Dr. ${vetName}`;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 font-sans">
      {/* Top Bar Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900">
              {translate("vet_queue", lang)}
            </h1>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              {cleanDocName}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-stone-500 uppercase tracking-wider font-bold">
            {translate("vet_dashboard_desc", lang)}
          </p>
        </div>

        {/* Action Controls & Doctor Settings Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-stone-200 hover:border-emerald-500 text-stone-800 text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 cursor-pointer hover:bg-stone-50"
          >
            <span>⚙️</span>
            <span>{translate("vet_settings", lang)}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs: Jurisdiction Active Queue vs Past Assessed Cases */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 p-2 rounded-3xl border border-stone-200/80 shadow-sm backdrop-blur-md">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setViewMode("queue")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 cursor-pointer uppercase tracking-wider ${
              viewMode === "queue"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
            }`}
          >
            {translate("active_jurisdiction_queue", lang)} ({activeQueueCases.length})
          </button>

          <button
            onClick={() => setViewMode("history")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 cursor-pointer uppercase tracking-wider ${
              viewMode === "history"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
            }`}
          >
            {translate("my_past_cases", lang)} ({pastAssessedCases.length})
          </button>

          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 cursor-pointer uppercase tracking-wider ${
              viewMode === "map"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
            }`}
          >
            Jurisdiction Disease Map
          </button>
        </div>

        {/* Status Filter Dropdown inside Active Queue */}
        {viewMode === "queue" && (
          <div className="flex gap-1 bg-stone-100/80 p-1 rounded-2xl border border-stone-200 self-end sm:self-auto">
            {[
              { id: "ALL", label: translate("all_statuses", lang) },
              { id: "AI_ANALYZED", label: translate("ai_triage_predicted", lang) },
              { id: "VET_ASSESSED", label: translate("clinically_assessed", lang) },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-emerald-800 shadow-sm font-black"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prominent Jurisdiction Info Banner */}
      {vetRegion && (
        <div className="mb-8 p-4 rounded-2xl bg-white border border-stone-200/80 text-stone-800 text-xs font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm glass-card">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse-ring" />
            <span className="text-stone-500 font-black uppercase tracking-wider">
              {translate("vet_jurisdiction", lang)}:
            </span>
            <span className="font-mono text-sm font-black text-stone-900 bg-stone-100 border border-stone-200 px-3.5 py-1 rounded-xl shadow-inner">
              {vetRegion}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-stone-450 font-bold uppercase tracking-wider">
              {translate("jurisdiction_locked_desc", lang)}
            </span>
            <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">
              🛡️ Locked Jurisdiction
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs font-bold flex gap-2 shadow-sm">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold flex gap-2 shadow-sm">
          <span>🛡️</span>
          <span>{success}</span>
        </div>
      )}

      {/* VIEW MODE 1: ACTIVE JURISDICTION QUEUE */}
      {viewMode === "queue" && (
        <>
          {activeQueueCases.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-stone-250 rounded-3xl bg-white text-stone-400 max-w-lg mx-auto min-h-[240px] flex flex-col items-center justify-center shadow-sm">
              <span className="text-3xl mb-3">📋</span>
              <p className="text-xs font-black uppercase text-stone-800">{translate("no_cases_queue", lang)}</p>
              <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-wider font-bold">
                All cases in {vetRegion} matching current status filters are cleared.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeQueueCases.map((c) => {
                const dateStr = formatDate(c.createdAt);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleOpenAssessment(c)}
                    className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 cursor-pointer flex flex-col justify-between group glass-card glass-card-hover"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4 border-b border-stone-150 pb-3">
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
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${
                              c.status === "PENDING"
                                ? "bg-stone-50 text-stone-550 border-stone-200"
                                : c.status === "AI_ANALYZED"
                                ? "bg-blue-50 text-blue-800 border-blue-200/50"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {c.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl mb-4 shadow-inner">
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                          {translate("symptoms", lang)}
                        </span>
                        <p className="text-stone-700 text-xs font-bold leading-relaxed line-clamp-2 italic">
                          &ldquo;<TranslatedText text={c.symptoms} lang={lang} />&rdquo;
                        </p>
                      </div>

                      <div className="space-y-2 text-[10px] font-bold text-stone-500 pt-3 border-t border-stone-100">
                        <div className="flex justify-between items-center gap-4 border-b border-stone-50 pb-1.5">
                          <span className="shrink-0 text-stone-400 uppercase text-[8px] tracking-widest">
                            {translate("farmer_name", lang)}
                          </span>
                          <span className="font-extrabold text-stone-800 text-right truncate max-w-[70%]">
                            {c.farmer.name} ({c.farmer.phone})
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-4 border-b border-stone-50 pb-1.5">
                          <span className="shrink-0 text-stone-400 uppercase text-[8px] tracking-widest">
                            {translate("species", lang)}
                          </span>
                          <span className="font-extrabold text-stone-850 text-right">
                            {c.species} ({c.affectedCount} headcount)
                          </span>
                        </div>
                        <div className="flex justify-between items-start gap-4 border-b border-stone-50 pb-1.5">
                          <span className="shrink-0 text-stone-400 uppercase text-[8px] tracking-widest">
                            {translate("location", lang)}
                          </span>
                          <span className="font-extrabold text-stone-800 text-right break-words max-w-[70%]">
                            <TranslatedText text={c.location || c.farmer.district} lang={lang} />
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="shrink-0 text-stone-400 uppercase text-[8px] tracking-widest">
                            {translate("reported_on", lang)}
                          </span>
                          <span className="text-right text-stone-800 font-bold">{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3.5 flex justify-between items-center text-[10px] font-black text-emerald-700 border-t border-stone-150 group-hover:text-emerald-500 transition duration-300 uppercase tracking-wider">
                      <span>
                        {c.status === "VET_ASSESSED"
                          ? translate("view_details", lang)
                          : translate("diagnose_prescribe", lang)}
                      </span>
                      <span>&rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: PAST CLINICAL ASSESSED CASES */}
      {viewMode === "history" && (
        <>
          {pastAssessedCases.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-stone-250 rounded-3xl bg-white text-stone-400 max-w-lg mx-auto min-h-[240px] flex flex-col items-center justify-center shadow-sm">
              <span className="text-3xl mb-3">🩺</span>
              <p className="text-xs font-black uppercase text-stone-800">{translate("no_past_cases", lang)}</p>
              <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-wider font-bold">
                Clinical assessments logged by you will appear here for long-term audit and prescription tracking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastAssessedCases.map((c) => {
                const latestAssessment = c.vetAssessments[0];
                const dateStr = formatDate(latestAssessment?.assessedAt || c.createdAt);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleOpenAssessment(c)}
                    className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 cursor-pointer flex flex-col justify-between group glass-card glass-card-hover"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4 border-b border-stone-150 pb-3">
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
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider bg-emerald-50 text-emerald-800 border-emerald-200">
                            ASSESSED
                          </span>
                        </div>
                      </div>

                      {/* Diagnosis & Severity */}
                      {latestAssessment && (
                        <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl mb-4 space-y-2 shadow-inner">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                              {translate("clinical_diagnosis", lang)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getUrgencyBadge(
                                latestAssessment.severity
                              )}`}
                            >
                              {latestAssessment.severity}
                            </span>
                          </div>
                          <p className="text-xs font-black text-emerald-800 uppercase">
                            <TranslatedText text={latestAssessment.diagnosis} lang={lang} />
                          </p>
                          <div className="pt-2 border-t border-stone-200/80">
                            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-0.5">
                              {translate("treatment_plan", lang)}
                            </span>
                            <p className="text-stone-700 text-xs font-bold leading-relaxed line-clamp-2 italic">
                              &ldquo;<TranslatedText text={latestAssessment.treatmentPlan} lang={lang} />&rdquo;
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 text-[10px] font-bold text-stone-500 pt-3 border-t border-stone-100">
                        <div className="flex justify-between items-center gap-4">
                          <span className="shrink-0 text-stone-400 uppercase text-[8px] tracking-widest">
                            {translate("farmer_name", lang)}
                          </span>
                          <span className="font-extrabold text-stone-800 truncate">{c.farmer.name}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="shrink-0 text-stone-400 uppercase text-[8px] tracking-widest">
                            Assessed Date
                          </span>
                          <span className="text-right text-stone-800 font-bold">{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3.5 flex justify-between items-center text-[10px] font-black text-emerald-700 border-t border-stone-150 group-hover:text-emerald-500 transition duration-300 uppercase tracking-wider">
                      <span>{translate("view_details", lang)}</span>
                      <span>&rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 3: REGIONAL JURISDICTION DISEASE MAP */}
      {viewMode === "map" && (
        <div className="animate-fadeIn">
          <VetJurisdictionMap vetRegion={vetRegion} cases={cases} vetName={cleanDocName} />
        </div>
      )}

      {/* DOCTOR PROFILE & CLINIC SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 font-black text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 border-b border-stone-150 pb-5">
              <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                🩺
              </div>
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">{cleanDocName}</h2>
                <p className="text-xs text-emerald-800 font-black uppercase tracking-wider mt-0.5">
                  Veterinary Medical Officer
                </p>
                <p className="text-[10px] text-stone-450 font-bold">{vetEmail}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold">
              {/* Duty Status Indicator */}
              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-0.5">
                    {translate("duty_status", lang)}
                  </span>
                  <span className="text-stone-850 font-extrabold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    {dutyStatus === "ON_DUTY" ? translate("on_duty", lang) : "Emergency Call Out"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDutyStatus(dutyStatus === "ON_DUTY" ? "ON_CALL" : "ON_DUTY")}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Toggle
                </button>
              </div>

              {/* Jurisdiction & Coverage Details */}
              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-3">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block border-b border-stone-200 pb-1.5">
                  {translate("clinic_coverage", lang)}
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 uppercase text-[10px] tracking-wider">Assigned Region</span>
                  <span className="font-black text-stone-900 bg-white border border-stone-200 px-3 py-1 rounded-xl font-mono text-xs">
                    {vetRegion}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 uppercase text-[10px] tracking-wider">Response Radius</span>
                  <span className="font-black text-stone-800">30 KM Coverage Area</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 uppercase text-[10px] tracking-wider">AP Animal Husbandry ID</span>
                  <span className="font-mono text-stone-800">VET-OFFICER-AP</span>
                </div>
              </div>

              {/* Language Selection */}
              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">
                  Portal Display Language
                </span>
                <LanguageSelector currentLang={lang} />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-3.5 rounded-2xl font-black bg-stone-900 hover:bg-stone-950 text-white transition text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSESSMENT INPUT / CASE DETAILS MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50/50 sticky top-0 bg-white z-10">
              <div>
                <span className="font-mono text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-0.5">
                  {translate("case_details", lang)}
                </span>
                <h2 className="font-black text-lg text-stone-900 flex items-center gap-2">
                  <span>{selectedCase.caseId}</span>
                  <span className="text-xs font-bold text-stone-500">
                    ({getSpeciesEmoji(selectedCase.species)} {selectedCase.species})
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-xl px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Section 1: Farmer & Location details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200/80 rounded-2xl text-xs font-bold">
                <div>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-0.5">
                    {translate("farmer_name", lang)}
                  </span>
                  <span className="text-stone-900 font-extrabold">{selectedCase.farmer.name}</span>
                  <span className="text-[10px] text-stone-500 block font-semibold">{selectedCase.farmer.phone}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block mb-0.5">
                    {translate("location", lang)}
                  </span>
                  <span className="text-stone-850">
                    <TranslatedText text={selectedCase.location || selectedCase.farmer.district} lang={lang} />
                  </span>
                </div>
              </div>

              {/* Section 2: Symptoms & Media */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-850 border-b border-stone-150 pb-2">
                  {translate("reported_symptoms_media", lang)}
                </h3>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold leading-relaxed italic text-stone-700 border-l-4 border-l-emerald-600 shadow-inner">
                  &ldquo;<TranslatedText text={selectedCase.symptoms} lang={lang} />&rdquo;
                </div>

                {selectedCase.images && selectedCase.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {selectedCase.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square border border-stone-200 rounded-2xl overflow-hidden block hover:opacity-90"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="Attach" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: AI Triage Decision Support */}
              {selectedCase.aIAnalysis ? (
                <div className="space-y-4 bg-emerald-50/60 border border-emerald-200/60 p-5 rounded-3xl shadow-sm">
                  <div className="flex justify-between items-center mb-1 border-b border-emerald-200/50 pb-2">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                      {translate("ai_status", lang)}
                    </span>
                    <span className="text-[8px] bg-emerald-700 text-white border border-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                      PRELIMINARY SUPPORT
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedCase.aIAnalysis.predictedDiseases.map((pred, i) => {
                      const confPct = Math.round(
                        Number(pred.confidence) > 1 ? Number(pred.confidence) : Number(pred.confidence) * 100
                      );
                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center border-b border-emerald-200/40 pb-2.5 last:border-0 last:pb-0 text-xs"
                        >
                          <div>
                            <div className="font-black text-stone-850">
                              <TranslatedText text={pred.disease} lang={lang} />
                            </div>
                            <div className="text-[8px] text-stone-450 mt-0.5 uppercase font-black tracking-widest">
                              {translate("triage_urgency", lang)}:{" "}
                              <span className="font-extrabold text-emerald-700">
                                {translate("urgency_" + pred.urgency.toLowerCase(), lang)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-800 text-sm">{confPct}%</span>
                            <span className="text-[9px] text-stone-400 block uppercase font-bold">confidence</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-emerald-800 bg-white/90 border border-emerald-200/50 p-3.5 rounded-2xl italic leading-relaxed font-bold shadow-sm">
                    <strong>Disclaimer:</strong>{" "}
                    <TranslatedText text={selectedCase.aIAnalysis.disclaimer} lang={lang} />
                  </div>
                </div>
              ) : null}

              {/* Section 4: Clinical Assessment Form */}
              <form onSubmit={handleSubmitAssessment} className="space-y-4 pt-4 border-t border-stone-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-850 border-b border-stone-150 pb-2">
                  {translate("diagnose_prescribe", lang)}
                </h3>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1.5">
                    {translate("clinical_diagnosis", lang)}
                  </label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder={translate("diagnosis_placeholder", lang)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 text-xs font-bold transition shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1.5">
                      {translate("clinical_severity", lang)}
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 text-xs font-bold transition shadow-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Preset Medicines Catalog */}
                <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200 shadow-inner">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500">
                    💊 Quick-Add Common Livestock Prescriptions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {VET_MEDICINES.map((med, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddMedicine(med)}
                        className="px-3 py-1.5 bg-white border border-stone-250 hover:border-emerald-500 text-stone-700 hover:text-emerald-800 text-[10px] font-extrabold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1 hover:bg-emerald-50/50"
                      >
                        <span>+</span>
                        <span>{med.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1.5">
                    {translate("treatment_plan", lang)}
                  </label>
                  <textarea
                    required
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder={translate("treatment_placeholder", lang)}
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-850 text-xs font-semibold leading-relaxed transition shadow-sm"
                  />
                </div>

                {/* Field Visit Dispatch & Scheduling (Editable for both new and assessed cases) */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="fieldVisitCheck"
                        checked={fieldVisitRequired}
                        onChange={(e) => setFieldVisitRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="fieldVisitCheck" className="text-xs font-black uppercase text-stone-850 cursor-pointer">
                        Dispatch / Schedule Farm Visit (Field Visit)
                      </label>
                    </div>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded uppercase">
                      Doctor On-Site
                    </span>
                  </div>

                  {fieldVisitRequired && (
                    <div className="space-y-3 pt-2 border-t border-emerald-200/60 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-stone-500 mb-1">
                            Scheduled Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={fieldVisitDate}
                            onChange={(e) => setFieldVisitDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-stone-500 mb-1">
                            Dispatch Priority
                          </label>
                          <select
                            value={fieldVisitPriority}
                            onChange={(e) => setFieldVisitPriority(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800"
                          >
                            <option value="EMERGENCY_DISPATCH">🚨 Emergency Dispatch</option>
                            <option value="STANDARD_INSPECTION">📋 Standard Farm Visit</option>
                            <option value="QUARANTINE_INSPECTION">🛡️ Quarantine Verification</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase text-stone-500 mb-1">
                          Visit Purpose & On-Site Equipment Needed
                        </label>
                        <input
                          type="text"
                          value={fieldVisitPurpose}
                          onChange={(e) => setFieldVisitPurpose(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1.5">
                    {translate("additional_notes", lang)}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={translate("notes_placeholder", lang)}
                    rows={2}
                    className="w-full px-4 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-850 text-xs font-semibold leading-relaxed transition shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 disabled:opacity-40 cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/15 mt-4"
                >
                  {loading
                    ? "Updating Assessment & Schedule..."
                    : selectedCase.status === "VET_ASSESSED"
                    ? "Save & Adjust Field Visit Schedule 🗓️"
                    : translate("commit_assessment_log", lang)}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
