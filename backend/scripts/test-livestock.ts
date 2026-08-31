import "dotenv/config";
import { db } from "@/lib/services/db";
import { createFarmerProfile } from "@/lib/services/farmer";
import {
  upsertFarmerLivestock,
  getFarmerLivestock,
  deleteFarmerLivestock,
} from "@/lib/services/livestock";

async function main() {
  console.log("🚀 Starting Livestock Service tests...");

  // 1. Create a temporary user & farmer profile
  console.log("Creating temporary user...");
  const tempUser = await db.user.create({
    data: {
      name: "Livestock Tester",
      email: `test-livestock-${Date.now()}@example.com`,
      role: "farmer",
    },
  });
  console.log(`User created. Creating Farmer Profile...`);
  const farmer = await createFarmerProfile(tempUser.id, {
    name: "John Doe Livestock",
    phone: "9876543211",
    village: "Haveli",
    taluka: "Haveli",
    district: "Pune",
    state: "Maharashtra",
  });
  console.log(`Farmer profile created (Farmer ID: ${farmer.farmerId})`);

  try {
    // 2. Add Livestock Counts
    console.log("Adding Cattle livestock headcount...");
    const cattleRecord = await upsertFarmerLivestock(tempUser.id, {
      species: "Cattle",
      approxCount: 15,
      notes: "Crossbred cows",
    });
    console.log(`✅ Cattle record added (Database ID: ${cattleRecord.id}, count: ${cattleRecord.approxCount})`);

    console.log("Adding Poultry livestock headcount...");
    await upsertFarmerLivestock(tempUser.id, {
      species: "Poultry",
      approxCount: 250,
    });
    console.log(`✅ Poultry record added.`);

    // 3. Fetch livestock profiles
    console.log("Fetching farmer livestock profiles...");
    const profiles = await getFarmerLivestock(tempUser.id);
    if (profiles.length !== 2) {
      throw new Error(`Expected 2 records, found ${profiles.length}`);
    }
    console.log("✅ Fetched profiles match count.");

    // 4. Update Livestock Count
    console.log("Updating Cattle count from 15 to 20...");
    const updatedCattle = await upsertFarmerLivestock(tempUser.id, {
      species: "Cattle",
      approxCount: 20,
      notes: "Purchased 5 more cows",
    });
    if (updatedCattle.approxCount !== 20) {
      throw new Error(`Expected Cattle count 20, got ${updatedCattle.approxCount}`);
    }
    console.log("✅ Cattle count updated successfully.");

    // 5. Delete Livestock record
    console.log("Deleting Cattle record...");
    await deleteFarmerLivestock(tempUser.id, "Cattle");
    const profilesAfterDelete = await getFarmerLivestock(tempUser.id);
    const hasCattle = profilesAfterDelete.some((p) => p.species === "Cattle");
    if (hasCattle) {
      throw new Error("Cattle record was not deleted");
    }
    console.log("✅ Cattle record deleted successfully.");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
    throw error;
  } finally {
    // Cleanup
    console.log("Cleaning up database...");
    await db.livestockProfile.deleteMany({
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
    console.log("🎉 All livestock tests passed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
