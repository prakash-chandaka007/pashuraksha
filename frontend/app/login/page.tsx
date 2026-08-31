"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { translate, SupportedLanguage } from "@/lib/services/i18n";
import LanguageSelector from "@/components/LanguageSelector";

export default function LoginPage() {
  // Localization state
  const [lang, setLang] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )pashuraksha_lang=([^;]*)/);
    if (match && match[1]) {
      setLang(match[1] as SupportedLanguage);
    }
  }, []);

  // Login Form States
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration Form States
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  
  // Shared OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resolvedPhone, setResolvedPhone] = useState("");
  const [isLoginOtpFlow, setIsLoginOtpFlow] = useState(false);

  // Common UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Standard Form Submission Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError(translate("enter_mobile_or_id", lang));
      return;
    }
    if (!password) {
      setError(translate("enter_pwd_or_otp", lang));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let callbackUrl = "/";
      if (!identifier.includes("@")) {
        callbackUrl = "/farmer/cases";
      } else if (identifier.includes("vet")) {
        callbackUrl = "/vet/queue";
      } else if (identifier.includes("gov") || identifier.includes("admin")) {
        callbackUrl = "/government";
      }

      const result = await signIn("credentials", {
        email: identifier,
        password: password,
        redirect: false,
      }) as { error?: string } | undefined;

      if (result?.error) {
        setError(translate("invalid_credentials", lang));
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err: unknown) {
      setError(translate("login_error", lang));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger login OTP via sending endpoint
  const handleTriggerLoginOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError(translate("enter_mobile_or_id", lang));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier, identifier }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger login verification code.");
      }

      setResolvedPhone(data.phone);
      setIsLoginOtpFlow(true);
      setOtpSent(true);
      setSuccessMessage(translate("otp_sent_success", lang));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to trigger OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Sign Up form flow triggering OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerPhone || registerPhone.length !== 10) {
      setError(translate("enter_mobile_or_id", lang));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          phone: registerPhone,
          password: registerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send registration verification code.");
      }

      setIsLoginOtpFlow(false);
      setOtpSent(true);
      setSuccessMessage(translate("otp_register_success", lang));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification and Auto-login Execution
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError(translate("enter_six_digit", lang));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: isLoginOtpFlow ? resolvedPhone : registerPhone,
          code: otpCode,
          name: isLoginOtpFlow ? undefined : registerName,
          password: isLoginOtpFlow ? undefined : registerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setSuccessMessage(translate("verification_success", lang));

      const result = await signIn("credentials", {
        email: data.phone || data.email,
        password: data.bypassToken,
        redirect: false,
      }) as { error?: string } | undefined;

      if (result?.error) {
        throw new Error(translate("session_auth_failed", lang));
      }

      window.location.href = "/farmer/cases";
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Could not connect to the backend server. Please ensure the Express backend is running on port 5000.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to verify code.");
      }
      setLoading(false);
    }
  };

  const REGIONAL_VETS = [
    { name: "Dr. Srinivas Rao (Vizag Urban)", email: "vet.officer1@pashuraksha.org" },
    { name: "Dr. K. Prasad (Gajuwaka)", email: "vet.officer2@pashuraksha.org" },
    { name: "Dr. G. Suresh (Bheemili)", email: "vet.officer3@pashuraksha.org" },
    { name: "Dr. Lakshmi Devi (East Godavari Central)", email: "vet.officer4@pashuraksha.org" },
    { name: "Dr. A. Rama Rao (East Godavari North)", email: "vet.officer5@pashuraksha.org" },
    { name: "Dr. B. Satish (East Godavari South)", email: "vet.officer6@pashuraksha.org" },
    { name: "Dr. Naidu (West Godavari Central)", email: "vet.officer7@pashuraksha.org" },
    { name: "Dr. V. Krishna (West Godavari South)", email: "vet.officer8@pashuraksha.org" },
    { name: "Dr. P. Radha (West Godavari East)", email: "vet.officer9@pashuraksha.org" },
  ];

  const handleSelectOfficial = (email: string, name: string) => {
    setIdentifier(email);
    setPassword("");
    setError(null);
    setSuccessMessage(`🔐 Secure session initialized for ${name.split(" (")[0]}. Enter official credentials to authorize.`);
    const pwdField = document.getElementById("password");
    if (pwdField) pwdField.focus();
  };

  const handleSelectGov = () => {
    setIdentifier("demo-gov@pashuraksha.org");
    setPassword("");
    setError(null);
    setSuccessMessage("🔐 Secure connection mode activated for Government Command Center. Enter password to authorize.");
    const pwdField = document.getElementById("password");
    if (pwdField) pwdField.focus();
  };

  const [showVetRegions, setShowVetRegions] = useState(false);
  const [showOfficialPanel, setShowOfficialPanel] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Graphic Accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-light/40 blur-3xl -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[65%] h-[65%] rounded-full bg-emerald-light/50 blur-3xl -z-10" />

      {/* Top Banner Selector */}
      <div className="w-full max-w-md mx-auto flex justify-between items-center pt-2 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/70 border border-stone-200/80 px-3.5 py-1.5 rounded-full shadow-sm text-[9px] font-black uppercase tracking-widest text-emerald-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
          {translate("official_banner", lang)}
        </div>
        <LanguageSelector currentLang={lang} />
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white/80 border border-stone-200/80 rounded-3xl shadow-xl p-6 md:p-8 space-y-6 glass-card">
        
        {/* Emblem Crest Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-light border border-emerald-accent/20 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm animate-pulse-ring">
            <svg className="w-8 h-8 text-emerald-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M2 12h20M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900 leading-tight">
            {translate("brand_title", lang)}
          </h1>
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mt-1">
            {translate("secure_portal", lang)}
          </p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/70 text-xs font-semibold text-red-800 flex gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-light border border-emerald-accent/20 text-xs font-semibold text-emerald-primary flex gap-2">
            <span>🛡️</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Selection Layer */}
        {otpSent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-150 pb-2.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-800">
                {translate("verify_identity", lang)}
              </h2>
              <button 
                onClick={() => {
                  setOtpSent(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[10px] font-black text-emerald-primary uppercase hover:underline"
              >
                {translate("cancel", lang)}
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl">
                <span className="text-[9px] text-stone-400 uppercase font-black tracking-wider block mb-0.5">
                  {translate("verification_sent", lang)}
                </span>
                <span className="font-mono text-sm font-bold text-stone-850">
                  {isLoginOtpFlow ? identifier : `+91 ${registerPhone}`}
                </span>
              </div>

              <div>
                <label htmlFor="regCode" className="block text-[9px] font-black uppercase tracking-wider text-stone-400 mb-1.5 text-center">
                  {translate("numerical_code", lang)}
                </label>
                <input
                  id="regCode"
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-lg font-black bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-primary hover:bg-emerald-800 text-white transition-all disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider shadow-md hover:shadow-lg"
              >
                {loading ? "Verifying..." : translate("verify_authorize", lang)}
              </button>
            </form>
          </div>
        ) : isRegisterMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-150 pb-2.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-800">
                {translate("farmer_registration", lang)}
              </h2>
              <button 
                onClick={() => {
                  setIsRegisterMode(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[10px] font-black text-emerald-primary uppercase hover:underline"
              >
                {translate("back_to_login", lang)}
              </button>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="regName" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  {translate("full_name", lang)}
                </label>
                <input
                  id="regName"
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder={translate("enter_name", lang)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent transition-all font-semibold text-xs"
                />
              </div>
              <div>
                <label htmlFor="regPhone" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  {translate("mobile_number", lang)}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-xs">+91</span>
                  <input
                    id="regPhone"
                    type="tel"
                    required
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-white border border-stone-300 rounded-xl pl-12 pr-3.5 py-2.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent transition-all font-bold text-xs"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="regPass" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                  {translate("password", lang)}
                </label>
                <input
                  id="regPass"
                  type="password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Password (minimum 6 characters)"
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent transition-all font-medium text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-primary hover:bg-emerald-800 text-white transition-all disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider shadow-md mt-2"
              >
                {loading ? "Requesting OTP..." : translate("request_otp", lang)}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex justify-between items-center border-b border-stone-150 pb-2.5">
                <h2 className="text-xs font-black uppercase tracking-wider text-stone-800">
                  {translate("sign_in", lang)}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[10px] font-black text-emerald-primary uppercase hover:underline"
                >
                  {translate("create_account", lang)}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="identifier" className="block text-[10px] font-black uppercase tracking-wider text-stone-500">
                      {translate("mobile_number", lang)}
                    </label>
                    <button
                      type="button"
                      onClick={handleTriggerLoginOtp}
                      className="text-[9px] font-black text-emerald-primary hover:underline uppercase tracking-wide cursor-pointer"
                    >
                      {translate("use_otp", lang)}
                    </button>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={translate("enter_credentials", lang)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent transition-all font-bold text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
                    {translate("password", lang)}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent transition-all font-medium text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold bg-stone-900 hover:bg-stone-955 text-white transition-all disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider shadow-md mt-2"
              >
                {loading ? "Verifying..." : translate("validate_credentials", lang)}
              </button>
            </form>

            {/* Official Directory panel */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowOfficialPanel(!showOfficialPanel);
                  setShowVetRegions(false);
                }}
                className="text-[9px] uppercase tracking-widest font-black text-stone-600 hover:text-emerald-primary cursor-pointer transition-all border border-stone-300 px-4 py-2.5 bg-stone-50 hover:bg-stone-100 w-full text-center rounded-xl"
              >
                {showOfficialPanel ? translate("close_directory", lang) : translate("open_directory", lang)}
              </button>
            </div>

            {showOfficialPanel && (
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-4">
                <h2 className="text-[9px] font-black tracking-widest uppercase text-stone-400 text-center border-b border-stone-150 pb-2">
                  {translate("official_directory", lang)}
                </h2>

                <div className="grid grid-cols-1 gap-2">
                  {!showVetRegions ? (
                    <button
                      onClick={() => setShowVetRegions(true)}
                      disabled={loading}
                      className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-250 text-left transition-all hover:border-emerald-accent cursor-pointer"
                    >
                      <div>
                        <div className="font-extrabold text-[11px] text-stone-850">
                          {translate("clinician_directory", lang)}
                        </div>
                        <div className="text-[9px] text-stone-500 font-semibold mt-0.5">
                          {translate("clinician_sub", lang)}
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-primary">&darr;</span>
                    </button>
                  ) : (
                    <div className="p-3 border border-stone-250 rounded-xl bg-white space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{translate("ap_clinicians", lang)}</span>
                        <button onClick={() => setShowVetRegions(false)} className="text-[9px] font-bold text-emerald-primary hover:underline">{translate("back", lang)}</button>
                      </div>
                      <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                        {REGIONAL_VETS.map((vet) => (
                          <button
                            key={vet.email}
                            onClick={() => handleSelectOfficial(vet.email, vet.name)}
                            disabled={loading}
                            className="w-full text-left p-2 bg-stone-50 hover:bg-emerald-light hover:border-emerald-accent/20 border border-stone-200 text-[10px] font-bold text-stone-700 transition rounded-lg"
                          >
                            {vet.name.split(" (")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSelectGov}
                    disabled={loading}
                    className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-250 text-left transition-all hover:border-emerald-accent cursor-pointer"
                  >
                    <div>
                      <div className="font-extrabold text-[11px] text-stone-850">
                        {translate("command_center", lang)}
                      </div>
                      <div className="text-[9px] text-stone-500 font-semibold mt-0.5">
                        {translate("command_center_sub", lang)}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-primary">&rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Compliance Footer */}
      <div className="w-full max-w-lg mx-auto text-center mt-8 pb-2 text-[9px] text-stone-400 font-black tracking-widest uppercase space-y-1">
        <div>{translate("auth_footer_1", lang)}</div>
        <div>{translate("auth_footer_2", lang)}</div>
      </div>
    </div>
  );
}
