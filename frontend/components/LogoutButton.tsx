"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 transition active:scale-95 cursor-pointer"
    >
      Sign Out
    </button>
  );
}
