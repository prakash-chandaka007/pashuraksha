import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

// Service role client to bypass RLS and allow signed url generation
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

const BUCKET_NAME = "pashuraksha-assets";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access. Please log in first." }, { status: 401 });
    }

    const { filename } = await request.json();
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Missing required property: filename" }, { status: 400 });
    }

    // Proactively verify and create storage bucket if it does not exist
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (!listError && buckets) {
        const bucketExists = buckets.some((b) => b.name === BUCKET_NAME);
        if (!bucketExists) {
          const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 10485760, // 10MB limit
          });
          if (createError) {
            console.error("Failed to auto-create storage bucket:", createError);
          } else {
            console.log(`📦 Auto-created Supabase Storage bucket: ${BUCKET_NAME}`);
          }
        }
      }
    } catch (bucketErr) {
      console.warn("Bucket auto-check skipped or failed:", bucketErr);
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
      return NextResponse.json(
        { error: `Supabase Storage error: ${uploadError?.message || "Failed to create signed upload URL. Ensure storage permissions are active."}` },
        { status: 500 }
      );
    }

    // 2. Resolve public URL for future client retrieval
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      fileUrl: publicUrlData.publicUrl,
      filePath,
    });
  } catch (error: unknown) {
    console.error("Presigned URL API error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
