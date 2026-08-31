import { db } from "@/lib/services/db";

export async function ensureDatabaseEmailsCorrect() {
  try {
    const emailMapping: Record<string, { email: string; name: string; region: string }> = {
      "vet.vizag1@pashuraksha.org": {
        email: "vet.officer1@pashuraksha.org",
        name: "Dr. Srinivas Rao",
        region: "Visakhapatnam Urban North (MVP Colony Clinic)",
      },
      "vet.vizag2@pashuraksha.org": {
        email: "vet.officer2@pashuraksha.org",
        name: "Dr. K. Prasad",
        region: "Visakhapatnam Urban South (Gajuwaka Clinic)",
      },
      "vet.guntur@pashuraksha.org": {
        email: "vet.officer3@pashuraksha.org",
        name: "Dr. G. Suresh",
        region: "Bheemunipatnam Region (Bheemili Clinic)",
      },
      "vet.chittoor@pashuraksha.org": {
        email: "vet.officer4@pashuraksha.org",
        name: "Dr. Lakshmi Devi",
        region: "East Godavari Central (Kakinada Clinic)",
      },
      "vet.eastgodavari2@pashuraksha.org": {
        email: "vet.officer5@pashuraksha.org",
        name: "Dr. A. Rama Rao",
        region: "East Godavari North (Rajamahendravaram Clinic)",
      },
      "vet.eastgodavari3@pashuraksha.org": {
        email: "vet.officer6@pashuraksha.org",
        name: "Dr. B. Satish",
        region: "East Godavari South (Amalapuram Clinic)",
      },
      "vet.anantapur@pashuraksha.org": {
        email: "vet.officer7@pashuraksha.org",
        name: "Dr. Naidu",
        region: "West Godavari Central (Eluru Clinic)",
      },
      "vet.westgodavari2@pashuraksha.org": {
        email: "vet.officer8@pashuraksha.org",
        name: "Dr. V. Krishna",
        region: "West Godavari South (Bhimavaram Clinic)",
      },
      "vet.westgodavari3@pashuraksha.org": {
        email: "vet.officer9@pashuraksha.org",
        name: "Dr. P. Radha",
        region: "West Godavari East (Tadepalligudem Clinic)",
      },
    };

    let migrationPerformed = false;

    for (const [oldEmail, target] of Object.entries(emailMapping)) {
      // 1. Check if old email exists in User table
      const oldUser = await db.user.findFirst({
        where: { email: oldEmail },
      });

      if (oldUser) {
        migrationPerformed = true;
        
        // Check if target email already exists
        const targetUser = await db.user.findFirst({
          where: { email: target.email },
        });

        if (targetUser) {
          console.log(`[VET-DB-FIX] Target user ${target.email} already exists. Migrating references...`);
          // Re-route cases assigned to oldUser.id to targetUser.id
          await db.healthCase.updateMany({
            where: { assignedVetId: oldUser.id },
            data: { assignedVetId: targetUser.id },
          });

          // Re-route assessments
          await db.veterinaryAssessment.updateMany({
            where: { vetUserId: oldUser.id },
            data: { vetUserId: targetUser.id },
          });

          // Delete old user
          await db.user.delete({
            where: { id: oldUser.id },
          });
        } else {
          console.log(`[VET-DB-FIX] Renaming ${oldEmail} -> ${target.email}`);
          // Rename oldUser to target details
          await db.user.update({
            where: { id: oldUser.id },
            data: {
              email: target.email,
              name: target.name,
              vetRegion: target.region,
            },
          });
        }
      }
    }

    // Also enforce correct names and regions on all seeded users to avoid shuffled records
    for (const target of Object.values(emailMapping)) {
      await db.user.updateMany({
        where: { email: target.email },
        data: {
          name: target.name,
          vetRegion: target.region,
        },
      });

      // Sync corresponding Veterinarian profile records
      const userRec = await db.user.findFirst({
        where: { email: target.email },
      });
      if (userRec) {
        // Enforce matching values on Veterinarian table
        await db.veterinarian.updateMany({
          where: { userId: userRec.id },
          data: {
            name: target.name,
            email: target.email,
            vetRegion: target.region,
          },
        });
      }

      // Also clean up double "Dr." in name field if any
      const existingUsers = await db.user.findMany({
        where: { email: target.email },
      });
      for (const u of existingUsers) {
        if (u.name.startsWith("Dr. Dr. ")) {
          await db.user.update({
            where: { id: u.id },
            data: {
              name: u.name.replace("Dr. Dr. ", "Dr. "),
            },
          });
        }
      }
    }

    if (migrationPerformed) {
      console.log("🎉 [VET-DB-FIX] Shuffled veterinarian database migration completed successfully!");
    }
  } catch (err) {
    console.error("❌ [VET-DB-FIX] Error repairing database vet emails:", err);
  }
}
