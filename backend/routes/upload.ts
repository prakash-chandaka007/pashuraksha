import { Router, Response } from "express";
import crypto from "crypto";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { supabase, BUCKET_NAME } from "../lib/services/supabase";

const router = Router();

/**
 * POST /api/upload/presigned
 * Body: { filename: string }
 * Generates a presigned upload URL valid for 15 minutes to allow direct client uploads to Supabase Storage.
 */
router.post("/presigned", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename } = req.body;

    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ error: "Missing required property: filename (string)" });
    }

    // Sanitize file path using a secure random prefix to prevent collisions
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueId = crypto.randomUUID();
    const filePath = `${uniqueId}-${cleanFilename}`;

    // 1. Generate signed upload URL (expires in 15 minutes = 900 seconds)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath);

    if (uploadError || !uploadData) {
      console.error("Supabase Storage signed URL error:", uploadError);
      return res.status(500).json({ error: "Failed to generate signed upload URL from cloud storage provider." });
    }

    // 2. Resolve public URL for future client retrieval
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return res.status(200).json({
      uploadUrl: uploadData.signedUrl,
      fileUrl: publicUrlData.publicUrl,
      filePath,
    });
  } catch (error: unknown) {
    console.error("Presigned URL route error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
