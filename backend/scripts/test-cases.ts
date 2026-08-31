import "dotenv/config";
import { db } from "@/lib/services/db";
import { createFarmerProfile } from "@/lib/services/farmer";
import {
  createHealthCase,
  getHealthCasesByFarmer,
  getHealthCaseDetails,
} from "@/lib/services/cases";

async function main() {
  console.log("🚀 Starting Health Case Service tests...");

  // 1. Create temporary user and farmer profile
  console.log("Creating temporary user...");
  const tempUser = await db.user.create({
    data: {
      name: "Case Reporter",
      email: `test-cases-${Date.now()}@example.com`,
      role: "farmer",
    },
  });

  console.log("Creating Farmer Profile...");
  const farmer = await createFarmerProfile(tempUser.id, {
    name: "John Doe Reporter",
    phone: "9876543212",
    village: "Mulshi",
    taluka: "Mulshi",
    district: "Pune",
    state: "Maharashtra",
  });
  console.log(`Farmer profile created (Farmer ID: ${farmer.farmerId})`);

  try {
    // 2. Create Health Case
    console.log("Reporting Health Case...");
    const healthCase = await createHealthCase(tempUser.id, {
      symptoms: "Animal has high fever, dry cough, and visible blisters near hooves.",
      symptomStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      location: "Near village pond, Mulshi",
      images: [
        "https://razsudkbrdmywrxeexzb.supabase.co/storage/v1/object/public/pashuraksha-assets/cases/test-image1.jpg",
        "https://razsudkbrdmywrxeexzb.supabase.co/storage/v1/object/public/pashuraksha-assets/cases/test-audio1.wav",
      ],
    });
    console.log(`✅ Case reported successfully! (Case ID: ${healthCase.caseId})`);
    if (!healthCase.caseId.startsWith("CASE-")) {
      throw new Error(`Invalid Case ID format: ${healthCase.caseId}`);
    }

    // 3. Fetch cases by farmer
    console.log("Fetching reported cases for farmer...");
    const casesList = await getHealthCasesByFarmer(tempUser.id);
    if (casesList.length !== 1) {
      throw new Error(`Expected 1 case, found ${casesList.length}`);
    }
    console.log("✅ Cases list loaded successfully!");

    // 4. Fetch case details (owner)
    console.log("Fetching case details as owner...");
    const caseDetails = await getHealthCaseDetails(tempUser.id, healthCase.caseId);
    if (!caseDetails || caseDetails.symptoms !== healthCase.symptoms) {
      throw new Error("Case details fetch failed or returned incorrect data");
    }
    console.log("✅ Case details retrieved successfully!");

    // 5. Fetch case details (non-owner unauthorized access check)
    console.log("Testing unauthorized access check...");
    const unauthorizedDetails = await getHealthCaseDetails("another-user-id-unauthorized", healthCase.caseId);
    if (unauthorizedDetails !== null) {
      throw new Error("Security check failed! Non-owner was able to access case details.");
    }
    console.log("✅ Security ownership verification passed!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
    throw error;
  } finally {
    // Cleanup
    console.log("Cleaning up database...");
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
    console.log("🎉 All Health Case tests passed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
