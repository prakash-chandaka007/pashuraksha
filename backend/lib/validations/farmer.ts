import { z } from "zod";

export const createFarmerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  address: z.string().optional(),
  village: z.string().min(1, "Village is required"),
  taluka: z.string().min(1, "Taluka is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
});

export const updateFarmerSchema = createFarmerSchema.partial();

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;
