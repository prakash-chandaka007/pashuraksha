import "dotenv/config";
import { db } from "@/lib/services/db";
import { createFarmerProfile } from "@/lib/services/farmer";
import { createHealthCase } from "@/lib/services/cases";
import { analyzeCaseHealth } from "@/lib/services/ai";
import {
  getCasesQueueForVet,
  createVeterinaryAssessment,
  getCaseAssessments,
} from "@/lib/services/vet";

async function main() {
  console.log("🚀 Starting Vet Portal Service tests...");

  // 1. Create temporary farmer and vet accounts
  console.log("Creating temporary farmer and vet users...");
  const farmerUser = await db.user.create({
    data: {
      name: "Farmer Case Creator",
      email: `test-vet-farmer-${Date.now()}@example.com`,
      role: "farmer",
    },
  });

  const vetUser = await db.user.create({
    data: {
      name: "Dr. Veterinarian",
      email: `test-vet-doctor-${Date.now()}@example.com`,
      role: "vet",
    },
  });

  const farmer = await createFarmerProfile(farmerUser.id, {
    name: "Farmer Joe VetTest",
    phone: "9876543214",
    village: "Mulshi",
    taluka: "Mulshi",
    district: "Pune",
    state: "Maharashtra",
  });
  console.log(`Farmer profile created (${farmer.farmerId}). Vet user created (${vetUser.email}).`);

  try {
    // 2. Create case and trigger AI analysis (status -> AI_ANALYZED)
    console.log("Creating a health case...");
    const healthCase = await createHealthCase(farmerUser.id, {
      symptoms: "The sheep has visible red spots near hooves and drooling.",
      location: "East pasture",
      images: [],
    });
    console.log(`Running AI triage to move status to AI_ANALYZED...`);
    await analyzeCaseHealth(healthCase.id);

    // 3. Fetch Vet Case Queue
    console.log(`Retrieving Vet case queue for Vet ID: ${vetUser.id}...`);
    const queue = await getCasesQueueForVet(vetUser.id);
    const caseInQueue = queue.find((c) => c.id === healthCase.id);
    if (!caseInQueue) {
      throw new Error("AI_ANALYZED case did not appear in Vet case queue!");
    }
    console.log("✅ Case successfully discovered in Vet queue!");

    // 4. Create Veterinary Assessment
    console.log("Recording Veterinary Assessment...");
    const assessment = await createVeterinaryAssessment(vetUser.id, {
      healthCaseId: healthCase.id,
      diagnosis: "Confirmed Foot-and-Mouth Disease (FMD) cluster",
      severity: "HIGH",
      treatmentPlan: "Quarantine affected sheep. Administer antibiotics and antiseptic foot washes.",
      notes: "High risk of spreading to neighboring cattle herds.",
    });
    console.log(`✅ Assessment recorded successfully! (ID: ${assessment.id})`);

    // 5. Verify Case status updated to VET_ASSESSED
    console.log("Checking updated Health Case status...");
    const updatedCase = await db.healthCase.findUnique({
      where: { id: healthCase.id },
    });
    if (!updatedCase || updatedCase.status !== "VET_ASSESSED") {
      throw new Error(`Expected case status VET_ASSESSED, got ${updatedCase?.status}`);
    }
    console.log("✅ Case status successfully verified as VET_ASSESSED!");

    // 6. Retrieve case assessments
    console.log("Retrieving assessments for the case...");
    const list = await getCaseAssessments(healthCase.id);
    if (list.length !== 1 || list[0].diagnosis !== assessment.diagnosis) {
      throw new Error("Assessments list retrieval failed or returned incorrect data");
    }
    console.log("✅ Assessments list retrieval successfully verified!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
    throw error;
  } finally {
    // Cleanup
    console.log("Cleaning up database...");
    await db.veterinaryAssessment.deleteMany({
      where: { healthCase: { farmerId: farmer.id } },
    });
    await db.aIAnalysis.deleteMany({
      where: { healthCase: { farmerId: farmer.id } },
    });
    await db.healthCase.deleteMany({
      where: { farmerId: farmer.id },
    });
    await db.farmer.deleteMany({
      where: { userId: farmerUser.id },
    });
    await db.user.delete({
      where: { id: farmerUser.id },
    });
    await db.user.delete({
      where: { id: vetUser.id },
    });
    console.log("🧹 Cleanup complete!");
  }
}

main()
  .then(() => {
    console.log("🎉 All Vet Portal tests passed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
