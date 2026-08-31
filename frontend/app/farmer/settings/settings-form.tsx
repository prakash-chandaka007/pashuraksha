"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AndhraPradeshMap from "@/components/AndhraPradeshMap";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import { translateText, formatTranslatableField } from "@/lib/services/translation";
import TranslatedText from "@/components/TranslatedText";

interface Profile {
  id: string;
  farmerId: string;
  name: string;
  phone: string;
  address?: string | null;
  district: string;
  state: string;
}

interface LivestockRecord {
  id: string;
  species: string;
  approxCount: number;
  notes?: string | null;
}

interface SecurityInfo {
  hasPassword: boolean;
  passwordLength: number;
  passwordLastChanged: string;
}

interface SettingsFormProps {
  initialProfile: Profile | null;
  userEmail: string;
  userId: string;
  initialRecords: LivestockRecord[];
  securityInfo: SecurityInfo;
}

const SPECIES_TEMPLATES = [
  { name: "Cattle", description: "Cows, bulls, and calves", emoji: "🐄" },
  { name: "Buffalo", description: "Water buffaloes", emoji: "🐃" },
  { name: "Sheep", description: "Ewes, rams, and lambs", emoji: "🐑" },
  { name: "Goat", description: "Bucks, does, and kids", emoji: "🐐" },
  { name: "Poultry", description: "Chickens, ducks, and birds", emoji: "🐓" },
  { name: "Other", description: "Horses, pigs, camels, etc.", emoji: "🐾" },
];

export default function SettingsForm({
  initialProfile,
  userEmail,
  userId,
  initialRecords,
  securityInfo,
}: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"account" | "livestock">("account");

  // Localization state
  const [lang, setLang] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )pashuraksha_lang=([^;]*)/);
    if (match && match[1]) {
      setLang(match[1] as SupportedLanguage);
    }
  }, []);

  // Profile fields state
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [name, setName] = useState(initialProfile?.name || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [address, setAddress] = useState(initialProfile?.address || "");
  const [district, setDistrict] = useState(initialProfile?.district || "");
  const [state, setState] = useState(initialProfile?.state || "");

  // Password fields state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Edit toggles for each field
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Livestock State
  const [records, setRecords] = useState<LivestockRecord[]>(initialRecords);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [approxCount, setApproxCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // UI status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Local page copy translations
  const localCopy = {
    en: {
      desc: "Configure profile locations, security password credentials, and livestock inventories.",
      edit_name: "Edit Name",
      edit_location: "Edit Location Map",
      save_landmark: "Save Landmark",
      delete_confirm: "Are you sure you want to remove",
      no_location: "No Location Defined",
      update_title: "Update Headcount",
      animals: "animals",
      inventory_desc: "Configure approximate counts of your livestock below."
    },
    te: {
      desc: "ప్రొఫైల్ స్థానాలు, పాస్‌వర్డ్ మరియు పశువుల జాబితాను కాన్ఫిగర్ చేయండి.",
      edit_name: "పేరు సవరించు",
      edit_location: "మ్యాప్ సవరించు",
      save_landmark: "ల్యాండ్‌మార్క్ సేవ్ చేయి",
      delete_confirm: "మీరు ఖచ్చితంగా తీసివేయాలనుకుంటున్నారా",
      no_location: "చిరునామా నమోదు కాలేదు",
      update_title: "సంఖ్యను నవీకరించు",
      animals: "పశువులు",
      inventory_desc: "మీ పశువుల సుమారు సంఖ్యలను ఇక్కడ కాన్ఫిగర్ చేయండి."
    },
    hi: {
      desc: "प्रोफ़ाइल स्थान, सुरक्षा पासवर्ड क्रेडेंशियल और पशुधन इन्वेंट्री कॉन्फ़िगर करें।",
      edit_name: "नाम संपादित करें",
      edit_location: "स्थान मानचित्र संपादित करें",
      save_landmark: "स्थान सहेजें",
      delete_confirm: "क्या आप वाकई निकालना चाहते हैं",
      no_location: "कोई स्थान परिभाषित नहीं है",
      update_title: "संख्या अपडेट करें",
      animals: "पशु",
      inventory_desc: "नीचे अपने पशुधन की अनुमानित संख्या कॉन्फ़िगर करें।"
    },
    ta: {
      desc: "சுயவிவர முகவரி, கடவுச்சொல் மற்றும் கால்நடை எண்ணிக்கையை மாற்றியமைக்கவும்.",
      edit_name: "பெயரைத் திருத்து",
      edit_location: "வரைபடத்தைத் திருத்து",
      save_landmark: "முகவரியைச் சேமி",
      delete_confirm: "நீக்க விரும்புகிறீர்களா",
      no_location: "முகவரி இல்லை",
      update_title: "எண்ணிக்கையை மாற்று",
      animals: "கால்நடைகள்",
      inventory_desc: "உங்கள் கால்நடைகளின் எண்ணிக்கையை கீழே மாற்றியமைக்கவும்."
    },
    kn: {
      desc: "ಪ್ರೊಫೈಲ್ ವಿಳಾಸ, ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತು ಜಾನುವಾರು ಸಂಖ್ಯೆಯನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ.",
      edit_name: "ಹೆಸರು ತಿದ್ದಿ",
      edit_location: "ವಿಳಾಸ ಮ್ಯಾಪ್ ತಿದ್ದಿ",
      save_landmark: "ವಿಳಾಸ ಉಳಿಸಿ",
      delete_confirm: "ತೆಗೆದುಹಾಕಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ",
      no_location: "ವಿಳಾಸ ದಾಖಲಾಗಿಲ್ಲ",
      update_title: "ಸಂಖ್ಯೆ ನವೀಕರಿಸಿ",
      animals: "ಜಾನುವಾರುಗಳು",
      inventory_desc: "ಕೆಳಗೆ ನಿಮ್ಮ ಜಾನುವಾರುಗಳ ಅಂದಾಜು ಸಂಖ್ಯೆಯನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ."
    }
  };

  const copy = localCopy[lang] || localCopy.en;

  // Save changes wrapper
  const handleSaveField = async (fieldType: "name" | "address" | "password") => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (fieldType === "password") {
      if (!password || password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      const payload: Record<string, string> = {};
      if (fieldType === "name") payload.name = name;
      if (fieldType === "address") {
        payload.address = address;
        payload.district = district;
        payload.state = state;
      }
      if (fieldType === "password") payload.password = password;

      const res = await fetch(`/api/farmer/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile field.");
      }

      setProfile(data.profile);
      setSuccess(`${fieldType.toUpperCase()} updated successfully.`);
      
      // Close forms
      setIsEditingName(false);
      setIsEditingAddress(false);
      setIsEditingPassword(false);
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update field.");
    } finally {
      setLoading(false);
    }
  };

  // Add/Update Livestock Record
  const handleSaveLivestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecies) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let englishNotes = notes;
      if (notes && lang !== "en") {
        englishNotes = await translateText(notes, lang, "en");
      }

      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${BACKEND_URL}/api/farmer/livestock`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": userId
        },
        body: JSON.stringify({
          species: selectedSpecies,
          approxCount,
          notes: englishNotes || notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save livestock record.");
      }

      // Update local state list
      const existingIdx = records.findIndex((r) => r.species === selectedSpecies);
      if (existingIdx > -1) {
        const nextRecords = [...records];
        nextRecords[existingIdx] = data.livestock;
        setRecords(nextRecords);
      } else {
        setRecords((prev) => [...prev, data.livestock]);
      }

      setSuccess(`Livestock catalog headcount for ${selectedSpecies} updated.`);
      setSelectedSpecies(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save livestock.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Livestock Record
  const handleDeleteLivestock = async (id: string, speciesName: string) => {
    if (!confirm(`${copy.delete_confirm} ${speciesName} from your inventory?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${BACKEND_URL}/api/farmer/livestock/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userId
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove livestock record.");
      }

      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSuccess(`Removed ${speciesName} record from catalog.`);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to remove livestock.");
    } finally {
      setLoading(false);
    }
  };

  const getRecordForSpecies = (speciesName: string) => {
    return records.find((r) => r.species.toLowerCase() === speciesName.toLowerCase());
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 font-sans">
      
      {/* Header Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900">
          {translate("settings_livestock", lang)}
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-stone-450 leading-relaxed max-w-xl">
          {copy.desc}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-8">
        <button
          onClick={() => {
            setActiveTab("account");
            setError(null);
            setSuccess(null);
          }}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "account"
              ? "border-emerald-primary text-emerald-primary"
              : "border-transparent text-stone-450 hover:text-stone-700"
          }`}
        >
          {translate("profile_security", lang)}
        </button>
        <button
          onClick={() => {
            setActiveTab("livestock");
            setError(null);
            setSuccess(null);
          }}
          className={`px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "livestock"
              ? "border-emerald-primary text-emerald-primary"
              : "border-transparent text-stone-450 hover:text-stone-700"
          }`}
        >
          {translate("livestock_catalog", lang)}
        </button>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-bold flex gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 text-xs font-bold flex gap-2">
          <span>🛡️</span>
          <span>{success}</span>
        </div>
      )}

      {/* Tab A: Account & Security */}
      {activeTab === "account" && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm divide-y divide-stone-150 overflow-hidden glass-card">
            
            {/* Field: Full Name */}
            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-1">
                  {translate("full_name", lang)}
                </span>
                {isEditingName ? (
                  <div className="flex items-center gap-2 max-w-sm mt-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-accent focus:border-emerald-accent w-full"
                    />
                    <button
                      onClick={() => handleSaveField("name")}
                      disabled={loading}
                      className="px-4 py-2.5 bg-emerald-primary text-white rounded-xl text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setName(profile?.name || "");
                        setIsEditingName(false);
                      }}
                      className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      {translate("back", lang)}
                    </button>
                  </div>
                ) : (
                  <span className="font-black text-stone-800 text-sm">
                    {profile?.name || "No Profile Configured"}
                  </span>
                )}
              </div>
              {!isEditingName && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="px-4 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  {copy.edit_name}
                </button>
              )}
            </div>

            {/* Field: Mobile Number */}
            <div className="p-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-1">
                {translate("mobile_number", lang)}
              </span>
              <span className="font-bold text-stone-850 text-sm">
                +91 {profile?.phone || userEmail}
              </span>
            </div>

            {/* Field: Address Map Location */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-1">
                    {translate("farm_location", lang)}
                  </span>
                  <p className="font-bold text-stone-800 text-xs leading-relaxed">
                    {profile?.address ? `${profile.address}, ` : ""} 
                    <span className="text-emerald-primary font-black underline underline-offset-2">
                      {profile?.district || copy.no_location}
                    </span>, {profile?.state || "Andhra Pradesh"}
                  </p>
                </div>
                {!isEditingAddress ? (
                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className="px-4 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    {copy.edit_location}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField("address")}
                      disabled={loading}
                      className="px-4 py-2.5 bg-emerald-primary text-white rounded-xl text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {copy.save_landmark}
                    </button>
                    <button
                      onClick={() => {
                        setAddress(profile?.address || "");
                        setDistrict(profile?.district || "");
                        setState(profile?.state || "");
                        setIsEditingAddress(false);
                      }}
                      className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                    >
                      {translate("back", lang)}
                    </button>
                  </div>
                )}
              </div>

              {isEditingAddress && (
                <div className="mt-4 border-t border-stone-150 pt-4 bg-stone-50 p-2.5 rounded-2xl">
                  <AndhraPradeshMap
                    initialRegion={district}
                    initialAddress={address || ""}
                    onLocationSelected={(loc) => {
                      setDistrict(loc.region);
                      setAddress(loc.address);
                      if (loc.region.includes("Godavari")) {
                        setState("Andhra Pradesh");
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Field: Password */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block mb-1">
                    {translate("password", lang)}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-mono text-base font-extrabold text-stone-700">
                      {securityInfo.hasPassword ? "•".repeat(securityInfo.passwordLength) : "No Password Configured (OTP-Only)"}
                    </span>
                    {securityInfo.hasPassword && (
                      <span className="text-[9px] text-stone-400 font-bold bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                        Last changed: {securityInfo.passwordLastChanged}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditingPassword ? (
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="px-4 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    {translate("change_pwd", lang)}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField("password")}
                      disabled={loading}
                      className="px-4 py-2.5 bg-emerald-primary text-white rounded-xl text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {translate("save_pwd", lang)}
                    </button>
                    <button
                      onClick={() => {
                        setPassword("");
                        setConfirmPassword("");
                        setIsEditingPassword(false);
                      }}
                      className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                    >
                      {translate("back", lang)}
                    </button>
                  </div>
                )}
              </div>

              {isEditingPassword && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-150 pt-4 max-w-xl animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                      {translate("new_pwd", lang)}
                    </label>
                    <input
                      type="password"
                      placeholder="Enter min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs font-bold w-full focus:outline-none focus:ring-1 focus:ring-emerald-accent focus:border-emerald-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">
                      {translate("confirm_pwd", lang)}
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="px-3.5 py-2.5 border border-stone-300 rounded-xl text-xs font-bold w-full focus:outline-none focus:ring-1 focus:ring-emerald-accent focus:border-emerald-accent"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab B: Livestock Inventory Catalog */}
      {activeTab === "livestock" && (
        <div className="space-y-8">
          {/* Add/Edit Form */}
          {selectedSpecies && (
            <form onSubmit={handleSaveLivestock} className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 glass-card animate-fadeIn">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-850 border-b border-stone-150 pb-3">
                {copy.update_title}: {selectedSpecies}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                    Approximate Headcount
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={approxCount}
                    onChange={(e) => setApproxCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-accent focus:border-emerald-accent text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                    {translate("remarks", lang)}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Mixed crossbreeds, vaccinated for FMD."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-emerald-accent focus:border-emerald-accent text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedSpecies(null)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-primary hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {translate("save_headcount", lang)}
                </button>
              </div>
            </form>
          )}

          {/* Grid list of animals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPECIES_TEMPLATES.map((species) => {
              const record = getRecordForSpecies(species.name);
              return (
                <div
                  key={species.name}
                  className="p-6 bg-white border border-stone-200 rounded-3xl shadow-sm flex flex-col justify-between glass-card glass-card-hover"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-150 pb-2 mb-2">
                      <h3 className="text-sm font-black uppercase tracking-tight text-stone-800 flex items-center gap-2">
                        <span>{species.emoji}</span>
                        <span>{species.name}</span>
                      </h3>
                      {record && (
                        <span className="text-[8px] bg-emerald-light text-emerald-primary border border-emerald-accent/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{species.description}</p>
                    
                    <div className="mt-5 p-4 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-baseline gap-2 shadow-inner">
                      <span className="text-3xl font-black text-emerald-primary">
                        {record ? record.approxCount : 0}
                      </span>
                      <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest">
                        {copy.animals}
                      </span>
                    </div>

                    {record?.notes && (
                      <p className="text-xs text-stone-600 mt-4 leading-relaxed font-bold bg-stone-50/50 p-2.5 rounded-xl border border-stone-200/80 italic">
                        &ldquo;<TranslatedText text={record.notes} lang={lang} />&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpecies(species.name);
                        setApproxCount(record?.approxCount || 1);
                        setNotes(record?.notes || "");
                      }}
                      className="flex-1 px-3 py-2.5 border border-emerald-primary text-emerald-primary font-bold text-xs rounded-xl hover:bg-emerald-light transition cursor-pointer text-center"
                    >
                      {record ? translate("update_headcount", lang) : translate("add_headcount", lang)}
                    </button>
                    {record && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLivestock(record.id, species.name)}
                        className="px-3 py-2.5 border border-red-200 text-red-700 font-bold text-xs rounded-xl hover:bg-red-50 transition cursor-pointer text-center"
                      >
                        {translate("clear", lang)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
