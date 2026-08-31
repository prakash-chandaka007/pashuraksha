import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { getSurveillanceMetrics, getRecentAlerts } from "../lib/services/government";

const router = Router();

/**
 * GET /api/government/surveillance
 * Retrieves aggregated national disease surveillance statistics.
 */
router.get("/surveillance", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "gov") {
      return res.status(403).json({ error: "Forbidden. Access is restricted to government officials." });
    }

    const metrics = await getSurveillanceMetrics(req.user!.id);
    return res.status(200).json(metrics);
  } catch (error: unknown) {
    console.error("GET gov surveillance error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/government/alerts
 * Retrieves active outbreak warning signals and alerts lists.
 */
router.get("/alerts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== "gov") {
      return res.status(403).json({ error: "Forbidden. Access is restricted to government officials." });
    }

    const alerts = await getRecentAlerts(req.user!.id);
    return res.status(200).json(alerts);
  } catch (error: unknown) {
    console.error("GET gov alerts error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
