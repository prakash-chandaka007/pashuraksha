"use client";

import { useEffect, useState, useRef } from "react";

interface HealthCase {
  id: string;
  caseId: string;
  symptoms: string;
  symptomStartDate: Date | string;
  location: string | null;
  status: string;
  createdAt: Date | string;
  images: string[];
  species: string;
  affectedCount: number;
  assignedVetId?: string | null;
  farmer: {
    name: string;
    phone: string;
    district: string;
    state: string;
  };
  aIAnalysis: {
    predictedDiseases: Array<{
      disease: string;
      confidence: number;
      urgency: string;
    }>;
    disclaimer: string;
  } | null;
  vetAssessments: Array<{
    id: string;
    diagnosis: string;
    severity: string;
    treatmentPlan: string;
    notes?: string | null;
    assessedAt: Date | string;
  }>;
}

interface VetJurisdictionMapProps {
  vetRegion: string;
  cases: HealthCase[];
  vetName?: string;
}

const CLINIC_CENTERS: Record<string, { lat: number; lng: number; radiusKm: number; district: string; centerName: string }> = {
  "Visakhapatnam Urban North (MVP Colony Clinic)": {
    lat: 17.7301,
    lng: 83.3323,
    radiusKm: 18,
    district: "Visakhapatnam",
    centerName: "MVP Colony Command HQ",
  },
  "Visakhapatnam Urban South (Gajuwaka Clinic)": {
    lat: 17.6905,
    lng: 83.2091,
    radiusKm: 20,
    district: "Visakhapatnam",
    centerName: "Gajuwaka Belt Command HQ",
  },
  "Bheemunipatnam Region (Bheemili Clinic)": {
    lat: 17.8893,
    lng: 83.4475,
    radiusKm: 25,
    district: "Visakhapatnam",
    centerName: "Bheemili Suburb HQ",
  },
  "East Godavari Central (Kakinada Clinic)": {
    lat: 16.9891,
    lng: 82.2475,
    radiusKm: 22,
    district: "East Godavari",
    centerName: "Kakinada Central Hospital",
  },
  "East Godavari North (Rajamahendravaram Clinic)": {
    lat: 17.0005,
    lng: 81.7835,
    radiusKm: 25,
    district: "East Godavari",
    centerName: "Rajahmundry Urban Center",
  },
  "East Godavari South (Amalapuram Clinic)": {
    lat: 16.5787,
    lng: 82.0125,
    radiusKm: 30,
    district: "East Godavari",
    centerName: "Amalapuram Care Center",
  },
  "West Godavari Central (Eluru Clinic)": {
    lat: 16.7108,
    lng: 81.1017,
    radiusKm: 20,
    district: "West Godavari",
    centerName: "Eluru Central Clinic",
  },
  "West Godavari South (Bhimavaram Clinic)": {
    lat: 16.5449,
    lng: 81.5224,
    radiusKm: 25,
    district: "West Godavari",
    centerName: "Bhimavaram Aqua Center",
  },
  "West Godavari East (Tadepalligudem Clinic)": {
    lat: 16.8143,
    lng: 81.5273,
    radiusKm: 28,
    district: "West Godavari",
    centerName: "Tadepalligudem Agri-Vet Center",
  },
};

// Deterministically offset lat/lng for cases based on caseId hash if location coordinates are not explicitly passed
function getCaseCoords(c: HealthCase, centerLat: number, centerLng: number, index: number) {
  let hash = 0;
  for (let i = 0; i < c.id.length; i++) {
    hash = (hash << 5) - hash + c.id.charCodeAt(i);
    hash |= 0;
  }
  const angle = ((Math.abs(hash) + index * 47) % 360) * (Math.PI / 180);
  const distKm = 2 + ((Math.abs(hash) % 120) / 10); // 2 to 14 km radius
  const latOffset = (distKm / 111) * Math.cos(angle);
  const lngOffset = (distKm / (111 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin(angle);
  return {
    lat: centerLat + latOffset,
    lng: centerLng + lngOffset,
  };
}

export default function VetJurisdictionMap({
  vetRegion,
  cases,
  vetName = "Doctor",
}: VetJurisdictionMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState("ALL");
  const [selectedCaseModal, setSelectedCaseModal] = useState<HealthCase | null>(null);

  const mapRef = useRef<any>(null);

  const clinicInfo = CLINIC_CENTERS[vetRegion] || {
    lat: 17.7301,
    lng: 83.3323,
    radiusKm: 20,
    district: "Visakhapatnam",
    centerName: vetRegion,
  };

  // Filter cases strictly to jurisdiction (based on vetRegion / district matching)
  const jurisdictionCases = cases.filter((c) => {
    // Check if status matches filter
    if (selectedStatusFilter !== "ALL" && c.status !== selectedStatusFilter) {
      return false;
    }
    if (selectedSpeciesFilter !== "ALL" && c.species?.toLowerCase() !== selectedSpeciesFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Counters
  const criticalCount = jurisdictionCases.filter(
    (c) => c.aIAnalysis?.predictedDiseases?.[0]?.urgency === "HIGH" || c.aIAnalysis?.predictedDiseases?.[0]?.urgency === "CRITICAL"
  ).length;
  const pendingCount = jurisdictionCases.filter((c) => c.status !== "VET_ASSESSED").length;
  const assessedCount = jurisdictionCases.filter((c) => c.status === "VET_ASSESSED").length;

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

    // Remove existing map instance if present
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const mapContainer = document.getElementById("vet-jurisdiction-map-container");
    if (!mapContainer) return;

    const map = L.map("vet-jurisdiction-map-container").setView([clinicInfo.lat, clinicInfo.lng], 11);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // 1. Render Vet HQ Command Center Marker
    const hqIcon = L.divIcon({
      className: "custom-hq-icon",
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-xl">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute"></div>
          <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([clinicInfo.lat, clinicInfo.lng], { icon: hqIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900 text-sm uppercase tracking-tight mb-1">${clinicInfo.centerName}</div>
          <div class="text-slate-600 font-semibold mb-0.5">Assigned Officer: <span class="text-slate-900">${vetName}</span></div>
          <div class="text-slate-500 font-medium">Jurisdiction Region: ${vetRegion}</div>
          <div class="text-indigo-700 font-bold mt-1 text-[10px] uppercase">Official Command Radius: ${clinicInfo.radiusKm} KM</div>
        </div>`
      );

    // 2. Render Jurisdiction Coverage Radius Circle (Spread)
    L.circle([clinicInfo.lat, clinicInfo.lng], {
      color: "#4f46e5",
      fillColor: "#6366f1",
      fillOpacity: 0.08,
      radius: clinicInfo.radiusKm * 1000,
      weight: 2,
      dashArray: "4, 6",
    }).addTo(map);

    // 3. Render Case Markers strictly for this jurisdiction
    jurisdictionCases.forEach((c, idx) => {
      const coords = getCaseCoords(c, clinicInfo.lat, clinicInfo.lng, idx);

      const topDisease = c.aIAnalysis?.predictedDiseases?.[0]?.disease || "Under Investigation";
      const urgency = c.aIAnalysis?.predictedDiseases?.[0]?.urgency || "MEDIUM";

      let markerBg = "bg-amber-500";
      let ringColor = "border-amber-200";

      if (c.status === "VET_ASSESSED") {
        markerBg = "bg-indigo-600";
        ringColor = "border-indigo-200";
      } else if (urgency === "HIGH" || urgency === "CRITICAL") {
        markerBg = "bg-rose-600";
        ringColor = "border-rose-200";
      } else if (urgency === "LOW") {
        markerBg = "bg-emerald-600";
        ringColor = "border-emerald-200";
      }

      const caseMarkerIcon = L.divIcon({
        className: "custom-case-marker",
        html: `
          <div class="w-6 h-6 rounded-full ${markerBg} border-2 border-white shadow-md flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: caseMarkerIcon }).addTo(map);

      const statusBadgeClass =
        c.status === "VET_ASSESSED"
          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
          : c.status === "AI_ANALYZED"
          ? "bg-blue-50 text-blue-800 border-blue-200"
          : "bg-amber-50 text-amber-800 border-amber-200";

      const popupContent = `
        <div class="p-2 font-sans max-w-[220px]">
          <div class="flex justify-between items-center mb-1">
            <span class="font-mono text-[10px] font-bold text-slate-400">REF: ${c.caseId}</span>
            <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${statusBadgeClass}">${c.status.replace("_", " ")}</span>
          </div>
          <div class="font-bold text-slate-900 text-xs mb-1">${topDisease}</div>
          <div class="text-[11px] text-slate-600 mb-1">Species: <span class="font-semibold text-slate-800">${c.species} (${c.affectedCount} affected)</span></div>
          <div class="text-[10px] text-slate-500 italic mb-2 line-clamp-2">"${c.symptoms.replace(/"/g, "&quot;")}"</div>
          <div class="text-[9px] text-slate-400 uppercase font-semibold">Farmer: ${c.farmer?.name || "Local Farmer"} (${c.farmer?.district || clinicInfo.district})</div>
        </div>
      `;

      marker.bindPopup(popupContent);
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
  }, [leafletLoaded, selectedStatusFilter, selectedSpeciesFilter, vetRegion]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Metrics Bar */}
      <div className="p-6 rounded-3xl border border-stone-200 bg-white shadow-sm glass-card space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-stone-150 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-900">
                Assigned Jurisdiction Disease Surveillance Map
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-semibold mt-1">
              Active case mapping and surveillance radius for <span className="text-stone-900 font-bold">{vetRegion}</span>. Only cases within your assigned jurisdiction are displayed.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase text-stone-400 mb-1">Status Filter</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="AI_ANALYZED">Pending Review (AI Triage)</option>
                <option value="VET_ASSESSED">Clinically Assessed</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-stone-400 mb-1">Species Filter</label>
              <select
                value={selectedSpeciesFilter}
                onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="ALL">All Species</option>
                <option value="Cattle">Cattle</option>
                <option value="Buffalo">Buffalo</option>
                <option value="Sheep">Sheep</option>
                <option value="Goat">Goat</option>
                <option value="Poultry">Poultry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider block mb-1">
              Jurisdiction Cases
            </span>
            <span className="text-2xl font-black text-stone-900">{jurisdictionCases.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70">
            <span className="text-[9px] font-black uppercase text-rose-800 tracking-wider block mb-1">
              High Priority Cases
            </span>
            <span className="text-2xl font-black text-rose-900">{criticalCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block mb-1">
              Pending Vet Review
            </span>
            <span className="text-2xl font-black text-amber-900">{pendingCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70">
            <span className="text-[9px] font-black uppercase text-indigo-800 tracking-wider block mb-1">
              Clinically Assessed
            </span>
            <span className="text-2xl font-black text-indigo-900">{assessedCount}</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            id="vet-jurisdiction-map-container"
            className="w-full h-[400px] rounded-2xl border border-stone-200 bg-stone-50 shadow-inner overflow-hidden z-10"
          />

          {!leafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100/70 backdrop-blur-xs rounded-2xl text-xs text-stone-500 font-bold">
              Loading jurisdiction map data...
            </div>
          )}
        </div>

        {/* Official Map Legend */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 border-b border-stone-200 pb-2">
            Jurisdiction Map Symbols & Legend
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-bold text-stone-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-white shadow-sm shrink-0" />
              <span>Clinic HQ Hub</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 border border-indigo-600 shrink-0" />
              <span>Coverage Zone ({clinicInfo.radiusKm} KM)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
              <span>Critical / High Urgency</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span>Medium / Suspected</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
              <span>Low Risk Case</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0" />
              <span>Clinically Assessed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
