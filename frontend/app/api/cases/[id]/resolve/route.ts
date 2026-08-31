import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/services/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const targetCase = await db.healthCase.findUnique({
      where: { id },
      include: { farmer: true },
    });

    if (!targetCase) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    // Farmer ownership check
    if (session.user.role === "farmer" && targetCase.farmer.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. Access restricted to case owner." }, { status: 403 });
    }

    const updated = await db.healthCase.update({
      where: { id },
      data: { status: "RESOLVED" },
    });

    return NextResponse.json({
      message: "Case marked as RESOLVED & Recovered successfully.",
      case: updated,
    });
  } catch (error: any) {
    console.error("PATCH resolve error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
