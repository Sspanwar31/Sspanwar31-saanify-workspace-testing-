import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "ADMIN@example.com" },
    update: {},
    create: {
      name: "ADMIN",
      email: "ADMIN@example.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("✅ Super admin created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });