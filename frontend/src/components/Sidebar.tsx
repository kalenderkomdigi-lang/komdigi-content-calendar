'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, History, LogOut, Sparkles, User, Menu, X, Shield, Mic, Users } from 'lucide-react';
import { removeToken, getCurrentUser } from '@/utils/api';
import { useEffect, useState } from 'react';
import ReminderNotification from './ReminderNotification';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('pegawai');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setEmail(user.email);
      setUserName(user.name || 'Pegawai Komdigi');
      setRole(user.role || 'pegawai');
    }
  }, []);

  // Close drawer when route changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const navItems = [
    {
      name: 'Kalender Konten',
      href: '/calendar',
      icon: Calendar,
      desc: 'Kalender & Rekomendasi'
    },
    {
      name: 'PodHub / Podcast',
      href: '/podcast',
      icon: Mic,
      desc: 'Tema & Naskah Obrolan'
    },
    {
      name: 'Generator Caption',
      href: '/generate-caption',
      icon: Sparkles,
      desc: 'Pembuat Text & Visual'
    },
    {
      name: 'Riwayat Konten',
      href: '/history',
      icon: History,
      desc: 'Arsip Publikasi Instansi'
    },
    ...(role === 'admin' ? [{
      name: 'Kelola Akun Pegawai',
      href: '/admin/users',
      icon: Users,
      desc: 'Manajemen Akun & Role'
    }] : []),
  ];

  const renderNavLinks = () => (
    <nav className="flex-1 px-3 py-5 space-y-1.5">
      <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400 font-display">
        Menu Utama Instansi
      </div>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
              isActive
                ? 'bg-[#0B2545] text-white font-semibold shadow-md shadow-[#0B2545]/15 border-l-4 border-amber-500'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-[#0B2545]'
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-[#0B2545]'
              }`}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold leading-tight">{item.name}</span>
              <span className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                {item.desc}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  const renderProfileFooter = () => (
    <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/80 m-3 rounded-2xl flex flex-col space-y-3">
      <div className="flex items-center space-x-3 px-1">
        <div className="h-8 w-8 rounded-xl bg-[#0B2545] flex items-center justify-center flex-shrink-0 shadow-xs">
          <User className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="text-xs font-bold text-[#0B2545] truncate">
              {userName || 'Pegawai Komdigi'}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase shrink-0 ${
              role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
            }`}>
              {role === 'admin' ? 'Admin' : 'Pegawai'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate" title={email}>
            {email || 'Loading...'}
          </p>
        </div>
      </div>
      
      <button
        onClick={handleLogout}
        className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-all duration-200 group cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5 text-rose-600 transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span>Keluar Sesi</span>
      </button>
    </div>
  );

  return (
    <>
      {/* 1. MOBILE TOP NAVIGATION BAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0B2545] border-b border-slate-800 flex items-center justify-between px-4 md:hidden z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-white/20 flex items-center justify-center flex-shrink-0">
            <Image
              src="/komdigi-icon.png"
              alt="Logo KOMDIGI"
              width={30}
              height={30}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-display font-black text-white text-xs leading-none tracking-wider">
                KOMDIGI
              </h1>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8.5px] font-extrabold uppercase border border-amber-500/30">
                BLSDM
              </span>
            </div>
            <span className="text-[9.5px] font-medium text-sky-200">
              Kalender Konten Instansi
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1.5">
          <ReminderNotification isMobile={true} />
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 hover:bg-white/10 rounded-xl border border-white/10 text-white transition cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 2. MOBILE DRAWER OVERLAY BACKDROP */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
        />
      )}

      {/* 3. MOBILE SIDEBAR DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col h-screen shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Logo */}
        <div className="p-4 bg-[#0B2545] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-white/20 flex items-center justify-center flex-shrink-0">
              <Image
                src="/komdigi-icon.png"
                alt="Logo KOMDIGI"
                width={30}
                height={30}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-display font-black text-white text-sm leading-none tracking-wider">
                  KOMDIGI
                </h1>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8.5px] font-extrabold uppercase border border-amber-500/30">
                  RI
                </span>
              </div>
              <span className="text-[9.5px] font-medium text-sky-200">
                BLSDM Publikasi Digital
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Navigation */}
        {renderNavLinks()}

        {/* Footer Profile & Logout */}
        {renderProfileFooter()}
      </aside>

      {/* 4. DESKTOP PERSISTENT SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/90 flex-col h-screen sticky top-0 flex-shrink-0 shadow-xs z-20">
        {/* Header Logo */}
        <div className="p-4.5 bg-[#0B2545] text-white flex items-center space-x-3 border-b border-white/10">
          <div className="h-11 w-11 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-white/20 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105">
            <Image
              src="/komdigi-icon.png"
              alt="Logo KOMDIGI"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-display font-black text-white text-sm leading-tight tracking-wider">
                KOMDIGI
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8.5px] font-extrabold uppercase border border-amber-500/30">
                RI
              </span>
            </div>
            <span className="text-[9.5px] font-semibold text-sky-200 tracking-tight truncate">
              Content Calendar & AI
            </span>
          </div>
        </div>

        {/* Instansi Info Pill & Reminder Notification */}
        <div className="mx-3 mt-3 px-3 py-2 bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-[#00ADE6] animate-pulse shrink-0"></span>
            <span className="text-[10px] font-bold text-[#0B2545] truncate">
              Badan Pengembangan SDM
            </span>
          </div>
          <ReminderNotification isMobile={false} />
        </div>

        {/* Navigation */}
        {renderNavLinks()}

        {/* Footer Profile & Logout */}
        {renderProfileFooter()}
      </aside>
    </>
  );
}
