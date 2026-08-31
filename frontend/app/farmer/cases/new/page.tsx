import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CaseWizard from "./case-wizard";

export default async function NewCasePage() {
  const session = await auth();

  // Redirect to login if unauthorized
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="flex-1 bg-slate-50/50 py-10">
      <CaseWizard userId={session.user.id} />
    </main>
  );
}
