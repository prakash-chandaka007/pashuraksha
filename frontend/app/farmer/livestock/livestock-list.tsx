"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  { name: "Cattle", description: "Cows, bulls, and calves" },
  { name: "Buffalo", description: "Water buffaloes" },
  { name: "Sheep", description: "Ewes, rams, and lambs" },
  { name: "Goat", description: "Bucks, does, and kids" },
  { name: "Poultry", description: "Chickens, ducks, and birds" },
  { name: "Other", description: "Horses, pigs, camels, etc." },
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

  const handleDelete = async (recordId: string, speciesName: string) => {
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

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Livestock Inventory
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Maintain approximate headcounts of your livestock. Individual animal registration is not required.
          </p>
        </div>
      </div>

      {/* Prominent Farmer ID Display Banner */}
      {farmerId && (
        <div className="mb-8 p-4 rounded-lg bg-indigo-50 border border-indigo-150 text-slate-800 text-sm font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-slate-500 font-medium">Farmer Profile ID: </span>
            <span className="font-mono text-base font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded ml-1.5 shadow-sm">
              {farmerId}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Use this Farmer ID or your registered Mobile Number to log in.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium">
          Success: {success}
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
                className="relative p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between min-h-48"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-800">
                      {species.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    {species.description}
                  </p>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-indigo-600">
                      {record?.approxCount || 0}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      approx. count
                    </span>
                  </div>

                  {record?.notes && (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic bg-slate-50 p-2 rounded-lg">
                      &ldquo;{record.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between gap-3">
                  <button
                    onClick={() => handleOpenEditor(species.name)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-all border border-indigo-200 cursor-pointer"
                  >
                    Adjust Count
                  </button>
                  {record && (
                    <button
                      onClick={() => handleDelete(record.id, species.name)}
                      disabled={loading}
                      className="py-2 px-3 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-all border border-red-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Panel: Inline Editor form */}
        <div className="lg:col-span-1">
          {selectedSpecies ? (
            <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">
                  Update {selectedSpecies}
                </h2>
                <button
                  onClick={() => setSelectedSpecies(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Approximate Headcount
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={approxCount}
                    onChange={(e) => setApproxCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Remarks/Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Crossbred heifers, lactation counts, vaccination details..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-800 transition text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-2.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Saving Changes..." : "Apply Count"}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 shadow-sm sticky top-6 text-center py-10 text-slate-400">
              <p className="text-sm font-semibold">Select a category</p>
              <p className="text-xs text-slate-450 mt-2 max-w-[200px] mx-auto">
                Click on the &ldquo;Adjust Count&rdquo; button of any livestock species card to edit its headcount.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
