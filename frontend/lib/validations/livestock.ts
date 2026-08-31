import { z } from "zod";

export const speciesEnum = z.enum(["Cattle", "Buffalo", "Sheep", "Goat", "Poultry", "Other"], {
  error: "Species must be one of: Cattle, Buffalo, Sheep, Goat, Poultry, Other",
});

export const upsertLivestockSchema = z.object({
  species: speciesEnum,
  approxCount: z.number().int().nonnegative("Approximate count must be a non-negative integer"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type UpsertLivestockInput = z.infer<typeof upsertLivestockSchema>;
