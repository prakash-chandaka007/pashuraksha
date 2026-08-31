import { db } from "./db";
import { CreateAssessmentInput } from "../validations/vet";

/**
 * Ensures the requesting user exists and is a veterinarian.
 */
async function verifyVetRole(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role !== "vet") {
    throw new Error("Access denied. User profile is not registered as a veterinarian.");
  }
}

/**
 * Retrieves the case queue for veterinarians.
 * Includes reported cases with statuses: AI_ANALYZED, VET_ASSIGNED, or VET_ASSESSED.
 */
export async function getCasesQueueForVet(vetUserId: string) {
  await verifyVetRole(vetUserId);

  const vetUser = await db.user.findUnique({
    where: { id: vetUserId },
  });

  const vetRegion = vetUser?.vetRegion || "";

  return db.healthCase.findMany({
    where: {
      OR: [
        { assignedVetId: vetUserId },
        ...(vetRegion ? [{ location: { contains: vetRegion, mode: "insensitive" as const } }] : []),
      ],
      status: {
        in: ["AI_ANALYZED", "VET_ASSIGNED", "VET_ASSESSED"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      farmer: true,
      aiAnalysis: true,
      vetAssessments: true,
      assignedVet: true,
    },
  });
}

/**
 * Creates a clinical assessment for a case, updating the case status to VET_ASSESSED.
 */
export async function createVeterinaryAssessment(vetUserId: string, data: CreateAssessmentInput) {
  await verifyVetRole(vetUserId);

  const healthCase = await db.healthCase.findUnique({
    where: { id: data.healthCaseId },
  });

  if (!healthCase) {
    throw new Error("Referenced health case not found.");
  }

  // Create or update assessment and set case status to VET_ASSESSED atomically
  return db.$transaction(async (tx) => {
    const existing = await tx.veterinaryAssessment.findFirst({
      where: { healthCaseId: data.healthCaseId },
    });

    let assessment;
    if (existing) {
      assessment = await tx.veterinaryAssessment.update({
        where: { id: existing.id },
        data: {
          vetUserId,
          diagnosis: data.diagnosis,
          severity: data.severity,
          treatmentPlan: data.treatmentPlan,
          notes: data.notes,
        },
      });
    } else {
      assessment = await tx.veterinaryAssessment.create({
        data: {
          healthCaseId: data.healthCaseId,
          vetUserId,
          diagnosis: data.diagnosis,
          severity: data.severity,
          treatmentPlan: data.treatmentPlan,
          notes: data.notes,
        },
      });
    }

    await tx.healthCase.update({
      where: { id: data.healthCaseId },
      data: { status: "VET_ASSESSED" },
    });

    return assessment;
  });
}

/**
 * Retrieves all veterinary assessments logged for a specific Health Case.
 */
export async function getCaseAssessments(healthCaseId: string) {
  return db.veterinaryAssessment.findMany({
    where: { healthCaseId },
    include: {
      vetUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      assessedAt: "desc",
    },
  });
}
