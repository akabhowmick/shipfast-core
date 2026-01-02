import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Try to get or create user in database
  const user = await getCurrentUser();
  
  // If user is not yet synced, wait on syncing page
  if (!user) {
    redirect("/syncing");
  }

  // User exists, go to dashboard
  redirect("/dashboard");
}