import Link from "next/link";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import Navbar from "@/components/Navbar";

export default async function Home() {
  const session = await auth();

  // Read current language from cookies
  const cookieStore = await cookies();
  const lang = (cookieStore.get("pashuraksha_lang")?.value || "en") as SupportedLanguage;

  // Localized copy for Home Page
  const homeContent = {
    en: {
      badge: "Livestock Healthcare & Disease Surveillance",
      title: "Pashuraksha",
      title_dev: "(पशुरक्षा)",
      subtitle: "A secure national portal designed for farmers to report health issues, veterinarians to submit diagnoses and prescriptions, and health departments to monitor regional epidemiological data.",
      farmer_title: "Farmer Portal",
      farmer_desc: "Manage livestock catalog, report symptoms, upload photos/audio, and monitor veterinary prescriptions.",
      vet_title: "Veterinary Portal",
      vet_desc: "Monitor active clinical triage queues, review preliminary AI insights, and submit verified case prescriptions.",
      gov_title: "Command Center",
      gov_desc: "Analyze regional outbreak data, map disease spreads, manage vaccination campaigns, and allocate resources.",
      access_portal: "Access Portal",
      access_queue: "Access Queue",
      access_dashboard: "Access Dashboard",
      dept_info: "Department of Animal Husbandry • Integrated Disease Surveillance Program"
    },
    te: {
      badge: "పశువుల ఆరోగ్యం & వ్యాధి నిఘా వేదిక",
      title: "పశురక్ష",
      title_dev: "(పशुरक्षा)",
      subtitle: "రైతులు తమ పశువుల ఆరోగ్య సమస్యలను నివేదించడానికి, పశువైద్యులు రోగనిర్ధారణ మరియు మందులను సూచించడానికి, మరియు ఆరోగ్య విభాగాలు ప్రాంతీయ వ్యాధి వ్యాప్తిని పర్యవేక్షించడానికి రూపొందించబడిన సురಕ್ಷಿತ జాతీయ ಪೋರ್ಟಲ್.",
      farmer_title: "రైతు ಪೋರ್ಟಲ್",
      farmer_desc: "పశువుల జాబಿತాను నిర్వహించండి, లక్షణాలను నివేదించండి, ఫోటోలు/ఆడియోలను అప్‌ಲೋಡ್ చేయండి మరియు ప్రిస్క్రిప్షన్‌లను చూడండి.",
      vet_title: "పశువైద్యుల ಪೋರ್ಟಲ್",
      vet_desc: "సక్రియ క్లినికల్ ట్రయాజ్ క్యూలను పర్యవేక్షించండి, ఏఐ ప్రాథమిక అంచనాలను సమీక్షించండి మరియు వైద్య నివేదికలను సమర్పించండి.",
      gov_title: "కమాండ్ సెంటర్",
      gov_desc: "ప్రాంతీయ వ్యాధి వ్యాప్తి డేటాను విశ్ಲೇషించండి, వ్యాప్తి మ్యాప్‌లను పరిశీలించండి మరియు నివారణ చర్యలను కేటాయించండి.",
      access_portal: "పోర్టల్‌ను తెరవండి",
      access_queue: "క్యూని తెరవండి",
      access_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ తెరవండి",
      dept_info: "పశుసంవర్ధక శాఖ • సమగ్ర వ్యాಧಿ నిఘా కార్యక్రమం"
    },
    hi: {
      badge: "पशुधन स्वास्थ्य और रोग निगरानी",
      title: "पशुरक्षा",
      title_dev: "(पशुरक्षा)",
      subtitle: "किसानों के लिए स्वास्थ्य समस्याओं की रिपोर्ट करने, पशु चिकित्सकों के लिए निदान और नुस्खे जमा करने, और स्वास्थ्य विभागों के लिए क्षेत्रीय महामारी विज्ञान डेटा की निगरानी के लिए एक सुरक्षित राष्ट्रीय पोर्टल।",
      farmer_title: "किसान पोर्टल",
      farmer_desc: "पशुधन सूची प्रबंधित करें, लक्षणों की रिपोर्ट करें, फ़ोटो/ऑडियो अपलोड करें और पशु चिकित्सा नुस्खे की निगरानी करें।",
      vet_title: "पशु चिकित्सक पोर्टल",
      vet_desc: "सक्रिय नैदानिक कतार की निगरानी करें, प्रारंभिक एआई अंतर्दृष्टि की समीक्षा करें, और सत्यापित नैदानिक नुस्खे दर्ज करें।",
      gov_title: "कमांड सेंटर",
      gov_desc: "क्षेत्रीय प्रकोप डेटा का विश्लेषण करें, बीमारी के प्रसार का मानचित्रण करें, और संसाधनों का आवंटन करें।",
      access_portal: "पोर्टल खोलें",
      access_queue: "कतार खोलें",
      access_dashboard: "डैशबोर्ड खोलें",
      dept_info: "पशुपालन विभाग • एकीकृत रोग निगरानी कार्यक्रम"
    },
    ta: {
      badge: "கால்நடை ஆரோக்கியம் & நோய் கண்காணிப்பு போர்டல்",
      title: "பசுரக்ஷா",
      title_dev: "(பசுரக்ஷா)",
      subtitle: "விவசாயிகள் நோய் அறிகுறிகளைப் புகாரளிக்கவும், கால்நடை மருத்துவர்கள் சிகிச்சை பரிந்துரைகளை வழங்கவும், அரசுத் துறை நோய் பரவலைக் கண்காணிக்கவும் வடிவமைக்கப்பட்ட ஒரு பாதுகாப்பான தேசிய போர்டல்.",
      farmer_title: "விவசாயி போர்டல்",
      farmer_desc: "கால்நடை பட்டியலைப் பராமரிக்கவும், அறிகுறிகளைப் புகாரளிக்கவும், புகைப்படங்கள்/ஒலிப்பதிவுகளைப் பதிவேற்றி சிகிச்சை விவரங்களைக் கண்காணிக்கவும்.",
      vet_title: "மருத்துவர் போர்டல்",
      vet_desc: "சிகிச்சை வரிசையைக் கண்காணிக்கவும், AI நோய் கணிப்பு முடிவுகளை மதிப்பாய்வு செய்து மருத்துவ பரிந்துரைகளை வழங்கவும்.",
      gov_title: "கட்டளை மையம்",
      gov_desc: "நோய் பரவல் தரவை பகுப்பாய்வு செய்யவும், பரவல் வரைபடங்களை கண்காணிக்கவும் மற்றும் மருத்துவ வளங்களை ஒதுக்கீடு செய்யவும்.",
      access_portal: "போர்டல் செல்",
      access_queue: "வரிசை செல்",
      access_dashboard: "டாஷ்போர்டு செல்",
      dept_info: "கால்நடை பராமரிப்புத் துறை • ஒருங்கிணைந்த நோய் கண்காணிப்புத் திட்டம்"
    },
    kn: {
      badge: "ಜಾನುವಾರು ಆರೋಗ್ಯ ಮತ್ತು ರೋಗ ತಡೆಗಟ್ಟುವಿಕೆ ನಿಗಾ",
      title: "ಪಶುರಕ್ಷಾ",
      title_dev: "(ಪಶುರಕ್ಷಾ)",
      subtitle: "ರೈತರು ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು, ಪಶುವೈದ್ಯರು ರೋಗನಿರ್ಣಯ ಮತ್ತು ಚಿಕಿತ್ಸಾ ಸೂಚನೆಗಳನ್ನು ನೀಡಲು, ಮತ್ತು ಆರೋಗ್ಯ ಇಲಾಖೆಗಳು ಸಾಂಕ್ರಾಮಿಕ ರೋಗ ಹರಡುವಿಕೆಯನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲು ರೂಪಿಸಿದ ಸುರಕ್ಷಿತ ರಾಷ್ಟ್ರೀಯ ಪೋರ್ಟಲ್.",
      farmer_title: "ರೈತ ಪೋರ್ಟಲ್",
      farmer_desc: "ಜಾನುವಾರು ಪಟ್ಟಿ ನಿರ್ವಹಿಸಿ, ಲಕ್ಷಣಗಳನ್ನು ವರದಿ ಮಾಡಿ, ಫೋಟೋ/ಆಡಿಯೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಔಷಧಿ ಚೀಟಿ ವೀಕ್ಷಿಸಿ.",
      vet_title: "ಪಶುವೈದ್ಯರ ಪೋರ್ಟಲ್",
      vet_desc: "ಸಕ್ರಿಯ ವೈದ್ಯಕೀಯ ಕ್ಯೂ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ, ಎಐ ಪ್ರಾಥಮಿಕ ಮುನ್ಸೂಚನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಚಿಕಿತ್ಸಾ ಯೋಜನೆ ದಾಖಲಿಸಿ.",
      gov_title: "ಕಮಾಂಡ್ ಸೆಂಟರ್",
      gov_desc: "ಪ್ರಾದೇಶಿಕ ರೋಗ ಹರಡುವಿಕೆ ಡೇಟಾ ವಿಶ್ಲೇಷಿಸಿ, ಹರಡುವಿಕೆಯ ನಕ್ಷೆ ವೀಕ್ಷಿಸಿ ಮತ್ತು ವೈದ್ಯಕೀಯ ಸಂಪನ್ಮೂಲಗಳನ್ನು ಹಂಚಿಕೆ ಮಾಡಿ.",
      access_portal: "ಪೋರ್ಟಲ್‌ಗೆ ಹೋಗಿ",
      access_queue: "ಕ್ಯೂಗೆ ಹೋಗಿ",
      access_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ",
      dept_info: "ಪಶುಸಂಗೋಪನಾ ಇಲಾಖೆ • ಸಮಗ್ರ ರೋಗ ನಿಗಾ ಕಾರ್ಯಕ್ರಮ"
    }
  };

  const copy = homeContent[lang] || homeContent.en;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between">
      {/* Dynamic Navbar */}
      <Navbar />

      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center gap-12 my-6">
        
        {/* Banner Badge & Title */}
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200/80 text-[10px] font-black uppercase tracking-widest text-emerald-primary shadow-sm animate-pulse-ring">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
            {copy.badge}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-stone-900 leading-tight">
            {copy.title} <span className="text-emerald-primary font-black">{copy.title_dev}</span>
          </h1>
          <p className="text-sm md:text-base text-stone-600 max-w-2xl mx-auto font-medium leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* Action Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-2">
          
          {/* Farmer Portal Option */}
          <Link
            href="/farmer/cases"
            className="group flex flex-col justify-between p-6 bg-white border border-stone-200/80 rounded-2xl shadow-sm hover:border-emerald-accent/50 hover:shadow-md transition-all duration-300 text-left glass-card glass-card-hover"
          >
            <div>
              <div className="w-10 h-10 bg-emerald-light border border-emerald-accent/20 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-105 group-hover:bg-emerald-50">
                <svg className="w-5 h-5 text-emerald-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="text-[10px] font-black text-emerald-primary uppercase tracking-widest mb-1.5">
                {copy.farmer_title}
              </div>
              <h2 className="text-lg font-black text-stone-900 mb-2 leading-tight">
                {lang === "te" ? "పశువులు & కేసులు" : lang === "hi" ? "पशुधन और मामले" : lang === "ta" ? "கால்நடைகள் & வழக்குகள்" : lang === "kn" ? "ಜಾನುವಾರು & ಪ್ರಕರಣಗಳು" : "Livestock & Cases"}
              </h2>
              <p className="text-xs text-stone-500 font-medium leading-relaxed mb-6">
                {copy.farmer_desc}
              </p>
            </div>
            <span className="text-[10px] font-black text-emerald-primary group-hover:text-emerald-accent uppercase tracking-wider flex items-center gap-1">
              {copy.access_portal} &rarr;
            </span>
          </Link>

          {/* Veterinarian Portal Option */}
          <Link
            href="/vet/queue"
            className="group flex flex-col justify-between p-6 bg-white border border-stone-200/80 rounded-2xl shadow-sm hover:border-emerald-accent/50 hover:shadow-md transition-all duration-300 text-left glass-card glass-card-hover"
          >
            <div>
              <div className="w-10 h-10 bg-emerald-light border border-emerald-accent/20 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-105 group-hover:bg-emerald-50">
                <svg className="w-5 h-5 text-emerald-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="text-[10px] font-black text-emerald-primary uppercase tracking-widest mb-1.5">
                {copy.vet_title}
              </div>
              <h2 className="text-lg font-black text-stone-900 mb-2 leading-tight">
                {lang === "te" ? "ట్రయాజ్ & క్యూ" : lang === "hi" ? "वर्गीकरण और कतार" : lang === "ta" ? "முன்னுரிமை & வரிசை" : lang === "kn" ? "ವರ್ಗೀಕರಣ & ಕ್ಯೂ" : "Triage & Queue"}
              </h2>
              <p className="text-xs text-stone-500 font-medium leading-relaxed mb-6">
                {copy.vet_desc}
              </p>
            </div>
            <span className="text-[10px] font-black text-emerald-primary group-hover:text-emerald-accent uppercase tracking-wider flex items-center gap-1">
              {copy.access_queue} &rarr;
            </span>
          </Link>

          {/* Government command Center Option */}
          <Link
            href="/government"
            className="group flex flex-col justify-between p-6 bg-white border border-stone-200/80 rounded-2xl shadow-sm hover:border-emerald-accent/50 hover:shadow-md transition-all duration-300 text-left glass-card glass-card-hover"
          >
            <div>
              <div className="w-10 h-10 bg-emerald-light border border-emerald-accent/20 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-105 group-hover:bg-emerald-50">
                <svg className="w-5 h-5 text-emerald-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="text-[10px] font-black text-emerald-primary uppercase tracking-widest mb-1.5">
                {copy.gov_title}
              </div>
              <h2 className="text-lg font-black text-stone-900 mb-2 leading-tight">
                {lang === "te" ? "అంటువ్యాధి ఇంటెల్" : lang === "hi" ? "महामारी खुफिया" : lang === "ta" ? "தொற்று நோய் கண்காணிப்பு" : lang === "kn" ? "ಸಾಂಕ್ರಾಮಿಕ ಇಂಟೆಲ್" : "Epidemic Intel"}
              </h2>
              <p className="text-xs text-stone-500 font-medium leading-relaxed mb-6">
                {copy.gov_desc}
              </p>
            </div>
            <span className="text-[10px] font-black text-emerald-primary group-hover:text-emerald-accent uppercase tracking-wider flex items-center gap-1">
              {copy.access_dashboard} &rarr;
            </span>
          </Link>

        </div>

      </main>

      {/* Footer specifications */}
      <footer className="w-full text-center border-t border-stone-200 py-6 bg-white/70">
        <div className="text-[9px] text-stone-400 font-extrabold tracking-widest uppercase">
          {copy.dept_info}
        </div>
      </footer>
    </div>
  );
}
