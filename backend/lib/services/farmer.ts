import { db } from "./db";
import { CreateFarmerInput, UpdateFarmerInput } from "../validations/farmer";
import crypto from "crypto";

/**
 * Generates a unique, platform-compliant Farmer ID slug.
 * Format: FRM-YYYY-XXXXXX (e.g. FRM-2026-A8B9C2)
 */
async function generateUniqueFarmerId(): Promise<string> {
  const year = new Date().getFullYear();
  let uniqueId = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomChars = crypto.randomBytes(3).toString("hex").toUpperCase();
    uniqueId = `FRM-${year}-${randomChars}`;

    // Check database for uniqueness
    const existing = await db.farmer.findUnique({
      where: { farmerId: uniqueId },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error("Failed to generate a unique Farmer ID after multiple attempts");
  }

  return uniqueId;
}

/**
 * Resolves a farmer's profile, including associated livestock counts, by User ID.
 */
export async function getFarmerProfile(userId: string) {
  return db.farmer.findUnique({
    where: { userId },
    include: {
      livestock: true,
    },
  });
}

/**
 * Creates a new farmer profile, auto-generating a platform Farmer ID and setting user role.
 */
export async function createFarmerProfile(userId: string, data: CreateFarmerInput) {
  // Ensure the user exists
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User account not found");
  }

  // Ensure user doesn't already have a profile
  const existingProfile = await db.farmer.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    throw new Error("Farmer profile already exists for this user account");
  }

  const generatedFarmerId = await generateUniqueFarmerId();

  // Create profile and update user role in a transaction
  return db.$transaction(async (tx) => {
    // Update user role to "farmer"
    await tx.user.update({
      where: { id: userId },
      data: { role: "farmer" },
    });

    // Create farmer profile
    return tx.farmer.create({
      data: {
        farmerId: generatedFarmerId,
        userId,
        name: data.name,
        phone: data.phone,
        address: data.address,
        district: data.district,
        state: data.state,
      },
      include: {
        livestock: true,
      },
    });
  });
}

/**
 * Updates an existing farmer's profile.
 */
export async function updateFarmerProfile(userId: string, data: UpdateFarmerInput) {
  const profile = await db.farmer.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Farmer profile not found for this user account");
  }

  return db.farmer.update({
    where: { userId },
    data: {
      name: data.name,
      phone: data.phone,
      address: data.address,
      district: data.district,
      state: data.state,
    },
    include: {
      livestock: true,
    },
  });
}
