'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { apiFetch, getToken, EventItem, IdeaItem, VideoContent, getAbsoluteUrl } from '@/utils/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  Save, 
  Copy, 
  Check, 
  Info,
  CalendarDays,
  PenTool,
  Video,
  ExternalLink,
  Bookmark,
  Trash2,
  Clapperboard,
  Clock,
  Music,
  Eye,
  MessageSquare,
  Hash,
  Megaphone,
  X,
  Wand2,
  Lightbulb,
  FileSpreadsheet,
  Download,
  Building2,
  Shield,
  Layers,
  Sparkle,
  Mic,
  Target,
  Compass
} from 'lucide-react';
import { 
  exportIdeasToPDF, 
  exportIdeasToExcel, 
  exportStoryboardToPDF, 
  exportStoryboardToExcel 
} from '@/utils/exportUtils';

const CATEGORY_LABELS: Record<string, string> = {
  nasional: 'Hari Libur Nasional',
  internasional: 'Hari Internasional',
  teknologi: 'Beasiswa DTS & IT',
  literasi_digital: 'Literasi & Keamanan Siber',
  custom: 'Tema Instansi',
  podcast: 'Jadwal PodHub / Podcast'
};

const CATEGORY_THEMES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  nasional: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-200'
  },
  internasional: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
    border: 'border-teal-200'
  },
  teknologi: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200'
  },
  literasi_digital: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    border: 'border-amber-200'
  },
  custom: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    border: 'border-indigo-200'
  },
  podcast: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
    border: 'border-purple-300'
  }
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const CONTENT_PILLARS = [
  {
    name: 'Semua Pilar',
    icon: '🎯',
    label: 'Semua Pilar',
    tagline: 'Kombinasi Dinamis',
    desc: 'Campuran beragam pilar sesuai kebutuhan publikasi instansi'
  },
  {
    name: 'Education/Information',
    icon: '📚',
    label: 'Education / Info',
    tagline: 'Edukasi & Panduan',
    desc: 'Tutorial teknis, infografis fakta & literasi digital masyarakat'
  },
  {
    name: 'Entertainment',
    icon: '🎮',
    label: 'Entertainment',
    tagline: 'Kuis & Tantangan',
    desc: 'Tebak-tebakan teknologi, kuis interaktif & challenge seru'
  },
  {
    name: 'Trend',
    icon: '🚀',
    label: 'Trend & Inovasi',
    tagline: 'AI & Isu Terkini',
    desc: 'Perkembangan AI mutakhir, algoritma baru & tren viral'
  },
  {
    name: 'Konten Nasional',
    icon: '🇮🇩',
    label: 'Konten Nasional',
    tagline: 'Wawasan Kebangsaan',
    desc: 'Peringatan hari besar nasional & program prioritas pemerintah'
  }
];

export default function CalendarPage() {
  const router = useRouter();
  
  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ date: Date; isCurrentMonth: boolean; dayNum: number } | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Copilot Form States
  const [customTheme, setCustomTheme] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string>('Semua Pilar');
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<IdeaItem[]>([]);
  const [savingTheme, setSavingTheme] = useState(false);
  const [deletingTheme, setDeletingTheme] = useState(false);

  // Theme Recommendation States
  const [selectedNiche, setSelectedNiche] = useState('');
  const [generatingThemes, setGeneratingThemes] = useState(false);
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([]);

  // Video Generation States
  const [generatingVideoIndex, setGeneratingVideoIndex] = useState<number | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<Record<number, VideoContent>>({});
  const [copiedScriptIndex, setCopiedScriptIndex] = useState<number | null>(null);

  // Notification & Feedback States
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  // Fetch events for current month
  const fetchMonthEvents = useCallback(async (year: number, month: number) => {
    setLoadingEvents(true);
    try {
      // API expects month 1-12
      const data = await apiFetch<EventItem[]>(`/api/events?month=${month + 1}`);
      setEvents(data);
    } catch (err: any) {
      showFeedback('Gagal memuat hari penting: ' + err.message, 'error');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Authentication check
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    } else {
      fetchMonthEvents(currentYear, currentMonth);
    }
  }, [router, currentYear, currentMonth, fetchMonthEvents]);

  // Prepopulate theme when selection changes
  useEffect(() => {
    if (selectedCell) {
      const dayEvents = events.filter(e => e.day === selectedCell.dayNum && selectedCell.isCurrentMonth);
      if (dayEvents.length > 0) {
        setCustomTheme(dayEvents[0].title);
      } else {
        setCustomTheme('');
      }
      // Reset generated data when changing dates
      setGeneratedIdeas([]);
      setGeneratedVideos({});
      setSuggestedThemes([]);
    }
  }, [selectedCell, events]);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 4000);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleTodayMonth = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid (35 or 42 days depending on rows needed)
  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 1, dayNum);
      days.push({ date, isCurrentMonth: false, dayNum });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({ date, isCurrentMonth: true, dayNum: i });
    }

    // Next month padding days to complete grid rows (35 or 42 cells)
    const neededRows = Math.ceil((startingDayOfWeek + daysInMonth) / 7);
    const targetTotal = neededRows * 7;
    const remainingCells = targetTotal - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      days.push({ date, isCurrentMonth: false, dayNum: i });
    }

    return days;
  };

  const handleGenerateIdeas = async () => {
    if (!customTheme.trim()) {
      showFeedback('Pilih tanggal atau masukkan tema terlebih dahulu.', 'error');
      return;
    }

    setGeneratingIdeas(true);
    setGeneratedIdeas([]);
    setGeneratedVideos({});

    try {
      const res = await apiFetch<{ ideas: IdeaItem[] }>('/api/content/generate-ideas', {
        method: 'POST',
        body: JSON.stringify({ 
          theme: customTheme,
          content_pillar: selectedPillar === 'Semua Pilar' ? '' : selectedPillar
        }),
      });
      setGeneratedIdeas(res.ideas);
      showFeedback('Ide konten berhasil dirancang oleh Asisten Komdigi!', 'success');
    } catch (err: any) {
      showFeedback('Gagal merancang ide konten: ' + err.message, 'error');
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!selectedCell) {
      showFeedback('Silakan pilih tanggal pada kalender.', 'error');
      return;
    }
    if (!customTheme.trim()) {
      showFeedback('Tema tidak boleh kosong.', 'error');
      return;
    }

    setSavingTheme(true);
    try {
      const dateStr = `${selectedCell.date.getFullYear()}-${String(selectedCell.date.getMonth() + 1).padStart(2, '0')}-${String(selectedCell.dayNum).padStart(2, '0')}`;
      await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          date: dateStr,
          month: selectedCell.date.getMonth() + 1,
          day: selectedCell.dayNum,
          title: customTheme,
          category: 'custom',
          description: 'Tema kustom publikasi instansi yang ditambahkan pegawai.',
        }),
      });
      showFeedback('Tema kustom berhasil disimpan ke kalender!', 'success');
      fetchMonthEvents(currentYear, currentMonth);
    } catch (err: any) {
      showFeedback('Gagal menyimpan tema kustom: ' + err.message, 'error');
    } finally {
      setSavingTheme(false);
    }
  };

  const handleDeleteTheme = async (eventId: number) => {
    setDeletingTheme(true);
    try {
      await apiFetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      showFeedback('Tema kustom berhasil dihapus!', 'success');
      setCustomTheme('');
      fetchMonthEvents(currentYear, currentMonth);
    } catch (err: any) {
      showFeedback('Gagal menghapus tema kustom: ' + err.message, 'error');
    } finally {
      setDeletingTheme(false);
    }
  };

  const handleCopyIdea = (idea: IdeaItem, index: number) => {
    let copyText = `*${idea.title}*\nFormat: ${idea.format || '-'}`;
    if (idea.pillar) {
      copyText += `\nPilar Konten: ${idea.pillar}`;
    }
    copyText += `\n\n${idea.summary}`;
    if (idea.reference_url) {
      copyText += `\n\nContoh Referensi: ${idea.reference_url}`;
    }
    navigator.clipboard.writeText(copyText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Generate Video Concept handler
  const handleGenerateVideo = async (idea: IdeaItem, index: number) => {
    setGeneratingVideoIndex(index);
    try {
      const res = await apiFetch<{ video_content: VideoContent }>('/api/content/generate-video', {
        method: 'POST',
        body: JSON.stringify({ theme: customTheme, idea }),
      });
      setGeneratedVideos(prev => ({ ...prev, [index]: res.video_content }));
      showFeedback('Konsep naskah video berhasil diproduksi!', 'success');
    } catch (err: any) {
      showFeedback('Gagal membuat konsep video: ' + err.message, 'error');
    } finally {
      setGeneratingVideoIndex(null);
    }
  };

  const handleCopyScript = (index: number) => {
    const video = generatedVideos[index];
    if (!video) return;

    let text = `🎬 *NASKAH & STORYBOARD VIDEO PRODUCTION*\n`;
    text += `Judul: ${video.title}\n`;
    text += `Format: ${video.format} | Durasi: ${video.duration}\n\n`;
    text += `📌 *HOOK (3 Detik Pertama):*\n"${video.hook}"\n\n`;
    text += `📋 *STORYBOARD / ALUR SCENE:*\n`;
    video.scenes.forEach((s) => {
      text += `Scene ${s.scene_number} [${s.duration}]:\n- Visual: ${s.visual}\n- Narasi: "${s.narration}"\n\n`;
    });
    text += `🎵 *Saran Musik Latar:* ${video.music_suggestion}\n`;
    text += `📢 *Call to Action:* ${video.cta}\n\n`;
    text += `📝 *Caption Pendukung:*\n${video.caption}\n\n`;
    text += `🏷️ ${video.hashtags ? video.hashtags.join(' ') : ''}`;

    navigator.clipboard.writeText(text);
    setCopiedScriptIndex(index);
    setTimeout(() => setCopiedScriptIndex(null), 2000);
  };

  const formatSelectedDate = () => {
    if (!selectedCell) return '';
    return `${selectedCell.dayNum} ${MONTH_NAMES[selectedCell.date.getMonth()]} ${selectedCell.date.getFullYear()}`;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const isToday = (d: Date) => 
    d.getDate() === today.getDate() && 
    d.getMonth() === today.getMonth() && 
    d.getFullYear() === today.getFullYear();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden pt-16 md:pt-0 bg-[#F8FAFC]">
      <Sidebar />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto bg-[#F8FAFC]">
        
        {/* Top Feedback Toast */}
        {feedbackMsg.text && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-xs font-bold shadow-xl border flex items-center space-x-2.5 animate-slideIn ${
            feedbackMsg.type === 'error' 
              ? 'bg-rose-900 text-rose-100 border-rose-700' 
              : feedbackMsg.type === 'info'
              ? 'bg-[#0B2545] text-amber-300 border-amber-500/40'
              : 'bg-emerald-900 text-emerald-100 border-emerald-700'
          }`}>
            <Info className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Corporate Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 mb-6 border-b border-slate-200/80 gap-4 animate-slideUp">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
                <Image
                  src="/komdigi-icon.png"
                  alt="Komdigi"
                  width={14}
                  height={14}
                  className="object-contain"
                />
                <span className="text-[10px] font-black text-[#0B2545] tracking-wider uppercase font-display">
                  KOMDIGI RI
                </span>
                <span className="text-[9px] text-slate-300 font-bold">•</span>
                <span className="text-[9.5px] text-slate-600 font-semibold">BLSDM Publikasi</span>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-display font-extrabold text-[#0B2545] tracking-tight">
              Kalender Konten & Publikasi Instansi
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              Perencanaan agenda publikasi digital, beasiswa DTS, dan edukasi literasi siber masyarakat.
            </p>
          </div>

          {/* Month Navigation & Action Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTodayMonth}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0B2545] border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Bulan Ini
            </button>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-extrabold text-[#0B2545] font-display min-w-[120px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Legend Indicators Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Kategori:</span>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const theme = CATEGORY_THEMES[key];
            return (
              <div 
                key={key} 
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${theme.bg} ${theme.text} ${theme.border}`}
              >
                <span className={`h-2 w-2 rounded-full ${theme.dot}`}></span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Calendar Grid Container */}
        <section className="flex-1 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden">
          
          {/* Day Names Header */}
          <div className="grid grid-cols-7 bg-[#0B2545] text-white border-b border-slate-800 text-center text-xs font-bold font-display py-2.5">
            {DAY_NAMES.map((day, i) => (
              <div key={day} className={i === 0 ? 'text-amber-400' : 'text-slate-200'}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className={`flex-1 grid grid-cols-7 ${calendarDays.length > 35 ? 'grid-rows-6' : 'grid-rows-5'} divide-x divide-y divide-slate-100 bg-slate-50/50`}>
            {loadingEvents ? (
              <div className={`col-span-7 ${calendarDays.length > 35 ? 'row-span-6' : 'row-span-5'} flex flex-col items-center justify-center p-8 space-y-3`}>
                <div className="h-8 w-8 rounded-full border-3 border-amber-500 border-t-[#0B2545] animate-spin"></div>
                <span className="text-xs font-bold text-slate-500 font-display">Memuat Agenda Instansi...</span>
              </div>
            ) : (
              calendarDays.map((cell, idx) => {
                const dayEvents = events.filter(e => e.day === cell.dayNum && cell.isCurrentMonth);
                const isSelected = selectedCell && 
                  selectedCell.dayNum === cell.dayNum && 
                  selectedCell.isCurrentMonth === cell.isCurrentMonth;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCell(cell)}
                    className={`min-h-[70px] md:min-h-[95px] p-2 flex flex-col cursor-pointer transition-all relative group ${
                      !cell.isCurrentMonth ? 'bg-slate-100/40 text-slate-350' : 'bg-white text-slate-800'
                    } ${
                      isSelected 
                        ? 'ring-2 ring-[#0B2545] ring-inset bg-amber-50/30' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Day Number Row */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center font-display ${
                        isToday(cell.date) 
                          ? 'bg-amber-500 text-[#0B2545] font-extrabold shadow-xs' 
                          : isSelected ? 'bg-[#0B2545] text-white font-extrabold' : 'text-slate-700'
                      } ${!cell.isCurrentMonth && 'opacity-30'}`}>
                        {cell.dayNum}
                      </span>
                    </div>

                    {/* Desktop Events rendering */}
                    <div className="space-y-1 overflow-y-auto flex-1 max-h-[85px] mt-0.5 pr-0.5 hidden md:block">
                      {dayEvents.map((evt) => {
                        const themeColors = CATEGORY_THEMES[evt.category] || { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500', border: 'border-slate-200' };
                        return (
                          <div
                            key={evt.id}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md truncate flex items-center space-x-1.5 border ${themeColors.bg} ${themeColors.text} ${themeColors.border}`}
                            title={`${CATEGORY_LABELS[evt.category] || evt.category}: ${evt.title}`}
                          >
                            {evt.category === 'podcast' ? (
                              <Mic className="h-2.5 w-2.5 shrink-0 text-purple-600" />
                            ) : (
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${themeColors.dot}`}></span>
                            )}
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile Dots indicators */}
                    <div className="flex flex-wrap gap-1 justify-center mt-1 md:hidden">
                      {dayEvents.map((evt) => {
                        const themeColors = CATEGORY_THEMES[evt.category] || { dot: 'bg-slate-500' };
                        return (
                          <span 
                            key={evt.id} 
                            className={`h-1.5 w-1.5 rounded-full ${themeColors.dot}`} 
                            title={`${CATEGORY_LABELS[evt.category] || evt.category}: ${evt.title}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Instansi AI Copilot Dialog Modal */}
        {selectedCell && (
          <>
            {/* Backdrop Overlay */}
            <div 
              onClick={() => setSelectedCell(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-45 animate-fadeIn"
            />
            
            {/* Floating Modal Wrapper */}
            <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-5 md:p-8 z-50 pointer-events-none">
              
              {/* Modal Box */}
              <section className="w-full max-w-2xl bg-white border border-slate-200 flex flex-col max-h-[90vh] rounded-2xl text-slate-800 overflow-hidden shadow-2xl relative pointer-events-auto animate-scaleUp">
                
                <div className="flex flex-col relative z-10 w-full h-full overflow-hidden">
                  
                  {/* Copilot Header (Navy Blue + Gold Badge) */}
                  <div className="p-5 bg-[#0B2545] text-white flex items-center justify-between shrink-0 border-b border-amber-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
                        <Image
                          src="/komdigi-icon.png"
                          alt="KOMDIGI"
                          width={26}
                          height={26}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-sm tracking-tight text-white flex items-center space-x-2">
                          <span>Asisten Publikasi Konten BLSDM Komdigi</span>
                        </h3>
                        <span className="text-[10.5px] font-bold text-amber-400 flex items-center space-x-1.5 mt-0.5">
                          <CalendarDays className="h-3 w-3" />
                          <span>{formatSelectedDate()}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCell(null)}
                      className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="Tutup Panel"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Scrollable workspace */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
                    
                    {/* Seed Event Detail Panel if exists */}
                    {(() => {
                      const dayEvents = events.filter(e => e.day === selectedCell.dayNum && selectedCell.isCurrentMonth);
                      if (dayEvents.length > 0) {
                        const evt = dayEvents[0];
                        const themeColors = CATEGORY_THEMES[evt.category] || { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500', border: 'border-slate-200' };
                        return (
                          <div className={`p-4 rounded-xl border ${themeColors.bg} ${themeColors.border} space-y-2`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${themeColors.text} bg-white border ${themeColors.border}`}>
                                {CATEGORY_LABELS[evt.category] || evt.category}
                              </span>
                              {(evt.category === 'custom' || evt.category === 'podcast') && (
                                <button
                                  onClick={() => handleDeleteTheme(evt.id)}
                                  disabled={deletingTheme}
                                  className="text-rose-700 hover:text-rose-800 text-[10px] font-bold flex items-center space-x-1 transition disabled:opacity-50 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded-md border border-rose-300"
                                  title="Hapus Jadwal"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus Jadwal</span>
                                </button>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <h4 className="font-display font-extrabold text-sm text-[#0B2545] leading-snug">
                                {evt.title}
                              </h4>
                              {evt.description && (
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                  {evt.description}
                                </p>
                              )}
                            </div>

                            {evt.category === 'podcast' && (
                              <div className="pt-2 flex items-center justify-between border-t border-purple-200/60">
                                <span className="text-[11px] text-purple-700 font-semibold flex items-center space-x-1">
                                  <Mic className="h-3 w-3" />
                                  <span>Jadwal Tayang PodHub</span>
                                </span>
                                <Link
                                  href={`/podcast?theme=${encodeURIComponent(evt.title.replace(/^\[PodHub\]\s*/i, ''))}`}
                                  className="px-3 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#134074] text-white text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                                >
                                  <Mic className="h-3 w-3 text-amber-400" />
                                  <span>Buka di Studio Podcast 🎙️</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* AI Theme Recommendation Section */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="h-4 w-4 text-amber-600" />
                          <span className="text-xs font-extrabold text-[#0B2545] uppercase tracking-wider">
                            Rekomendasi Tema Instansi
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Pilih fokus niche</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {['AI & Data', 'Cybersecurity', 'Digitalent DTS', 'Coding', 'Literasi Digital'].map((niche) => (
                          <button
                            key={niche}
                            onClick={() => setSelectedNiche(selectedNiche === niche ? '' : niche)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                              selectedNiche === niche
                                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {niche}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={async () => {
                          setGeneratingThemes(true);
                          setSuggestedThemes([]);
                          try {
                            const dateStr = selectedCell
                              ? `${selectedCell.date.getFullYear()}-${String(selectedCell.date.getMonth() + 1).padStart(2, '0')}-${String(selectedCell.dayNum).padStart(2, '0')}`
                              : '';
                            const res = await apiFetch<{ themes: string[] }>('/api/content/generate-theme', {
                              method: 'POST',
                              body: JSON.stringify({ 
                                niche: selectedNiche || 'Umum', 
                                date: dateStr,
                                content_pillar: selectedPillar === 'Semua Pilar' ? '' : selectedPillar
                              }),
                            });
                            setSuggestedThemes(res.themes);
                            showFeedback('Rekomendasi tema berhasil dibuat!', 'success');
                          } catch (err: any) {
                            showFeedback('Gagal generate tema: ' + err.message, 'error');
                          } finally {
                            setGeneratingThemes(false);
                          }
                        }}
                        disabled={generatingThemes}
                        className="w-full py-2.5 bg-[#0B2545] hover:bg-[#081C35] text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer border-b-2 border-amber-500 shadow-2xs"
                      >
                        {generatingThemes ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin"></span>
                            <span>Menghasilkan Rekomendasi Tema...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span>Generate Rekomendasi Tema AI</span>
                          </>
                        )}
                      </button>

                      {/* Theme suggestions */}
                      {suggestedThemes.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Pilih Salah Satu Tema Berikut:
                          </span>
                          {suggestedThemes.map((theme, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCustomTheme(theme);
                                showFeedback('Tema terpilih! Silakan generate ide konten.', 'info');
                              }}
                              className="w-full text-left p-3 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl text-xs font-semibold text-slate-800 transition cursor-pointer flex items-start space-x-2.5 group"
                            >
                              <span className="h-5 w-5 rounded-full bg-[#0B2545] text-amber-400 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed font-bold">{theme}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI Input Form */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-extrabold text-[#0B2545] uppercase tracking-wider">
                          Tema Konten / Kegiatan Publikasi Instansi
                        </label>
                        <div className="relative">
                          <span className="absolute top-3 left-3.5 flex items-center pointer-events-none text-slate-400">
                            <PenTool className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            value={customTheme}
                            onChange={(e) => setCustomTheme(e.target.value)}
                            placeholder="Tulis tema konten baru di sini..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveTheme}
                          disabled={savingTheme || !customTheme.trim()}
                          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border border-slate-200 disabled:opacity-50 cursor-pointer"
                        >
                          {savingTheme ? (
                            <>
                              <span className="h-3 w-3 rounded-full border border-slate-400 border-t-[#0B2545] animate-spin"></span>
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-3.5 w-3.5 text-slate-600" />
                              <span>Simpan Tema ke Kalender</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content Pillar Selector */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-[#0B2545] uppercase tracking-wider flex items-center space-x-1.5">
                          <Target className="h-4 w-4 text-amber-500" />
                          <span>Pilar Konten (Content Pillar)</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Arahkan fokus ide AI
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {CONTENT_PILLARS.map((pillar) => {
                          const isSelected = selectedPillar === pillar.name;
                          return (
                            <button
                              key={pillar.name}
                              type="button"
                              onClick={() => setSelectedPillar(pillar.name)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                                isSelected
                                  ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-xs ring-2 ring-[#0B2545]/20'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 mb-1">
                                <span className="text-sm shrink-0">{pillar.icon}</span>
                                <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-800'}`}>
                                  {pillar.label}
                                </span>
                              </div>
                              <span className={`text-[9.5px] leading-tight font-medium ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                                {pillar.tagline}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Pillar Description Banner */}
                      {(() => {
                        const activeObj = CONTENT_PILLARS.find(p => p.name === selectedPillar);
                        return activeObj ? (
                          <div className="mt-1 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start space-x-2 text-[11px] text-slate-700">
                            <span className="text-amber-600 font-bold shrink-0 mt-0.5">{activeObj.icon}</span>
                            <div className="leading-snug">
                              <span className="font-extrabold text-[#0B2545]">{activeObj.name}: </span>
                              <span className="font-medium text-slate-600">{activeObj.desc}</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* AI Core Generation Trigger */}
                    <div>
                      <button
                        onClick={handleGenerateIdeas}
                        disabled={generatingIdeas || !customTheme.trim()}
                        className="w-full py-3 bg-[#0B2545] hover:bg-[#081C35] text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer border-b-2 border-amber-500"
                      >
                        {generatingIdeas ? (
                          <>
                            <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin"></span>
                            <span>Menganalisis & Merancang Ide Konten...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span>Generate Ide Konten Instansi</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Recommendations Showcase */}
                    <div className="space-y-4">
                      {generatedIdeas.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                          <span className="text-xs font-extrabold text-[#0B2545] uppercase tracking-wider">
                            Rekomendasi Ide Konten ({generatedIdeas.length} Poin)
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => exportIdeasToPDF(customTheme, formatSelectedDate(), generatedIdeas)}
                              className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                              title="Ekspor daftar ide ke PDF"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Ekspor PDF</span>
                            </button>
                            <button
                              onClick={() => exportIdeasToExcel(customTheme, formatSelectedDate(), generatedIdeas)}
                              className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                              title="Ekspor daftar ide ke Excel"
                            >
                              <FileSpreadsheet className="h-3 w-3" />
                              <span>Ekspor Excel</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {generatedIdeas.map((idea, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-white border border-slate-200 hover:border-[#0B2545]/40 rounded-xl relative group transition shadow-2xs space-y-2.5"
                        >
                          <button
                            onClick={() => handleCopyIdea(idea, idx)}
                            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Salin Ide"
                          >
                            {copiedIndex === idx ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#0B2545] text-amber-400 text-[9.5px] font-extrabold uppercase tracking-wider">
                              Ide 0{idx + 1}
                            </span>
                            {idea.pillar && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold border ${
                                idea.pillar === 'Entertainment' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : idea.pillar === 'Trend'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : idea.pillar === 'Konten Nasional'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {idea.pillar === 'Entertainment' ? '🎮 ' : idea.pillar === 'Trend' ? '🚀 ' : idea.pillar === 'Konten Nasional' ? '🇮🇩 ' : '📚 '}
                                {idea.pillar}
                              </span>
                            )}
                            {idea.format && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[9.5px] font-bold">
                                {idea.format}
                              </span>
                            )}
                          </div>

                          <h5 className="font-display font-extrabold text-xs text-[#0B2545] leading-snug pr-6">
                            {idea.title}
                          </h5>

                          <p className="text-xs text-slate-600 leading-relaxed font-medium pr-4">
                            {idea.summary}
                          </p>

                          <div className="pt-2 flex flex-wrap gap-2">
                            {idea.reference_url && (
                              <a
                                href={getAbsoluteUrl(idea.reference_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition ${
                                  idea.format?.toLowerCase().includes('carousel') || idea.format?.toLowerCase().includes('poster') || idea.format?.toLowerCase().includes('infografis')
                                    ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                                    : 'text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200'
                                }`}
                              >
                                {idea.format?.toLowerCase().includes('carousel') || idea.format?.toLowerCase().includes('poster') || idea.format?.toLowerCase().includes('infografis') ? (
                                  <Layers className="h-3.5 w-3.5" />
                                ) : (
                                  <Video className="h-3.5 w-3.5" />
                                )}
                                <span>
                                  {idea.format?.toLowerCase().includes('carousel') ? 'Contoh Carousel' 
                                    : idea.format?.toLowerCase().includes('poster') || idea.format?.toLowerCase().includes('infografis') ? 'Contoh Desain'
                                    : idea.format?.toLowerCase().includes('reels') || idea.format?.toLowerCase().includes('tiktok') ? 'Contoh Reels'
                                    : idea.format?.toLowerCase().includes('motion') ? 'Contoh Motion'
                                    : 'Contoh Video'}
                                </span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                              </a>
                            )}

                            <button
                              onClick={() => handleGenerateVideo(idea, idx)}
                              disabled={generatingVideoIndex !== null}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#0B2545] bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                            >
                              {generatingVideoIndex === idx ? (
                                <>
                                  <span className="h-3 w-3 rounded-full border border-[#0B2545] border-t-amber-500 animate-spin"></span>
                                  <span>
                                    {idea.format?.toLowerCase().includes('carousel') 
                                      ? 'Menyusun Slide...' 
                                      : idea.format?.toLowerCase().includes('poster') || idea.format?.toLowerCase().includes('infografis')
                                      ? 'Menyusun Layout...'
                                      : 'Membuat Script...'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  {idea.format?.toLowerCase().includes('carousel') ? (
                                    <Layers className="h-3.5 w-3.5 text-indigo-600" />
                                  ) : idea.format?.toLowerCase().includes('poster') || idea.format?.toLowerCase().includes('infografis') ? (
                                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                                  ) : (
                                    <Clapperboard className="h-3.5 w-3.5 text-amber-600" />
                                  )}
                                  <span>
                                    {idea.format?.toLowerCase().includes('carousel') 
                                      ? 'Rancang Slide Carousel' 
                                      : idea.format?.toLowerCase().includes('poster') || idea.format?.toLowerCase().includes('infografis')
                                      ? 'Rancang Layout Poster'
                                      : 'Storyboard & Naskah Video'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Video / Carousel / Poster concept result */}
                          {generatedVideos[idx] && (() => {
                            const isCar = generatedVideos[idx].format?.toLowerCase().includes('carousel') || idea.format?.toLowerCase().includes('carousel');
                            const isPost = generatedVideos[idx].format?.toLowerCase().includes('poster') || generatedVideos[idx].format?.toLowerCase().includes('infografis') || idea.format?.toLowerCase().includes('poster');
                            return (
                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 bg-slate-50/80 p-3.5 rounded-xl border">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
                                <span className="text-[10px] font-extrabold text-[#0B2545] uppercase tracking-wider flex items-center space-x-1.5">
                                  {isCar ? <Layers className="h-3.5 w-3.5 text-indigo-600" /> : isPost ? <FileText className="h-3.5 w-3.5 text-blue-600" /> : <Clapperboard className="h-3.5 w-3.5 text-amber-600" />}
                                  <span>
                                    {isCar ? `Konsep & Alur Slide Carousel 0${idx + 1}` : isPost ? `Layout & Copywriting Poster 0${idx + 1}` : `Konsep Storyboard Video 0${idx + 1}`}
                                  </span>
                                </span>
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => exportStoryboardToPDF(customTheme, generatedVideos[idx])}
                                    className="text-[9.5px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-md transition flex items-center space-x-1 cursor-pointer"
                                    title="Ekspor ke PDF"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span>PDF</span>
                                  </button>
                                  <button
                                    onClick={() => exportStoryboardToExcel(customTheme, generatedVideos[idx])}
                                    className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition flex items-center space-x-1 cursor-pointer"
                                    title="Ekspor ke Excel"
                                  >
                                    <FileSpreadsheet className="h-3 w-3" />
                                    <span>Excel</span>
                                  </button>
                                  <button
                                    onClick={() => handleCopyScript(idx)}
                                    className="text-[9.5px] font-bold text-[#0B2545] bg-white hover:bg-slate-100 border border-slate-300 px-2 py-1 rounded-md transition cursor-pointer"
                                  >
                                    {copiedScriptIndex === idx ? (
                                      <span className="text-emerald-600 font-bold">Tersalin!</span>
                                    ) : (
                                      <span>Copy {isCar ? 'Slide' : isPost ? 'Poster' : 'Script'}</span>
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                                  isCar ? 'bg-indigo-700 text-white' : isPost ? 'bg-blue-700 text-white' : 'bg-[#0B2545] text-white'
                                }`}>
                                  {generatedVideos[idx].format}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[9px] font-bold">
                                  {generatedVideos[idx].duration}
                                </span>
                              </div>

                              <h6 className="text-xs font-extrabold text-[#0B2545]">
                                {generatedVideos[idx].title}
                              </h6>

                              {/* Hook */}
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider block mb-0.5">
                                  {isCar ? 'Headline Cover Slide 1 (Hook Pemikat)' : isPost ? 'Headline Utama Poster' : 'Hook (3 Detik Pertama)'}
                                </span>
                                <p className="text-xs text-slate-800 leading-relaxed font-semibold italic">
                                  &ldquo;{generatedVideos[idx].hook}&rdquo;
                                </p>
                              </div>

                              {/* Storyboard / Slide breakdown */}
                              <div className="space-y-2">
                                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                  {isCar ? `Alur Slide-by-Slide (${generatedVideos[idx].scenes.length} Slide)` : isPost ? 'Struktur Bagian Poster Infografis' : 'Storyboard Adegan Video'}
                                </span>
                                {generatedVideos[idx].scenes.map((scene, sIdx) => (
                                  <div key={sIdx} className="flex gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                                    <div className={`h-5 w-5 rounded-full text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                                      isCar ? 'bg-indigo-900 text-amber-300' : isPost ? 'bg-blue-900 text-blue-200' : 'bg-[#0B2545] text-amber-400'
                                    }`}>
                                      {scene.scene_number}
                                    </div>
                                    <div className="space-y-0.5 leading-relaxed">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                                        {scene.duration || (isCar ? `Slide ${scene.scene_number}` : `Bagian ${scene.scene_number}`)}
                                      </span>
                                      <p className="text-slate-800">
                                        <strong className={isCar ? 'text-indigo-900' : isPost ? 'text-blue-900' : 'text-[#0B2545]'}>
                                          {isCar ? 'Arahan Visual Desain Slide:' : isPost ? 'Layout & Visual Grafis:' : 'Visual Kamera:'}
                                        </strong> {scene.visual}
                                      </p>
                                      <p className="text-slate-700">
                                        <strong className="text-slate-900">
                                          {isCar ? 'Teks yang Ditulis di Slide:' : isPost ? 'Teks Konten Poster:' : 'Naskah Narasi:'}
                                        </strong> &ldquo;{scene.narration}&rdquo;
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Suggested Music */}
                              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                                <div className="flex items-center space-x-1.5 mb-0.5">
                                  <Music className="h-3.5 w-3.5 text-blue-700" />
                                  <span className="text-[9px] font-extrabold text-blue-800 uppercase tracking-wider">
                                    {isCar ? 'Saran Audio / Lagu Tren Instagram' : isPost ? 'Saran Musik Latar Feed' : 'Saran Audio Latar'}
                                  </span>
                                </div>
                                <p className="text-slate-700 font-medium">{generatedVideos[idx].music_suggestion}</p>
                              </div>

                              {/* CTA */}
                              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                                <div className="flex items-center space-x-1.5 mb-0.5">
                                  <Megaphone className="h-3.5 w-3.5 text-emerald-700" />
                                  <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">Call to Action</span>
                                </div>
                                <p className="text-slate-700 font-medium">{generatedVideos[idx].cta}</p>
                              </div>
                            </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </section>

            </div>
          </>
        )}

      </main>
    </div>
  );
}
