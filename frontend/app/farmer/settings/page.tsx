import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFarmerProfile } from "@/lib/services/farmer";
import { getFarmerLivestock } from "@/lib/services/livestock";
import { db } from "@/lib/services/db";
import SettingsForm from "./settings-form";

export default async function FarmerSettingsPage() {
  const session = await auth();

  // If unauthorized, redirect to login
  if (!session?.user?.id || !session?.user?.email) {
    redirect("/login");
  }

  // Fetch existing profile, livestock, and user details
  const rawProfile = await getFarmerProfile(session.user.id);
  const userRecord = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, updatedAt: true },
  });
  
  let rawRecords = [];
  let farmerId = "";
  
  if (rawProfile) {
    farmerId = rawProfile.farmerId;
    rawRecords = await getFarmerLivestock(session.user.id);
  }

  const profile = rawProfile
    ? {
        id: rawProfile.id,
        farmerId: rawProfile.farmerId,
        name: rawProfile.name,
        phone: rawProfile.phone || "",
        address: rawProfile.address,
        district: rawProfile.district || "",
        state: rawProfile.state || "",
      }
    : null;

  const records = rawRecords.map((r) => ({
    id: r.id,
    species: r.species,
    approxCount: r.approxCount,
    notes: r.notes,
  }));

  const securityInfo = {
    hasPassword: !!userRecord?.password,
    passwordLength: userRecord?.password ? Math.min(12, Math.max(8, userRecord.password.length)) : 0,
    passwordLastChanged: userRecord?.updatedAt ? userRecord.updatedAt.toLocaleDateString() + " " + userRecord.updatedAt.toLocaleTimeString() : "N/A",
  };

  return (
    <main className="flex-1 bg-slate-50/50 py-10">
      <SettingsForm 
        initialProfile={profile} 
        userEmail={session.user.email} 
        userId={session.user.id} 
        initialRecords={records}
        securityInfo={securityInfo}
      />
    </main>
  );
}
