import "dotenv/config";
import { db } from "@/lib/services/db";
import { createFarmerProfile } from "@/lib/services/farmer";
import { createHealthCase } from "@/lib/services/cases";
import { createVeterinaryAssessment } from "@/lib/services/vet";
import { getSurveillanceMetrics, getRecentAlerts } from "@/lib/services/government";

async function main() {
  console.log("🚀 Starting Government Portal Service tests...");

  // 1. Create temporary farmer, vet, and government users
  console.log("Creating temporary farmer, vet, and gov users...");
  const farmerUser = await db.user.create({
    data: {
      name: "Gov Test Farmer",
      email: `test-gov-farmer-${Date.now()}@example.com`,
      role: "farmer",
    },
  });

  const vetUser = await db.user.create({
    data: {
      name: "Gov Test Vet",
      email: `test-gov-vet-${Date.now()}@example.com`,
      role: "vet",
    },
  });

  const govUser = await db.user.create({
    data: {
      name: "Gov Official",
      email: `test-gov-official-${Date.now()}@example.com`,
      role: "gov",
    },
  });

  const farmer = await createFarmerProfile(farmerUser.id, {
    name: "Farmer Joe GovTest",
    phone: "9876543215",
    village: "Mulshi",
    taluka: "Mulshi",
    district: "Pune",
    state: "Maharashtra",
  });
  console.log(`Farmer profile created (${farmer.farmerId}). Gov user created (${govUser.email}).`);

  try {
    // 2. Report 3 cases in "Pune" district to trigger cluster detection rules
    console.log("Creating 3 health cases in Pune...");
    const case1 = await createHealthCase(farmerUser.id, {
      symptoms: "The cow has visible mouth lesions and a high fever.",
      location: "Pune",
      images: [],
    });

    const case2 = await createHealthCase(farmerUser.id, {
      symptoms: "The sheep has a severe dry cough and laboured breathing.",
      location: "Pune",
      images: [],
    });

    await createHealthCase(farmerUser.id, {
      symptoms: "Another cow is salivating excessively with hoof blisters.",
      location: "Pune",
      images: [],
    });
    console.log("Cases reported successfully!");

    // 3. Register clinical assessment on Case 1 to verify suspect vs confirmed logic
    console.log("Recording Vet Assessment on Case 1...");
    await createVeterinaryAssessment(vetUser.id, {
      healthCaseId: case1.id,
      diagnosis: "Confirmed Foot-and-Mouth Disease (FMD)",
      severity: "HIGH",
      treatmentPlan: "Quarantine and disinfect.",
    });
    console.log("Assessment recorded!");

    // 4. Retrieve surveillance metrics
    console.log("Fetching surveillance metrics...");
    const metrics = await getSurveillanceMetrics(govUser.id);
    console.log("Metrics retrieved:", metrics);
    if (metrics.totalCases < 3) {
      throw new Error(`Expected at least 3 cases, got ${metrics.totalCases}`);
    }
    if (metrics.districtGroups.Pune < 3) {
      throw new Error(`Expected Pune to have at least 3 cases, got ${metrics.districtGroups.Pune}`);
    }
    if (metrics.speciesEstimates.Cattle < 2 || metrics.speciesEstimates.Sheep < 1) {
      throw new Error("Species keyword estimation logic failed to count Cattle and Sheep");
    }
    console.log("✅ Surveillance metrics verified successfully!");

    // 5. Retrieve recent alerts
    console.log("Fetching recent alerts...");
    const alerts = await getRecentAlerts(govUser.id);
    console.log("Alerts list:", alerts.map(a => ({ type: a.type, msg: a.message })));
    
    // Check if POTENTIAL_CLUSTER was raised
    const hasCluster = alerts.some(a => a.type === "POTENTIAL_CLUSTER" && a.district === "Pune");
    if (!hasCluster) {
      throw new Error("Government service failed to flag Pune as a POTENTIAL_CLUSTER");
    }

    // Check if CONFIRMED_CASE was raised
    const hasConfirmed = alerts.some(a => a.type === "CONFIRMED_CASE" && a.message.includes(case1.caseId));
    if (!hasConfirmed) {
      throw new Error(`Government service failed to flag case ${case1.caseId} as a CONFIRMED_CASE`);
    }

    // Check if SUSPECTED_CASE was raised
    const hasSuspected = alerts.some(a => a.type === "SUSPECTED_CASE" && a.message.includes(case2.caseId));
    if (!hasSuspected) {
      throw new Error(`Government service failed to flag case ${case2.caseId} as a SUSPECTED_CASE`);
    }
    console.log("✅ Surveillance alerts and density logic verified successfully!");

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
    await db.user.delete({
      where: { id: govUser.id },
    });
    console.log("🧹 Cleanup complete!");
  }
}

main()
  .then(() => {
    console.log("🎉 All Government Portal tests passed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
