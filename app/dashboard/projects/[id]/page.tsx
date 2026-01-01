import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch the project
  const project = await prisma.project.findUnique({
    where: { id: id },
    include: {
      files: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  // Check if project exists
  if (!project) {
    notFound();
  }

  // Check if user owns this project
  if (project.userId !== user.id && user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex gap-3 items-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                  Status: {project.status}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Files ({project.files.length})</h2>
            <Link
              href={`/dashboard/projects/${project.id}/upload`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload File
            </Link>
          </div>

          {project.files.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-gray-500 mb-4">No files uploaded yet</p>
              <Link
                href={`/dashboard/projects/${project.id}/upload`}
                className="text-blue-600 hover:underline"
              >
                Upload your first file
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {project.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">
                        {file.fileName.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB • Uploaded{" "}
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
