"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import TranslatedText from "@/components/TranslatedText";

interface LivestockRecord {
  id: string;
  species: string;
  approxCount: number;
  notes?: string | null;
}

interface LivestockListProps {
  userId: string;
  farmerId: string;
  initialRecords: LivestockRecord[];
}

const SPECIES_TEMPLATES = [
  { name: "Cattle", description: "Cows, bulls, and calves", emoji: "🐄" },
  { name: "Buffalo", description: "Water buffaloes", emoji: "🐃" },
  { name: "Sheep", description: "Ewes, rams, and lambs", emoji: "🐑" },
  { name: "Goat", description: "Bucks, does, and kids", emoji: "🐐" },
  { name: "Poultry", description: "Chickens, ducks, and birds", emoji: "🐓" },
  { name: "Other", description: "Horses, pigs, camels, etc.", emoji: "🐾" },
];

export default function LivestockList({ userId, farmerId, initialRecords }: LivestockListProps) {
  const router = useRouter();
  const [records, setRecords] = useState<LivestockRecord[]>(initialRecords);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [approxCount, setApproxCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Localization state
  const [lang, setLang] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )pashuraksha_lang=([^;]*)/);
    if (match && match[1]) {
      setLang(match[1] as SupportedLanguage);
    }
  }, []);

  const localTranslations = {
    en: {
      header_title: "Livestock Catalog",
      header_desc: "Maintain approximate headcounts of your livestock. Individual animal registration is not required.",
      headcount: "headcount",
      headcount_log: "Headcount Log",
      no_notes: "No condition notes logged.",
      update_btn: "Update Catalog",
      add_btn: "Add Catalog",
      delete_confirm: "Are you sure you want to clear the headcount for",
      delete_success: "Cleared headcount record successfully.",
      save_success: "Successfully updated headcount.",
      notes_label: "Remarks / Condition Notes",
      notes_placeholder: "e.g. Health status, vaccination dates, remarks...",
      save_btn: "Save Headcount",
      clear_btn: "Clear record",
      cancel_btn: "Cancel"
    },
    te: {
      header_title: "పశువుల కేటలాగ్",
      header_desc: "మీ పశువుల సుమారు సంఖ్యను నిర్వహించండి. వ్యక్తిగత జంతువుల నమోదు అవసరం లేదు.",
      headcount: "పశువుల సంఖ్య",
      headcount_log: "సంఖ్య నమోదు లాగ్",
      no_notes: "ఎటువంటి వ్యాఖ్యలు లేవు.",
      update_btn: "కేటలాగ్‌ను నవీకరించు",
      add_btn: "కేటలాగ్‌కు జోడించు",
      delete_confirm: "మీరు ఖచ్చితంగా ఈ జంతువుల సంఖ్యను తొలగించాలనుకుంటున్నారా?",
      delete_success: "సంఖ్య రికార్డు విజయవంతంగా తొలగించబడింది.",
      save_success: "పశువుల సంఖ్య విజయవంతంగా నవీకరించబడింది.",
      notes_label: "వ్యాఖ్యలు / స్థితి గమనికలు",
      notes_placeholder: "ఉదా: ఆరోగ్య స్థితి, టీకా తేదీలు, వ్యాఖ్యలు...",
      save_btn: "సంఖ్యను సేవ్ చేయి",
      clear_btn: "రికార్డును క్లియర్ చేయి",
      cancel_btn: "రద్దు చేయి"
    },
    hi: {
      header_title: "पशुधन कैटलॉग",
      header_desc: "अपने पशुधन की अनुमानित संख्या बनाए रखें। व्यक्तिगत पशु पंजीकरण की आवश्यकता नहीं है।",
      headcount: "पशु संख्या",
      headcount_log: "पशु संख्या लॉग",
      no_notes: "कोई टिप्पणी दर्ज नहीं है।",
      update_btn: "कैटलॉग अपडेट करें",
      add_btn: "कैटलॉग में जोड़ें",
      delete_confirm: "क्या आप वाकई पशु संख्या को साफ़ करना चाहते हैं?",
      delete_success: "संख्या रिकॉर्ड सफलतापूर्वक साफ़ कर दिया गया है।",
      save_success: "पशुधन संख्या सफलतापूर्वक अपडेट की गई।",
      notes_label: "टिप्पणी / स्वास्थ्य नोट्स",
      notes_placeholder: "जैसे: स्वास्थ्य की स्थिति, टीकाकरण की तारीखें, टिप्पणियां...",
      save_btn: "संख्या सहेजें",
      clear_btn: "रिकॉर्ड साफ़ करें",
      cancel_btn: "रद्द करें"
    },
    ta: {
      header_title: "கால்நடை அட்டவணை",
      header_desc: "கால்நடைகளின் தோராயமான எண்ணிக்கையைப் பராமரிக்கவும். தனி விலங்குப் பதிவு தேவையில்லை.",
      headcount: "எண்ணிக்கை",
      headcount_log: "எண்ணிக்கை பதிவு",
      no_notes: "குறிப்புகள் எதுவும் இல்லை.",
      update_btn: "அட்டவணையை மாற்று",
      add_btn: "அட்டவணையில் சேர்",
      delete_confirm: "எண்ணிக்கையை நீக்க விரும்புகிறீர்களா?",
      delete_success: "எண்ணிக்கை வெற்றிகரமாக நீக்கப்பட்டது.",
      save_success: "எண்ணிக்கை வெற்றிகரமாக புதுப்பிக்கப்பட்டது.",
      notes_label: "குறிப்புகள் / ஆரோக்கிய விவரங்கள்",
      notes_placeholder: "எ.கா: உடல்நிலை, தடுப்பூசி தேதிகள், குறிப்புகள்...",
      save_btn: "எண்ணிக்கையைச் சேமி",
      clear_btn: "பதிவை நீக்கு",
      cancel_btn: "ரத்துசெய்"
    },
    kn: {
      header_title: "ಜಾನುವಾರು ಕ್ಯಾಟಲಾಗ್",
      header_desc: "ನಿಮ್ಮ ಜಾನುವಾರುಗಳ ಅಂದಾಜು ಸಂಖ್ಯೆಯನ್ನು ನಿರ್ವಹಿಸಿ. ಪ್ರತ್ಯೇಕ ಪ್ರಾಣಿ ನೋಂದಣಿ ಅಗತ್ಯವಿಲ್ಲ.",
      headcount: "ಜಾನುವಾರು ಸಂಖ್ಯೆ",
      headcount_log: "ಸಂಖ್ಯೆ ದಾಖಲೆ ಲಾಗ್",
      no_notes: "ಯಾವುದೇ ಟಿಪ್ಪಣಿಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
      update_btn: "ಕ್ಯಾಟಲಾಗ್ ನವೀಕರಿಸಿ",
      add_btn: "ಕ್ಯಾಟಲಾಗ್‌ಗೆ ಸೇರಿಸಿ",
      delete_confirm: "ನೀವು ಜಾನುವಾರುಗಳ ಸಂಖ್ಯೆಯನ್ನು ತೆಗೆದುಹಾಕಲು ಖಚಿತವಾಗಿದ್ದೀರಾ?",
      delete_success: "ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.",
      save_success: "ಜಾನುವಾರು ಸಂಖ್ಯೆ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.",
      notes_label: "ಟಿಪ್ಪಣಿಗಳು / ಆರೋಗ್ಯ ವಿವರಗಳು",
      notes_placeholder: "ಉದಾ: ಆರೋಗ್ಯ ಸ್ಥಿತಿ, ಲಸಿಕೆ ದಿನಾಂಕಗಳು, ಟಿಪ್ಪಣಿಗಳು...",
      save_btn: "ಸಂಖ್ಯೆ ಉಳಿಸಿ",
      clear_btn: "ದಾಖಲೆ ತೆಗೆದುಹಾಕಿ",
      cancel_btn: "ರದ್ದುಮಾಡಿ"
    }
  };

  const copy = localTranslations[lang] || localTranslations.en;

  // Find record for template
  const getRecordForSpecies = (speciesName: string) => {
    return records.find((r) => r.species === speciesName);
  };

  const handleOpenEditor = (speciesName: string) => {
    const existing = getRecordForSpecies(speciesName);
    setSelectedSpecies(speciesName);
    setApproxCount(existing?.approxCount || 0);
    setNotes(existing?.notes || "");
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecies) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/farmer/livestock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        credentials: "include",
        body: JSON.stringify({
          species: selectedSpecies,
          approxCount: Number(approxCount),
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update livestock headcount.");
      }

      // Update local state
      const updatedRecord: LivestockRecord = data.livestock;
      setRecords((prev) => {
        const index = prev.findIndex((r) => r.species === selectedSpecies);
        if (index !== -1) {
          const next = [...prev];
          next[index] = updatedRecord;
          return next;
        }
        return [...prev, updatedRecord];
      });

      setSuccess(`${copy.save_success} (${selectedSpecies})`);
      setSelectedSpecies(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string, speciesName: string) => {
    if (!confirm(`${copy.delete_confirm} ${speciesName}?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/farmer/livestock/${recordId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userId,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete livestock headcount.");
      }

      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setSuccess(`${copy.delete_success} (${speciesName})`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 font-sans">
      {/* Header Section */}
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-stone-900 uppercase">
            {copy.header_title}
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-stone-450 leading-relaxed max-w-xl">
            {copy.header_desc}
          </p>
        </div>
      </div>

      {/* Prominent Farmer ID Display Banner */}
      {farmerId && (
        <div className="mb-8 p-4 rounded-2xl bg-white border border-stone-200 text-stone-850 text-xs font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm glass-card">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-accent rounded-full animate-pulse-ring" />
            <span className="text-stone-500 font-black uppercase tracking-wider">
              {translate("farmer_id", lang)}: 
            </span>
            <span className="font-mono text-sm font-black text-stone-900 bg-stone-100 border border-stone-200 px-3.5 py-1 rounded-xl shadow-inner">
              {farmerId}
            </span>
          </div>
          <span className="text-[10px] font-bold text-stone-450 uppercase tracking-wider">
            Use Farmer ID or Mobile Number to log in.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-bold flex gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold flex gap-2">
          <span>🛡️</span>
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Grid: Card Listings */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SPECIES_TEMPLATES.map((species) => {
            const record = getRecordForSpecies(species.name);
            return (
              <div
                key={species.name}
                className="relative p-6 rounded-2xl border border-stone-200 bg-white shadow-sm flex flex-col justify-between min-h-48 glass-card glass-card-hover"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2 border-b border-stone-150 pb-2">
                    <h3 className="text-base font-black text-stone-850 uppercase tracking-tight flex items-center gap-2">
                      <span>{species.emoji}</span>
                      <span>{species.name}</span>
                    </h3>
                    {record && (
                      <span className="text-[9px] bg-emerald-light text-emerald-primary border border-emerald-accent/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-4">
                    {species.description}
                  </p>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tight text-emerald-primary">
                      {record?.approxCount || 0}
                    </span>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                      {copy.headcount}
                    </span>
                  </div>

                  {record?.notes && (
                    <div className="mt-4 p-2 bg-stone-50 border border-stone-150 rounded-xl text-[10px] text-stone-600 font-semibold italic">
                      &ldquo;<TranslatedText text={record.notes} lang={lang} />&rdquo;
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-2 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => handleOpenEditor(species.name)}
                    className="flex-1 text-center py-2.5 rounded-xl text-[9px] font-black border border-stone-300 hover:bg-stone-50 text-stone-700 transition uppercase tracking-wider cursor-pointer"
                  >
                    {record ? copy.update_btn : copy.add_btn}
                  </button>
                  {record && (
                    <button
                      onClick={() => handleDelete(record.id, species.name)}
                      className="px-3 text-center py-2.5 rounded-xl text-[9px] font-black border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition uppercase tracking-wider cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Hand Side Editor Pane */}
        <div className="lg:col-span-1">
          {selectedSpecies ? (
            <div className="p-6 rounded-2xl border border-stone-250 bg-white shadow-sm sticky top-24 glass-card animate-fadeIn">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-850 border-b border-stone-150 pb-3 mb-5">
                {copy.headcount_log}: {selectedSpecies}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                    {copy.headcount}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={approxCount}
                    onChange={(e) => setApproxCount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent bg-white text-stone-800 transition text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                    {copy.notes_label}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={copy.notes_placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent bg-white text-stone-800 transition text-xs font-semibold leading-relaxed"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-emerald-primary hover:bg-emerald-800 text-white transition-all text-[10px] uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    {loading ? "Saving..." : copy.save_btn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSpecies(null)}
                    className="py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 font-bold text-stone-600 transition text-[10px] uppercase tracking-wider cursor-pointer"
                  >
                    {copy.cancel_btn}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-stone-250 bg-stone-100/50 shadow-sm sticky top-24 glass-card text-center min-h-60 flex flex-col items-center justify-center">
              <span className="text-3xl mb-3">📊</span>
              <p className="text-xs font-black uppercase text-stone-700">No Editor Active</p>
              <p className="text-[10px] text-stone-500 mt-1 max-w-[200px] font-bold uppercase tracking-wider leading-relaxed">
                Click update/add on any card to update livestock counts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
