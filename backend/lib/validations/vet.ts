import { z } from "zod";

export const severityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
  invalid_type_error: "Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL",
});

export const createAssessmentSchema = z.object({
  healthCaseId: z.string().cuid("Invalid Health Case ID reference"),
  diagnosis: z.string().min(3, "Diagnosis description must be at least 3 characters long"),
  severity: severityEnum,
  treatmentPlan: z.string().min(10, "Treatment plan details must be at least 10 characters long"),
  notes: z.string().max(1000, "Additional notes cannot exceed 1000 characters").optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
