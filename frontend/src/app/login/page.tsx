'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch, setToken, setCurrentUser, getToken, User as UserType } from '@/utils/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, redirect to calendar
    if (getToken()) {
      router.push('/calendar');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch<{ token: string; user: UserType }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(data.token);
      setCurrentUser(data.user);
      router.push('/calendar');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal, periksa email dan kata sandi Anda.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#07192F] via-[#0B2545] to-[#133966] p-4 relative overflow-hidden">
      {/* Subtle decorative glow orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#00ADE6]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-[400px] relative z-10">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-7 md:p-8 shadow-2xl shadow-black/25 border border-white/50 transition-all">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-3">
              <Image
                src="/komdigi-logo-tight.png"
                alt="Logo KOMDIGI"
                width={140}
                height={42}
                className="h-9 w-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-lg font-display font-bold text-[#0B2545] tracking-tight">
              Content Calendar & AI
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Kementerian Komunikasi dan Digital RI
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-fadeIn">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Kedinasan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@komdigi.go.id"
                  className="w-full bg-white/70 border border-slate-200/90 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-2 focus:ring-[#0B2545]/15 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/70 border border-slate-200/90 rounded-xl py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-2 focus:ring-[#0B2545]/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0B2545] hover:bg-[#134074] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0B2545]/20 flex items-center justify-center space-x-2 border-b-2 border-amber-500 disabled:opacity-50 cursor-pointer mt-1"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-amber-400 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-[10.5px] text-slate-400 mt-4 font-medium">
          © {new Date().getFullYear()} BLSDM • Kementerian Komunikasi dan Digital RI
        </p>
      </div>
    </div>
  );
}
