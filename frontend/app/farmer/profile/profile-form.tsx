"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AndhraPradeshMap from "@/components/AndhraPradeshMap";

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

  // Form Fields State
  const [name, setName] = useState(initialProfile?.name || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [address, setAddress] = useState(initialProfile?.address || "");
  const [district, setDistrict] = useState(initialProfile?.district || "");
  const [state, setState] = useState(initialProfile?.state || "");

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
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      {/* Visual Header */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Farmer Profile Setup
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Register your farm profile to access livestock reporting, AI triage tools, and veterinary support.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm">
          Success: {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Hand: Registration / Edit Form */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              {isEditing ? "Profile Details" : "Registered Information"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Account Email (Read-Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={userEmail}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-650 focus:border-indigo-650 bg-white text-slate-800 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Mobile Number (Indian 10-digit)
                </label>
                <input
                  type="tel"
                  required
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-655 focus:border-indigo-655 bg-white text-slate-800 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  District
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-650 focus:border-indigo-650 bg-white text-slate-800 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  State
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-650 focus:border-indigo-650 bg-white text-slate-800 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Street Address (Optional)
                </label>
                <textarea
                  disabled={!isEditing}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter farm address details"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-650 focus:border-indigo-650 bg-white text-slate-800 transition text-sm"
                />
              </div>

              {isEditing && (
                <div className="border-t border-slate-100 pt-6">
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
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
                  >
                    {loading ? "Saving Profile..." : "Save Farm Profile"}
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
                      className="px-6 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full px-6 py-2.5 rounded-lg font-semibold border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition active:scale-98 cursor-pointer"
                  >
                    Edit Profile Details
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Hand: Premium Digital Farmer Passport/ID Card */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 shadow-sm sticky top-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
              Digital Passport
            </h2>

            {profile ? (
              <div className="relative overflow-hidden p-6 rounded-lg border border-slate-350 bg-slate-800 text-white shadow-md">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
                      PASHURAKSHA ID
                    </div>
                    <div className="text-lg font-mono font-bold tracking-tight mt-1">
                      {profile.farmerId}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[9px] uppercase font-semibold text-slate-300">
                      Farmer Name
                    </div>
                    <div className="text-base font-bold truncate mt-0.5">
                      {profile.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] uppercase font-semibold text-slate-300">
                        District
                      </div>
                      <div className="text-sm font-bold truncate mt-0.5">
                        {profile.district}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-semibold text-slate-300">
                        State
                      </div>
                      <div className="text-sm font-bold truncate mt-0.5">
                        {profile.state}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer watermark */}
                <div className="border-t border-slate-700 mt-6 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Farmer Portal Access</span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-lg border border-dashed border-slate-300 text-center text-slate-400 flex flex-col items-center justify-center min-h-60 bg-white">
                <p className="text-sm font-medium">
                  No Farmer ID generated yet.
                </p>
                <p className="text-xs text-slate-450 mt-1 max-w-[180px]">
                  Fill out the form and save your details to generate your digital passport.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
