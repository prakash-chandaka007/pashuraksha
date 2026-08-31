import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
      <main className="max-w-4xl w-full flex flex-col items-center text-center gap-10">
        
        {/* Badge & Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold">
            Livestock Healthcare & Disease Surveillance
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Pashuraksha <span className="text-indigo-600">(पशुरक्षा)</span>
          </h1>
          <p className="text-base text-slate-650 max-w-2xl mx-auto font-medium leading-relaxed">
            A secure national portal designed for farmers to report health issues, veterinarians to submit diagnoses and prescriptions, and health departments to monitor regional epidemiological data.
          </p>
        </div>

        {/* Action Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
          
          {/* Farmer Portal Option */}
          <Link
            href="/farmer/cases"
            className="group flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-600 hover:shadow transition-all text-left"
          >
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">
              Farmer Portal
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Livestock & Cases</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Manage livestock inventory headcounts, report symptoms, upload diagnostic files, and monitor veterinary prescriptions.
            </p>
            <span className="mt-6 text-xs font-bold text-indigo-600 group-hover:underline">
              Access Portal &rarr;
            </span>
          </Link>

          {/* Veterinarian Portal Option */}
          <Link
            href="/vet/queue"
            className="group flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-600 hover:shadow transition-all text-left"
          >
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">
              Veterinary Portal
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Triage & Queue</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Monitor active clinical triage queues, review preliminary AI insights, and submit verified case prescriptions.
            </p>
            <span className="mt-6 text-xs font-bold text-indigo-600 group-hover:underline">
              Access Queue &rarr;
            </span>
          </Link>

          {/* Government command Center Option */}
          <Link
            href="/government"
            className="group flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-600 hover:shadow transition-all text-left"
          >
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">
              Command Center
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Epidemic Intel</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Analyze regional outbreak data, map disease spreads, manage vaccination campaigns, and allocate clinical resources.
            </p>
            <span className="mt-6 text-xs font-bold text-indigo-600 group-hover:underline">
              Access Dashboard &rarr;
            </span>
          </Link>

        </div>

        {/* Footer specifications */}
        <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
          Department of Animal Husbandry &bull; Integrated Disease Surveillance Program
        </div>

      </main>
    </div>
  );
}
