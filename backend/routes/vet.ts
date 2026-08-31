import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { getCasesQueueForVet, createVeterinaryAssessment, getCaseAssessments } from "../lib/services/vet";
import { createAssessmentSchema } from "../lib/validations/vet";

const router = Router();

/**
 * GET /api/vet/queue
 * Retrieves cases waiting in the vet queue.
 */
router.get("/queue", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "vet") {
      return res.status(403).json({ error: "Forbidden. Access is restricted to veterinarians." });
    }

    const queue = await getCasesQueueForVet(req.user!.id);
    return res.status(200).json(queue);
  } catch (error: unknown) {
    console.error("GET queue error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/cases/:id/assessment
 * Retrieves assessments logged for a case.
 */
router.get("/:id/assessment", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const list = await getCaseAssessments(id);
    return res.status(200).json(list);
  } catch (error: unknown) {
    console.error("GET assessments error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/cases/:id/assessment
 * Submits a new clinical veterinary assessment.
 */
router.post("/:id/assessment", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "vet") {
      return res.status(403).json({ error: "Forbidden. Access is restricted to veterinarians." });
    }

    const { id } = req.params;

    const parseResult = createAssessmentSchema.safeParse({
      ...req.body,
      healthCaseId: id,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input payload",
        details: parseResult.error.flatten(),
      });
    }

    const assessment = await createVeterinaryAssessment(req.user!.id, parseResult.data);
    return res.status(201).json({
      message: "Veterinary assessment recorded successfully!",
      assessment,
    });
  } catch (error: unknown) {
    console.error("POST assessment error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
