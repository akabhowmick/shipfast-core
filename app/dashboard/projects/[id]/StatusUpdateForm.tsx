"use client";

import { updateProjectStatus } from "@/app/actions/projects";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StatusUpdateForm({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const statuses = [
    { value: "draft", label: "Draft", color: "bg-gray-200 text-gray-800" },
    { value: "active", label: "Active", color: "bg-blue-200 text-blue-800" },
    { value: "completed", label: "Completed", color: "bg-green-200 text-green-800" },
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setUpdating(true);
    try {
      await updateProjectStatus(projectId, newStatus);
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex gap-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => handleStatusChange(status.value)}
          disabled={updating || status.value === currentStatus}
          className={`px-4 py-2 rounded-lg font-medium transition-all text-black ${
            status.value === currentStatus
              ? status.color + " ring-2 ring-offset-2 ring-blue-700"
              : "bg-gray-100  hover:bg-gray-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
