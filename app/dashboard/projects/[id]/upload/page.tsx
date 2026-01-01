import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import UploadForm from "./UploadForm";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  if (project.userId !== user.id && user.role !== "admin") {
    redirect("/dashboard");
  }

  return <UploadForm projectId={id} projectName={project.name} />;
}
