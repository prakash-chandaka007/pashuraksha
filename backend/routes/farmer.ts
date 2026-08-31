import { Router as ExpressRouter, Response } from "express";
import { db } from "../lib/services/db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createFarmerProfile, getFarmerProfile, updateFarmerProfile } from "../lib/services/farmer";
import { getFarmerLivestock, upsertFarmerLivestock, deleteFarmerLivestock } from "../lib/services/livestock";
import { createFarmerSchema, updateFarmerSchema } from "../lib/validations/farmer";
import { upsertLivestockSchema } from "../lib/validations/livestock";

const router = ExpressRouter();

/**
 * GET /api/farmer/profile
 * Retrieves profile of the logged-in farmer.
 */
router.get("/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await getFarmerProfile(req.user!.id);
    if (!profile) {
      return res.status(404).json({ error: "Farmer profile not registered yet." });
    }
    return res.status(200).json(profile);
  } catch (error: unknown) {
    console.error("GET profile error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /api/farmer/profile
 * Creates or updates profile of the logged-in farmer.
 */
router.put("/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await getFarmerProfile(req.user!.id);

    if (!existing) {
      // Validate with creation schema
      const parseResult = createFarmerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid input payload",
          details: parseResult.error.flatten(),
        });
      }

      const profile = await createFarmerProfile(req.user!.id, parseResult.data);
      return res.status(201).json({
        message: "Farmer profile created successfully!",
        profile,
      });
    } else {
      // Validate with update schema
      const parseResult = updateFarmerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid input payload",
          details: parseResult.error.flatten(),
        });
      }

      // Update user password if provided
      if (req.body.password && typeof req.body.password === "string" && req.body.password.trim().length >= 6) {
        await db.user.update({
          where: { id: req.user!.id },
          data: { password: req.body.password },
        });
      }

      const profile = await updateFarmerProfile(req.user!.id, parseResult.data);
      return res.status(200).json({
        message: "Farmer profile updated successfully!",
        profile,
      });
    }
  } catch (error: unknown) {
    console.error("PUT profile error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /api/farmer/livestock
 * Retrieves livestock inventory records for the logged-in farmer.
 */
router.get("/livestock", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await getFarmerLivestock(req.user!.id);
    return res.status(200).json(records);
  } catch (error: unknown) {
    console.error("GET livestock error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/farmer/livestock
 * Upserts approximate headcount for a specific livestock species.
 */
router.post("/livestock", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = upsertLivestockSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input payload",
        details: parseResult.error.flatten(),
      });
    }

    const record = await upsertFarmerLivestock(req.user!.id, parseResult.data);
    return res.status(200).json({
      message: "Livestock headcount record updated successfully!",
      livestock: record,
    });
  } catch (error: unknown) {
    console.error("POST livestock error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * DELETE /api/farmer/livestock/:id
 * Removes a livestock headcount record.
 */
router.delete("/livestock/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing record ID parameter." });
    }

    await deleteFarmerLivestock(req.user!.id, id);
    return res.status(200).json({ message: "Livestock record cleared successfully." });
  } catch (error: unknown) {
    console.error("DELETE livestock error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
