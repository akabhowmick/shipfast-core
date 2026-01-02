"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncingPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    const checkUserSync = async () => {
      try {
        // Check if user is synced by making a request to a status endpoint
        const response = await fetch('/api/user-status');
        
        if (response.ok) {
          const data = await response.json();
          if (data.synced) {
            router.push('/dashboard');
            return;
          }
        }

        // Retry after delay
        if (attempts < maxAttempts) {
          setTimeout(() => {
            setAttempts(prev => prev + 1);
          }, 1000); // Check every second
        } else {
          // Max attempts reached, redirect anyway
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user sync:', error);
        // Retry on error
        if (attempts < maxAttempts) {
          setTimeout(() => {
            setAttempts(prev => prev + 1);
          }, 1000);
        }
      }
    };

    checkUserSync();
  }, [attempts, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
        <p className="text-gray-400 text-sm mt-2">This usually takes just a moment</p>
      </div>
    </div>
  );
}