"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
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

  // Standard Form Submission Login (Password or direct OTP entry if they already typed code)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError("Please enter your Mobile Number, Farmer ID, or Email.");
      return;
    }
    if (!password) {
      setError("Please enter your Password or verification OTP code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let callbackUrl = "/";
      if (!identifier.includes("@")) {
        // Mobile number or Farmer ID
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
        setError("Invalid credentials. Please verify your Password/OTP or trigger a new verification code.");
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err: unknown) {
      setError("An unexpected error occurred during login.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger login OTP via sending endpoint
  const handleTriggerLoginOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError("Please enter your Mobile Number or Farmer ID first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identifier }), // API param maps identifier to phone
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger login verification code.");
      }

      setResolvedPhone(data.phone);
      setOtpSent(true);
      setIsLoginOtpFlow(true);
      setSuccessMessage("Login verification code generated. Please check your backend terminal console logs.");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Could not connect to the backend server. Please ensure the Express backend is running on port 5000 (cd backend && npm run dev).");
      } else {
        setError(err instanceof Error ? err.message : "Failed to trigger login code.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Farmer Registration OTP Trigger
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!registerName || registerName.trim().length < 3) {
      setError("Please enter your full name (minimum 3 characters).");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(registerPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setError("Please create a password of at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: registerPhone, name: registerName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setOtpSent(true);
      setIsLoginOtpFlow(false);
      setSuccessMessage("Verification code generated. Please check your backend terminal console logs.");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Could not connect to the backend server. Please ensure the Express backend is running on port 5000 (cd backend && npm run dev).");
      } else {
        setError(err instanceof Error ? err.message : "Failed to send OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Log In / Register
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      setError("Please enter a valid 6-digit numerical code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const targetPhone = isLoginOtpFlow ? resolvedPhone : registerPhone;
      const targetName = isLoginOtpFlow ? "" : registerName;

      // 1. Verify OTP code
      const res = await fetch(`${BACKEND_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: targetPhone, 
          name: targetName || undefined, 
          code: otpCode,
          password: isLoginOtpFlow ? undefined : registerPassword
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setSuccessMessage("Verification successful. Authorizing session...");

      // 2. Automatically log in the user via NextAuth using secure signed bypassToken
      const result = await signIn("credentials", {
        email: data.phone || data.email,
        password: data.bypassToken,
        redirect: false,
      }) as { error?: string } | undefined;

      if (result?.error) {
        throw new Error("Session authorization failed.");
      }

      window.location.href = "/farmer/cases";
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Could not connect to the backend server. Please ensure the Express backend is running on port 5000 (cd backend && npm run dev).");
      } else {
        setError(err instanceof Error ? err.message : "Failed to verify code.");
      }
      setLoading(false);
    }
  };

  // Demo Login Quick-Launcher
  const handleQuickLogin = async (role: "farmer" | "vet" | "gov", vetEmail?: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/register-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, vetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to provision demo account.");
      }

      let callbackUrl = "/";
      if (role === "farmer") callbackUrl = "/farmer/cases";
      if (role === "vet") callbackUrl = "/vet/queue";
      if (role === "gov") callbackUrl = "/government";

      await signIn("credentials", {
        email: data.email,
        password: "password",
        redirect: true,
        callbackUrl,
      });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to register or login demo account.");
      setLoading(false);
    }
  };

  const REGIONAL_VETS = [
    { name: "Dr. Srinivas Rao (Vizag Urban North)", email: "vet.officer1@pashuraksha.org" },
    { name: "Dr. K. Prasad (Vizag Urban South)", email: "vet.officer2@pashuraksha.org" },
    { name: "Dr. G. Suresh (Vizag Bheemili)", email: "vet.officer3@pashuraksha.org" },
    { name: "Dr. Lakshmi Devi (East Godavari Central)", email: "vet.officer4@pashuraksha.org" },
    { name: "Dr. A. Rama Rao (East Godavari North)", email: "vet.officer5@pashuraksha.org" },
    { name: "Dr. B. Satish (East Godavari South)", email: "vet.officer6@pashuraksha.org" },
    { name: "Dr. Naidu (West Godavari Central)", email: "vet.officer7@pashuraksha.org" },
    { name: "Dr. V. Krishna (West Godavari South)", email: "vet.officer8@pashuraksha.org" },
    { name: "Dr. P. Radha (West Godavari East)", email: "vet.officer9@pashuraksha.org" },
  ];

  const [showVetRegions, setShowVetRegions] = useState(false);
  const [showOfficialPanel, setShowOfficialPanel] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Block */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Pashuraksha <span className="text-indigo-600">Portal</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {isRegisterMode 
              ? "Register a new Farmer account via mobile OTP" 
              : "Access your dashboard or sign up as a farmer"
            }
          </p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 text-center font-medium">
            Error: {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 text-center font-medium">
            Success: {successMessage}
          </div>
        )}

        {/* Render Register/Verify Form OR Sign In Form */}
        {otpSent ? (
          /* ====================================================
             OTP VERIFICATION CODE ENTRY SCREEN (SHARED)
             ==================================================== */
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Enter Verification Code</h2>
              <button 
                onClick={() => {
                  setOtpSent(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-indigo-655 hover:underline"
              >
                Back
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="text-xs text-slate-500 font-medium">Code generated for</div>
                <div className="font-bold text-slate-900">
                  {isLoginOtpFlow ? identifier : `+91 ${registerPhone}`}
                </div>
              </div>

              <div>
                <label htmlFor="regCode" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  id="regCode"
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-xl font-extrabold bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder:text-slate-350 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </form>
          </div>
        ) : isRegisterMode ? (
          /* ====================================================
             FARMER REGISTRATION DETAILS INPUT FORM
             ==================================================== */
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Farmer Sign Up</h2>
              <button 
                onClick={() => {
                  setIsRegisterMode(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-indigo-650 hover:underline"
              >
                Back to Login
              </button>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="regName" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Full Name
                </label>
                <input
                  id="regName"
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
                />
              </div>
              <div>
                <label htmlFor="regPhone" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Indian Mobile Number (10 Digits)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 font-bold text-sm">+91</span>
                  <input
                    id="regPhone"
                    type="tel"
                    required
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-14 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="regPass" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Create Account Password
                </label>
                <input
                  id="regPass"
                  type="password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Sending Code..." : "Verify Mobile via OTP"}
              </button>
            </form>
          </div>
        ) : (
          /* ====================================================
             STANDARD SIGN IN FORM (PASSWORD OR OTP INTAKE)
             ==================================================== */
          <div className="space-y-6">
            <form onSubmit={handleLogin} className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Sign In</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-indigo-650 hover:underline font-bold"
                >
                  Create Farmer Account &rarr;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="identifier" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Mobile Number or Farmer ID
                    </label>
                    <button
                      type="button"
                      onClick={handleTriggerLoginOtp}
                      className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wide cursor-pointer"
                    >
                      Login via OTP instead
                    </button>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or FRM-2026-XXXXXX"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Account Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>

            {/* Toggle Link for Veterinarian / Govt Officer login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowOfficialPanel(!showOfficialPanel);
                  setShowVetRegions(false);
                }}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline cursor-pointer transition-all"
              >
                {showOfficialPanel ? "Hide official portals" : "Official Portal: Log in as Veterinarian or Government Officer"}
              </button>
            </div>

            {showOfficialPanel && (
              <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
                <h2 className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 text-center border-b border-slate-100 pb-2">
                  Official Verification & Terms of Access
                </h2>
                
                <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">
                  Access is restricted to authorized state clinical practitioners and government epidemiology surveyors. All diagnostic reports, prescription updates, and resource allocation actions are logged with timestamps and cryptographically linked to your official credentials.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  {!showVetRegions ? (
                    <button
                      onClick={() => setShowVetRegions(true)}
                      disabled={loading}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all hover:border-indigo-300 cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800">Veterinary Officer Logins</div>
                        <div className="text-[10px] text-slate-500 font-semibold">Select regional clinic to access queue</div>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-600">&darr;</span>
                    </button>
                  ) : (
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select clinic region</span>
                        <button onClick={() => setShowVetRegions(false)} className="text-[9px] font-bold text-indigo-650 hover:underline">Back</button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                        {REGIONAL_VETS.map((vet) => (
                          <button
                            key={vet.email}
                            onClick={() => handleQuickLogin("vet", vet.email)}
                            disabled={loading}
                            className="w-full text-left p-2 bg-white hover:bg-slate-100 border border-slate-100 rounded text-[11px] font-semibold text-slate-700 transition"
                          >
                            {vet.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleQuickLogin("gov")}
                    disabled={loading}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all hover:border-indigo-300 cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800">Government Command Center</div>
                      <div className="text-[10px] text-slate-500 font-semibold">Epidemic surveillance & alerts dispatch</div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-600">&rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
