import Link from "next/link";
import { auth } from "@/auth";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="bg-white border-b border-slate-200 py-3.5 px-6 shadow-sm">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-extrabold text-xl text-slate-800 tracking-tight">
            Pashuraksha <span className="text-indigo-650 font-semibold text-sm">(पशुरक्षा)</span>
          </span>
        </Link>

        {/* Portal Switcher & Session Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {session?.user?.role === "farmer" && (
              <>
                <Link href="/farmer/cases" className="hover:text-indigo-600 transition">My Cases</Link>
                <Link href="/farmer/settings" className="hover:text-indigo-600 transition">Settings & Livestock</Link>
              </>
            )}
            {session?.user?.role === "vet" && (
              <Link href="/vet/queue" className="hover:text-indigo-600 transition">Vet Queue</Link>
            )}
            {session?.user?.role === "gov" && (
              <Link href="/government" className="hover:text-indigo-600 transition">Surveillance Command</Link>
            )}
            {!session?.user && (
              <>
                <Link href="/farmer/livestock" className="hover:text-indigo-600 transition">Farmer Portal</Link>
                <Link href="/vet/queue" className="hover:text-indigo-600 transition">Vet Portal</Link>
                <Link href="/government" className="hover:text-indigo-600 transition">Command Center</Link>
              </>
            )}
          </div>

          {session?.user && (
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">{session.user.name || "User"}</div>
                <div className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">
                  {session.user.role === "gov" 
                    ? "Gov Official" 
                    : session.user.role === "vet" 
                      ? "Veterinarian" 
                      : "Farmer"
                  }
                </div>
              </div>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
