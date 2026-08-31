import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS (VETS) ===");
  const users = await prisma.user.findMany({
    where: { role: "vet" },
  });
  console.log(JSON.stringify(users, null, 2));

  console.log("=== VETERINARIANS ===");
  const vets = await prisma.veterinarian.findMany();
  console.log(JSON.stringify(vets, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
