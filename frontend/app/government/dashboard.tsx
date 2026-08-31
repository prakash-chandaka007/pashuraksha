"use client";

import { useState } from "react";

interface SurveillanceSummary {
  totalCases: number;
  statusGroups: Record<string, number>;
  districtGroups: Record<string, number>;
  speciesEstimates: {
    Cattle: number;
    Buffalo: number;
    Sheep: number;
    Goat: number;
    Poultry: number;
    Other: number;
  };
}

interface DiseaseAlert {
  id: string;
  district: string;
  type: "POTENTIAL_CLUSTER" | "HIGH_RISK_AREA" | "CONFIRMED_CASE" | "SUSPECTED_CASE";
  message: string;
  timestamp: Date | string;
}

interface GovernmentDashboardProps {
  metrics: SurveillanceSummary;
  alerts: DiseaseAlert[];
}

export default function GovernmentDashboard({ metrics, alerts }: GovernmentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"surveillance" | "alerts">("surveillance");

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Government Command Center
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          National Livestock Disease Surveillance, Area Density Clusters, and Clinical Alert Monitoring.
        </p>
      </div>

      {/* Tabs Control */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 flex gap-6">
        <button
          onClick={() => setActiveTab("surveillance")}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === "surveillance"
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Surveillance Statistics
          {activeTab === "surveillance" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === "alerts"
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Outbreak Alerts
          <span className="ml-2 px-2 py-0.5 bg-red-150 text-red-700 dark:bg-red-950/20 dark:text-red-400 text-[10px] rounded-full font-extrabold">
            {alerts.filter((a) => a.type === "POTENTIAL_CLUSTER" || a.type === "HIGH_RISK_AREA").length} Active
          </span>
          {activeTab === "alerts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
          )}
        </button>
      </div>

      {activeTab === "surveillance" ? (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Total Reported Cases
              </h3>
              <div className="text-4xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                {metrics.totalCases}
              </div>
              <p className="text-[10px] text-slate-450 mt-1">
                Active cases recorded across all districts
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Clinically Confirmed Cases
              </h3>
              <div className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {metrics.statusGroups.VET_ASSESSED || 0}
              </div>
              <p className="text-[10px] text-slate-450 mt-1">
                Verified by certified veterinarians
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Symptomatic Suspicion Queue
              </h3>
              <div className="text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                {(metrics.statusGroups.PENDING || 0) + (metrics.statusGroups.AI_ANALYZED || 0)}
              </div>
              <p className="text-[10px] text-slate-450 mt-1">
                Awaiting final clinical diagnosis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Species affected estimates breakdown */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6">
                Species Symptom Incidence (Estimated)
              </h3>
              <div className="space-y-4">
                {Object.entries(metrics.speciesEstimates).map(([species, count]) => {
                  const percentage = metrics.totalCases > 0 ? (count / metrics.totalCases) * 100 : 0;
                  return (
                    <div key={species} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-650 dark:text-slate-350">{species}</span>
                        <span className="font-bold">{count} cases ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="bg-indigo-650 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* District cases density breakdown */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6">
                Regional Case Density Breakdown
              </h3>
              {Object.keys(metrics.districtGroups).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No regional case reports recorded yet.
                </p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {Object.entries(metrics.districtGroups)
                    .sort((a, b) => b[1] - a[1])
                    .map(([district, count]) => {
                      const percentage = metrics.totalCases > 0 ? (count / metrics.totalCases) * 100 : 0;
                      return (
                        <div key={district} className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/80 pb-3">
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {district}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {Math.round(percentage)}% of nationwide reports
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                              {count}
                            </span>
                            <span className="text-[10px] text-slate-400 block">reports</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* AI Core & Active Learning Stats */}
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  AI Diagnostics & Active Learning Status
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Continuous Feedback Loop monitoring, Model Hot-Swapping, and Computer Vision diagnostics statistics.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-705 dark:bg-emerald-950/20 dark:text-emerald-405 text-xs font-bold rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Inference System Online
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Computer Vision Module
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  ResNet50 Fine-tuned
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatic skin lesions & blisters visual assessment enabled.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Audio Analysis Module
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Mel-Spectrogram Classifier
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Acoustic wheezing & respiratory cough triggers enabled.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Self-Upgrading Loop
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Active (Threshold: 3 Vets)
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Auto-retrains weights on verified clinical ground truth.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active alerts grid */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
              Disease Outbreak & Severity Alarms
            </h3>
            <p className="text-xs text-slate-450">
              Generated based on active case density thresholds (3+ reports in 30 days flags a Potential Cluster, 2+ confirmed cases flags a High-Risk Area).
            </p>
          </div>

          {alerts.length === 0 ? (
            <div className="p-12 border border-slate-200 rounded-xl bg-white shadow-sm text-center py-20 text-slate-400">
              <h3 className="text-lg font-bold text-slate-700">
                No Warnings
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                All regions are currently within normal baseline thresholds. No outbreak clusters or high-risk warnings detected.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                return (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-xl border flex items-start gap-4 transition duration-300 ${
                      alert.type === "HIGH_RISK_AREA"
                        ? "bg-red-50/50 border-red-200"
                        : alert.type === "POTENTIAL_CLUSTER"
                        ? "bg-amber-50/50 border-amber-200"
                        : alert.type === "CONFIRMED_CASE"
                        ? "bg-indigo-50/20 border-indigo-100"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            alert.type === "HIGH_RISK_AREA"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                              : alert.type === "POTENTIAL_CLUSTER"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                              : alert.type === "CONFIRMED_CASE"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {alert.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(alert.timestamp).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {alert.message}
                      </p>

                      <div className="text-xs text-slate-450 mt-1 font-semibold">
                        Region: {alert.district}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
