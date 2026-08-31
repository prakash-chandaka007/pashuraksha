"use client";

import { useEffect, useState, useRef } from "react";

interface AndhraPradeshMapProps {
  onLocationSelected: (locationInfo: {
    region: string;
    address: string;
    landmark: string;
  }) => void;
  initialRegion?: string;
  initialAddress?: string;
  initialLandmark?: string;
}

const CLINICS = [
  // Visakhapatnam District (3 Vets)
  {
    name: "Visakhapatnam Urban North (MVP Colony Clinic)",
    vet: "Dr. Srinivas Rao",
    lat: 17.7301,
    lng: 83.3323,
    radius: 15,
    span: "MVP Colony Area Clinic",
    district: "Visakhapatnam",
  },
  {
    name: "Visakhapatnam Urban South (Gajuwaka Clinic)",
    vet: "Dr. K. Prasad",
    lat: 17.6905,
    lng: 83.2091,
    radius: 15,
    span: "Gajuwaka Industrial Belt Clinic",
    district: "Visakhapatnam",
  },
  {
    name: "Bheemunipatnam Region (Bheemili Clinic)",
    vet: "Dr. G. Suresh",
    lat: 17.8893,
    lng: 83.4475,
    radius: 25,
    span: "Bheemili Port & Coastal Suburbs Center",
    district: "Visakhapatnam",
  },

  // East Godavari District (3 Vets)
  {
    name: "East Godavari Central (Kakinada Clinic)",
    vet: "Dr. Lakshmi Devi",
    lat: 16.9891,
    lng: 82.2475,
    radius: 20,
    span: "Kakinada Central Veterinary Hospital",
    district: "East Godavari",
  },
  {
    name: "East Godavari North (Rajamahendravaram Clinic)",
    vet: "Dr. A. Rama Rao",
    lat: 17.0005,
    lng: 81.7835,
    radius: 25,
    span: "Rajahmundry Urban Animal Center",
    district: "East Godavari",
  },
  {
    name: "East Godavari South (Amalapuram Clinic)",
    vet: "Dr. B. Satish",
    lat: 16.5787,
    lng: 82.0125,
    radius: 30,
    span: "Amalapuram Konaseema Care Center",
    district: "East Godavari",
  },

  // West Godavari District (3 Vets)
  {
    name: "West Godavari Central (Eluru Clinic)",
    vet: "Dr. Naidu",
    lat: 16.7108,
    lng: 81.1017,
    radius: 20,
    span: "Eluru Central Veterinary Clinic",
    district: "West Godavari",
  },
  {
    name: "West Godavari South (Bhimavaram Clinic)",
    vet: "Dr. V. Krishna",
    lat: 16.5449,
    lng: 81.5224,
    radius: 25,
    span: "Bhimavaram Aqua-Belt Clinic",
    district: "West Godavari",
  },
  {
    name: "West Godavari East (Tadepalligudem Clinic)",
    vet: "Dr. P. Radha",
    lat: 16.8143,
    lng: 81.5273,
    radius: 30,
    span: "Tadepalligudem Agri-Veterinary Hospital",
    district: "West Godavari",
  },
];

type ClinicName = typeof CLINICS[number]["name"];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AndhraPradeshMap({
  onLocationSelected,
  initialRegion = "Visakhapatnam Urban North (MVP Colony Clinic)",
  initialAddress = "",
  initialLandmark = "",
}: AndhraPradeshMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<ClinicName>(
    CLINICS.some((c) => c.name === initialRegion)
      ? (initialRegion as ClinicName)
      : CLINICS[0].name
  );
  const [address, setAddress] = useState(initialAddress);
  const [landmark, setLandmark] = useState(initialLandmark);

  const [mapAlert, setMapAlert] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

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
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      // Script is already added, wait a brief moment to check if L loaded
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

    const initialClinic = CLINICS.find((c) => c.name === selectedRegion) || CLINICS[0];
    const initialLat = initialClinic.lat;
    const initialLng = initialClinic.lng;

    const map = L.map("leaflet-map-container").setView([initialLat, initialLng], 9);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const farmerIcon = L.divIcon({
      className: "custom-farmer-icon",
      html: `<div class="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-lg animate-pulse"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: farmerIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    CLINICS.forEach((c) => {
      const clinicIcon = L.divIcon({
        className: "custom-clinic-icon",
        html: `<div class="w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-md"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([c.lat, c.lng], { icon: clinicIcon })
        .addTo(map)
        .bindPopup(`<b>${c.name.split(" (")[0]}</b><br>District: ${c.district}<br>Doctor: ${c.vet}`);

      L.circle([c.lat, c.lng], {
        color: "#4f46e5",
        fillColor: "#818cf8",
        fillOpacity: 0.1,
        radius: c.radius * 1000,
        weight: 1.5,
      }).addTo(map);
    });

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      handleMapClickOrDrag(pos.lat, pos.lng);
    });

    map.on("click", (e: any) => {
      const pos = e.latlng;
      marker.setLatLng(pos);
      handleMapClickOrDrag(pos.lat, pos.lng);
    });

    // Force Leaflet to recalculate bounds and fix partial render tile bugs in tabs/wizards
    const sizeTimeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(sizeTimeout);
      map.remove();
    };
  }, [leafletLoaded]);

  const handleMapClickOrDrag = (lat: number, lng: number) => {
    setMapAlert(null);

    let closestClinic = CLINICS[0];
    let minDistance = getDistanceKm(lat, lng, CLINICS[0].lat, CLINICS[0].lng);

    for (let i = 1; i < CLINICS.length; i++) {
      const dist = getDistanceKm(lat, lng, CLINICS[i].lat, CLINICS[i].lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestClinic = CLINICS[i];
      }
    }

    if (minDistance > 100) {
      setMapAlert("This region is outside our active service zone (Visakhapatnam, East Godavari, West Godavari). Showing nearest operational clinic details below.");
    }

    setSelectedRegion(closestClinic.name);
    
    const resolvedAddress = `Section ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    triggerCallback(closestClinic.name, resolvedAddress, landmark);
  };

  const handleTextChange = (addrVal: string, landVal: string) => {
    setAddress(addrVal);
    setLandmark(landVal);
    triggerCallback(selectedRegion, addrVal, landVal);
  };

  const triggerCallback = (reg: ClinicName, addr: string, land: string) => {
    const fullAddress = `${addr}${land ? ` (Near ${land})` : ""}, ${reg}`;
    if (onLocationSelected) {
      onLocationSelected({
        region: reg,
        address: fullAddress,
        landmark: land,
      });
    }
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setMapAlert("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    setMapAlert(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDetecting(false);

        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo([latitude, longitude], 12);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        handleMapClickOrDrag(latitude, longitude);
      },
      (error) => {
        console.warn(error);
        setDetecting(false);
        const mockClinic = CLINICS[Math.floor(Math.random() * CLINICS.length)];
        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo([mockClinic.lat, mockClinic.lng], 12);
          markerRef.current.setLatLng([mockClinic.lat, mockClinic.lng]);
        }
        handleMapClickOrDrag(mockClinic.lat, mockClinic.lng);
      },
      { timeout: 8000 }
    );
  };

  const activeClinic = CLINICS.find((c) => c.name === selectedRegion) || CLINICS[0];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          Select Your Location
        </label>
        <p className="text-xs text-slate-400">
          Click or drag the marker to choose your farm location. Supported districts for the prototype: Visakhapatnam, East Godavari, and West Godavari.
        </p>
      </div>

      {mapAlert && (
        <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-800 rounded-lg text-xs font-semibold">
          {mapAlert}
        </div>
      )}

      <div className="relative">
        <div
          id="leaflet-map-container"
          className="w-full h-[280px] rounded-lg border border-slate-200 bg-slate-50 shadow-sm overflow-hidden z-10"
        />

        {!leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm rounded-lg text-xs text-slate-500 font-semibold">
            Loading geographical map...
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">
            Assigned Veterinary Officer
          </span>
          <span className="text-sm font-bold text-slate-800">
            {activeClinic.vet}
          </span>
          <span className="text-xs text-slate-500 block font-medium">
            District: {activeClinic.district} &bull; Center: {activeClinic.span}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={detecting}
          className="px-4 py-2 rounded border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold text-xs transition cursor-pointer"
        >
          {detecting ? "Locating..." : "Use Current Location"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Street Address or Village Name
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => handleTextChange(e.target.value, landmark)}
            placeholder="e.g. Plot 12, Main Road, Kakinada"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Nearby Landmark
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => handleTextChange(address, e.target.value)}
            placeholder="e.g. Near Panchayat Building"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
}
