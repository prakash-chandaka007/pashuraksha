import "dotenv/config";
import { db } from "@/lib/services/db";
import {
  createFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
} from "@/lib/services/farmer";

async function main() {
  console.log("🚀 Starting Farmer Service tests...");

  // 1. Create a temporary user
  console.log("Creating temporary user...");
  const tempUser = await db.user.create({
    data: {
      name: "Test User",
      email: `test-farmer-${Date.now()}@example.com`,
      role: "farmer",
    },
  });
  console.log(`Temporary user created with ID: ${tempUser.id}`);

  try {
    // 2. Create Farmer Profile (this tests generateUniqueFarmerId and db.$transaction)
    console.log("Creating Farmer Profile...");
    const profile = await createFarmerProfile(tempUser.id, {
      name: "John Doe Farmer",
      phone: "9876543210",
      address: "123 Green Field Street",
      village: "Mulshi",
      taluka: "Mulshi",
      district: "Pune",
      state: "Maharashtra",
    });

    console.log("✅ Profile created successfully!");
    console.log(`Generated Farmer ID: ${profile.farmerId}`);
    if (!profile.farmerId.startsWith("FRM-")) {
      throw new Error(`Invalid Farmer ID format: ${profile.farmerId}`);
    }

    // 3. Fetch Farmer Profile
    console.log("Fetching Farmer Profile...");
    const fetchedProfile = await getFarmerProfile(tempUser.id);
    if (!fetchedProfile || fetchedProfile.farmerId !== profile.farmerId) {
      throw new Error("Fetched profile does not match created profile");
    }
    console.log("✅ Profile fetched successfully!");

    // 4. Update Farmer Profile
    console.log("Updating Farmer Profile...");
    const updatedProfile = await updateFarmerProfile(tempUser.id, {
      name: "John Doe Farmer Updated",
      phone: "9876543210",
    });
    if (updatedProfile.name !== "John Doe Farmer Updated") {
      throw new Error("Profile name did not update correctly");
    }
    console.log("✅ Profile updated successfully!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
    throw error;
  } finally {
    // 5. Clean up database
    console.log("Cleaning up database...");
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
    console.log("🎉 All tests passed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
