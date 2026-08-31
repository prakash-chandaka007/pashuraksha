"use client";

import { useEffect, useState, useRef } from "react";
import { SupportedLanguage } from "@/lib/services/i18n";

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

interface GovAnalyticsMapProps {
  metrics?: SurveillanceSummary;
}

const HISTORICAL_ANALYTICS_DATA = [
  {
    district: "Visakhapatnam",
    lat: 17.7301,
    lng: 83.3323,
    totalHistoricalCases: 38,
    primaryDisease: "Foot and Mouth Disease (FMD)",
    dominantSpecies: "Cattle",
    resolutionRate: 88,
    densityTier: "HIGH",
  },
  {
    district: "East Godavari",
    lat: 16.9891,
    lng: 82.2475,
    totalHistoricalCases: 24,
    primaryDisease: "Peste des Petits Ruminants (PPR)",
    dominantSpecies: "Goat",
    resolutionRate: 92,
    densityTier: "MODERATE",
  },
  {
    district: "West Godavari",
    lat: 16.7108,
    lng: 81.1017,
    totalHistoricalCases: 19,
    primaryDisease: "Lumpy Skin Disease (LSD)",
    dominantSpecies: "Buffalo",
    resolutionRate: 85,
    densityTier: "MODERATE",
  },
  {
    district: "Krishna",
    lat: 16.5062,
    lng: 80.648,
    totalHistoricalCases: 12,
    primaryDisease: "Haemorrhagic Septicaemia (HS)",
    dominantSpecies: "Cattle",
    resolutionRate: 95,
    densityTier: "LOW",
  },
  {
    district: "Guntur",
    lat: 16.3067,
    lng: 80.4365,
    totalHistoricalCases: 9,
    primaryDisease: "Black Quarter (BQ)",
    dominantSpecies: "Sheep",
    resolutionRate: 90,
    densityTier: "LOW",
  },
  {
    district: "Chittoor",
    lat: 13.2172,
    lng: 79.1003,
    totalHistoricalCases: 14,
    primaryDisease: "Brucellosis",
    dominantSpecies: "Cattle",
    resolutionRate: 91,
    densityTier: "MODERATE",
  },
];

const UI_LABELS: Record<string, Record<string, string>> = {
  en: {
    title: "Historical Disease Outbreak & Density Analytics Map",
    desc: "Analyze previous disease incidence trends, district volume density, species vulnerability, and resolution efficiency.",
    time_range: "Time Range",
    past_30: "Past 30 Days",
    past_90: "Past 90 Days",
    past_6m: "Past 6 Months",
    past_1y: "Past Year",
    all_time: "All Time",
    disease_filter: "Disease Filter",
    all_diseases: "All Diseases",
    species_filter: "Species Filter",
    all_species: "All Species",
    record_volume: "Historical Record Volume",
    cases_suffix: "Cases",
    highest_district: "Highest Incident District",
    avg_resolution: "Avg Resolution Rate",
    primary_threat: "Primary State Threat",
    fmd_outbreaks: "FMD Outbreaks",
    loading: "Loading historical analytics map data...",
    legend_title: "Historical Outbreak Density Legend",
    high_density: "High Density Zone (> 30 Cumulative Cases)",
    mod_density: "Moderate Density Zone (15 – 30 Cumulative Cases)",
    low_density: "Low Density Zone (< 15 Cumulative Cases)",
  },
  te: {
    title: "చారిత్రక వ్యాధి వ్యాప్తి & సాంద్రత విశ్లేషణ మ్యాప్",
    desc: "గత వ్యాధి సంభవ ధోరణులు, జిల్లా పరిమాణ సాంద్రత, జాతుల దుర్బలత్వం మరియు పరిష్కార సామర్థ్యం విశ్లేషించండి.",
    time_range: "సమయ వ్యవధి",
    past_30: "గత 30 రోజులు",
    past_90: "గత 90 రోజులు",
    past_6m: "గత 6 నెలలు",
    past_1y: "గత సంవత్సరం",
    all_time: "మొత్తం కాలం",
    disease_filter: "వ్యాధి ఫిల్టర్",
    all_diseases: "అన్ని వ్యాధులు",
    species_filter: "జాతుల ఫిల్టర్",
    all_species: "అన్ని జాతులు",
    record_volume: "చారిత్రక రికార్డ్ పరిమాణం",
    cases_suffix: "కేసులు",
    highest_district: "అత్యధిక సంఘటన జిల్లా",
    avg_resolution: "సగటు పరిష్కార రేటు",
    primary_threat: "ప్రాథమిక రాష్ట్ర ముప్పు",
    fmd_outbreaks: "FMD వ్యాప్తులు",
    loading: "చారిత్రక విశ్లేషణ మ్యాప్ డేటా లోడ్ అవుతోంది...",
    legend_title: "చారిత్రక వ్యాప్తి సాంద్రత సూచి",
    high_density: "అధిక సాంద్రత మండలం (> 30 సంచిత కేసులు)",
    mod_density: "మధ్యస్థ సాంద్రత మండలం (15 – 30 సంచిత కేసులు)",
    low_density: "తక్కువ సాంద్రత మండలం (< 15 సంచిత కేసులు)",
  },
  hi: {
    title: "ऐतिहासिक रोग प्रकोप एवं घनत्व विश्लेषण मानचित्र",
    desc: "पिछली रोग घटना प्रवृत्तियों, जिला आयतन घनत्व, प्रजाति भेद्यता और समाधान दक्षता का विश्लेषण करें।",
    time_range: "समय सीमा",
    past_30: "पिछले 30 दिन",
    past_90: "पिछले 90 दिन",
    past_6m: "पिछले 6 महीने",
    past_1y: "पिछला वर्ष",
    all_time: "पूरा समय",
    disease_filter: "रोग फ़िल्टर",
    all_diseases: "सभी रोग",
    species_filter: "प्रजाति फ़िल्टर",
    all_species: "सभी प्रजातियां",
    record_volume: "ऐतिहासिक रिकॉर्ड मात्रा",
    cases_suffix: "मामले",
    highest_district: "सर्वाधिक घटना जिला",
    avg_resolution: "औसत समाधान दर",
    primary_threat: "प्राथमिक राज्य खतरा",
    fmd_outbreaks: "FMD प्रकोप",
    loading: "ऐतिहासिक विश्लेषण मानचित्र डेटा लोड हो रहा है...",
    legend_title: "ऐतिहासिक प्रकोप घनत्व संकेत",
    high_density: "उच्च घनत्व क्षेत्र (> 30 संचयी मामले)",
    mod_density: "मध्यम घनत्व क्षेत्र (15 – 30 संचयी मामले)",
    low_density: "कम घनत्व क्षेत्र (< 15 संचयी मामले)",
  },
  ta: {
    title: "வரலாற்று நோய் பரவல் & அடர்த்தி பகுப்பாய்வு வரைபடம்",
    desc: "முந்தைய நோய் நிகழ்வு போக்குகள், மாவட்ட அளவு அடர்த்தி, இனங்களின் பாதிப்பு மற்றும் தீர்வு திறனை பகுப்பாய்வு செய்யுங்கள்.",
    time_range: "நேர வரம்பு",
    past_30: "கடந்த 30 நாட்கள்",
    past_90: "கடந்த 90 நாட்கள்",
    past_6m: "கடந்த 6 மாதங்கள்",
    past_1y: "கடந்த ஆண்டு",
    all_time: "அனைத்து காலம்",
    disease_filter: "நோய் வடிகட்டி",
    all_diseases: "அனைத்து நோய்கள்",
    species_filter: "இன வடிகட்டி",
    all_species: "அனைத்து இனங்கள்",
    record_volume: "வரலாற்று பதிவு அளவு",
    cases_suffix: "வழக்குகள்",
    highest_district: "அதிக நிகழ்வு மாவட்டம்",
    avg_resolution: "சராசரி தீர்வு விகிதம்",
    primary_threat: "முதன்மை மாநில அச்சுறுத்தல்",
    fmd_outbreaks: "FMD பரவல்கள்",
    loading: "வரலாற்று பகுப்பாய்வு வரைபட தரவு ஏற்றப்படுகிறது...",
    legend_title: "வரலாற்று பரவல் அடர்த்தி குறிகாட்டி",
    high_density: "அதிக அடர்த்தி மண்டலம் (> 30 ஒட்டுமொத்த வழக்குகள்)",
    mod_density: "மிதமான அடர்த்தி மண்டலம் (15 – 30 ஒட்டுமொத்த வழக்குகள்)",
    low_density: "குறைந்த அடர்த்தி மண்டலம் (< 15 ஒட்டுமொத்த வழக்குகள்)",
  },
  kn: {
    title: "ಐತಿಹಾಸಿಕ ರೋಗ ಹರಡುವಿಕೆ & ಸಾಂದ್ರತೆ ವಿಶ್ಲೇಷಣೆ ನಕ್ಷೆ",
    desc: "ಹಿಂದಿನ ರೋಗ ಸಂಭವ ಪ್ರವೃತ್ತಿಗಳು, ಜಿಲ್ಲಾ ಪ್ರಮಾಣ ಸಾಂದ್ರತೆ, ಜಾತಿ ದುರ್ಬಲತೆ ಮತ್ತು ಪರಿಹಾರ ದಕ್ಷತೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಿ.",
    time_range: "ಸಮಯ ವ್ಯಾಪ್ತಿ",
    past_30: "ಕಳೆದ 30 ದಿನಗಳು",
    past_90: "ಕಳೆದ 90 ದಿನಗಳು",
    past_6m: "ಕಳೆದ 6 ತಿಂಗಳುಗಳು",
    past_1y: "ಕಳೆದ ವರ್ಷ",
    all_time: "ಎಲ್ಲಾ ಸಮಯ",
    disease_filter: "ರೋಗ ಫಿಲ್ಟರ್",
    all_diseases: "ಎಲ್ಲಾ ರೋಗಗಳು",
    species_filter: "ಜಾತಿ ಫಿಲ್ಟರ್",
    all_species: "ಎಲ್ಲಾ ಜಾತಿಗಳು",
    record_volume: "ಐತಿಹಾಸಿಕ ದಾಖಲೆ ಪ್ರಮಾಣ",
    cases_suffix: "ಪ್ರಕರಣಗಳು",
    highest_district: "ಅತ್ಯಧಿಕ ಘಟನೆ ಜಿಲ್ಲೆ",
    avg_resolution: "ಸರಾಸರಿ ಪರಿಹಾರ ದರ",
    primary_threat: "ಪ್ರಾಥಮಿಕ ರಾಜ್ಯ ಬೆದರಿಕೆ",
    fmd_outbreaks: "FMD ಸೋಂಕುಗಳು",
    loading: "ಐತಿಹಾಸಿಕ ವಿಶ್ಲೇಷಣೆ ನಕ್ಷೆ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    legend_title: "ಐತಿಹಾಸಿಕ ಸೋಂಕು ಸಾಂದ್ರತೆ ಸೂಚಕ",
    high_density: "ಅಧಿಕ ಸಾಂದ್ರತೆ ವಲಯ (> 30 ಸಂಚಿತ ಪ್ರಕರಣಗಳು)",
    mod_density: "ಮಧ್ಯಮ ಸಾಂದ್ರತೆ ವಲಯ (15 – 30 ಸಂಚಿತ ಪ್ರಕರಣಗಳು)",
    low_density: "ಕಡಿಮೆ ಸಾಂದ್ರತೆ ವಲಯ (< 15 ಸಂಚಿತ ಪ್ರಕರಣಗಳು)",
  },
};

export default function GovAnalyticsMap({ metrics }: GovAnalyticsMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [dateRange, setDateRange] = useState("90_DAYS");
  const [selectedDisease, setSelectedDisease] = useState("ALL");
  const [selectedSpecies, setSelectedSpecies] = useState("ALL");
  const [lang, setLang] = useState<SupportedLanguage>("en");

  const mapRef = useRef<any>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )pashuraksha_lang=([^;]*)/);
    if (match && match[1]) {
      setLang(match[1] as SupportedLanguage);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const L = (window as any).L;
    if (L) {
      setLeafletLoaded(true);
      return;
    }

    const cssId = "leaflet-style-tag";
    const jsId = "leaflet-script-tag";

    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || typeof window === "undefined") return;
    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const mapContainer = document.getElementById("gov-analytics-map-container");
    if (!mapContainer) return;

    const map = L.map("gov-analytics-map-container").setView([16.5, 80.8], 7);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Render Historical Density Circles per District
    HISTORICAL_ANALYTICS_DATA.forEach((item) => {
      // Apply mock filter adjustments
      if (selectedDisease !== "ALL" && !item.primaryDisease.toLowerCase().includes(selectedDisease.toLowerCase())) {
        return;
      }
      if (selectedSpecies !== "ALL" && item.dominantSpecies.toLowerCase() !== selectedSpecies.toLowerCase()) {
        return;
      }

      let circleColor = "#059669"; // Emerald (Low)
      let fillColor = "#10b981";

      if (item.totalHistoricalCases >= 30) {
        circleColor = "#e11d48"; // Crimson Red (High)
        fillColor = "#f43f5e";
      } else if (item.totalHistoricalCases >= 15) {
        circleColor = "#d97706"; // Amber (Moderate)
        fillColor = "#fbbf24";
      }

      // Radius scales with historical cases count
      const radiusMeters = 15000 + item.totalHistoricalCases * 800;

      L.circle([item.lat, item.lng], {
        color: circleColor,
        fillColor: fillColor,
        fillOpacity: 0.25,
        radius: radiusMeters,
        weight: 2,
      }).addTo(map);

      // District Analytics Center Marker
      const analyticsMarkerIcon = L.divIcon({
        className: "gov-analytics-icon",
        html: `
          <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-[10px] font-black text-white">
            ${item.totalHistoricalCases}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const popupHtml = `
        <div class="p-2 font-sans max-w-[220px]">
          <div class="font-bold text-slate-900 text-xs mb-1">${item.district} Historical Surveillance</div>
          <div class="text-[11px] text-slate-600 mb-1">Total Recorded Cases: <span class="font-bold text-slate-900">${item.totalHistoricalCases}</span></div>
          <div class="text-[11px] text-slate-600 mb-1">Dominant Disease: <span class="font-bold text-slate-800">${item.primaryDisease}</span></div>
          <div class="text-[11px] text-slate-600 mb-1">Most Affected Species: <span class="font-bold text-slate-800">${item.dominantSpecies}</span></div>
          <div class="text-[10px] text-emerald-700 font-bold uppercase mt-1">Resolution Rate: ${item.resolutionRate}%</div>
        </div>
      `;

      L.marker([item.lat, item.lng], { icon: analyticsMarkerIcon })
        .addTo(map)
        .bindPopup(popupHtml);
    });

    const invalidateTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(invalidateTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, dateRange, selectedDisease, selectedSpecies]);

  const totalHistoricalCount = HISTORICAL_ANALYTICS_DATA.reduce((acc, curr) => acc + curr.totalHistoricalCases, 0);
  const t = UI_LABELS[lang] || UI_LABELS.en;

  return (
    <div className="space-y-6">
      {/* Top Header & Analytics Filters */}
      <div className="p-6 rounded-3xl border border-stone-200 bg-white shadow-sm glass-card space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-stone-150 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-900">
                {t.title}
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-semibold mt-1">
              {t.desc}
            </p>
          </div>

          {/* Analytics Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase text-stone-400 mb-1">{t.time_range}</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="30_DAYS">{t.past_30}</option>
                <option value="90_DAYS">{t.past_90}</option>
                <option value="6_MONTHS">{t.past_6m}</option>
                <option value="1_YEAR">{t.past_1y}</option>
                <option value="ALL">{t.all_time}</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-stone-400 mb-1">{t.disease_filter}</label>
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">{t.all_diseases}</option>
                <option value="FMD">Foot and Mouth Disease (FMD)</option>
                <option value="PPR">Peste des Petits Ruminants (PPR)</option>
                <option value="LSD">Lumpy Skin Disease (LSD)</option>
                <option value="HS">Haemorrhagic Septicaemia (HS)</option>
                <option value="Brucellosis">Brucellosis</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-stone-400 mb-1">{t.species_filter}</label>
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">{t.all_species}</option>
                <option value="Cattle">Cattle</option>
                <option value="Buffalo">Buffalo</option>
                <option value="Goat">Goat</option>
                <option value="Sheep">Sheep</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider block mb-1">
              {t.record_volume}
            </span>
            <span className="text-2xl font-black text-stone-900">{totalHistoricalCount} {t.cases_suffix}</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70">
            <span className="text-[9px] font-black uppercase text-rose-800 tracking-wider block mb-1">
              {t.highest_district}
            </span>
            <span className="text-xl font-black text-rose-900">Visakhapatnam</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider block mb-1">
              {t.avg_resolution}
            </span>
            <span className="text-2xl font-black text-emerald-900">90.2%</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70">
            <span className="text-[9px] font-black uppercase text-indigo-800 tracking-wider block mb-1">
              {t.primary_threat}
            </span>
            <span className="text-xl font-black text-indigo-900">{t.fmd_outbreaks}</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            id="gov-analytics-map-container"
            className="w-full h-[420px] rounded-2xl border border-stone-200 bg-stone-50 shadow-inner overflow-hidden z-10"
          />

          {!leafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100/70 backdrop-blur-xs rounded-2xl text-xs text-stone-500 font-bold">
              {t.loading}
            </div>
          )}
        </div>

        {/* Analytics Map Legend */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 border-b border-stone-200 pb-2">
            {t.legend_title}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-stone-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600/30 border border-rose-600 shrink-0" />
              <span>{t.high_density}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500/30 border border-amber-600 shrink-0" />
              <span>{t.mod_density}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/30 border border-emerald-600 shrink-0" />
              <span>{t.low_density}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
