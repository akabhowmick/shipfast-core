import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/syncing");
  }

  // Fetch user's projects
  const projects = await prisma.project.findMany({
    where: { userId: user?.id || "" },
    orderBy: { createdAt: "desc" },
    include: {
      files: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
            {user.role === "admin" && (
              <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Admin
              </span>
            )}
          </div>
          <div>
            <Link
              href="/dashboard/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create Project
            </Link>
            <SignOutButton>
              <button className="bg-gray-200 text-gray-700 mx-1 px-6 py-3 rounded-lg hover:bg-gray-300">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link href="/dashboard/new" className="text-blue-600 hover:underline">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: (typeof projects)[0]) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded">{project.status}</span>
                  <span>{project.files.length} files</span>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}

        {user.role === "admin" && (
          <div className="mt-8">
            <Link href="/admin" className="text-purple-600 hover:underline">
              → Admin Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
