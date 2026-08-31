"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AndhraPradeshMap from "@/components/AndhraPradeshMap";
import { translate, SupportedLanguage } from "@/lib/services/i18n";

interface Profile {
  id: string;
  farmerId: string;
  name: string;
  phone: string;
  address?: string | null;
  district: string;
  state: string;
}

interface ProfileFormProps {
  initialProfile: Profile | null;
  userEmail: string;
  userId: string;
}

export default function ProfileForm({ initialProfile, userEmail, userId }: ProfileFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [isEditing, setIsEditing] = useState(!initialProfile);
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

  // Form Fields State
  const [name, setName] = useState(initialProfile?.name || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [address, setAddress] = useState(initialProfile?.address || "");
  const [district, setDistrict] = useState(initialProfile?.district || "");
  const [state, setState] = useState(initialProfile?.state || "");

  const localTranslations = {
    en: {
      header_title: "Farmer Profile Setup",
      header_desc: "Register your farm profile to access livestock reporting, AI triage tools, and veterinary support.",
      profile_details: "Profile Details",
      registered_info: "Registered Information",
      email_label: "Account Email (Read-Only)",
      district_label: "District",
      state_label: "State",
      address_label: "Street Address (Optional)",
      address_placeholder: "Enter farm address details",
      save_btn: "Save Farm Profile",
      saving_btn: "Saving Profile...",
      cancel_btn: "Cancel",
      edit_btn: "Edit Profile Details",
      passport_title: "Digital Passport",
      passport_id: "PASHURAKSHA ID",
      passport_footer: "Farmer Portal Access",
      no_passport: "No Farmer ID generated yet.",
      no_passport_sub: "Fill out the form and save your details to generate your digital passport.",
      district_placeholder: "e.g. Visakhapatnam",
      state_placeholder: "e.g. Andhra Pradesh",
      name_placeholder: "Enter your full name"
    },
    te: {
      header_title: "రైతు ప్రొఫైల్ సెటప్",
      header_desc: "పశువుల నివేదికలు, ఏఐ ట్రయాజ్ సాధనాలు మరియు పశువైద్య సేవలను పొందడానికి మీ ఫారమ్ ప్రొఫైల్‌ను నమోదు చేయండి.",
      profile_details: "ప్రొఫైల్ వివరాలు",
      registered_info: "నమోదిత సమాచారం",
      email_label: "ఖాతా ఈమెయిల్ (చదవడానికి మాత్రమే)",
      district_label: "జిల్లా",
      state_label: "రాష్ట్రం",
      address_label: "వీధి చిరునామా (ఐచ్ఛికం)",
      address_placeholder: "ఫారమ్ చిరునామా వివరాలను నమోదు చేయండి",
      save_btn: "ఫారమ్ ప్రొఫైల్‌ను సేవ్ చేయి",
      saving_btn: "ప్రొఫైల్‌ను సేవ్ చేస్తోంది...",
      cancel_btn: "రద్దు చేయి",
      edit_btn: "ప్రొఫೈల్ వివరాలను సవరించండి",
      passport_title: "డిజిటల్ పాస్‌పోర్ట్",
      passport_id: "పశురక్ష ఐడి",
      passport_footer: "రైతు పోర్టల్ యాక్సెస్",
      no_passport: "ఇంకా ఎటువంటి రైతు ఐడి సృష్టించబడలేదు.",
      no_passport_sub: "మీ డిజిಟಲ್ పాస్‌పోర్ట్‌ను పొందడానికి ఫారమ్ నింపి వివరాలను సేవ్ చేయండి.",
      district_placeholder: "ఉదా: విశాఖపట్నం",
      state_placeholder: "ఉదా: ఆంధ్రప్రదేశ్",
      name_placeholder: "మీ పూర్తి పేరు నమోదు చేయండి"
    },
    hi: {
      header_title: "किसान प्रोफ़ाइल सेटअप",
      header_desc: "पशुधन रिपोर्टिंग, एआई ट्राइएज टूल और पशु चिकित्सा सहायता का उपयोग करने के लिए अपनी फॉर्म प्रोफ़ाइल पंजीकृत करें।",
      profile_details: "प्रोफ़ाइल विवरण",
      registered_info: "पंजीकृत जानकारी",
      email_label: "खाता ईमेल (केवल पढ़ने के लिए)",
      district_label: "जिला",
      state_label: "राज्य",
      address_label: "गली का पता (वैकल्पिक)",
      address_placeholder: "खेत के पते का विवरण दर्ज करें",
      save_btn: "किसान प्रोफ़ाइल सहेजें",
      saving_btn: "प्रोफ़ाइल सहेजी जा रही है...",
      cancel_btn: "रद्द करें",
      edit_btn: "प्रोफ़ाइल विवरण संपादित करें",
      passport_title: "डिजिटल पासपोर्ट",
      passport_id: "पशुरक्षा आईडी",
      passport_footer: "किसान पोर्टल एक्सेस",
      no_passport: "अभी तक कोई किसान आईडी उत्पन्न नहीं हुई है।",
      no_passport_sub: "अपना डिजिटल पासपोर्ट जनरेट करने के लिए फॉर्म भरें और अपना विवरण सहेजें।",
      district_placeholder: "जैसे: विशाखापत्तनम",
      state_placeholder: "जैसे: आंध्र प्रदेश",
      name_placeholder: "अपना पूरा नाम दर्ज करें"
    },
    ta: {
      header_title: "விவசாயி சுயவிவர அமைப்பு",
      header_desc: "கால்நடை அறிக்கை, AI முன்னுரிமை கருவிகள் மற்றும் கால்நடை மருத்துவ உதவியைப் பெற உங்கள் சுயவிவரத்தைப் பதிவு செய்யவும்.",
      profile_details: "சுயவிவர விவரங்கள்",
      registered_info: "பதிவு செய்யப்பட்ட தகவல்",
      email_label: "கணக்கு மின்னஞ்சல் (வாசிப்பு மட்டும்)",
      district_label: "மாவட்டம்",
      state_label: "மாநிலம்",
      address_label: "முகவரி (விருப்பத்தேர்வு)",
      address_placeholder: "பண்ணை முகவரி விவரங்களை உள்ளிடவும்",
      save_btn: "சுயவிவரத்தைச் சேமி",
      saving_btn: "சுயவிவரம் சேமிக்கப்படுகிறது...",
      cancel_btn: "ரத்துசெய்",
      edit_btn: "சுயவிவரத்தைத் திருத்து",
      passport_title: "டிஜிட்டல் பாஸ்போர்ட்",
      passport_id: "பசுரக்ஷா ஐடி",
      passport_footer: "விவசாயி போர்டல் அணுகல்",
      no_passport: "இன்னும் விவசாயி ஐடி உருவாக்கப்படவில்லை.",
      no_passport_sub: "டிஜிட்டல் பாஸ்போர்ட்டை உருவாக்க படிவத்தை பூர்த்தி செய்து விவரங்களை சேமிக்கவும்.",
      district_placeholder: "எ.கா: விசாகப்பட்டினம்",
      state_placeholder: "எ.கா: ஆந்திரப் பிரதேசம்",
      name_placeholder: "முழு பெயரை உள்ளிடவும்"
    },
    kn: {
      header_title: "ರೈತ ಪ್ರೊಫೈಲ್ ಸೆಟಪ್",
      header_desc: "ಜಾನುವಾರು ವರದಿ, ಎಐ ಮುನ್ಸೂಚನೆ ಪರಿಕರಗಳು ಮತ್ತು ಪಶುವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆಯಲು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ನೋಂದಾಯಿಸಿ.",
      profile_details: "ಪ್ರೊಫೈಲ್ ವಿವರಗಳು",
      registered_info: "ನೋಂದಾಯಿತ ಮಾಹಿತಿ",
      email_label: "ಖಾತೆಯ ಇಮೇಲ್ (ಓದಲು ಮಾತ್ರ)",
      district_label: "ಜಿಲ್ಲೆ",
      state_label: "ರಾಜ್ಯ",
      address_label: "ವಿಳಾಸ (ಐಚ್ಛಿಕ)",
      address_placeholder: "ಫಾರ್ಮ್ ವಿಳಾಸದ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ",
      save_btn: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ",
      saving_btn: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
      cancel_btn: "ರದ್ದುಮಾಡಿ",
      edit_btn: "ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ತಿದ್ದಿ",
      passport_title: "ಡಿಜಿಟಲ್ ಪಾಸ್‌ಪೋರ್ಟ್",
      passport_id: "ಪಶುರಕ್ಷಾ ಐಡಿ",
      passport_footer: "ರೈತ ಪೋರ್ಟಲ್ ಪ್ರವೇಶ",
      no_passport: "ಇನ್ನೂ ರೈತ ಐಡಿ ರಚನೆಯಾಗಿಲ್ಲ.",
      no_passport_sub: "ಡಿಜಿಟಲ್ ಪಾಸ್‌ಪೋರ್ಟ್ ಪಡೆಯಲು ಫಾರ್ಮ್ ತುಂಬಿ ವಿವರಗಳನ್ನು ಉಳಿಸಿ.",
      district_placeholder: "ಉದಾ: ವಿಶಾಖಪಟ್ಟಣಂ",
      state_placeholder: "ಉದಾ: ಆಂಧ್ರಪ್ರದೇಶ",
      name_placeholder: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ"
    }
  };

  const copy = localTranslations[lang] || localTranslations.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/farmer/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          phone,
          address: address || undefined,
          village: "N/A", // Default placeholder since service validates it
          taluka: "N/A", // Default placeholder
          district,
          state,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setProfile(data.profile);
      setSuccess(data.message || "Profile saved successfully!");
      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 font-sans">
      {/* Visual Header */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-black tracking-tight text-stone-900 uppercase">
          {copy.header_title}
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-stone-450 leading-relaxed max-w-2xl">
          {copy.header_desc}
        </p>
      </div>

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
        {/* Left Hand: Registration / Edit Form */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-sm glass-card">
            <h2 className="text-sm font-black uppercase tracking-wider text-stone-800 border-b border-stone-150 pb-3 mb-6">
              {isEditing ? copy.profile_details : copy.registered_info}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                  {copy.email_label}
                </label>
                <input
                  type="text"
                  disabled
                  value={userEmail}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-400 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                  {translate("full_name", lang)}
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.name_placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent bg-white text-stone-800 transition text-xs font-bold disabled:bg-stone-50 disabled:text-stone-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                  {translate("mobile_number", lang)}
                </label>
                <input
                  type="tel"
                  required
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent bg-white text-stone-800 transition text-xs font-bold disabled:bg-stone-50 disabled:text-stone-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                    {copy.district_label}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder={copy.district_placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent bg-white text-stone-800 transition text-xs font-bold disabled:bg-stone-50 disabled:text-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                    {copy.state_label}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder={copy.state_placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent bg-white text-stone-800 transition text-xs font-bold disabled:bg-stone-50 disabled:text-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                  {copy.address_label}
                </label>
                <textarea
                  disabled={!isEditing}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={copy.address_placeholder}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent bg-white text-stone-800 transition text-xs font-semibold leading-relaxed disabled:bg-stone-50 disabled:text-stone-500"
                />
              </div>

              {isEditing && (
                <div className="border-t border-stone-150 pt-6">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-550 mb-3">
                    {translate("farm_location", lang)}
                  </label>
                  <AndhraPradeshMap
                    initialRegion={district}
                    initialAddress={address}
                    onLocationSelected={({ region, address: fullAddr }) => {
                      setDistrict(region);
                      setState("Andhra Pradesh");
                      setAddress(fullAddr);
                    }}
                  />
                </div>
              )}

              {isEditing ? (
                <div className="flex gap-4 pt-4 border-t border-stone-150">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 rounded-xl font-bold bg-emerald-primary hover:bg-emerald-800 text-white transition-all disabled:opacity-50 active:scale-98 cursor-pointer text-xs uppercase tracking-wider shadow-sm"
                  >
                    {loading ? copy.saving_btn : copy.save_btn}
                  </button>
                  {profile && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(profile.name);
                        setPhone(profile.phone);
                        setAddress(profile.address || "");
                        setDistrict(profile.district);
                        setState(profile.state);
                      }}
                      className="px-6 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 font-bold text-stone-600 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      {copy.cancel_btn}
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-4 border-t border-stone-150">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full px-6 py-3 rounded-xl font-bold border border-emerald-primary text-emerald-primary hover:bg-emerald-light transition active:scale-98 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {copy.edit_btn}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Hand: Premium Digital Farmer Passport/ID Card */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl border border-stone-250 bg-stone-100/50 shadow-sm sticky top-24 glass-card">
            <h2 className="text-[10px] font-black tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">
              {copy.passport_title}
            </h2>

            {profile ? (
              <div className="relative overflow-hidden p-6 rounded-2xl border border-emerald-800 bg-stone-900 text-white shadow-lg bg-gradient-to-br from-stone-900 via-stone-950 to-emerald-950">
                
                {/* Visual Accent Badge */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-accent/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[8px] uppercase font-black tracking-widest text-emerald-accent">
                      {copy.passport_id}
                    </div>
                    <div className="text-base font-mono font-black tracking-wider mt-1 text-emerald-light">
                      {profile.farmerId}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-primary/45 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-xs font-black text-emerald-accent">+</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[8px] uppercase font-black tracking-widest text-stone-400">
                      {translate("full_name", lang)}
                    </div>
                    <div className="text-sm font-black truncate mt-0.5 text-stone-100">
                      {profile.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[8px] uppercase font-black tracking-widest text-stone-400">
                        {copy.district_label}
                      </div>
                      <div className="text-xs font-black truncate mt-0.5 text-stone-100">
                        {profile.district}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase font-black tracking-widest text-stone-400">
                        {copy.state_label}
                      </div>
                      <div className="text-xs font-black truncate mt-0.5 text-stone-100">
                        {profile.state}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer watermark */}
                <div className="border-t border-white/10 mt-6 pt-3.5 flex justify-between items-center text-[8px] text-stone-450 font-black uppercase tracking-widest">
                  <span>{copy.passport_footer}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-stone-300 text-center text-stone-400 flex flex-col items-center justify-center min-h-60 bg-white">
                <div className="w-10 h-10 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-stone-400 text-sm">🔒</span>
                </div>
                <p className="text-xs font-black uppercase tracking-wider text-stone-800">
                  {copy.no_passport}
                </p>
                <p className="text-[10px] text-stone-500 mt-1 max-w-[180px] font-semibold leading-relaxed">
                  {copy.no_passport_sub}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
