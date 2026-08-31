import { db } from "./db";
import { CreateCaseInput } from "../validations/cases";
import crypto from "crypto";

/**
 * Generates a unique, platform-compliant Health Case ID.
 * Format: CASE-YYYY-XXXXXX (e.g. CASE-2026-F9B2D8)
 */
async function generateUniqueCaseId(): Promise<string> {
  const year = new Date().getFullYear();
  let uniqueId = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomChars = crypto.randomBytes(3).toString("hex").toUpperCase();
    uniqueId = `CASE-${year}-${randomChars}`;

    const existing = await db.healthCase.findUnique({
      where: { caseId: uniqueId },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error("Failed to generate a unique Case ID after multiple attempts");
  }

  return uniqueId;
}

async function resolveVetForLocation(location: string): Promise<string | null> {
  const normalized = location.toLowerCase();
  let targetEmail = "";

  if (normalized.includes("kakinada") || normalized.includes("central") && normalized.includes("east godavari")) {
    targetEmail = "vet.officer4@pashuraksha.org"; // East Godavari Central (Kakinada Clinic)
  } else if (normalized.includes("rajahmundry") || normalized.includes("rajamahendravaram") || normalized.includes("north") && normalized.includes("east godavari")) {
    targetEmail = "vet.officer5@pashuraksha.org"; // East Godavari North (Rajamahendravaram Clinic)
  } else if (normalized.includes("amalapuram") || normalized.includes("south") && normalized.includes("east godavari")) {
    targetEmail = "vet.officer6@pashuraksha.org"; // East Godavari South (Amalapuram Clinic)
  } else if (normalized.includes("eluru") || normalized.includes("central") && normalized.includes("west godavari")) {
    targetEmail = "vet.officer7@pashuraksha.org"; // West Godavari Central (Eluru Clinic)
  } else if (normalized.includes("bhimavaram") || normalized.includes("south") && normalized.includes("west godavari")) {
    targetEmail = "vet.officer8@pashuraksha.org"; // West Godavari South (Bhimavaram Clinic)
  } else if (normalized.includes("tadepalligudem") || normalized.includes("east") && normalized.includes("west godavari")) {
    targetEmail = "vet.officer9@pashuraksha.org"; // West Godavari East (Tadepalligudem Clinic)
  } else if (normalized.includes("mvp") || (normalized.includes("north") && normalized.includes("urban"))) {
    targetEmail = "vet.officer1@pashuraksha.org"; // MVP Colony Clinic
  } else if (normalized.includes("gajuwaka") || (normalized.includes("south") && normalized.includes("urban"))) {
    targetEmail = "vet.officer2@pashuraksha.org"; // Gajuwaka Clinic
  } else if (normalized.includes("bheemunipatnam") || normalized.includes("bheemili")) {
    targetEmail = "vet.officer3@pashuraksha.org"; // Bheemili Clinic
  } else {
    targetEmail = "vet.officer1@pashuraksha.org"; // Fallback to Officer 1
  }

  const vetUser = await db.user.findFirst({
    where: { email: targetEmail },
  });

  return vetUser ? vetUser.id : null;
}

/**
 * Creates a new Health Case for a farmer.
 */
export async function createHealthCase(userId: string, data: CreateCaseInput) {
  const farmer = await db.farmer.findUnique({
    where: { userId },
  });

  if (!farmer) {
    throw new Error("Farmer profile not found for this user account. Create a profile first.");
  }

  const caseId = await generateUniqueCaseId();
  const locationText = data.location || farmer.address || farmer.district || "Visakhapatnam North";
  const assignedVetId = await resolveVetForLocation(locationText);

  return db.healthCase.create({
    data: {
      caseId,
      farmerId: farmer.id,
      symptoms: data.symptoms,
      symptomStartDate: data.symptomStartDate ? new Date(data.symptomStartDate as any) : new Date(),
      location: locationText,
      images: data.images || [],
      audio: data.audio || null,
      species: (data.species as string) || "Cattle",
      affectedCount: typeof data.affectedCount === "number" ? data.affectedCount : 1,
      status: assignedVetId ? "VET_ASSIGNED" : "PENDING",
      assignedVetId,
    },
    include: {
      farmer: true,
    },
  });
}

/**
 * Retrieves all Health Cases reported by the logged-in farmer.
 */
export async function getHealthCasesByFarmer(userId: string) {
  const farmer = await db.farmer.findUnique({
    where: { userId },
  });

  if (!farmer) {
    throw new Error("Farmer profile not found for this user account");
  }

  return db.healthCase.findMany({
    where: { farmerId: farmer.id },
    orderBy: { createdAt: "desc" },
    include: {
      aiAnalysis: true,
      vetAssessments: true,
      assignedVet: true,
    },
  });
}

/**
 * Retrieves full details of a specific Health Case, validating farmer ownership.
 */
export async function getHealthCaseDetails(userId: string, caseId: string) {
  const farmer = await db.farmer.findUnique({
    where: { userId },
  });

  if (!farmer) {
    return null;
  }

  const healthCase = await db.healthCase.findUnique({
    where: { caseId },
    include: {
      farmer: true,
      aiAnalysis: true,
      assignedVet: true,
      vetAssessments: {
        include: {
          vetUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { assessedAt: "desc" },
      },
    },
  });

  if (!healthCase || healthCase.farmerId !== farmer.id) {
    return null;
  }

  return healthCase;
}
