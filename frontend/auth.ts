import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/services/db";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";

import crypto from "crypto";

// Override Credentials provider in node environment to allow database lookups
const nodeProviders = authConfig.providers.map((provider) => {
  if (provider.id === "credentials") {
    return Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const identifier = credentials.email as string;
        const secret = credentials.password as string;

        // Check if identifier is email format
        const isEmail = identifier.includes("@");
        const isMobile = /^[6-9]\d{9}$/.test(identifier);
        const isFarmerId = identifier.startsWith("FRM-");

        if (isEmail) {
          // Standard Email & Password / Dev Quick Login Lookup
          const user = await db.user.findUnique({
            where: { email: identifier },
          });

          if (!user) return null;

          // Check for signed OTP verification bypass token
          const phone = identifier.split("@")[0];
          const expectedBypass = crypto
            .createHmac("sha256", process.env.AUTH_SECRET || "some-placeholder-secret-for-development-32-chars")
            .update(phone)
            .digest("hex");

          if (secret === expectedBypass) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }

          // Verify password if set
          if (user.password && user.password === secret) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }

          return null; // Password mismatch
        } else {
          // Farmer Mobile or Farmer ID Lookup
          let targetPhone = "";
          if (isMobile) {
            targetPhone = identifier;
          } else if (isFarmerId) {
            const farmer = await db.farmer.findUnique({
              where: { farmerId: identifier },
            });
            if (farmer) {
              targetPhone = farmer.phone;
            }
          }

          if (!targetPhone) return null;

          const farmerRecord = await db.farmer.findFirst({
            where: { phone: targetPhone },
          });

          if (!farmerRecord) return null;

          const user = await db.user.findUnique({
            where: { id: farmerRecord.userId },
          });

          if (!user) return null;

          // Check for signed OTP verification bypass token (hex string of length 64)
          const isBypassToken = /^[a-f0-9]{64}$/i.test(secret);
          if (isBypassToken) {
            const expectedBypass = crypto
              .createHmac("sha256", process.env.AUTH_SECRET || "some-placeholder-secret-for-development-32-chars")
              .update(targetPhone)
              .digest("hex");

            if (secret === expectedBypass) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
          }

          // Option A: Check if secret is their account password
          if (user.password && user.password === secret) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }

          // Option B: Check if secret matches active OTP verification code
          const isSixDigitCode = /^\d{6}$/.test(secret);
          if (isSixDigitCode) {
            const verification = await db.otpVerification.findUnique({
              where: { phone: targetPhone },
            });

            if (verification && verification.code === secret && verification.expiresAt > new Date()) {
              // Cleanup verification code
              await db.otpVerification.delete({ where: { phone: targetPhone } }).catch(() => {});
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
          }

          return null; // Both password and OTP failed
        }
      },
    });
  }
  return provider;
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: nodeProviders,
  session: { 
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Omit maxAge/expires to make this cookie clear immediately on browser/tab close
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      
      // Dynamic Database Verification (Invalidates deleted/role-changed users immediately)
      if (token?.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          
          if (!dbUser) {
            return null; // Invalidate JWT session
          }
          token.role = dbUser.role; // Keep role synchronized in session
        } catch (dbErr) {
          console.error("Session database verification error:", dbErr);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
export default auth;
