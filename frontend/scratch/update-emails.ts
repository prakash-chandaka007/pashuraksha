import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const EMAIL_MAPPING: Record<string, string> = {
  "vet.vizag1@pashuraksha.org": "vet.officer1@pashuraksha.org",
  "vet.vizag2@pashuraksha.org": "vet.officer2@pashuraksha.org",
  "vet.guntur@pashuraksha.org": "vet.officer3@pashuraksha.org",
  "vet.chittoor@pashuraksha.org": "vet.officer4@pashuraksha.org",
  "vet.eastgodavari2@pashuraksha.org": "vet.officer5@pashuraksha.org",
  "vet.eastgodavari3@pashuraksha.org": "vet.officer6@pashuraksha.org",
  "vet.anantapur@pashuraksha.org": "vet.officer7@pashuraksha.org",
  "vet.westgodavari2@pashuraksha.org": "vet.officer8@pashuraksha.org",
  "vet.westgodavari3@pashuraksha.org": "vet.officer9@pashuraksha.org",
};

async function main() {
  console.log("🚀 Starting database email migration...");
  for (const [oldEmail, newEmail] of Object.entries(EMAIL_MAPPING)) {
    // 1. Update User records
    const user = await prisma.user.findUnique({
      where: { email: oldEmail },
    });
    if (user) {
      await prisma.user.update({
        where: { email: oldEmail },
        data: { email: newEmail },
      });
      console.log(`✅ Updated User email: ${oldEmail} -> ${newEmail}`);
    }

    // 2. Update Veterinarian records
    const vet = await prisma.veterinarian.findUnique({
      where: { email: oldEmail },
    });
    if (vet) {
      await prisma.veterinarian.update({
        where: { email: oldEmail },
        data: { email: newEmail },
      });
      console.log(`✅ Updated Veterinarian profile email: ${oldEmail} -> ${newEmail}`);
    }
  }
  console.log("🎉 Database email migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error running migration:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
