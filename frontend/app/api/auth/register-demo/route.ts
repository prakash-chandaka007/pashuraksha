import { NextResponse } from "next/server";
import { db } from "@/lib/services/db";

// Define 9 veterinarians all serving specific clinics in Visakhapatnam, East Godavari, and West Godavari
const REGIONAL_VETS = [
  // Visakhapatnam (3)
  {
    name: "Dr. Srinivas Rao",
    email: "vet.officer1@pashuraksha.org",
    vetRegion: "Visakhapatnam Urban North (MVP Colony Clinic)",
  },
  {
    name: "Dr. K. Prasad",
    email: "vet.officer2@pashuraksha.org",
    vetRegion: "Visakhapatnam Urban South (Gajuwaka Clinic)",
  },
  {
    name: "Dr. G. Suresh",
    email: "vet.officer3@pashuraksha.org",
    vetRegion: "Bheemunipatnam Region (Bheemili Clinic)",
  },

  // East Godavari (3)
  {
    name: "Dr. Lakshmi Devi",
    email: "vet.officer4@pashuraksha.org",
    vetRegion: "East Godavari Central (Kakinada Clinic)",
  },
  {
    name: "Dr. A. Rama Rao",
    email: "vet.officer5@pashuraksha.org",
    vetRegion: "East Godavari North (Rajamahendravaram Clinic)",
  },
  {
    name: "Dr. B. Satish",
    email: "vet.officer6@pashuraksha.org",
    vetRegion: "East Godavari South (Amalapuram Clinic)",
  },

  // West Godavari (3)
  {
    name: "Dr. Naidu",
    email: "vet.officer7@pashuraksha.org",
    vetRegion: "West Godavari Central (Eluru Clinic)",
  },
  {
    name: "Dr. V. Krishna",
    email: "vet.officer8@pashuraksha.org",
    vetRegion: "West Godavari South (Bhimavaram Clinic)",
  },
  {
    name: "Dr. P. Radha",
    email: "vet.officer9@pashuraksha.org",
    vetRegion: "West Godavari East (Tadepalligudem Clinic)",
  },
];

export async function POST(request: Request) {
  try {
    const { role, vetEmail } = await request.json();

    if (!role || !["farmer", "vet", "gov"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    // Provision Vets (all 9 at once, returning the selected one or the first one)
    if (role === "vet") {
      let selectedEmail = vetEmail || REGIONAL_VETS[0].email;
      let targetVet = REGIONAL_VETS.find(v => v.email === selectedEmail) || REGIONAL_VETS[0];

      // Ensure all 9 exist in database
      for (const v of REGIONAL_VETS) {
        let user = await db.user.findUnique({
          where: { email: v.email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              name: v.name,
              email: v.email,
              role: "vet",
              password: "password",
              vetRegion: v.vetRegion,
            },
          });
          console.log(`🩺 Seeded Regional Veterinarian: ${v.name} (${v.vetRegion})`);
        } else {
          // Update region
          user = await db.user.update({
            where: { email: v.email },
            data: { vetRegion: v.vetRegion },
          });
        }

        // Ensure Veterinarian profile table record exists (maintain separate tables)
        let vetProfile = await db.veterinarian.findUnique({
          where: { userId: user.id },
        });
        if (!vetProfile) {
          const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          await db.veterinarian.create({
            data: {
              vetId: `VET-2026-${randomSuffix}`,
              userId: user.id,
              name: v.name,
              email: v.email,
              vetRegion: v.vetRegion,
              radiusKm: 30,
            },
          });
          console.log(`🩺 Seeded separate Veterinarian profile: ${v.name}`);
        }
      }

      return NextResponse.json({
        success: true,
        email: targetVet.email,
        name: targetVet.name,
        role: "vet",
      });
    }

    // Provision Government
    if (role === "gov") {
      const email = `demo-gov@pashuraksha.org`;
      let user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            name: "Demo Government",
            email,
            role: "gov",
            password: "password",
          },
        });
      }

      // Ensure GovernmentOfficial profile table record exists (maintain separate tables)
      let govProfile = await db.governmentOfficial.findUnique({
        where: { userId: user.id },
      });
      if (!govProfile) {
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        await db.governmentOfficial.create({
          data: {
            govId: `GOV-2026-${randomSuffix}`,
            userId: user.id,
            name: user.name || "Demo Government",
            email,
            department: "Department of Animal Husbandry",
            clearance: "LEVEL_1",
          },
        });
        console.log(`🏛️ Seeded separate GovernmentOfficial profile: ${user.name}`);
      }

      return NextResponse.json({
        success: true,
        email,
        name: user.name,
        role: "gov",
      });
    }

    // Farmer demo provisioning is disabled to enforce live registration
    return NextResponse.json(
      { error: "Farmer demo accounts are disabled. Please register using your active mobile number and an OTP." },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error("Demo registration error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
