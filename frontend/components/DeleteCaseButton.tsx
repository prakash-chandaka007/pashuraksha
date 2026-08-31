"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteCaseButtonProps {
  caseDbId: string;
  caseRefId: string;
  userId: string;
}

export default function DeleteCaseButton({ caseDbId, caseRefId, userId }: DeleteCaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const message = `Are you sure you want to delete/withdraw Case ${caseRefId}? This action cannot be undone.`;
    if (!confirm(message)) return;

    setLoading(true);
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${BACKEND_URL}/api/cases/${caseDbId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userId,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete the case.");
      }

      alert("Case report successfully deleted.");
      router.push("/farmer/cases");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error deleting case.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 border border-red-250 text-red-655 font-bold text-xs rounded hover:bg-red-50 transition cursor-pointer disabled:opacity-50 uppercase tracking-wider"
    >
      {loading ? "Deleting..." : "Withdraw Case"}
    </button>
  );
}
