import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createVeterinaryAssessment } from "@/lib/services/vet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "vet") {
      return NextResponse.json(
        { error: "Unauthorized. Access is restricted to registered veterinarians." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { caseId, diagnosis, severity, treatmentPlan, notes } = body;

    if (!caseId || !diagnosis || !treatmentPlan) {
      return NextResponse.json(
        { error: "Missing required clinical assessment fields (caseId, diagnosis, treatmentPlan)." },
        { status: 400 }
      );
    }

    const assessment = await createVeterinaryAssessment(session.user.id, {
      healthCaseId: caseId,
      diagnosis,
      severity: severity || "MEDIUM",
      treatmentPlan,
      notes: notes || null,
    });

    return NextResponse.json({
      message: "Veterinary assessment recorded successfully!",
      assessment,
    });
  } catch (error: any) {
    console.error("POST /api/vet/assessments error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record clinical assessment" },
      { status: 500 }
    );
  }
}
