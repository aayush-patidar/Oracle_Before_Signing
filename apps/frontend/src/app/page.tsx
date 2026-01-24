'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/enterprise');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-pulse text-blue-500 font-bold">
        Redirecting to Security Console...
      </div>
    </div>
  );
}