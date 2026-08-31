import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up old official users...");
  
  // Delete all users who are vets or gov officials to allow clean re-seeding
  const deleteResult = await prisma.user.deleteMany({
    where: {
      role: { in: ["vet", "gov"] }
    }
  });
  
  console.log(`✅ Successfully deleted ${deleteResult.count} stale official users.`);
  console.log("🎉 Database is now ready for clean, location-independent seeding!");
}

main()
  .catch((e) => {
    console.error("❌ Error running cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
