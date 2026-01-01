import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SyncingPage() {
  // Try to get user
  const user = await getCurrentUser();

  if (user) {
    // User now exists, redirect to dashboard
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}
