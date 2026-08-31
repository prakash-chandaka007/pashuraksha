"use client";

import { useState, useEffect } from "react";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import TranslatedText from "@/components/TranslatedText";
import GovOutbreakMap from "@/components/maps/GovOutbreakMap";
import GovAnalyticsMap from "@/components/maps/GovAnalyticsMap";

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
  const [activeTab, setActiveTab] = useState<"surveillance" | "alerts" | "map">("surveillance");
  const [mapSubTab, setMapSubTab] = useState<"outbreaks" | "analytics">("outbreaks");

  // Localization state
  const [lang, setLang] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )pashuraksha_lang=([^;]*)/);
    if (match && match[1]) {
      setLang(match[1] as SupportedLanguage);
    }
  }, []);

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

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case "HIGH_RISK_AREA":
        return "bg-rose-100 text-rose-900 border-rose-300 shadow-sm font-black";
      case "POTENTIAL_CLUSTER":
        return "bg-amber-100 text-amber-900 border-amber-300 shadow-sm font-black";
      case "CONFIRMED_CASE":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm font-black";
      default:
        return "bg-sky-100 text-sky-900 border-sky-300 shadow-sm font-black";
    }
  };

  const localCopy = {
    en: {
      active: "Active",
      stats: "Surveillance Stats",
      alerts: "Outbreak Alerts",
      resolution_rate: "Triage Resolution Rate",
      resolution_desc: "Reports clinically diagnosed by state veterinarians",
      pending_review: "Pending Review",
      pending_desc: "Cases waiting for vet clinical review",
      cases_desc: "Active cases recorded across all districts",
      alerts_title: "Active Surveillance Notifications",
      alerts_desc: "All regions are currently within normal baseline thresholds. No outbreak clusters detected.",
      region: "Jurisdiction Region",
      banner_badge: "State Epidemic Control Gateway",
      banner_desc: "Statewide Livestock Disease Surveillance, Real-Time Area Density Clusters, and Epidemiological Monitoring.",
      surv_center: "Surveillance Center",
      ap_dept: "Andhra Pradesh AH Dept",
      geo_maps: "Geographic Disease Maps",
      breakdown: "Breakdown",
      ranked: "Ranked",
      cases_word: "cases",
      of_state: "of state total",
      reports: "reports",
      no_regional: "No regional case data recorded yet.",
      active_feeds: "Active Feeds",
      no_alerts: "No Active Outbreak Alerts",
      timestamp: "Timestamp",
      outbreak_map: "Active Outbreaks Map",
      analytics_map: "Previous Analytics Map",
    },
    te: {
      active: "సక్రియ",
      stats: "నిఘా గణాంకాలు",
      alerts: "వ్యాప్తి హెచ్చరికలు",
      resolution_rate: "పరిష్కార రేటు",
      resolution_desc: "పశువైద్యులచే క్లినికల్‌గా నిర్ధారించబడిన నివేదికలు",
      pending_review: "సమీక్ష పెండింగ్",
      pending_desc: "పశువైద్యుల పరిశీలన కోసం వేచి ఉన్న కేసులు",
      cases_desc: "అన్ని జిల్లాల్లో నమోదైన క్రియాశీల కేసులు",
      alerts_title: "సక్రియ నిఘా నోటిఫికేషన్‌లు",
      alerts_desc: "అన్ని ప్రాంతాలు ప్రస్తుతం సాధారణ బేస్‌లైన్ పరిమితుల్లో ఉన్నాయి. ఎటువంటి వ్యాప్తి క్లస్టర్లు కనుగొనబడలేదు.",
      region: "పరిధి ప్రాంతం",
      banner_badge: "రాష్ట్ర అంటువ్యాధి నియంత్రణ గేట్‌వే",
      banner_desc: "రాష్ట్రవ్యాప్త పశువుల వ్యాధి నిఘా, నిజ-సమయ ప్రాంత సాంద్రత క్లస్టర్లు మరియు ఎపిడెమియోలాజికల్ పర్యవేక్షణ.",
      surv_center: "నిఘా కేంద్రం",
      ap_dept: "ఆంధ్రప్రదేశ్ AH విభాగం",
      geo_maps: "భౌగోళిక వ్యాధి మ్యాప్‌లు",
      breakdown: "విభజన",
      ranked: "ర్యాంక్‌డ్",
      cases_word: "కేసులు",
      of_state: "రాష్ట్ర మొత్తంలో",
      reports: "నివేదికలు",
      no_regional: "ఇంకా ప్రాంతీయ కేసుల డేటా నమోదు కాలేదు.",
      active_feeds: "సక్రియ ఫీడ్‌లు",
      no_alerts: "సక్రియ వ్యాప్తి హెచ్చరికలు లేవు",
      timestamp: "సమయ ముద్ర",
      outbreak_map: "సక్రియ వ్యాప్తుల మ్యాప్",
      analytics_map: "గత విశ్లేషణ మ్యాప్",
    },
    hi: {
      active: "सक्रिय",
      stats: "निगरानी आँकड़े",
      alerts: "प्रकोप अलर्ट",
      resolution_rate: "समाधान दर",
      resolution_desc: "पशु चिकित्सकों द्वारा चिकित्सकीय रूप से निदान की गई रिपोर्ट",
      pending_review: "समीक्षा लंबित",
      pending_desc: "पशु चिकित्सक नैदानिक समीक्षा की प्रतीक्षा कर रहे मामले",
      cases_desc: "सभी जिलों में दर्ज किए गए सक्रिय मामले",
      alerts_title: "सक्रिय निगरानी सूचनाएं",
      alerts_desc: "सभी क्षेत्र वर्तमान में सामान्य आधार रेखा सीमा के भीतर हैं। कोई प्रकोप क्लस्टर नहीं मिला।",
      region: "अधिकार क्षेत्र",
      banner_badge: "राज्य महामारी नियंत्रण गेटवे",
      banner_desc: "राज्यव्यापी पशुधन रोग निगरानी, वास्तविक समय क्षेत्र घनत्व क्लस्टर, और महामारी विज्ञान निगरानी।",
      surv_center: "निगरानी केंद्र",
      ap_dept: "आंध्र प्रदेश AH विभाग",
      geo_maps: "भौगोलिक रोग मानचित्र",
      breakdown: "विश्लेषण",
      ranked: "रैंकिंग",
      cases_word: "मामले",
      of_state: "राज्य कुल का",
      reports: "रिपोर्ट",
      no_regional: "अभी तक कोई क्षेत्रीय मामला डेटा दर्ज नहीं हुआ।",
      active_feeds: "सक्रिय फ़ीड",
      no_alerts: "कोई सक्रिय प्रकोप अलर्ट नहीं",
      timestamp: "समय-चिह्न",
      outbreak_map: "सक्रिय प्रकोप मानचित्र",
      analytics_map: "पिछला विश्लेषण मानचित्र",
    },
    ta: {
      active: "செயலில் உள்ளது",
      stats: "கண்காணிப்பு புள்ளிவிவரங்கள்",
      alerts: "பரவல் எச்சரிக்கைகள்",
      resolution_rate: "தீர்வு விகிதம்",
      resolution_desc: "கால்நடை மருத்துவர்களால் கண்டறியப்பட்ட அறிக்கைகள்",
      pending_review: "மதிப்பாய்வு நிலுவையில் உள்ளது",
      pending_desc: "மதிப்பாய்வுக்காக காத்திருக்கும் வழக்குகள்",
      cases_desc: "அனைத்து மாவட்டங்களிலும் பதிவு செய்யப்பட்ட வழக்குகள்",
      alerts_title: "செயலில் உள்ள கண்காணிப்பு அறிவிப்புகள்",
      alerts_desc: "அனைத்து பகுதிகளும் தற்போது இயல்பான வரம்பிற்குள் உள்ளன. பரவல் எச்சரிக்கைகள் எதுவும் இல்லை.",
      region: "அதிகார வரம்பு",
      banner_badge: "மாநில தொற்றுநோய் கட்டுப்பாட்டு நுழைவாயில்",
      banner_desc: "மாநிலம் முழுவதும் கால்நடை நோய் கண்காணிப்பு, நிகழ்நேர பகுதி அடர்த்தி, தொற்றுநோயியல் கண்காணிப்பு.",
      surv_center: "கண்காணிப்பு மையம்",
      ap_dept: "ஆந்திர பிரதேசம் AH துறை",
      geo_maps: "புவியியல் நோய் வரைபடங்கள்",
      breakdown: "பிரிவு",
      ranked: "தரவரிசை",
      cases_word: "வழக்குகள்",
      of_state: "மாநில மொத்தத்தில்",
      reports: "அறிக்கைகள்",
      no_regional: "இன்னும் பகுதி வழக்கு தரவு பதிவு செய்யப்படவில்லை.",
      active_feeds: "செயலில் உள்ள ஊட்டங்கள்",
      no_alerts: "செயலில் உள்ள பரவல் எச்சரிக்கைகள் இல்லை",
      timestamp: "நேர முத்திரை",
      outbreak_map: "செயலில் உள்ள பரவல் வரைபடம்",
      analytics_map: "முந்தைய பகுப்பாய்வு வரைபடம்",
    },
    kn: {
      active: "ಸಕ್ರಿಯ",
      stats: "ಕಣ್ಗಾವಲು ಅಂಕಿಅಂಶಗಳು",
      alerts: "ಸೋಂಕು ಹರಡುವಿಕೆ ಎಚ್ಚರಿಕೆಗಳು",
      resolution_rate: "ಪರಿಹಾರ ದರ",
      resolution_desc: "ಪಶುವೈದ್ಯರಿಂದ ವೈದ್ಯಕೀಯವಾಗಿ ಪತ್ತೆಹಚ್ಚಲಾದ ವರದಿಗಳು",
      pending_review: "ಪರಿಶೀಲನೆ ಬಾಕಿ",
      pending_desc: "ಪಶುವೈದ್ಯ ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆಗೆ ಕಾಯುತ್ತಿರುವ ಪ್ರಕರಣಗಳು",
      cases_desc: "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳಲ್ಲಿ ದಾಖಲಾದ ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು",
      alerts_title: "ಸಕ್ರಿಯ ಕಣ್ಗಾವಲು ಅಧಿಸೂಚನೆಗಳು",
      alerts_desc: "ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು ಪ್ರಸ್ತುತ ಸಾಮಾನ್ಯ ಮಿತಿಯಲ್ಲಿವೆ. ಯಾವುದೇ ಸೋಂಕು ಎಚ್ಚರಿಕೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
      region: "ಅಧಿಕಾರ ವ್ಯಾಪ್ತಿ",
      banner_badge: "ರಾಜ್ಯ ಸಾಂಕ್ರಾಮಿಕ ನಿಯಂತ್ರಣ ಗೇಟ್‌ವೇ",
      banner_desc: "ರಾಜ್ಯವ್ಯಾಪಿ ಜಾನುವಾರು ರೋಗ ಕಣ್ಗಾವಲು, ನೈಜ ಸಮಯ ಸಾಂದ್ರತೆ ಕ್ಲಸ್ಟರ್, ಸಾಂಕ್ರಾಮಿಕ ಕಣ್ಗಾವಲು.",
      surv_center: "ಕಣ್ಗಾವಲು ಕೇಂದ್ರ",
      ap_dept: "ಆಂಧ್ರ ಪ್ರದೇಶ AH ಇಲಾಖೆ",
      geo_maps: "ಭೌಗೋಳಿಕ ರೋಗ ನಕ್ಷೆಗಳು",
      breakdown: "ವಿಭಜನೆ",
      ranked: "ಶ್ರೇಣೀಕೃತ",
      cases_word: "ಪ್ರಕರಣಗಳು",
      of_state: "ರಾಜ್ಯ ಒಟ್ಟಿನಲ್ಲಿ",
      reports: "ವರದಿಗಳು",
      no_regional: "ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಾದೇಶಿಕ ಪ್ರಕರಣಗಳ ಡೇಟಾ ದಾಖಲಾಗಿಲ್ಲ.",
      active_feeds: "ಸಕ್ರಿಯ ಫೀಡ್‌ಗಳು",
      no_alerts: "ಸಕ್ರಿಯ ಸೋಂಕು ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ",
      timestamp: "ಸಮಯ ಮುದ್ರೆ",
      outbreak_map: "ಸಕ್ರಿಯ ಸೋಂಕುಗಳ ನಕ್ಷೆ",
      analytics_map: "ಹಿಂದಿನ ವಿಶ್ಲೇಷಣೆ ನಕ್ಷೆ",
    }
  };

  const copy = localCopy[lang] || localCopy.en;
  const highRiskCount = alerts.filter((a) => a.type === "POTENTIAL_CLUSTER" || a.type === "HIGH_RISK_AREA").length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 font-sans">
      
      {/* State Surveillance Banner */}
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-3 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {copy.banner_badge}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              {translate("surveillance_command", lang)}
            </h1>
            <p className="mt-1.5 text-xs text-indigo-200 uppercase font-bold tracking-wider max-w-xl">
              {copy.banner_desc}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 shadow-inner">
            <span className="text-2xl">🏛️</span>
            <div>
              <div className="text-[9px] uppercase font-black tracking-widest text-indigo-300">{copy.surv_center}</div>
              <div className="text-xs font-black text-white uppercase tracking-wider">{copy.ap_dept}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Pill Control */}
      <div className="mb-8 flex flex-wrap items-center gap-2 bg-stone-200/70 p-1.5 rounded-2xl border border-stone-300/80 shadow-inner w-fit">
        <button
          onClick={() => setActiveTab("surveillance")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "surveillance"
              ? "bg-gradient-to-r from-indigo-800 to-slate-900 text-white shadow-md shadow-indigo-950/20 scale-[1.02]"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
          }`}
        >
          📊 {copy.stats}
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === "alerts"
              ? "bg-gradient-to-r from-indigo-800 to-slate-900 text-white shadow-md shadow-indigo-950/20 scale-[1.02]"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
          }`}
        >
          <span>🚨 {copy.alerts}</span>
          {highRiskCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] rounded-full font-black uppercase animate-pulse shadow-sm">
              {highRiskCount} {copy.active}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("map")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === "map"
              ? "bg-gradient-to-r from-indigo-800 to-slate-900 text-white shadow-md shadow-indigo-950/20 scale-[1.02]"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
          }`}
        >
          <span>🗺️ {copy.geo_maps}</span>
        </button>
      </div>

      {activeTab === "surveillance" ? (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/20 shadow-md shadow-emerald-900/5 glass-card glass-card-hover">
              <div className="flex justify-between items-center mb-3 border-b border-emerald-200/60 pb-2">
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                  {translate("total_cases", lang)}
                </h3>
                <span className="text-xs">📊</span>
              </div>
              <div className="text-4xl font-black tracking-tight text-emerald-700">
                {metrics.totalCases}
              </div>
              <p className="text-[9px] text-stone-500 mt-2 uppercase font-bold tracking-wider">
                {copy.cases_desc}
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-indigo-100/20 shadow-md shadow-indigo-900/5 glass-card glass-card-hover">
              <div className="flex justify-between items-center mb-3 border-b border-indigo-200/60 pb-2">
                <h3 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">
                  {copy.resolution_rate}
                </h3>
                <span className="text-xs">🩺</span>
              </div>
              <div className="text-4xl font-black tracking-tight text-indigo-800">
                {metrics.totalCases > 0 
                  ? Math.round(((metrics.statusGroups.VET_ASSESSED || 0) / metrics.totalCases) * 100) 
                  : 100}%
              </div>
              <p className="text-[9px] text-stone-500 mt-2 uppercase font-bold tracking-wider">
                {copy.resolution_desc}
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 shadow-md shadow-amber-900/5 glass-card glass-card-hover">
              <div className="flex justify-between items-center mb-3 border-b border-amber-200/60 pb-2">
                <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                  {copy.pending_review}
                </h3>
                <span className="text-xs">⏳</span>
              </div>
              <div className="text-4xl font-black tracking-tight text-amber-700">
                {metrics.statusGroups.AI_ANALYZED || 0}
              </div>
              <p className="text-[9px] text-stone-500 mt-2 uppercase font-bold tracking-wider">
                {copy.pending_desc}
              </p>
            </div>
          </div>

          {/* Regional splits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Species split */}
            <div className="p-6 rounded-3xl border border-stone-200/80 bg-white shadow-sm glass-card">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 mb-6 border-b border-stone-150 pb-2 flex items-center justify-between">
                <span>{translate("species_affected", lang)}</span>
                <span className="text-xs text-stone-400 font-bold uppercase">{copy.breakdown}</span>
              </h3>
              <div className="space-y-4">
                {Object.entries(metrics.speciesEstimates).map(([species, count]) => {
                  const percentage = metrics.totalCases > 0 ? (count / metrics.totalCases) * 100 : 0;
                  return (
                    <div key={species} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-700 flex items-center gap-1.5">
                          <span>{getSpeciesEmoji(species)}</span>
                          <span className="font-extrabold">{translate("species_" + species.toLowerCase(), lang)}</span>
                        </span>
                        <span className="font-black text-stone-900">{count} {copy.cases_word} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5 border border-stone-200/60">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full transition-all duration-500 rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* District density */}
            <div className="p-6 rounded-3xl border border-stone-200/80 bg-white shadow-sm glass-card">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 mb-6 border-b border-stone-150 pb-2 flex items-center justify-between">
                <span>{translate("regional_density", lang)}</span>
                <span className="text-xs text-stone-400 font-bold uppercase">{copy.ranked}</span>
              </h3>
              {Object.keys(metrics.districtGroups).length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">
                  {copy.no_regional}
                </p>
              ) : (
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
                  {Object.entries(metrics.districtGroups)
                    .sort((a, b) => b[1] - a[1])
                    .map(([district, count]) => {
                      const percentage = metrics.totalCases > 0 ? (count / metrics.totalCases) * 100 : 0;
                      return (
                        <div key={district} className="flex justify-between items-center text-xs border-b border-stone-100 pb-3 last:border-0 last:pb-0 hover:bg-stone-50/80 p-2 rounded-xl transition">
                          <div>
                            <div className="font-black text-stone-850">
                              <TranslatedText text={district} lang={lang} />
                            </div>
                            <div className="text-[9px] text-stone-450 uppercase font-extrabold mt-0.5">
                              {Math.round(percentage)}% {copy.of_state}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-indigo-700">
                              {count}
                            </span>
                            <span className="text-[9px] text-stone-400 block uppercase font-bold">{copy.reports}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "alerts" ? (
        // Tab B: Outbreak Alerts feed
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm glass-card animate-fadeIn space-y-6">
          <div className="flex justify-between items-center border-b border-stone-150 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <span>🚨</span>
              <span>{copy.alerts_title}</span>
            </h3>
            <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              {alerts.length} {copy.active_feeds}
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-stone-250 rounded-3xl text-stone-400 max-w-lg mx-auto">
              <span className="text-3xl mb-3 block">🛡️</span>
              <p className="text-xs font-black uppercase text-stone-800">{copy.no_alerts}</p>
              <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-wider font-bold">
                {copy.alerts_desc}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 rounded-2xl border border-stone-200/80 bg-stone-50/80 shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card glass-card-hover"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${getAlertBadgeColor(alert.type)}`}>
                        {alert.type.replace("_", " ")}
                      </span>
                      <span className="font-mono text-xs font-black text-stone-900 uppercase">
                        📍 <TranslatedText text={alert.district} lang={lang} />
                      </span>
                    </div>
                    <p className="text-xs font-bold text-stone-800 leading-relaxed">
                      <TranslatedText text={alert.message} lang={lang} />
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">{copy.timestamp}</span>
                    <span className="text-xs font-black text-stone-700">
                      {new Date(alert.timestamp).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Tab C: Geographic Disease Surveillance Maps (Outbreak Surveillance vs Previous Analytics)
        <div className="space-y-6 animate-fadeIn">
          {/* Map Sub-Navigation Toggle */}
          <div className="flex gap-2 bg-stone-200/70 p-1.5 rounded-2xl border border-stone-300/80 w-fit shadow-inner">
            <button
              type="button"
              onClick={() => setMapSubTab("outbreaks")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                mapSubTab === "outbreaks"
                  ? "bg-gradient-to-r from-rose-700 to-slate-900 text-white shadow-md font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              🔥 {copy.outbreak_map}
            </button>

            <button
              type="button"
              onClick={() => setMapSubTab("analytics")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                mapSubTab === "analytics"
                  ? "bg-gradient-to-r from-indigo-800 to-slate-900 text-white shadow-md font-black"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              📈 {copy.analytics_map}
            </button>
          </div>

          {mapSubTab === "outbreaks" ? (
            <GovOutbreakMap alerts={alerts} />
          ) : (
            <GovAnalyticsMap metrics={metrics} />
          )}
        </div>
      )}
    </div>
  );
}
