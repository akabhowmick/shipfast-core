"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    throw new Error("Project name is required");
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      userId: user.id,
      status: "draft",
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: "PROJECT_CREATED",
      userId: user.id,
      metadata: JSON.stringify({ projectId: project.id, projectName: project.name }),
    },
  });

  // Revalidate the dashboard to show the new project
  revalidatePath("/dashboard");

  // Redirect to the new project page
  redirect(`/dashboard/projects/${project.id}`);
}

export async function saveFileMetadata(
  projectId: string,
  fileName: string,
  fileUrl: string,
  fileSize: number
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify user owns this project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || (project.userId !== user.id && user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  // Save file metadata to database
  const file = await prisma.file.create({
    data: {
      projectId,
      fileName,
      url: fileUrl,
      size: fileSize,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: "FILE_UPLOADED",
      userId: user.id,
      metadata: JSON.stringify({
        projectId,
        fileId: file.id,
        fileName,
      }),
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);

  return file;
}

export async function updateProjectStatus(projectId: string, newStatus: string) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('No user detected')
  }

  // Verify user owns this project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  if (project.userId !== user.id && user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // Validate status
  const validStatuses = ['draft', 'active', 'completed']
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid status')
  }

  // Update project status
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'STATUS_UPDATED',
      userId: user.id,
      metadata: JSON.stringify({
        projectId,
        oldStatus: project.status,
        newStatus,
      }),
    },
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')

  return updatedProject
}