import "dotenv/config";
import { supabase, BUCKET_NAME } from "@/lib/services/supabase";

async function main() {
  console.log("🚀 Starting Supabase Storage Client test...");
  console.log(`Bucket Name: ${BUCKET_NAME}`);

  try {
    const testPath = `test-${Date.now()}.txt`;
    
    console.log(`Generating signed upload URL for path: ${testPath}...`);
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(testPath);

    if (error) {
      throw error;
    }

    console.log("✅ Success! Signed upload URL generated.");
    console.log(`Upload URL: ${data.signedUrl.slice(0, 100)}...`);

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testPath);

    console.log(`Public Retrieve URL: ${publicUrlData.publicUrl}`);

  } catch (error) {
    console.error("❌ Storage test failed with error:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("🎉 Storage test passed successfully!");
    process.exit(0);
  });
