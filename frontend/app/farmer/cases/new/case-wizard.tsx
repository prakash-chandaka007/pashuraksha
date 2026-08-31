"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AndhraPradeshMap from "@/components/AndhraPradeshMap";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import { translateText, formatTranslatableField } from "@/lib/services/translation";
import TranslatedText from "@/components/TranslatedText";

interface AIDisease {
  disease: string;
  confidence: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface AIAnalysisResult {
  id: string;
  isPreliminaryOnly: boolean;
  disclaimer: string;
  predictedDiseases: AIDisease[];
}

const COMMON_SYMPTOMS = [
  { key: "tag_mouth_blisters", defaultLabel: "Mouth Blisters / Sores", keywords: "blisters on tongue, blisters in mouth" },
  { key: "tag_limping", defaultLabel: "Limping / Leg Pain", keywords: "limping, foot pain, hoof sores" },
  { key: "tag_high_fever", defaultLabel: "High Fever", keywords: "high fever, warm body" },
  { key: "tag_drooling", defaultLabel: "Drooling / Excess Saliva", keywords: "salivating heavily, drooling" },
  { key: "tag_coughing", defaultLabel: "Coughing / Wheezing", keywords: "coughing, hard breathing" },
  { key: "tag_skin_lumps", defaultLabel: "Skin Lumps / Bumps", keywords: "skin lumps, nodules" },
  { key: "tag_loss_appetite", defaultLabel: "Loss of Appetite / Not Eating", keywords: "refuses to eat, loss of appetite" },
  { key: "tag_weakness", defaultLabel: "Weakness / Low Milk", keywords: "weakness, low milk production" },
];

interface CaseWizardProps {
  userId: string;
}

export default function CaseWizard({ userId }: CaseWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Localization state
  const [lang, setLang] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )pashuraksha_lang=([^;]*)/);
    if (match && match[1]) {
      setLang(match[1] as SupportedLanguage);
    }
  }, []);

  // Form Fields State
  const [symptoms, setSymptoms] = useState("");
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([]);
  const [symptomStartDate, setSymptomStartDate] = useState("");
  const [location, setLocation] = useState("");
  const [species, setSpecies] = useState("Cattle");
  const [affectedCount, setAffectedCount] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleToggleTag = (tagKey: string, defaultLabel: string, keywords: string) => {
    setSelectedTagKeys((prev) => {
      const isSelected = prev.includes(tagKey);
      const nextTags = isSelected ? prev.filter((k) => k !== tagKey) : [...prev, tagKey];

      if (nextTags.length === 0) {
        setSymptoms("");
      } else {
        const descriptions = nextTags.map((key) => translate(key, lang));
        const prefix = translate("symptom_prefix", lang);
        setSymptoms(`${prefix} ${descriptions.join(", ")}.`);
      }
      return nextTags;
    });
  };

  // Success Triage Results
  const [reportedCase, setReportedCase] = useState<{ id: string; caseId: string } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);

      const signedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });

      if (!signedRes.ok) {
        let errMsg = `Failed to request upload signature for ${file.name}`;
        try {
          const errJSON = await signedRes.json();
          errMsg = errJSON.error || errMsg;
        } catch {}
        throw new Error(`${errMsg} (Status ${signedRes.status})`);
      }

      let signatureData;
      try {
        signatureData = await signedRes.json();
      } catch {
        throw new Error(`Failed to parse upload signature details (Status ${signedRes.status})`);
      }

      const { uploadUrl, fileUrl } = signatureData;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload ${file.name} to storage bucket (Status ${uploadRes.status}).`);
      }

      uploadedUrls.push(fileUrl);
    }

    setUploadProgress(null);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Upload files first
      const uploadedUrls = await handleUploadFiles();

      const imageUrls = files
        .map((f, idx) => (!f.type.startsWith("audio/") ? uploadedUrls[idx] : null))
        .filter(Boolean) as string[];

      const audioUrl = files
        .map((f, idx) => (f.type.startsWith("audio/") ? uploadedUrls[idx] : null))
        .filter(Boolean)[0] || null;

      // Translate symptoms to English first if the lang is not English
      let englishSymptoms = symptoms;
      if (lang !== "en") {
        setUploadProgress("Translating symptoms description to English...");
        englishSymptoms = await translateText(symptoms, lang, "en");
      }

      // Translate location details if not English
      let englishLocation = location;
      if (location && lang !== "en") {
        setUploadProgress("Translating location details to English...");
        englishLocation = await translateText(location, lang, "en");
      }

      // 2. Create the Health Case with clean English data for AI pipeline
      setUploadProgress("Submitting clinical health report...");
      const caseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/cases`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": userId
        },
        credentials: "include",
        body: JSON.stringify({
          symptoms: englishSymptoms || symptoms,
          symptomStartDate: symptomStartDate ? new Date(symptomStartDate) : undefined,
          location: englishLocation || location || undefined,
          images: imageUrls,
          audio: audioUrl,
          species,
          affectedCount: Number(affectedCount),
        }),
      });

      if (!caseRes.ok) {
        let errMsg = "Failed to submit case.";
        try {
          const errJSON = await caseRes.json();
          errMsg = errJSON.error || errMsg;
        } catch {}
        throw new Error(`${errMsg} (Status ${caseRes.status})`);
      }

      let caseData;
      try {
        caseData = await caseRes.json();
      } catch {
        throw new Error(`Failed to parse case response data (Status ${caseRes.status})`);
      }

      const createdCase = caseData.case;
      setReportedCase(createdCase);

      // 3. Trigger AI Triage Analysis in background
      setUploadProgress("Running preliminary AI triage classifier...");
      const aiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/cases/${createdCase.id}/ai-analysis`, {
        method: "POST",
        headers: { "X-User-Id": userId },
        credentials: "include",
      });

      if (!aiRes.ok) {
        let errMsg = "Failed to run AI triage.";
        try {
          const errJSON = await aiRes.json();
          errMsg = errJSON.error || errMsg;
        } catch {}
        throw new Error(`${errMsg} (Status ${aiRes.status})`);
      }

      let aiData;
      try {
        aiData = await aiRes.json();
      } catch {
        throw new Error(`Failed to parse AI response (Status ${aiRes.status})`);
      }

      setAiAnalysis(aiData.analysis);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 font-sans">
      {/* Step Indicators */}
      {step < 4 && (
        <div className="mb-10 flex justify-between items-center max-w-md mx-auto relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-200 -translate-y-1/2 z-0 rounded-full" />
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                step >= s
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 scale-105"
                  : "bg-white text-stone-400 border-2 border-stone-250"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs font-bold flex gap-2 shadow-sm">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {uploadProgress && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-sm backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          {uploadProgress}
        </div>
      )}

      <div className="p-6 md:p-10 rounded-3xl border border-stone-200/80 bg-white/90 shadow-xl shadow-stone-900/5 backdrop-blur-md">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-black tracking-tight text-stone-900 mb-2">
              1. {translate("symptoms", lang)}
            </h2>
            <p className="text-xs text-stone-500 mb-6 font-bold tracking-wide uppercase leading-relaxed">
              {translate("explain_symptoms_help", lang)}
            </p>

            <div className="space-y-6">
              {/* Tap symptom tags checklist */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-3 border-b border-stone-150 pb-2">
                  {translate("select_symptoms_tap", lang)}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COMMON_SYMPTOMS.map((item) => {
                    const isSelected = selectedTagKeys.includes(item.key);
                    const labelText = translate(item.key, lang);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleToggleTag(item.key, item.defaultLabel, item.keywords)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 scale-[1.02]"
                            : "bg-stone-50/80 text-stone-700 border-stone-250 hover:bg-emerald-50/60 hover:border-emerald-300 hover:text-emerald-800"
                        }`}
                      >
                        {labelText}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                  {translate("symptoms", lang)}
                </label>
                <textarea
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={translate("symptoms_placeholder", lang)}
                  rows={4}
                  className="w-full px-4 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 transition text-xs font-semibold leading-relaxed shadow-inner"
                />
                <span className="text-[10px] text-stone-400 mt-2 block font-bold uppercase tracking-wider">
                  {translate("symptoms_min_help", lang)}
                </span>
              </div>

              {/* Animal species and affected count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-150 pt-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                    {translate("species", lang)}
                  </label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 transition text-xs font-bold shadow-sm"
                  >
                    <option value="Cattle">{translate("species_cattle", lang)}</option>
                    <option value="Buffalo">{translate("species_buffalo", lang)}</option>
                    <option value="Sheep">{translate("species_sheep", lang)}</option>
                    <option value="Goat">{translate("species_goat", lang)}</option>
                    <option value="Poultry">{translate("species_poultry", lang)}</option>
                    <option value="Other">{translate("species_other", lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                    {translate("sick_count", lang)}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={affectedCount}
                    onChange={(e) => setAffectedCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 transition text-xs font-bold shadow-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={symptoms.length < 5}
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 disabled:opacity-40 active:scale-[0.99] cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/15"
              >
                {translate("continue", lang)} &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-black tracking-tight text-stone-900 mb-2">
              2. {translate("farm_location", lang)}
            </h2>
            <p className="text-xs text-stone-500 mb-6 font-bold tracking-wide uppercase leading-relaxed">
              {translate("onset_location_sub", lang)}
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                  {translate("onset_date", lang)}
                </label>
                <input
                  type="date"
                  required
                  value={symptomStartDate}
                  onChange={(e) => setSymptomStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-stone-800 transition text-xs font-bold shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                  {translate("farm_location", lang)}
                </label>
                <div className="border border-stone-200 rounded-3xl overflow-hidden p-2 bg-stone-50 shadow-inner">
                  <AndhraPradeshMap
                    initialRegion=""
                    initialAddress={location}
                    onLocationSelected={({ region, address: fullAddr }) => {
                      setLocation(fullAddr);
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-4 border-t border-stone-150 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-2xl border border-stone-300 hover:bg-stone-50 font-bold text-stone-600 transition cursor-pointer text-xs uppercase tracking-wider"
                >
                  &larr; {translate("back", lang)}
                </button>
                <button
                  type="button"
                  disabled={!symptomStartDate || !location}
                  onClick={() => setStep(3)}
                  className="flex-1 py-3.5 rounded-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 disabled:opacity-40 cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/15"
                >
                  {translate("continue", lang)} &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-black tracking-tight text-stone-900 mb-2">
              {translate("step_media_title", lang)}
            </h2>
            <p className="text-xs text-stone-500 mb-6 font-bold tracking-wide uppercase leading-relaxed">
              {translate("step_media_sub", lang)}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-10 border-2 border-dashed border-stone-300 rounded-3xl text-center bg-stone-50/80 hover:border-emerald-500/60 hover:bg-emerald-50/20 transition duration-300 relative group cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-3xl block mb-2 group-hover:scale-110 transition duration-300">📸</span>
                <p className="text-xs font-black uppercase tracking-widest text-stone-800">
                  {translate("select_media", lang)}
                </p>
                <p className="text-[10px] text-stone-450 mt-1 uppercase font-bold tracking-wider">
                  {translate("supports_media", lang)}
                </p>
              </div>

              {/* Uploaded Files list */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-2xl border border-stone-200">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-stone-200 bg-white rounded-xl text-xs font-bold shadow-sm">
                      <span className="text-stone-700 truncate max-w-md flex items-center gap-2">
                        <span>{file.type.startsWith("audio/") ? "🔊" : "🖼️"}</span>
                        <span>{file.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-600 hover:text-red-800 font-extrabold px-2 cursor-pointer uppercase text-[9px] tracking-wider"
                      >
                        {translate("clear", lang)}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 border-t border-stone-150 pt-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 rounded-2xl border border-stone-300 hover:bg-stone-50 font-bold text-stone-600 transition cursor-pointer text-xs uppercase tracking-wider"
                >
                  &larr; {translate("back", lang)}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 disabled:opacity-40 cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/15"
                >
                  {loading ? "Submitting..." : translate("report_issue", lang)}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 4 && reportedCase && (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full mx-auto flex items-center justify-center mb-6 shadow-md shadow-emerald-900/10">
              <span className="text-3xl text-emerald-600">🛡️</span>
            </div>
            <h2 className="text-2xl font-black text-emerald-700 uppercase tracking-wider leading-tight">
              {translate("case_reported", lang)}
            </h2>
            <div className="mt-4 text-xs font-mono font-black text-stone-700 bg-stone-100 border border-stone-200 py-2.5 px-5 rounded-2xl inline-block shadow-inner">
              CASE ID: {reportedCase.caseId}
            </div>

            {/* AI Preliminary Triage Card */}
            {aiAnalysis ? (
              <div className="mt-8 p-6 rounded-3xl border border-stone-200 bg-stone-50/80 text-left max-w-xl mx-auto shadow-sm backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4 border-b border-stone-200 pb-3">
                  <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    {translate("ai_status", lang)}
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                    PRELIMINARY
                  </span>
                </div>

                <div className="space-y-4">
                  {aiAnalysis.predictedDiseases.map((pred, index) => {
                    const confPct = Math.round(Number(pred.confidence) > 1 ? Number(pred.confidence) : Number(pred.confidence) * 100);
                    return (
                      <div key={index} className="flex justify-between items-center border-b border-stone-150 pb-3 last:border-0 last:pb-0">
                        <div>
                          <div className="text-xs font-black text-stone-850">
                            <TranslatedText text={pred.disease} lang={lang} />
                          </div>
                          <div className="text-[9px] text-stone-450 mt-0.5 font-bold uppercase tracking-wider">
                            {translate("triage_urgency", lang)}: <span className="font-extrabold text-emerald-700">{translate("urgency_" + pred.urgency.toLowerCase(), lang)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-stone-800">
                            {confPct}%
                          </span>
                          <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">confidence</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Medical Disclaimer Constraint */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200/60 rounded-2xl text-[11px] text-amber-800 leading-relaxed italic shadow-inner">
                  <strong>Disclaimer:</strong> <TranslatedText text={aiAnalysis.disclaimer} lang={lang} />
                </div>
              </div>
            ) : (
              <p className="mt-6 text-xs text-stone-400 font-bold uppercase tracking-wider">
                AI Preliminary analysis was triggered in the background. State veterinarians will review details.
              </p>
            )}

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/farmer/cases")}
                className="px-6 py-3.5 rounded-2xl border border-stone-300 hover:bg-stone-50 font-bold text-stone-600 transition cursor-pointer text-xs uppercase tracking-wider"
              >
                {translate("view_cases", lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSymptoms("");
                  setSymptomStartDate("");
                  setLocation("");
                  setFiles([]);
                  setReportedCase(null);
                  setAiAnalysis(null);
                }}
                className="px-6 py-3.5 rounded-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/15"
              >
                {translate("report_another", lang)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
