import { prisma } from "./prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function syncUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Check if user exists in database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // If user doesn't exist, create them
  if (!user) {
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new Error("No email found for user");
    }

    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        role: "user",
      },
    });

    console.log("✅ New user synced to database:", email);
  }

  return user;
}
