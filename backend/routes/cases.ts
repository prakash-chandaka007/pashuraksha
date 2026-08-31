import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createHealthCase, getHealthCasesByFarmer, getHealthCaseDetails } from "../lib/services/cases";
import { analyzeCaseHealth, getCaseAIAnalysis } from "../lib/services/ai";
import { createCaseSchema } from "../lib/validations/cases";
import { db } from "../lib/services/db";

const router = Router();

/**
 * GET /api/farmer/cases (or /api/cases for generic queue lookup depending on role)
 * List cases reported by the farmer, or list all cases for Vets/Gov.
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role === "farmer") {
      const cases = await getHealthCasesByFarmer(req.user!.id);
      return res.status(200).json(cases);
    } else {
      // Vets and Gov officials can pull all cases
      const cases = await db.healthCase.findMany({
        include: { farmer: true },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(cases);
    }
  } catch (error: unknown) {
    console.error("GET cases error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/farmer/cases
 * Reports a new health case.
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createCaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input payload",
        details: parseResult.error.flatten(),
      });
    }

    const healthCase = await createHealthCase(req.user!.id, parseResult.data);
    return res.status(201).json({
      message: "Health case reported successfully!",
      case: healthCase,
    });
  } catch (error: unknown) {
    console.error("POST case error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/farmer/cases/:caseId
 * Retrieve detailed case specs, verifying ownership for farmers.
 */
router.get("/:caseId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    const details = await getHealthCaseDetails(req.user!.id, caseId);

    if (!details) {
      return res.status(404).json({ error: "Case not found." });
    }

    // Farmer ownership check
    if (req.user!.role === "farmer" && details.farmer.userId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden. Access is restricted to case owners." });
    }

    return res.status(200).json(details);
  } catch (error: unknown) {
    console.error("GET case detail error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/cases/:id/ai-analysis
 * Triggers rules-based AI triage decision support predictions.
 */
router.post("/:id/ai-analysis", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify case ownership if requested by farmer
    if (req.user!.role === "farmer") {
      const target = await db.healthCase.findUnique({
        where: { id },
        include: { farmer: true },
      });
      if (!target || target.farmer.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden. Access is restricted to case owners." });
      }
    }

    const analysis = await analyzeCaseHealth(id);
    return res.status(200).json({
      message: "AI preliminary triage analysis generated successfully.",
      analysis,
    });
  } catch (error: unknown) {
    console.error("POST ai-analysis error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/cases/:id/ai-analysis
 * Fetches existing triage log.
 */
router.get("/:id/ai-analysis", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify case ownership if requested by farmer
    if (req.user!.role === "farmer") {
      const target = await db.healthCase.findUnique({
        where: { id },
        include: { farmer: true },
      });
      if (!target || target.farmer.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden. Access is restricted to case owners." });
      }
    }

    const analysis = await getCaseAIAnalysis(id);
    if (!analysis) {
      return res.status(404).json({ error: "Triage analysis log not found." });
    }
    return res.status(200).json(analysis);
  } catch (error: unknown) {
    console.error("GET ai-analysis error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * DELETE /api/cases/:id
 * Deletes a health case, validating ownership for farmers.
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const targetCase = await db.healthCase.findUnique({
      where: { id },
      include: { farmer: true },
    });

    if (!targetCase) {
      return res.status(404).json({ error: "Case not found." });
    }

    // Farmer ownership check: farmers can only delete their own cases
    if (req.user!.role === "farmer" && targetCase.farmer.userId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden. Access is restricted to case owners." });
    }

    // Delete the case (AIAnalysis and VeterinaryAssessment will cascade delete)
    await db.healthCase.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Health case deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("DELETE case error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * PATCH /api/cases/:id/resolve
 * Marks a health case as RESOLVED upon completion of treatment and animal recovery.
 */
router.patch("/:id/resolve", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const targetCase = await db.healthCase.findUnique({
      where: { id },
      include: { farmer: true },
    });

    if (!targetCase) {
      return res.status(404).json({ error: "Case not found." });
    }

    if (req.user!.role === "farmer" && targetCase.farmer.userId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden. Access is restricted to case owners." });
    }

    const updated = await db.healthCase.update({
      where: { id },
      data: { status: "RESOLVED" },
    });

    return res.status(200).json({
      message: "Case marked as RESOLVED & Recovered successfully.",
      case: updated,
    });
  } catch (error: unknown) {
    console.error("PATCH resolve case error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
