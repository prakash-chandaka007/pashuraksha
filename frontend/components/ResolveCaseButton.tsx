"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResolveCaseButtonProps {
  caseDbId: string;
  caseRefId: string;
  currentStatus: string;
}

export default function ResolveCaseButton({ caseDbId, caseRefId, currentStatus }: ResolveCaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (currentStatus === "RESOLVED") {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span>✅</span>
          <span className="uppercase font-black tracking-wider">Case Status: RESOLVED & RECOVERED</span>
        </div>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase font-black tracking-wider">
          Completed
        </span>
      </div>
    );
  }

  const handleResolve = async () => {
    const confirmMsg = `Have your animals recovered and is treatment complete for Case ${caseRefId}?`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseDbId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update case status.");
      }

      alert(`Case ${caseRefId} has been successfully marked as RESOLVED & Recovered!`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error resolving case.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
      <div>
        <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider block">
          Treatment & Recovery Status
        </span>
        <p className="text-xs text-stone-600 font-bold mt-0.5">
          If treatment is complete and your livestock has recovered, mark this case resolved.
        </p>
      </div>
      <button
        onClick={handleResolve}
        disabled={loading}
        className="px-5 py-2.5 rounded-xl font-black bg-emerald-700 hover:bg-emerald-800 text-white transition-all disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer shadow-md active:scale-98 shrink-0"
      >
        {loading ? "Resolving..." : "Mark Recovered & Resolve Case ✅"}
      </button>
    </div>
  );
}
