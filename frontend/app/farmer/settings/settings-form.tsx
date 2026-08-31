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
  { name: "Cattle", description: "Cows, bulls, and calves" },
  { name: "Buffalo", description: "Water buffaloes" },
  { name: "Sheep", description: "Ewes, rams, and lambs" },
  { name: "Goat", description: "Bucks, does, and kids" },
  { name: "Poultry", description: "Chickens, ducks, and birds" },
  { name: "Other", description: "Horses, pigs, camels, etc." },
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
          village: "N/A",
          taluka: "N/A",
          district,
          state,
          password: fieldType === "password" ? password : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update account setting.");
      }

      setProfile(data.profile);
      setSuccess(`${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} updated successfully!`);
      
      // Close edits
      if (fieldType === "name") setIsEditingName(false);
      if (fieldType === "address") setIsEditingAddress(false);
      if (fieldType === "password") {
        setIsEditingPassword(false);
        setPassword("");
        confirmPassword || setConfirmPassword("");
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Livestock Save Helper
  const handleSaveLivestock = async (e: React.FormEvent) => {
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
        throw new Error(data.error || "Failed to update livestock record.");
      }

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

      setSuccess(`Successfully updated ${selectedSpecies} headcount.`);
      setSelectedSpecies(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Livestock Delete Helper
  const handleDeleteLivestock = async (recordId: string, speciesName: string) => {
    if (!confirm(`Are you sure you want to clear the headcount for ${speciesName}?`)) return;

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
      setSuccess(`Cleared ${speciesName} headcount record.`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRecordForSpecies = (speciesName: string) => {
    return records.find((r) => r.species === speciesName);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      {/* Header Info */}
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">My Account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your password, farm profile, and livestock catalog.
          </p>
        </div>

        {profile && (
          <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
              Farmer ID
            </span>
            <span className="font-mono text-sm font-bold text-slate-800">
              {profile.farmerId}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8">
        <button
          onClick={() => {
            setActiveTab("account");
            setError(null);
            setSuccess(null);
          }}
          className={`px-6 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
            activeTab === "account"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Profile & Security
        </button>
        <button
          onClick={() => {
            setActiveTab("livestock");
            setError(null);
            setSuccess(null);
          }}
          className={`px-6 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition ${
            activeTab === "livestock"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          My Livestock Catalog
        </button>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-indigo-50 border border-indigo-150 text-slate-800 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Tab A: Account & Security */}
      {activeTab === "account" && (
        <div className="space-y-6">
          
          {/* Fields list catalog */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            
            {/* Field: Full Name */}
            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                  Full Name
                </span>
                {isEditingName ? (
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="px-3 py-1.5 rounded border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 w-full"
                    />
                    <button
                      onClick={() => handleSaveField("name")}
                      disabled={loading}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setName(profile?.name || "");
                        setIsEditingName(false);
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-800">{name}</span>
                )}
              </div>
              {!isEditingName && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-bold cursor-pointer"
                >
                  Edit Field
                </button>
              )}
            </div>

            {/* Field: Mobile Number */}
            <div className="p-6 flex justify-between items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                  Registered Mobile Number
                </span>
                <span className="text-sm font-bold text-slate-800">{phone}</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-400 font-bold px-2 py-1 rounded select-none border border-slate-150">
                LOCKED
              </span>
            </div>

            {/* Field: Email */}
            <div className="p-6 flex justify-between items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                  Registered Email Address
                </span>
                <span className="text-sm font-semibold text-slate-650">{userEmail}</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-400 font-bold px-2 py-1 rounded select-none border border-slate-150">
                LOCKED
              </span>
            </div>

            {/* Field: Address & Landmark */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                    Farm Landmark & Coordinates
                  </span>
                  <span className="text-sm font-bold text-slate-800 leading-relaxed block">
                    {address || "No address details registered. Tap edit to select on state map."}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                    District: {district || "Unassigned"} &bull; State: {state || "Unassigned"}
                  </span>
                </div>
                {!isEditingAddress ? (
                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-bold cursor-pointer"
                  >
                    Edit Address Map
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField("address")}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                    >
                      Save Landmark
                    </button>
                    <button
                      onClick={() => {
                        setAddress(profile?.address || "");
                        setDistrict(profile?.district || "");
                        setState(profile?.state || "");
                        setIsEditingAddress(false);
                      }}
                      className="px-3.5 py-1.5 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingAddress && (
                <div className="mt-4 border-t border-slate-100 pt-4">
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
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                    Security Credentials (Password)
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-mono text-base font-extrabold text-slate-700">
                      {securityInfo.hasPassword ? "•".repeat(securityInfo.passwordLength) : "No Password Configured (OTP-Only)"}
                    </span>
                    {securityInfo.hasPassword && (
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        Last changed: {securityInfo.passwordLastChanged}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditingPassword ? (
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-bold cursor-pointer"
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveField("password")}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                    >
                      Save Password
                    </button>
                    <button
                      onClick={() => {
                        setPassword("");
                        setConfirmPassword("");
                        setIsEditingPassword(false);
                      }}
                      className="px-3.5 py-1.5 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingPassword && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 max-w-xl">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-medium"
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
            <form onSubmit={handleSaveLivestock} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                Update Headcount: {selectedSpecies}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Approximate Headcount
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={approxCount}
                    onChange={(e) => setApproxCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Optional Remarks / Condition Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Mixed crossbreeds, vaccinated for FMD."
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSpecies(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-650 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                >
                  Save Headcount
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
                  className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{species.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{species.description}</p>
                    
                    <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-indigo-600">
                        {record ? record.approxCount : 0}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        animals
                      </span>
                    </div>

                    {record?.notes && (
                      <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium bg-slate-50/50 p-2.5 rounded border border-slate-100">
                        {record.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpecies(species.name);
                        setApproxCount(record?.approxCount || 1);
                        setNotes(record?.notes || "");
                      }}
                      className="flex-1 px-3 py-2 border border-indigo-600 text-indigo-600 font-bold text-xs rounded hover:bg-indigo-50 transition cursor-pointer text-center"
                    >
                      {record ? "Update Headcount" : "Add Headcount"}
                    </button>
                    {record && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLivestock(record.id, species.name)}
                        className="px-3 py-2 border border-red-200 text-red-650 font-bold text-xs rounded hover:bg-red-50 transition cursor-pointer text-center"
                      >
                        Clear
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
