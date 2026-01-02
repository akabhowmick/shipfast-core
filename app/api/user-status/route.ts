import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      synced: !!user,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
    });
  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json(
      { synced: false, error: "Failed to check user status" },
      { status: 500 }
    );
  }
}
