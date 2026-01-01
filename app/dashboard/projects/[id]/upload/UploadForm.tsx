"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { saveFileMetadata } from "@/app/actions/projects";
import Link from "next/link";

export default function UploadForm({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/", "application/pdf", "text/"];
    const isAllowed = allowedTypes.some((type) => file.type.startsWith(type));

    if (!isAllowed) {
      setError("Only images, PDFs, and text files are allowed");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Create storage reference
      const storageRef = ref(storage, `projects/${projectId}/${Date.now()}_${file.name}`);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(prog));
        },
        (error) => {
          console.error("Upload error:", error);
          setError("Upload failed. Please try again.");
          setUploading(false);
        },
        async () => {
          // Upload completed, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to database via Server Action
          await saveFileMetadata(projectId, file.name, downloadURL, file.size);

          // Redirect back to project page
          router.push(`/dashboard/projects/${projectId}`);
        }
      );
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/projects/${projectId}`} className="text-blue-600 hover:underline">
            ← Back to {projectName}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6">Upload File</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept="image/*,.pdf,.txt,.csv,.json"
              />
              <p className="text-sm text-gray-500 mt-2">
                Max file size: 10MB. Allowed: Images, PDFs, text files
              </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            {uploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">Uploading... {progress}%</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading || !file}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
