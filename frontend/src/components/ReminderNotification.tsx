'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bell, 
  X, 
  Clock, 
  Sparkles, 
  Mic, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  CalendarDays,
  Volume2,
  Check
} from 'lucide-react';
import { apiFetch, ReminderResponse, ReminderItem, ReminderSummary, getCurrentUser } from '@/utils/api';

interface ReminderNotificationProps {
  isMobile?: boolean;
}

export default function ReminderNotification({ isMobile = false }: ReminderNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReminderSummary>({
    today_count: 0,
    tomorrow_count: 0,
    upcoming_count: 0,
    total_reminders: 0,
  });
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming'>('all');
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [showTodayBanner, setShowTodayBanner] = useState(false);
  const [userRole, setUserRole] = useState('pegawai');
  const [mounted, setMounted] = useState(false);

  // Check notification permission & user role on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
    const user = getCurrentUser();
    if (user?.role) {
      setUserRole(user.role);
    }
  }, []);

  // Fetch reminders from backend
  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      // Optional: pass client local date to avoid timezone offset
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const res = await apiFetch<ReminderResponse>(`/api/events/reminders?date=${dateStr}`).catch(() => null);
      if (res && res.summary) {
        setSummary(res.summary);
        setReminders(res.reminders || []);

        // Show today's banner if there is at least 1 event today and hasn't been dismissed in this session
        if (res.summary.today_count > 0 && typeof window !== 'undefined') {
          const dismissed = sessionStorage.getItem('dismissed_today_reminder');
          if (!dismissed) {
            setShowTodayBanner(true);
          }
        }
      }
    } catch {
      // Graceful fallback if backend is restarting or route not ready
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    // Poll reminders every 3 minutes
    const interval = setInterval(fetchReminders, 180000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  // Request native browser/device notification permission
  const requestNativeNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser atau handphone Anda belum mendukung fitur Web Notification.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification('KOMDIGI Content Calendar AI', {
          body: 'Notifikasi pengingat tema konten berhasil diaktifkan di perangkat Anda!',
          icon: '/komdigi-icon.png',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissBanner = () => {
    setShowTodayBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dismissed_today_reminder', 'true');
    }
  };

  // Filtered reminder list
  const filteredReminders = reminders.filter((item) => {
    if (activeFilter === 'today') return item.status === 'today';
    if (activeFilter === 'tomorrow') return item.status === 'tomorrow';
    if (activeFilter === 'upcoming') return item.status === 'upcoming';
    return true;
  });

  const CATEGORY_TAGS: Record<string, { label: string; bg: string; text: string }> = {
    nasional: { label: 'Hari Libur Nasional', bg: 'bg-rose-50', text: 'text-rose-700' },
    internasional: { label: 'Hari Internasional', bg: 'bg-blue-50', text: 'text-blue-700' },
    teknologi: { label: 'Beasiswa DTS & IT', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    literasi_digital: { label: 'Literasi Digital', bg: 'bg-amber-50', text: 'text-amber-800' },
    custom: { label: 'Tema Instansi', bg: 'bg-sky-50', text: 'text-sky-700' },
    podcast: { label: 'PodHub / Podcast', bg: 'bg-purple-50', text: 'text-purple-700' },
  };

  return (
    <>
      {/* 1. TRIGGER BELL BUTTON */}
      {isMobile ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 hover:bg-white/10 rounded-xl border border-white/10 text-white transition cursor-pointer"
          aria-label="Pemberitahuan tema konten"
          title="Pemberitahuan & Pengingat Tema"
        >
          <Bell className="h-5 w-5" />
          {summary.total_reminders > 0 && (
            <span
              className={`absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-black text-white shadow-xs ${
                summary.today_count > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
              }`}
            >
              {summary.total_reminders}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-1.5 rounded-lg text-slate-500 hover:text-[#0B2545] hover:bg-slate-200/60 transition cursor-pointer shrink-0"
          title="Pusat Pengingat & Notifikasi Tema"
          aria-label="Pusat Pengingat"
        >
          <Bell className="h-4.5 w-4.5" />
          {summary.total_reminders > 0 && (
            <span
              className={`absolute -top-1 -right-1 h-4.5 min-w-4.5 px-1 flex items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-xs ${
                summary.today_count > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
              }`}
            >
              {summary.total_reminders}
            </span>
          )}
        </button>
      )}

      {/* 2. FLOATING TOP REMINDER BANNER FOR TODAY (IF NOT DISMISSED) */}
      {mounted && showTodayBanner && summary.today_count > 0 && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-20 md:top-4 left-4 right-4 md:left-auto md:right-8 z-[9998] max-w-md bg-gradient-to-r from-[#0B2545] to-[#134074] text-white p-3.5 rounded-2xl shadow-2xl border border-amber-500/40 flex items-start space-x-3 animate-slideDown">
          <div className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="h-4.5 w-4.5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Pengingat Hari Ini!
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500 text-[8.5px] font-extrabold text-white">
                {summary.today_count} Agenda
              </span>
            </div>
            <p className="text-xs font-semibold mt-0.5 text-slate-100 truncate">
              {reminders.find((r) => r.status === 'today')?.title || 'Ada tema konten yang perlu dipersiapkan!'}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowTodayBanner(false);
                  setIsOpen(true);
                  setActiveFilter('today');
                }}
                className="text-[10px] font-bold text-[#0B2545] bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                Buka Notifikasi & Siapkan →
              </button>
              <button
                onClick={handleDismissBanner}
                className="text-[10px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg cursor-pointer"
              >
                Nanti
              </button>
            </div>
          </div>
          <button
            onClick={handleDismissBanner}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>,
        document.body
      )}

      {/* 3. MODAL / SLIDEOVER NOTIFICATION DRAWER */}
      {mounted && isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end animate-fadeIn">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Side Drawer Content */}
          <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft border-l border-slate-200">
            {/* Header */}
            <div className="p-4.5 bg-[#0B2545] text-white flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h2 className="font-display font-extrabold text-sm tracking-tight text-white">
                      Pengingat & Notifikasi Tema
                    </h2>
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase ${
                      userRole === 'admin' 
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' 
                        : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                    }`}>
                      {userRole === 'admin' ? 'Admin' : 'Pegawai'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-sky-200 mt-0.5">
                    Agenda konten & hari penting instansi yang harus dipublikasikan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                aria-label="Tutup Notifikasi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Native Browser Notification Permission Bar */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50/80 px-4 py-2.5 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="text-[11px] font-semibold text-[#0B2545]">
                  {notifPermission === 'granted'
                    ? 'Pengingat perangkat HP/Browser aktif'
                    : 'Nyalakan pengingat otomatis di HP/Browser'}
                </span>
              </div>
              {notifPermission !== 'granted' ? (
                <button
                  onClick={requestNativeNotification}
                  className="px-2.5 py-1 bg-[#0B2545] text-white hover:bg-[#134074] text-[10px] font-bold rounded-lg transition shadow-2xs cursor-pointer"
                >
                  Aktifkan
                </button>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <Check className="h-3 w-3 mr-1" />
                  Aktif
                </span>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 p-3 bg-slate-50 border-b border-slate-200/80 text-xs shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-[#0B2545] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                }`}
              >
                Semua ({summary.total_reminders})
              </button>
              <button
                onClick={() => setActiveFilter('today')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'today'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                <span>Hari Ini 🚨</span>
                <span className="font-extrabold">({summary.today_count})</span>
              </button>
              <button
                onClick={() => setActiveFilter('tomorrow')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'tomorrow'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <span>Besok ⏳</span>
                <span className="font-extrabold">({summary.tomorrow_count})</span>
              </button>
              <button
                onClick={() => setActiveFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${
                  activeFilter === 'upcoming'
                    ? 'bg-[#0B2545] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                }`}
              >
                Mendatang ({summary.upcoming_count})
              </button>
            </div>

            {/* Notification Reminders List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
              {loading && reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-400">
                  <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                  <span className="text-xs font-semibold">Memeriksa jadwal pengingat...</span>
                </div>
              ) : filteredReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/60" />
                  <p className="text-xs font-bold text-slate-700">Tidak ada pengingat dalam kategori ini</p>
                  <p className="text-[11px] text-slate-400">
                    Semua jadwal publikasi dalam kendali atau belum ada tema yang jatuh tempo.
                  </p>
                </div>
              ) : (
                filteredReminders.map((item) => {
                  const tag = CATEGORY_TAGS[item.category] || { label: item.category, bg: 'bg-slate-100', text: 'text-slate-700' };
                  const isToday = item.status === 'today';
                  const isTomorrow = item.status === 'tomorrow';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 bg-white shadow-xs space-y-2.5 ${
                        isToday
                          ? 'border-rose-300 ring-2 ring-rose-500/20'
                          : isTomorrow
                          ? 'border-amber-300 ring-1 ring-amber-400/20'
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Header info */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border border-black/5 ${tag.bg} ${tag.text}`}>
                          {tag.label}
                        </span>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                            isToday
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : isTomorrow
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{item.badge_text}</span>
                        </span>
                      </div>

                      {/* Title & Date */}
                      <div>
                        <div className="text-[10.5px] font-bold text-slate-400 mb-0.5 flex items-center space-x-1">
                          <CalendarDays className="h-3 w-3 text-slate-400" />
                          <span>Tanggal: {item.date_formatted}</span>
                        </div>
                        <h3 className="text-sm font-display font-extrabold text-[#0B2545] leading-snug">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                        {item.category === 'podcast' ? (
                          <Link
                            href={`/podcast?topic=${encodeURIComponent(item.title)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-xl text-[10.5px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-2xs"
                          >
                            <Mic className="h-3.5 w-3.5 text-amber-300" />
                            <span>Bikin Naskah Podcast</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/generate-caption?theme=${encodeURIComponent(item.title)}&date=${new Date().getFullYear()}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`}
                            onClick={() => setIsOpen(false)}
                            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-xl text-[10.5px] font-bold bg-[#0B2545] hover:bg-[#134074] text-white transition shadow-2xs"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>Buat Caption & Visual</span>
                          </Link>
                        )}

                        <Link
                          href="/calendar"
                          onClick={() => setIsOpen(false)}
                          className="py-1.5 px-2.5 rounded-xl text-[10.5px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition border border-slate-200/80"
                          title="Lihat di Kalender"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Sinkronisasi Otomatis</span>
              </span>
              <button
                onClick={fetchReminders}
                className="font-bold text-[#0B2545] hover:underline cursor-pointer"
              >
                Segarkan Sekarang ↻
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}

