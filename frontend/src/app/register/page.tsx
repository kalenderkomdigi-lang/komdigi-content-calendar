'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Optionally redirect after a brief delay
    const timer = setTimeout(() => {
      router.push('/login');
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0B2545] via-[#0D3059] to-[#07192F] px-4 relative overflow-hidden py-8">
      {/* Decorative ambient cyan & navy brand glows */}
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[#00ADE6]/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/15 blur-[130px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 my-4 text-center">
        {/* Official Logo Container */}
        <div className="bg-white px-6 py-3.5 rounded-2xl shadow-xl shadow-black/20 border border-white/20 inline-flex items-center justify-center mb-6">
          <Image
            src="/komdigi-logo-tight.png"
            alt="Logo Resmi KOMDIGI"
            width={160}
            height={50}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        {/* Card Notice */}
        <div className="bg-white rounded-3xl p-7 md:p-8 shadow-2xl border border-slate-200/90 relative overflow-hidden text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 p-3 mx-auto flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div>
            <h2 className="font-display font-extrabold text-lg text-[#0B2545]">
              Pendaftaran Mandiri Dinonaktifkan
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Sesuai standar operasional dan keamanan data Kementerian Komunikasi dan Digital RI, seluruh akun pegawai didaftarkan secara terpusat oleh <span className="font-semibold text-slate-800">Administrator BLSDM</span> melalui menu <b>Kelola Akun Pegawai</b>.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
            Anda akan dialihkan otomatis ke halaman login dalam beberapa detik...
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-[#0B2545] hover:bg-[#134074] text-white rounded-xl text-xs font-bold transition shadow-md border-b-2 border-amber-500"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Halaman Login</span>
          </Link>
        </div>

        <div className="text-center mt-6 text-[10.5px] text-slate-400">
          © {new Date().getFullYear()} BLSDM Komdigi — Kementerian Komunikasi dan Digital RI
        </div>
      </div>
    </div>
  );
}
