"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AndhraPradeshMap from "@/components/AndhraPradeshMap";

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
  { label: "Mouth Blisters / Sores", keywords: "blisters on tongue, blisters in mouth" },
  { label: "Limping / Leg Pain", keywords: "limping, foot pain, hoof sores" },
  { label: "High Fever", keywords: "high fever, warm body" },
  { label: "Drooling / Excess Saliva", keywords: "salivating heavily, drooling" },
  { label: "Coughing / Wheezing", keywords: "coughing, hard breathing" },
  { label: "Skin Lumps / Bumps", keywords: "skin lumps, nodules" },
  { label: "Loss of Appetite / Not Eating", keywords: "refuses to eat, loss of appetite" },
  { label: "Weakness / Low Milk", keywords: "weakness, low milk production" },
];

interface CaseWizardProps {
  userId: string;
}

export default function CaseWizard({ userId }: CaseWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [symptoms, setSymptoms] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [symptomStartDate, setSymptomStartDate] = useState("");
  const [location, setLocation] = useState("");
  const [species, setSpecies] = useState("Cattle");
  const [affectedCount, setAffectedCount] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleToggleTag = (label: string, keywords: string) => {
    setSelectedTags((prev) => {
      const isSelected = prev.includes(label);
      const nextTags = isSelected ? prev.filter((t) => t !== label) : [...prev, label];

      if (nextTags.length === 0) {
        setSymptoms("");
      } else {
        const descriptions = nextTags.map((tag) => {
          const item = COMMON_SYMPTOMS.find((s) => s.label === tag);
          return item ? item.keywords : "";
        });
        setSymptoms(`Animal is showing symptoms: ${descriptions.join(", ")}.`);
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

      // 1. Get signed upload URL from native Next.js API
      const signedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
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

      // 2. Put file directly to Supabase Storage signed upload URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
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
      // 1. Upload files first (if any)
      const imageUrls = await handleUploadFiles();

      // 2. Create the Health Case
      const caseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/cases`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": userId
        },
        credentials: "include",
        body: JSON.stringify({
          symptoms,
          symptomStartDate: symptomStartDate ? new Date(symptomStartDate) : undefined,
          location: location || undefined,
          images: imageUrls,
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
        headers: {
          "X-User-Id": userId
        },
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

      setStep(4); // Advance to final success step
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
      {/* Step Indicators */}
      {step < 4 && (
        <div className="mb-10 flex justify-between items-center max-w-md mx-auto relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition duration-300 ${
                step >= s
                  ? "bg-indigo-655 text-white shadow-sm"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {uploadProgress && (
        <div className="mb-6 p-4 rounded-lg border border-indigo-150 bg-indigo-50/50 text-indigo-700 text-sm flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          {uploadProgress}
        </div>
      )}

      <div className="p-6 md:p-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Describe the Symptoms
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Explain what symptoms or abnormal behaviors you notice in your livestock.
            </p>

            <div className="space-y-6">
              {/* Tap-to-select symptom tags checklist for easy descriptions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Select Symptoms (Tap all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOMS.map((item) => {
                    const isSelected = selectedTags.includes(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleToggleTag(item.label, item.keywords)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-sm font-bold"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Detailed Symptoms
                </label>
                <textarea
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="The checklist above will fill this box. You can also write here directly if you want."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  Please tap at least one symptom or write a description.
                </span>
              </div>

              {/* Type of Animal and Affected Headcount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Type of Animal
                  </label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm font-medium"
                  >
                    <option value="Cattle">Cattle (Cow/Bull/Calf)</option>
                    <option value="Buffalo">Buffalo</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Poultry">Poultry (Chicken/Duck)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Number of Sick Animals
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={affectedCount}
                    onChange={(e) => setAffectedCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={symptoms.length < 10}
                onClick={() => setStep(2)}
                className="w-full px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Location & Start Date
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              When did the symptoms begin, and where is the animal located?
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Symptom Start Date
                </label>
                <input
                  type="date"
                  required
                  value={symptomStartDate}
                  onChange={(e) => setSymptomStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Farm Location & Landmark Selector
                </label>
                <AndhraPradeshMap
                  initialRegion=""
                  initialAddress={location}
                  onLocationSelected={({ region, address: fullAddr }) => {
                    setLocation(fullAddr);
                  }}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!symptomStartDate || !location}
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Attach Photos or Audio
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Upload photos of lesions/symptoms or audio files of animal breathing/coughs for AI triage support.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 hover:border-indigo-500/50 transition duration-300 relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-sm font-semibold text-slate-700">
                  Select symptom media
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports images and audio files
                </p>
              </div>

              {/* Uploaded Files list */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border border-slate-100 bg-white rounded-lg text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-md">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700 font-semibold px-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Submitting Case..." : "Report Case"}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 4 && reportedCase && (
          <div className="text-center py-6">
            <h2 className="text-2xl font-extrabold text-slate-800">
              Case Reported Successfully
            </h2>
            <div className="mt-2 text-sm text-slate-500 font-mono">
              CASE ID: {reportedCase.caseId}
            </div>

            {/* AI Preliminary Triage Card */}
            {aiAnalysis ? (
              <div className="mt-8 p-6 rounded-xl border border-indigo-100 bg-slate-50 text-left max-w-xl mx-auto shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    AI Preliminary Triage Results
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-750 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                    PRELIMINARY
                  </span>
                </div>

                <div className="space-y-4">
                  {aiAnalysis.predictedDiseases.map((pred, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {pred.disease}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Triage Urgency: <span className="font-semibold text-indigo-650">{pred.urgency}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-slate-800">
                          {Math.round(pred.confidence * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">confidence</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Medical Disclaimer Constraint */}
                <div className="mt-6 p-3 bg-amber-50 border border-amber-250/50 rounded-lg text-[11px] text-amber-800 leading-relaxed italic">
                  <strong>Disclaimer:</strong> {aiAnalysis.disclaimer}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-400">
                AI Preliminary analysis was triggered in the background. Vets will review details.
              </p>
            )}

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/farmer/cases")}
                className="px-6 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 transition cursor-pointer"
              >
                View My Cases
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
                className="px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
              >
                Report Another Case
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
