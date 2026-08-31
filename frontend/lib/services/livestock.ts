import { db } from "./db";
import { UpsertLivestockInput } from "../validations/livestock";

/**
 * Retrieves the livestock profiles (approximate counts) for a farmer based on user ID.
 */
export async function getFarmerLivestock(userId: string) {
  const farmer = await db.farmer.findUnique({
    where: { userId },
  });

  if (!farmer) {
    throw new Error("Farmer profile not found for this user account");
  }

  return db.livestockProfile.findMany({
    where: { farmerId: farmer.id },
    orderBy: { species: "asc" },
  });
}

/**
 * Creates or updates an approximate livestock headcount for a farmer.
 */
export async function upsertFarmerLivestock(userId: string, data: UpsertLivestockInput) {
  const farmer = await db.farmer.findUnique({
    where: { userId },
  });

  if (!farmer) {
    throw new Error("Farmer profile not found for this user account");
  }

  // Use a transaction or standard upsert on the composite unique constraint (farmerId, species)
  return db.livestockProfile.upsert({
    where: {
      farmerId_species: {
        farmerId: farmer.id,
        species: data.species,
      },
    },
    update: {
      approxCount: data.approxCount,
      notes: data.notes,
    },
    create: {
      farmerId: farmer.id,
      species: data.species,
      approxCount: data.approxCount,
      notes: data.notes,
    },
  });
}

/**
 * Deletes a livestock headcount record for a farmer.
 */
export async function deleteFarmerLivestock(userId: string, species: string) {
  const farmer = await db.farmer.findUnique({
    where: { userId },
  });

  if (!farmer) {
    throw new Error("Farmer profile not found for this user account");
  }

  return db.livestockProfile.delete({
    where: {
      farmerId_species: {
        farmerId: farmer.id,
        species,
      },
    },
  });
}
