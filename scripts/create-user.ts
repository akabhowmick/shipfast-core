import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
config();

const prisma = new PrismaClient();

async function main() {
  const clerkUserId = "user_37c2btub6TGXFk5q67NgcR6EhQR"; 

  const user = await prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email: "akabhowmick@gmail.com",
      role: "admin",
    },
  });

  console.log("✅ User created:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
