"use client";

import { useEffect, useState, useRef } from "react";
import { SupportedLanguage } from "@/lib/services/i18n";

interface HealthCase {
  id: string;
  caseId: string;
  symptoms: string;
  location: string | null;
  status: string;
  createdAt: Date | string;
  species: string;
  affectedCount: number;
  farmer: {
    name: string;
    district: string;
    state: string;
  };
  aIAnalysis: {
    predictedDiseases: Array<{
      disease: string;
      confidence: number;
      urgency: string;
    }>;
  } | null;
  vetAssessments: Array<{
    diagnosis: string;
    severity: string;
  }>;
}

interface DiseaseAlert {
  id: string;
  district: string;
  type: "POTENTIAL_CLUSTER" | "HIGH_RISK_AREA" | "CONFIRMED_CASE" | "SUSPECTED_CASE";
  message: string;
  timestamp: Date | string;
}

interface GovOutbreakMapProps {
  cases?: HealthCase[];
  alerts?: DiseaseAlert[];
}

const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  Visakhapatnam: { lat: 17.7301, lng: 83.3323 },
  "East Godavari": { lat: 16.9891, lng: 82.2475 },
  "West Godavari": { lat: 16.7108, lng: 81.1017 },
  Krishna: { lat: 16.5062, lng: 80.648 },
  Guntur: { lat: 16.3067, lng: 80.4365 },
  Chittoor: { lat: 13.2172, lng: 79.1003 },
};

// Generate deterministic coordinates for outbreak hotspots and quarantine zones across AP
const MOCK_OUTBREAK_CLUSTERS = [
  {
    id: "cluster-visakhapatnam-north",
    district: "Visakhapatnam",
    taluka: "Bheemunipatnam",
    village: "Thagarapuvalasa",
    disease: "Foot and Mouth Disease (FMD)",
    status: "CONFIRMED_OUTBREAK",
    riskLevel: "HIGH_RISK_AREA",
    affectedAnimals: 42,
    quarantineRadiusKm: 8,
    lat: 17.8505,
    lng: 83.3891,
  },
  {
    id: "cluster-east-godavari-kakinada",
    district: "East Godavari",
    taluka: "Samalkota",
    village: "Peddapuram",
    disease: "Peste des Petits Ruminants (PPR)",
    status: "POTENTIAL_CLUSTER",
    riskLevel: "POTENTIAL_CLUSTER",
    affectedAnimals: 28,
    quarantineRadiusKm: 6,
    lat: 17.0491,
    lng: 82.1725,
  },
  {
    id: "cluster-west-godavari-eluru",
    district: "West Godavari",
    taluka: "Denduluru",
    village: "Vatluru",
    disease: "Lumpy Skin Disease (LSD)",
    status: "SUSPECTED_OUTBREAK",
    riskLevel: "SUSPECTED_CASE",
    affectedAnimals: 15,
    quarantineRadiusKm: 5,
    lat: 16.735,
    lng: 81.145,
  },
  {
    id: "cluster-krishna-vijayawada",
    district: "Krishna",
    taluka: "Gannavaram",
    village: "Mustabada",
    disease: "Anthrax Surveillance Zone",
    status: "HIGH_RISK_SURVEILLANCE",
    riskLevel: "HIGH_RISK_AREA",
    affectedAnimals: 19,
    quarantineRadiusKm: 10,
    lat: 16.535,
    lng: 80.795,
  },
];

const UI_LABELS: Record<string, Record<string, string>> = {
  en: {
    title: "Statewide Active Outbreak Surveillance Map",
    desc: "Geographic surveillance hierarchy: State → District → Taluka → Village. Real-time outbreak mapping and quarantine perimeters.",
    district_label: "District Hierarchy",
    all_districts: "All Districts (Andhra Pradesh)",
    layer_controls: "Surveillance Layer Controls",
    confirmed: "Confirmed Outbreaks",
    suspected: "Suspected Cases",
    high_risk: "High-Risk Zones",
    quarantine: "Quarantine Boundaries",
    vet_hq: "District Vet HQs",
    loading: "Loading outbreak surveillance map data...",
    legend_title: "Outbreak Map Symbols & Indicators",
    legend_confirmed: "Confirmed Outbreak",
    legend_cluster: "Potential Cluster / Suspected",
    legend_quarantine: "Quarantine Ring",
    legend_hq: "District Vet Command HQ",
    legend_team: "Active Response Team",
    footnote: "* Note: Map uses observed and reporting data from PashuRaksha system; does not imply complete state livestock census coverage.",
  },
  te: {
    title: "రాష్ట్రవ్యాప్త సక్రియ వ్యాప్తి పర్యవేక్షణ మ్యాప్",
    desc: "భౌగోళిక నిఘా శ్రేణి: రాష్ట్రం → జిల్లా → తాలూకా → గ్రామం. నిజ-సమయ వ్యాప్తి మ్యాపింగ్ మరియు క్వారంటైన్ పరిధులు.",
    district_label: "జిల్లా శ్రేణి",
    all_districts: "అన్ని జిల్లాలు (ఆంధ్రప్రదేశ్)",
    layer_controls: "నిఘా లేయర్ నియంత్రణలు",
    confirmed: "ధృవీకరించిన వ్యాప్తులు",
    suspected: "అనుమానిత కేసులు",
    high_risk: "అధిక-ప్రమాద ప్రాంతాలు",
    quarantine: "క్వారంటైన్ హద్దులు",
    vet_hq: "జిల్లా వెట్ కేంద్రాలు",
    loading: "వ్యాప్తి నిఘా మ్యాప్ డేటా లోడ్ అవుతోంది...",
    legend_title: "వ్యాప్తి మ్యాప్ సంకేతాలు & సూచికలు",
    legend_confirmed: "ధృవీకరించిన వ్యాప్తి",
    legend_cluster: "సంభావ్య క్లస్టర్ / అనుమానిత",
    legend_quarantine: "క్వారంటైన్ రింగ్",
    legend_hq: "జిల్లా వెట్ కమాండ్ HQ",
    legend_team: "సక్రియ ప్రతిస్పందన బృందం",
    footnote: "* గమనిక: మ్యాప్ పశురక్ష వ్యవస్థ నుండి పరిశీలన & రిపోర్టింగ్ డేటాను ఉపయోగిస్తుంది; పూర్తి రాష్ట్ర పశుగణన కవరేజ్‌ను సూచించదు.",
  },
  hi: {
    title: "राज्यव्यापी सक्रिय प्रकोप निगरानी मानचित्र",
    desc: "भौगोलिक निगरानी पदानुक्रम: राज्य → जिला → तालुका → गांव। वास्तविक समय प्रकोप मानचित्रण और संगरोध परिधि।",
    district_label: "जिला पदानुक्रम",
    all_districts: "सभी जिले (आंध्र प्रदेश)",
    layer_controls: "निगरानी परत नियंत्रण",
    confirmed: "पुष्ट प्रकोप",
    suspected: "संदिग्ध मामले",
    high_risk: "उच्च जोखिम क्षेत्र",
    quarantine: "संगरोध सीमाएं",
    vet_hq: "जिला पशु चिकित्सा मुख्यालय",
    loading: "प्रकोप निगरानी मानचित्र डेटा लोड हो रहा है...",
    legend_title: "प्रकोप मानचित्र प्रतीक और संकेतक",
    legend_confirmed: "पुष्ट प्रकोप",
    legend_cluster: "संभावित क्लस्टर / संदिग्ध",
    legend_quarantine: "संगरोध वलय",
    legend_hq: "जिला पशु चिकित्सा कमान मुख्यालय",
    legend_team: "सक्रिय प्रतिक्रिया दल",
    footnote: "* नोट: मानचित्र पशुरक्षा प्रणाली के अवलोकन और रिपोर्टिंग डेटा का उपयोग करता है; पूर्ण राज्य पशुधन जनगणना कवरेज का संकेत नहीं देता।",
  },
  ta: {
    title: "மாநிலம் முழுவதும் சுறுசுறுப்பான பரவல் கண்காணிப்பு வரைபடம்",
    desc: "புவியியல் கண்காணிப்பு: மாநிலம் → மாவட்டம் → வட்டம் → கிராமம். நிகழ்நேர பரவல் வரைபடம் மற்றும் தனிமைப்படுத்தல் எல்லைகள்.",
    district_label: "மாவட்ட வரிசை",
    all_districts: "அனைத்து மாவட்டங்கள் (ஆந்திர பிரதேசம்)",
    layer_controls: "கண்காணிப்பு அடுக்கு கட்டுப்பாடுகள்",
    confirmed: "உறுதிப்படுத்தப்பட்ட பரவல்கள்",
    suspected: "சந்தேகிக்கப்படும் வழக்குகள்",
    high_risk: "அதிக ஆபத்து மண்டலங்கள்",
    quarantine: "தனிமைப்படுத்தல் எல்லைகள்",
    vet_hq: "மாவட்ட கால்நடை மையங்கள்",
    loading: "பரவல் கண்காணிப்பு வரைபட தரவு ஏற்றப்படுகிறது...",
    legend_title: "பரவல் வரைபட குறியீடுகள் & குறிகாட்டிகள்",
    legend_confirmed: "உறுதிப்படுத்தப்பட்ட பரவல்",
    legend_cluster: "சாத்தியமான கொத்து / சந்தேகம்",
    legend_quarantine: "தனிமைப்படுத்தல் வளையம்",
    legend_hq: "மாவட்ட கால்நடை கட்டளை தலைமையகம்",
    legend_team: "செயலில் உள்ள பதிலடி குழு",
    footnote: "* குறிப்பு: வரைபடம் பசுரக்ஷா அமைப்பிலிருந்து கவனிப்பு மற்றும் அறிக்கையிடல் தரவைப் பயன்படுத்துகிறது; முழு மாநில கால்நடை கணக்கெடுப்பு கவரேஜை குறிக்காது.",
  },
  kn: {
    title: "ರಾಜ್ಯವ್ಯಾಪಿ ಸಕ್ರಿಯ ಸೋಂಕು ಕಣ್ಗಾವಲು ನಕ್ಷೆ",
    desc: "ಭೌಗೋಳಿಕ ಕಣ್ಗಾವಲು: ರಾಜ್ಯ → ಜಿಲ್ಲೆ → ತಾಲ್ಲೂಕು → ಗ್ರಾಮ. ನೈಜ ಸಮಯ ಸೋಂಕು ಮ್ಯಾಪಿಂಗ್ ಮತ್ತು ಕ್ವಾರಂಟೈನ್ ವ್ಯಾಪ್ತಿ.",
    district_label: "ಜಿಲ್ಲಾ ಕ್ರಮಾನುಗತ",
    all_districts: "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು (ಆಂಧ್ರ ಪ್ರದೇಶ)",
    layer_controls: "ಕಣ್ಗಾವಲು ಪದರ ನಿಯಂತ್ರಣಗಳು",
    confirmed: "ದೃಢೀಕೃತ ಸೋಂಕುಗಳು",
    suspected: "ಶಂಕಿತ ಪ್ರಕರಣಗಳು",
    high_risk: "ಅಧಿಕ ಅಪಾಯ ವಲಯಗಳು",
    quarantine: "ಕ್ವಾರಂಟೈನ್ ಗಡಿಗಳು",
    vet_hq: "ಜಿಲ್ಲಾ ಪಶುವೈದ್ಯ ಕೇಂದ್ರಗಳು",
    loading: "ಸೋಂಕು ಕಣ್ಗಾವಲು ನಕ್ಷೆ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    legend_title: "ಸೋಂಕು ನಕ್ಷೆ ಚಿಹ್ನೆಗಳು & ಸೂಚಕಗಳು",
    legend_confirmed: "ದೃಢೀಕೃತ ಸೋಂಕು",
    legend_cluster: "ಸಂಭಾವ್ಯ ಕ್ಲಸ್ಟರ್ / ಶಂಕಿತ",
    legend_quarantine: "ಕ್ವಾರಂಟೈನ್ ವಲಯ",
    legend_hq: "ಜಿಲ್ಲಾ ಪಶುವೈದ್ಯ ಕಮಾಂಡ್ HQ",
    legend_team: "ಸಕ್ರಿಯ ಪ್ರತಿಕ್ರಿಯೆ ತಂಡ",
    footnote: "* ಗಮನಿಸಿ: ನಕ್ಷೆ ಪಶುರಕ್ಷಾ ವ್ಯವಸ್ಥೆಯ ವೀಕ್ಷಣೆ ಮತ್ತು ವರದಿ ಡೇಟಾವನ್ನು ಬಳಸುತ್ತದೆ; ಸಂಪೂರ್ಣ ರಾಜ್ಯ ಜಾನುವಾರು ಗಣತಿ ವ್ಯಾಪ್ತಿಯನ್ನು ಸೂಚಿಸುವುದಿಲ್ಲ.",
  },
};

export default function GovOutbreakMap({ cases = [], alerts = [] }: GovOutbreakMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [lang, setLang] = useState<SupportedLanguage>("en");

  // Layer Visibility Toggles
  const [layers, setLayers] = useState({
    confirmed: true,
    suspected: true,
    clusters: true,
    highRisk: true,
    quarantine: true,
    vetHQ: true,
  });

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

    const mapContainer = document.getElementById("gov-outbreak-map-container");
    if (!mapContainer) return;

    // Center map on Andhra Pradesh (or selected district)
    let centerLat = 17.15;
    let centerLng = 82.2;
    let zoomLevel = 8;

    if (selectedDistrict !== "ALL" && DISTRICT_CENTERS[selectedDistrict]) {
      centerLat = DISTRICT_CENTERS[selectedDistrict].lat;
      centerLng = DISTRICT_CENTERS[selectedDistrict].lng;
      zoomLevel = 10;
    }

    const map = L.map("gov-outbreak-map-container").setView([centerLat, centerLng], zoomLevel);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // 1. Render District HQ Centers
    if (layers.vetHQ) {
      Object.entries(DISTRICT_CENTERS).forEach(([districtName, coords]) => {
        if (selectedDistrict !== "ALL" && selectedDistrict !== districtName) return;

        const hqIcon = L.divIcon({
          className: "gov-hq-icon",
          html: `
            <div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center">
              <div class="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([coords.lat, coords.lng], { icon: hqIcon })
          .addTo(map)
          .bindPopup(
            `<div class="p-1 font-sans text-xs">
              <div class="font-bold text-slate-900 uppercase tracking-tight">${districtName} Veterinary HQ Command</div>
              <div class="text-slate-500 font-medium">State Surveillance Hub</div>
            </div>`
          );
      });
    }

    // 2. Render Active Outbreak Clusters & Quarantine Rings
    MOCK_OUTBREAK_CLUSTERS.forEach((cluster) => {
      if (selectedDistrict !== "ALL" && selectedDistrict !== cluster.district) return;

      const isConfirmed = cluster.status === "CONFIRMED_OUTBREAK";
      const isHighRisk = cluster.riskLevel === "HIGH_RISK_AREA";

      if (isConfirmed && !layers.confirmed) return;
      if (!isConfirmed && !layers.suspected) return;
      if (isHighRisk && !layers.highRisk) return;

      // Render Quarantine Ring Overlay
      if (layers.quarantine) {
        L.circle([cluster.lat, cluster.lng], {
          color: isConfirmed ? "#dc2626" : "#d97706",
          fillColor: isConfirmed ? "#ef4444" : "#f59e0b",
          fillOpacity: 0.12,
          radius: cluster.quarantineRadiusKm * 1000,
          weight: 2,
          dashArray: "6, 8",
        }).addTo(map);
      }

      // Outbreak Hotspot Pin
      const iconBg = isConfirmed ? "bg-rose-600" : "bg-amber-500";
      const hotspotIcon = L.divIcon({
        className: "outbreak-hotspot-icon",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${iconBg} border-2 border-white shadow-xl">
            <div class="w-3 h-3 rounded-full bg-white animate-ping absolute"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupHtml = `
        <div class="p-2 font-sans max-w-[240px]">
          <div class="flex justify-between items-center mb-1">
            <span class="text-[9px] font-black uppercase text-slate-400">${cluster.district} &bull; ${cluster.taluka}</span>
            <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
              isConfirmed ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
            }">${cluster.status.replace("_", " ")}</span>
          </div>
          <div class="font-bold text-slate-900 text-xs mb-1">${cluster.disease}</div>
          <div class="text-[11px] text-slate-600 mb-1">Affected Livestock: <span class="font-bold text-slate-900">${cluster.affectedAnimals} head</span></div>
          <div class="text-[10px] text-indigo-700 font-bold uppercase">Quarantine Perimeter: ${cluster.quarantineRadiusKm} KM Zone</div>
          <div class="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Location: ${cluster.village} Village</div>
        </div>
      `;

      L.marker([cluster.lat, cluster.lng], { icon: hotspotIcon })
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
  }, [leafletLoaded, selectedDistrict, layers]);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const t = UI_LABELS[lang] || UI_LABELS.en;

  return (
    <div className="space-y-6">
      {/* Top Header & Layer Controls */}
      <div className="p-6 rounded-3xl border border-stone-200 bg-white shadow-sm glass-card space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-stone-150 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-900">
                {t.title}
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-semibold mt-1">
              {t.desc}
            </p>
          </div>

          {/* District Selector */}
          <div>
            <label className="block text-[9px] font-black uppercase text-stone-400 mb-1">{t.district_label}</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-600"
            >
              <option value="ALL">{t.all_districts}</option>
              <option value="Visakhapatnam">Visakhapatnam District</option>
              <option value="East Godavari">East Godavari District</option>
              <option value="West Godavari">West Godavari District</option>
              <option value="Krishna">Krishna District</option>
              <option value="Guntur">Guntur District</option>
            </select>
          </div>
        </div>

        {/* Interactive Layer Checkboxes */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-3">
            {t.layer_controls}
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => toggleLayer("confirmed")}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                layers.confirmed ? "bg-rose-50 border-rose-300 text-rose-800 font-black" : "bg-stone-50 border-stone-200 text-stone-400"
              }`}
            >
              {t.confirmed}
            </button>

            <button
              type="button"
              onClick={() => toggleLayer("suspected")}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                layers.suspected ? "bg-amber-50 border-amber-300 text-amber-800 font-black" : "bg-stone-50 border-stone-200 text-stone-400"
              }`}
            >
              {t.suspected}
            </button>

            <button
              type="button"
              onClick={() => toggleLayer("highRisk")}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                layers.highRisk ? "bg-red-50 border-red-300 text-red-900 font-black" : "bg-stone-50 border-stone-200 text-stone-400"
              }`}
            >
              {t.high_risk}
            </button>

            <button
              type="button"
              onClick={() => toggleLayer("quarantine")}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                layers.quarantine ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-black" : "bg-stone-50 border-stone-200 text-stone-400"
              }`}
            >
              {t.quarantine}
            </button>

            <button
              type="button"
              onClick={() => toggleLayer("vetHQ")}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                layers.vetHQ ? "bg-slate-100 border-slate-300 text-slate-800 font-black" : "bg-stone-50 border-stone-200 text-stone-400"
              }`}
            >
              {t.vet_hq}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            id="gov-outbreak-map-container"
            className="w-full h-[420px] rounded-2xl border border-stone-200 bg-stone-50 shadow-inner overflow-hidden z-10"
          />

          {!leafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100/70 backdrop-blur-xs rounded-2xl text-xs text-stone-500 font-bold">
              {t.loading}
            </div>
          )}
        </div>

        {/* Legend & Reporting Footnote */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 border-b border-stone-200 pb-2">
            {t.legend_title}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs font-bold text-stone-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white shadow-xs shrink-0" />
              <span>{t.legend_confirmed}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shadow-xs shrink-0" />
              <span>{t.legend_cluster}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500/20 border border-rose-600 shrink-0" />
              <span>{t.legend_quarantine}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-white shrink-0" />
              <span>{t.legend_hq}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0" />
              <span>{t.legend_team}</span>
            </div>
          </div>

          {/* Mandatory Architecture Footnote */}
          <div className="pt-2 border-t border-stone-200 text-[10px] text-stone-450 font-semibold italic">
            {t.footnote}
          </div>
        </div>
      </div>
    </div>
  );
}
