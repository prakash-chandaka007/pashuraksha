import "dotenv/config";
import { db } from "@/lib/services/db";
import { createFarmerProfile } from "@/lib/services/farmer";
import { createHealthCase } from "@/lib/services/cases";
import { analyzeCaseHealth, getCaseAIAnalysis, DiseasePrediction } from "@/lib/services/ai";

async function main() {
  console.log("🚀 Starting AI Analysis Service tests...");

  // 1. Create temporary user and farmer profile
  console.log("Creating temporary user...");
  const tempUser = await db.user.create({
    data: {
      name: "AI Tester User",
      email: `test-ai-${Date.now()}@example.com`,
      role: "farmer",
    },
  });

  console.log("Creating Farmer Profile...");
  const farmer = await createFarmerProfile(tempUser.id, {
    name: "John Doe AI Reporter",
    phone: "9876543213",
    village: "Mulshi",
    taluka: "Mulshi",
    district: "Pune",
    state: "Maharashtra",
  });

  try {
    // 2. Create Case with specific keywords to trigger FMD classification
    console.log("Reporting Health Case with blisters/mouth symptoms...");
    const healthCase = await createHealthCase(tempUser.id, {
      symptoms: "The sheep is limping and has visible red blisters around its mouth and feet.",
      location: "Barn A",
      images: [],
    });
    console.log(`Case created. Initial status: ${healthCase.status}`);
    if (healthCase.status !== "PENDING") {
      throw new Error(`Expected initial status PENDING, got ${healthCase.status}`);
    }

    // 3. Trigger AI Triage Analysis
    console.log(`Executing AI Analysis on case ID: ${healthCase.id}...`);
    const analysis = await analyzeCaseHealth(healthCase.id);
    console.log("✅ AI Analysis generated successfully!");
    
    // 4. Verify constraints (disclaimer and isPreliminaryOnly)
    console.log("Verifying AI constraints...");
    if (analysis.isPreliminaryOnly !== true) {
      throw new Error(`Constraint violated: isPreliminaryOnly must be true, got ${analysis.isPreliminaryOnly}`);
    }

    const expectedDisclaimer = "Preliminary decision support only. Not a confirmed veterinary diagnosis.";
    if (analysis.disclaimer !== expectedDisclaimer) {
      throw new Error(`Constraint violated: disclaimer must match locked text, got "${analysis.disclaimer}"`);
    }
    console.log("✅ AI constraint validation passed!");

    // Verify predictions list contains FMD
    const predictions = analysis.predictedDiseases as unknown as DiseasePrediction[];
    console.log("Predictions output:", predictions);
    const hasFMD = predictions.some(p => p.disease.includes("Foot-and-Mouth Disease"));
    if (!hasFMD) {
      throw new Error("AI failed to predict FMD for blister/mouth symptoms");
    }
    console.log("✅ AI disease prediction logic verified!");

    // 5. Verify case status update
    console.log("Checking if Case status updated to AI_ANALYZED...");
    const updatedCase = await db.healthCase.findUnique({
      where: { id: healthCase.id },
    });
    if (!updatedCase || updatedCase.status !== "AI_ANALYZED") {
      throw new Error(`Expected updated status AI_ANALYZED, got ${updatedCase?.status}`);
    }
    console.log("✅ Case status update successfully verified!");

    // 6. Fetch AI analysis
    console.log("Fetching AI analysis details...");
    const fetchedAnalysis = await getCaseAIAnalysis(healthCase.id);
    if (!fetchedAnalysis || fetchedAnalysis.id !== analysis.id) {
      throw new Error("Fetched AI analysis does not match generated analysis");
    }
    console.log("✅ Fetched AI analysis verified!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
    throw error;
  } finally {
    // Cleanup
    console.log("Cleaning up database...");
    await db.aIAnalysis.deleteMany({
      where: { healthCase: { farmerId: farmer.id } },
    });
    await db.healthCase.deleteMany({
      where: { farmerId: farmer.id },
    });
    await db.farmer.deleteMany({
      where: { userId: tempUser.id },
    });
    await db.user.delete({
      where: { id: tempUser.id },
    });
    console.log("🧹 Cleanup complete!");
  }
}

main()
  .then(() => {
    console.log("🎉 All AI Triage tests passed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
