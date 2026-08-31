import { z } from "zod";

export const createCaseSchema = z.object({
  symptoms: z.string().min(10, "Please describe the symptoms in at least 10 characters"),
  symptomStartDate: z.preprocess(
    (arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg),
    z.date({
      invalid_type_error: "Symptom start date must be a valid date",
    })
  ).optional(),
  location: z.string().max(250, "Location details cannot exceed 250 characters").optional(),
  images: z.array(z.string()).default([]),
  audio: z.string().optional().nullable(),
  species: z.string().min(2, "Species type is required").optional().default("Cattle"),
  affectedCount: z.preprocess(
    (val) => (val === undefined || val === null ? 1 : Number(val)),
    z.number().int().min(1, "Headcount must be at least 1")
  ).optional().default(1),
});

export type CreateCaseInput = z.input<typeof createCaseSchema>;
