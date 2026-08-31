import { Router, Response, Request } from "express";
import crypto from "crypto";
import { db } from "../lib/services/db";
import { z } from "zod";
import { sendRegisterOtpSms } from "../lib/services/sms";

const router = Router();
// Zod validations for registration inputs
const sendOtpSchema = z.object({
  phone: z.string().min(3, "Identifier must be at least 3 characters long"),
  name: z.string().optional(),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(3, "Identifier must be at least 3 characters long"),
  name: z.string().optional(),
  code: z.string().length(6, "OTP must be exactly 6 digits long"),
  password: z.string().min(6, "Password must be at least 6 characters long").optional().or(z.literal("")),
});

/**
 * POST /api/auth/otp/send
 * Generates a 6-digit OTP and logs it to console (SMS gateway simulation).
 */
router.post("/otp/send", async (req: Request, res: Response) => {
  try {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input values",
        details: parseResult.error.flatten(),
      });
    }

    const { phone: identifier, name } = parseResult.data;
    let targetPhone = "";
    let targetName = name || "Farmer";
    let isLogin = false;

    // Check if identifier is 10-digit Indian mobile number
    const isMobile = /^[6-9]\d{9}$/.test(identifier);
    const isFarmerId = identifier.startsWith("FRM-");

    if (isMobile) {
      targetPhone = identifier;
      const existingFarmer = await db.farmer.findFirst({
        where: { phone: identifier },
      });
      if (existingFarmer) {
        isLogin = true;
        targetName = existingFarmer.name;
      } else {
        // Sign up requires a name
        if (!name || name.trim().length < 3) {
          return res.status(400).json({
            error: "Full Name is required for registration (minimum 3 characters).",
          });
        }
      }
    } else if (isFarmerId) {
      const farmer = await db.farmer.findUnique({
        where: { farmerId: identifier },
      });
      if (!farmer) {
        return res.status(400).json({
          error: "Farmer ID not found. Please verify your ID.",
        });
      }
      targetPhone = farmer.phone || identifier;
      targetName = farmer.name;
      isLogin = true;
    } else {
      return res.status(400).json({
        error: "Please enter a valid 10-digit Indian mobile number or Farmer ID (e.g. FRM-XXXXXX).",
      });
    }

    // 2. Generate a 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Upsert the verification code with a 5-minute expiry window
    await db.otpVerification.upsert({
      where: { phone: targetPhone },
      update: {
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      create: {
        phone: targetPhone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // 4. Send the OTP code via configured SMS gateway
    await sendRegisterOtpSms(targetPhone, code, targetName);

    return res.status(200).json({
      success: true,
      phone: targetPhone, // Return resolved phone to help verification
      isLogin,
      message: isLogin
        ? "Verification code sent for login. Please check your messages."
        : "Verification code sent for registration. Please check your messages.",
    });
  } catch (error: unknown) {
    console.error("Send OTP error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/auth/otp/verify
 * Validates the verification code and creates the user/farmer profile.
 */
router.post("/otp/verify", async (req: Request, res: Response) => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid input values",
        details: parseResult.error.flatten(),
      });
    }

    const { phone, name, code, password } = parseResult.data;
    let targetPhone = phone;
    const isMobile = /^[6-9]\d{9}$/.test(phone);

    if (!isMobile && phone.startsWith("FRM-")) {
      const farmer = await db.farmer.findUnique({
        where: { farmerId: phone },
      });
      if (farmer?.phone) {
        targetPhone = farmer.phone;
      }
    }

    // 1. Resolve verification record from database
    const verification = await db.otpVerification.findUnique({
      where: { phone: targetPhone },
    });

    if (!verification) {
      return res.status(400).json({
        error: "No active verification code found. Please request a new code.",
      });
    }

    // 2. Validate code matches
    if (verification.code !== code) {
      return res.status(400).json({
        error: "Invalid OTP code. Please check and try again.",
      });
    }

    // 3. Validate code has not expired
    if (verification.expiresAt < new Date()) {
      return res.status(400).json({
        error: "OTP code has expired. Please request a new one.",
      });
    }

    // Generate HMAC signed bypassToken using targetPhone and AUTH_SECRET
    const bypassToken = crypto
      .createHmac("sha256", process.env.AUTH_SECRET || "some-placeholder-secret-for-development-32-chars")
      .update(targetPhone)
      .digest("hex");

    // Check if the user is already registered using their phone number
    const existingUser = await db.user.findUnique({
      where: { phone: targetPhone },
    });

    if (existingUser) {
      // Clean up verification code
      await db.otpVerification.delete({ where: { phone: targetPhone } }).catch(() => {});
      return res.status(200).json({
        success: true,
        phone: targetPhone,
        bypassToken,
        message: "OTP verified. Access authorized.",
      });
    }

    const finalName = name || "Farmer";

    // Execute User and Farmer creation inside a Prisma transaction block
    const user = await db.$transaction(async (tx) => {
      // 4. Create User
      const newUser = await tx.user.create({
        data: {
          name: finalName,
          phone: targetPhone,
          role: "farmer",
          password: password || null,
        },
      });

      // 5. Create Farmer Profile
      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      await tx.farmer.create({
        data: {
          farmerId: `FRM-2026-${randomSuffix}`,
          userId: newUser.id,
          name: finalName,
          phone: targetPhone,
          state: "Maharashtra", // Default defaults for initial registration
          district: "Pune",
          address: "Registered via mobile OTP",
        },
      });

      // 6. Delete verification record
      await tx.otpVerification.delete({
        where: { phone: targetPhone },
      });

      return newUser;
    });

    console.log(`🎉 Farmer registered successfully: ${finalName} (+91${targetPhone})`);

    return res.status(200).json({
      success: true,
      phone: user.phone,
      name: user.name,
      role: user.role,
      bypassToken,
    });
  } catch (error: unknown) {
    console.error("Verify OTP error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
