import { db } from "../lib/services/db";

async function testOtpRegistration() {
  console.log("🚀 Starting Farmer OTP Registration integration tests...");

  const testPhone = "9999999999";
  const testName = "Test Farmer OTP";

  try {
    // 1. Clean up any existing test user from previous runs
    console.log("Cleaning up previous test runs...");
    const existingUser = await db.user.findFirst({
      where: { email: `${testPhone}@pashuraksha.org` },
    });
    if (existingUser) {
      await db.user.delete({ where: { id: existingUser.id } });
      console.log("🧹 Previous test user deleted.");
    }
    await db.otpVerification.deleteMany({
      where: { phone: testPhone },
    });

    // 2. Simulate sending OTP code
    console.log("Generating and saving OTP verification code...");
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    await db.otpVerification.create({
      data: {
        phone: testPhone,
        code: mockCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    console.log(`📲 Generated OTP [${mockCode}] for mobile +91${testPhone}`);

    // 3. Verify OTP code and register
    console.log("Verifying OTP code and performing database transactions...");
    const verification = await db.otpVerification.findUnique({
      where: { phone: testPhone },
    });

    if (!verification || verification.code !== mockCode) {
      throw new Error("❌ OTP verification record lookup failed!");
    }

    // Execute Registration
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: testName,
          email: `${testPhone}@pashuraksha.org`,
          role: "farmer",
        },
      });

      await tx.farmer.create({
        data: {
          farmerId: `FRM-2026-TESTOTP`,
          userId: newUser.id,
          name: testName,
          phone: testPhone,
          state: "Maharashtra",
          district: "Pune",
          address: "Registered via test OTP",
        },
      });

      await tx.otpVerification.delete({
        where: { phone: testPhone },
      });

      return newUser;
    });

    console.log("✅ Registration transaction completed successfully!");

    // 4. Verify created records
    const checkFarmer = await db.farmer.findFirst({
      where: { userId: user.id },
    });
    if (!checkFarmer || checkFarmer.farmerId !== "FRM-2026-TESTOTP") {
      throw new Error("❌ Farmer profile creation check failed!");
    }
    console.log(`✅ Verified Farmer Profile recorded in database! (ID: ${checkFarmer.farmerId})`);

    // 5. Cleanup
    console.log("Cleaning up test records...");
    await db.user.delete({ where: { id: user.id } });
    console.log("🧹 Cleanup complete!");
    console.log("🎉 All Farmer OTP registration tests passed successfully!");

  } catch (error) {
    console.error("❌ Test run failed:", error);
  }
}

testOtpRegistration();
