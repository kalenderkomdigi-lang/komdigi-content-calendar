'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getToken } from '@/utils/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push('/calendar');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Custom Loader with KOMDIGI Logo */}
        <div className="relative h-16 w-16 flex items-center justify-center bg-white rounded-2xl shadow-md border border-slate-200/80 p-2">
          <div className="absolute -inset-1 rounded-2xl border-2 border-[#00ADE6] border-t-transparent animate-spin"></div>
          <Image
            src="/komdigi-icon.png"
            alt="Logo KOMDIGI"
            width={34}
            height={34}
            className="object-contain"
            priority
          />
        </div>
        <p className="text-xs font-semibold text-slate-500 font-display tracking-wide animate-pulse">
          Mempersiapkan Ruang Kerja Digital Komdigi...
        </p>
      </div>
    </div>
  );
}
