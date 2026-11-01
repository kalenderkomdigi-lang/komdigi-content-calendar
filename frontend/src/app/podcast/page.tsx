'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { 
  apiFetch, 
  getToken, 
  PodcastEpisode, 
  PodcastSpeaker, 
  PodcastThemeIdea 
} from '@/utils/api';
import { 
  exportPodcastScriptToPDF, 
  exportPodcastScriptToTXT 
} from '@/utils/exportUtils';
import { 
  Mic, 
  Sparkles, 
  Users, 
  Radio, 
  FileText, 
  Save, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  ChevronRight, 
  Clock, 
  Flame, 
  HelpCircle, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Edit3, 
  Sliders, 
  FolderOpen, 
  Layers, 
  Headphones, 
  Volume2, 
  MessageCircle,
  Share2,
  Calendar,
  CalendarPlus,
  X
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'Semua Kategori', label: 'Semua Kategori' },
  { id: 'Teknologi & Keterampilan Digital', label: 'Teknologi & Keterampilan Digital' },
  { id: 'Karier & Fresh Graduate', label: 'Karier & Fresh Graduate' },
  { id: 'Komunikasi & Public Speaking', label: 'Komunikasi & Public Speaking' },
  { id: 'Budaya Kerja & Relasi Kantor', label: 'Budaya Kerja & Relasi Kantor' },
  { id: 'Mental Health & Work-Life Balance', label: 'Mental Health & Work-Life Balance' },
  { id: 'Finansial & Quarter-Life Crisis', label: 'Finansial & Quarter-Life Crisis' }
];

const SUGGESTED_PRESETS = [
  {
    title: 'AI & Keterampilan Digital',
    prompt: 'Pemanfaatan AI dan keahlian digital untuk meningkatkan efisiensi kerja pegawai kantor',
    badge: 'Teknologi 🚀',
    category: 'Teknologi & Keterampilan Digital'
  },
  {
    title: 'Transisi Fresh Graduate',
    prompt: 'Kegalauan fresh graduate masuk dunia kerja: syok budaya kampus vs ritme 9-to-5',
    badge: 'Karier 🎓',
    category: 'Karier & Fresh Graduate'
  },
  {
    title: 'Public Speaking di Depan Pimpinan',
    prompt: 'Tips presentasi percaya diri di depan pimpinan tanpa rasa grogi dan overthinking',
    badge: 'Komunikasi 🎤',
    category: 'Komunikasi & Public Speaking'
  },
  {
    title: 'Mengatasi Imposter Syndrome',
    prompt: 'Sindrom imposter di kantor: mengatasi rasa minder di hadapan rekan kerja senior',
    badge: 'Mental Health 🧠',
    category: 'Mental Health & Work-Life Balance'
  },
  {
    title: 'Work-Life Balance & Cegah Burnout',
    prompt: 'Menjaga produktivitas dan batasan kerja profesional tanpa mengorbankan kesehatan mental',
    badge: 'Produktivitas ⚖️',
    category: 'Mental Health & Work-Life Balance'
  },
  {
    title: 'Melek Finansial First Jobber',
    prompt: 'Manajemen gaji pertama, dilema sandwich generation pemula, dan self-reward bijak',
    badge: 'Finansial 💸',
    category: 'Finansial & Quarter-Life Crisis'
  },
  {
    title: 'Beasiswa Pelatihan Digital (DTS)',
    prompt: 'Panduan dan peluang memanfaatkan beasiswa pelatihan digital gratis dari instansi resmi',
    badge: 'Beasiswa 🏛️',
    category: 'Teknologi & Keterampilan Digital'
  }
];

const VIBE_OPTIONS = [
  { id: 'PodHub Santai & Solutif', label: 'PodHub Santai & Solutif', desc: 'Obrolan santai, humor cerdas, mengalir alami, tapi sarat solusi konkret.' },
  { id: 'Edukasi Praktis & Aplikatif', label: 'Edukasi Praktis & Aplikatif', desc: 'Fokus tips nyata, panduan langkah demi langkah yang mudah diterapkan.' },
  { id: 'Deep Talk & Reflektif', label: 'Deep Talk & Reflektif', desc: 'Membahas sisi emosional, perjuangan nyata, dan pembelajaran bijak.' },
  { id: 'Debat Perspektif & Opini', label: 'Debat Perspektif & Opini', desc: 'Diskusi kritis saling adu pandangan pro vs kontra secara asik.' }
];

const DURATION_OPTIONS = [
  { id: '10-15 Menit', label: '10-15 Menit', tag: 'Quick Pod' },
  { id: '20-25 Menit', label: '20-25 Menit', tag: 'Standard PodHub' },
  { id: '30-40 Menit', label: '30-40 Menit', tag: 'Deep Dive' }
];

const SPEAKER_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' }
};

export default function PodcastStudioPage() {
  const router = useRouter();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'studio' | 'history'>('studio');

  // Step 1: Theme Generation States
  const [themeKeyword, setThemeKeyword] = useState('Pemanfaatan AI & Keterampilan Digital untuk Produktivitas Kerja');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedVibe, setSelectedVibe] = useState('PodHub Santai & Solutif');
  const [generatingThemes, setGeneratingThemes] = useState(false);
  const [themeOptions, setThemeOptions] = useState<PodcastThemeIdea[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<PodcastThemeIdea | null>(null);

  // Step 2: Attendees & Script Config States
  const [speakerCount, setSpeakerCount] = useState<number>(3);
  const [speakers, setSpeakers] = useState<PodcastSpeaker[]>([
    { id: 1, name: 'Rangga', role: 'Host Utama', persona: 'Host santai, komunikatif, ahli memancing curhat, dan suka bikin suasana hidup.', avatarColor: 'amber', avatar_color: 'amber' },
    { id: 2, name: 'Dinda', role: 'Narasumber (Fresh Grad)', persona: 'Fresh graduate baru lulus 4 bulan, lagi masa adaptasi, overthinking masa depan tapi penuh semangat.', avatarColor: 'blue', avatar_color: 'blue' },
    { id: 3, name: 'Bayu', role: 'Narasumber (Senior Muda)', persona: 'Pegawai yang sudah 3 tahun kerja di kantor, realistis, solutif, pernah melewati masa-masa galau pas lulus.', avatarColor: 'emerald', avatar_color: 'emerald' },
  ]);
  const [selectedDuration, setSelectedDuration] = useState('20-25 Menit');
  const [isEditingSpeakers, setIsEditingSpeakers] = useState(false);

  // Step 3: Script & Output States
  const [generatingScript, setGeneratingScript] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState<number | 'all'>('all');
  const [savingScript, setSavingScript] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: string; link?: { href: string; label: string } }>({ text: '', type: '' });
  const [savingThemeDraft, setSavingThemeDraft] = useState(false);

  // Teleprompter States
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(2); // 1 to 5
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // History Tab States
  const [historyEpisodes, setHistoryEpisodes] = useState<PodcastEpisode[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Calendar Scheduling Modal States
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<{ title: string; description: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // Authentication check & URL query check
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get('theme') || params.get('topic');
      if (urlTheme) {
        setThemeKeyword(urlTheme);
      }
    }
  }, [router]);

  // Adjust default speakers list whenever speakerCount changes
  useEffect(() => {
    const defaultTemplates: PodcastSpeaker[] = [
      { id: 1, name: 'Rangga', role: 'Host Utama', persona: 'Host santai, komunikatif, ahli memancing curhat, dan suka bikin suasana hidup.', avatarColor: 'amber', avatar_color: 'amber' },
      { id: 2, name: 'Dinda', role: 'Narasumber (Fresh Grad)', persona: 'Fresh graduate baru lulus 4 bulan, lagi masa adaptasi, overthinking masa depan tapi penuh semangat.', avatarColor: 'blue', avatar_color: 'blue' },
      { id: 3, name: 'Bayu', role: 'Narasumber (Senior Muda)', persona: 'Pegawai yang sudah 3 tahun kerja, realistis, solutif, pernah melewati masa galau pas lulus.', avatarColor: 'emerald', avatar_color: 'emerald' },
      { id: 4, name: 'Rian', role: 'Narasumber (Teman Kantor Kocak)', persona: 'Rekan kerja seumuran yang blak-blakan, punya banyak cerita blunder lucu.', avatarColor: 'purple', avatar_color: 'purple' },
      { id: 5, name: 'Sarah', role: 'Narasumber / Co-Host (Talenta Muda)', persona: 'Pemerhati tren karier dan teknologi muda, wawasan luas seputar skill digital.', avatarColor: 'rose', avatar_color: 'rose' },
    ];

    setSpeakers(defaultTemplates.slice(0, speakerCount));
  }, [speakerCount]);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success', link?: { href: string; label: string }) => {
    setFeedbackMsg({ text, type, link });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 6000);
  };

  // Open Calendar Schedule Modal
  const openScheduleModal = (title: string, description: string) => {
    setScheduleTarget({ title, description });
    setScheduleModalOpen(true);
  };

  // Confirm Save Event to Calendar
  const handleConfirmSchedule = async () => {
    if (!scheduleTarget) return;

    setSchedulingLoading(true);
    try {
      let m = 0;
      let d = 0;
      if (scheduleDate) {
        const parts = scheduleDate.split('-');
        if (parts.length === 3) {
          m = parseInt(parts[1], 10);
          d = parseInt(parts[2], 10);
        }
      }

      await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: `[PodHub] ${scheduleTarget.title}`,
          description: `${scheduleTarget.description} | Format: Podcast Anak Muda (${speakerCount} Pembicara)`,
          category: 'podcast',
          date: scheduleDate,
          month: m > 0 ? m : undefined,
          day: d > 0 ? d : undefined,
        }),
      });

      showFeedback(
        `Tema podcast "${scheduleTarget.title}" berhasil disimpan ke Kalender Konten! 📅`,
        'success',
        { href: '/calendar', label: 'Buka Kalender Konten →' }
      );
      setScheduleModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menjadwalkan ke kalender';
      showFeedback(`Gagal: ${msg}`, 'error');
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Save Active Theme directly as a draft episode in history/database
  const handleSaveActiveThemeAsDraft = async () => {
    const activeTitle = selectedTheme ? selectedTheme.title : (themeKeyword.trim() || 'Kegalauan Anak Muda Saat Lulus Nanti');
    const activeDesc = selectedTheme ? selectedTheme.description : `Tema Podcast: ${activeTitle}`;

    // If there's already a generated script matching this title, save full episode
    if (currentEpisode && currentEpisode.title.toLowerCase() === activeTitle.toLowerCase()) {
      handleSaveEpisode();
      return;
    }

    setSavingThemeDraft(true);
    try {
      const draftEpisode: PodcastEpisode = {
        title: activeTitle,
        topic: activeDesc,
        category: selectedTheme?.category || 'Tema Pilihan',
        vibe: selectedVibe,
        duration: selectedDuration,
        speaker_count: speakerCount,
        speakers: speakers,
        segments: [
          {
            segment_number: 1,
            title: 'Konsep & Kerangka Tema',
            duration: selectedDuration,
            summary: `Eksplorasi tema podcast: ${activeTitle}`,
            dialogue: [
              {
                speaker_id: speakers[0]?.id || 1,
                speaker_name: speakers[0]?.name || 'Host',
                speaker_role: speakers[0]?.role || 'Host Utama',
                line: `Halo rekan-rekan semua! Di episode PodHub kali ini, kita akan membahas topik yang sedang hangat diperbincangkan: "${activeTitle}".`,
                cue: 'antusias dan hangat',
              }
            ]
          }
        ],
        key_takeaways: [
          `Fokus utama tema: ${activeTitle}`,
          `Format podcast: ${speakerCount} pembicara (${selectedVibe})`,
          'Draft tema tersimpan untuk proses produksi lanjutan'
        ],
        social_caption: `🎙️ PodHub Kantor Segera Hadir: "${activeTitle}"! Nantikan obrolan seru dan insight mendalamnya.`
      };

      await apiFetch('/api/podcast/save', {
        method: 'POST',
        body: JSON.stringify(draftEpisode),
      });

      showFeedback(
        `Tema "${activeTitle}" berhasil disimpan ke Arsip PodHub! 💾`,
        'success',
        { href: '#', label: '' }
      );
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      showFeedback(`Gagal menyimpan tema: ${msg}`, 'error');
    } finally {
      setSavingThemeDraft(false);
    }
  };

  // 1. Generate Podcast Themes Handler
  const handleGenerateThemes = async (keywordToUse?: string, categoryToUse?: string) => {
    const kw = keywordToUse !== undefined ? keywordToUse : themeKeyword;
    const cat = categoryToUse !== undefined ? categoryToUse : selectedCategory;
    if (!kw.trim()) {
      showFeedback('Ketik topik podcast atau pilih salah satu inspirasi preset di bawah.', 'error');
      return;
    }

    setGeneratingThemes(true);
    setThemeOptions([]);

    try {
      const res = await apiFetch<{ themes: PodcastThemeIdea[] }>('/api/podcast/generate-themes', {
        method: 'POST',
        body: JSON.stringify({
          keyword: kw,
          category: cat === 'Semua Kategori' ? '' : cat,
          vibe: selectedVibe,
        }),
      });

      if (res.themes && res.themes.length > 0) {
        setThemeOptions(res.themes);
        setSelectedTheme(res.themes[0]);
        showFeedback(`Berhasil menghasilkan ${res.themes.length} rekomendasi tema podcast!`, 'success');
      } else {
        showFeedback('Tidak ada tema yang dihasilkan. Coba kata kunci lain.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      showFeedback(`Gagal membuat tema: ${msg}`, 'error');
    } finally {
      setGeneratingThemes(false);
    }
  };

  // 2. Generate Podcast Script Handler
  const handleGenerateScript = async () => {
    if (!selectedTheme && !themeKeyword) {
      showFeedback('Pilih salah satu tema podcast terlebih dahulu.', 'error');
      return;
    }

    setGeneratingScript(true);
    setCurrentEpisode(null);

    const themeTitle = selectedTheme ? selectedTheme.title : themeKeyword;
    const themeDesc = selectedTheme ? selectedTheme.description : 'Kegalauan anak muda di kantor';

    try {
      const res = await apiFetch<{ episode: PodcastEpisode }>('/api/podcast/generate-script', {
        method: 'POST',
        body: JSON.stringify({
          theme: themeTitle,
          description: themeDesc,
          speaker_count: speakerCount,
          custom_speakers: speakers,
          duration: selectedDuration,
          vibe: selectedVibe,
        }),
      });

      if (res.episode) {
        setCurrentEpisode(res.episode);
        showFeedback('Naskah podcast lengkap berhasil dibuat!', 'success');
        
        // Auto scroll to script preview
        setTimeout(() => {
          const el = document.getElementById('script-preview-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      showFeedback(`Gagal membuat naskah: ${msg}`, 'error');
    } finally {
      setGeneratingScript(false);
    }
  };

  // 3. Save Podcast Episode to Database
  const handleSaveEpisode = async () => {
    if (!currentEpisode) return;

    setSavingScript(true);
    try {
      await apiFetch('/api/podcast/save', {
        method: 'POST',
        body: JSON.stringify(currentEpisode),
      });

      showFeedback('Episode podcast berhasil disimpan ke arsip kantor!', 'success');
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      showFeedback(`Gagal menyimpan: ${msg}`, 'error');
    } finally {
      setSavingScript(false);
    }
  };

  // 4. Fetch History Episodes
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiFetch<PodcastEpisode[]>(`/api/podcast/history${historySearch ? `?q=${encodeURIComponent(historySearch)}` : ''}`);
      setHistoryEpisodes(res || []);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, [historySearch]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // 5. Delete Episode from History
  const handleDeleteEpisode = async (id?: number) => {
    if (!id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus arsip podcast ini?')) return;

    try {
      await apiFetch(`/api/podcast/${id}`, { method: 'DELETE' });
      showFeedback('Arsip podcast berhasil dihapus.', 'info');
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      showFeedback(`Gagal menghapus: ${msg}`, 'error');
    }
  };

  // Teleprompter Auto Scroll Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTeleprompterOpen && isAutoScrolling) {
      interval = setInterval(() => {
        const container = document.getElementById('teleprompter-content');
        if (container) {
          container.scrollTop += teleprompterSpeed;
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isTeleprompterOpen, isAutoScrolling, teleprompterSpeed]);

  // Copy full script as text
  const handleCopyScriptText = () => {
    if (!currentEpisode) return;
    let fullText = `NASKAH PODCAST: ${currentEpisode.title}\n`;
    fullText += `Topik: ${currentEpisode.topic}\n`;
    fullText += `Durasi: ${currentEpisode.duration} | Pembicara: ${currentEpisode.speaker_count} Orang\n\n`;
    fullText += `--- PEMBICARA ---\n`;
    currentEpisode.speakers.forEach((s) => {
      fullText += `- ${s.name} (${s.role}): ${s.persona}\n`;
    });
    fullText += `\n--- DIALOG ---\n`;
    currentEpisode.segments.forEach((seg) => {
      fullText += `\n[${seg.title}]\n`;
      seg.dialogue.forEach((d) => {
        fullText += `[${d.speaker_name}] ${d.cue ? `${d.cue} ` : ''}: "${d.line}"\n`;
      });
    });

    navigator.clipboard.writeText(fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
    showFeedback('Naskah berhasil disalin ke clipboard!', 'success');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden pt-16 md:pt-0">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN STUDIO VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* HEADER BAR */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#0B2545] to-blue-700 flex items-center justify-center text-amber-400 shadow-md shadow-[#0B2545]/20 ring-2 ring-amber-400/30">
              <Mic className="h-5.5 w-5.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
                  <Image
                    src="/komdigi-icon.png"
                    alt="Komdigi"
                    width={13}
                    height={13}
                    className="object-contain"
                  />
                  <span className="text-[9.5px] font-black text-[#0B2545] tracking-wider uppercase font-display">
                    KOMDIGI
                  </span>
                </div>
                <h1 className="text-lg font-bold text-[#0B2545] font-display tracking-tight">
                  Studio PodHub & Podcast Anak Muda
                </h1>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span>ON AIR STUDIO</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generator tema dan naskah obrolan kantor multi-speaker otomatis untuk anak muda & fresh graduates
              </p>
            </div>
          </div>

          {/* STUDIO MODE TABS */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-white text-[#0B2545] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B2545]'
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-amber-500" />
              <span>Studio Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-[#0B2545] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B2545]'
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
              <span>Arsip Naskah</span>
            </button>
          </div>
        </header>

        {/* FEEDBACK TOAST */}
        {feedbackMsg.text && (
          <div className="fixed top-20 right-6 z-50">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center space-x-2.5 backdrop-blur-md ${
                feedbackMsg.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : feedbackMsg.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{feedbackMsg.text}</span>
              {feedbackMsg.link?.href && feedbackMsg.link?.label && (
                <Link
                  href={feedbackMsg.link.href}
                  className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                >
                  {feedbackMsg.link.label}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: STUDIO GENERATOR */}
        {/* ============================================================== */}
        {activeTab === 'studio' && (
          <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
            
            {/* HERO BANNER & INSPIRATION */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B2545] via-[#134074] to-[#0B2545] p-6 md:p-8 text-white shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-sky-200">
                  <Image
                    src="/komdigi-icon.png"
                    alt="Komdigi"
                    width={14}
                    height={14}
                    className="object-contain"
                  />
                  <span>Fitur Khusus PodHub Anak Muda BLSDM Komdigi</span>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold font-display leading-snug">
                  Bikin Obrolan Podcast Kantor yang Seru, Relatable, dan Gak Kaku! 🎙️✨
                </h2>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  Tentukan tema obrolan yang lagi hangat dirasain anak-anak muda kantor (seperti <i>kegalauan fresh graduate pas lulus, realita dunia kerja, sindrom imposter</i>), pilih berapa orang yang hadir, dan biarkan AI merancang naskah PodHub lengkap baris-per-baris dengan intonasi emosional.
                </p>

                {/* AUDIO WAVE VISUALIZER DECORATION */}
                <div className="flex items-center space-x-1.5 pt-2">
                  <span className="text-[10px] text-slate-300 font-medium mr-2">Studio Mic Live:</span>
                  {[40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 70].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-amber-400 rounded-full animate-pulse"
                      style={{ height: `${h * 0.22}px`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 1: GENERATE & TENTUKAN TEMA PODCAST */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B2545] font-display">
                      Tentukan & Generate Tema Podcast
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ketik topik bahasan podcast, pilih kategori dan gaya obrolan, lalu generate tema yang relevan dan aplikatif
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Flame className="h-4 w-4 text-rose-500" />
                  <span>Contoh: Keamanan data digital, public speaking pimpinan, pemanfaatan AI, work-life balance</span>
                </div>
              </div>

              {/* INPUT BAR & ACTION */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={themeKeyword}
                      onChange={(e) => setThemeKeyword(e.target.value)}
                      placeholder='Contoh: Pemanfaatan AI untuk Produktivitas Kerja, Tips Public Speaking di Depan Pimpinan...'
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] transition"
                    />
                  </div>

                  {/* Category Selection Dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B2545] cursor-pointer"
                    title="Pilih kategori topik"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {/* Vibe Selection Dropdown */}
                  <select
                    value={selectedVibe}
                    onChange={(e) => setSelectedVibe(e.target.value)}
                    className="px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B2545] cursor-pointer"
                    title="Pilih gaya dan suasana obrolan"
                  >
                    {VIBE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (!themeKeyword.trim()) {
                        showFeedback('Ketik tema podcast Anda terlebih dahulu.', 'error');
                        return;
                      }
                      const customIdea: PodcastThemeIdea = {
                        id: `custom-${Date.now()}`,
                        title: themeKeyword.trim(),
                        catchphrase: 'Tema kustom pilihan',
                        description: `Pembahasan mendalam dan terarah mengenai: ${themeKeyword.trim()}`,
                        category: selectedCategory === 'Semua Kategori' ? 'Tema Kustom' : selectedCategory,
                        angle: 'Perspektif aplikatif dunia kerja',
                        target_audience: 'Pegawai muda, profesional, anak magang, dan talenta digital',
                        practical_application: `Langkah nyata penerapan ${themeKeyword.trim()} di lingkungan kerja.`,
                        discussion_points: [
                          `Tantangan dan realitas seputar ${themeKeyword.trim()}`,
                          `Solusi konkret dan strategi implementasi`,
                          `Tips menjaga konsistensi dan evaluasi hasil`
                        ],
                        suggested_questions: [
                          `Bagaimana pandangan kita tentang tantangan ${themeKeyword.trim()} saat ini?`,
                          `Apa langkah pertama yang paling realistis untuk dieksekusi?`
                        ],
                        relatability_score: 98,
                      };
                      setSelectedTheme(customIdea);
                      showFeedback(`Tema aktif disetel ke: "${themeKeyword.trim()}"`, 'success');
                    }}
                    className="px-4 py-3 rounded-xl border border-[#0B2545] bg-white hover:bg-slate-50 text-[#0B2545] text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                    title="Gunakan langsung teks yang Anda ketik sebagai judul tema podcast tanpa generate AI"
                  >
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Pakai Tema Ini Langsung 🎯</span>
                  </button>

                  <button
                    onClick={() => handleGenerateThemes()}
                    disabled={generatingThemes}
                    className="px-6 py-3 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold transition shadow-md shadow-[#0B2545]/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {generatingThemes ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menganalisis Relevansi...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>Generate Ide Tema ✨</span>
                      </>
                    )}
                  </button>
                </div>

                {/* PRESET TAGS / CHIPS */}
                <div className="flex items-center flex-wrap gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display mr-1">
                    Inspirasi Cepat:
                  </span>
                  {SUGGESTED_PRESETS.map((p) => (
                    <button
                      key={p.title}
                      onClick={() => {
                        setThemeKeyword(p.prompt);
                        if (p.category) {
                          setSelectedCategory(p.category);
                        }
                        handleGenerateThemes(p.prompt, p.category);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 hover:text-[#0B2545] hover:border-slate-300 transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>{p.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                        {p.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GENERATED THEME OPTIONS CARDS */}
              {themeOptions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-display">
                      Rekomendasi Tema Podcast Terpilih ({themeOptions.length} Opsi):
                    </span>
                    <span className="text-xs text-amber-700 font-medium">
                      💡 Klik kartu untuk memilih tema yang akan dibuatkan naskah
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {themeOptions.map((opt) => {
                      const isSelected = selectedTheme?.id === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedTheme(opt)}
                          className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer space-y-4 ${
                            isSelected
                              ? 'border-[#0B2545] bg-blue-50/40 ring-2 ring-[#0B2545]/20 shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wide">
                                {opt.category || 'Podcast'}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <span>Relate:</span>
                                <span>{opt.relatability_score}%</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-[#0B2545] leading-snug">
                              {opt.title}
                            </h4>

                            <p className="text-xs italic text-slate-500 font-serif">
                              {opt.catchphrase}
                            </p>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {opt.description}
                            </p>

                            {/* Practical Application Callout */}
                            {opt.practical_application && (
                              <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200/70 text-emerald-950 text-xs leading-relaxed space-y-0.5">
                                <span className="font-extrabold flex items-center gap-1.5 text-emerald-800 text-[11px] uppercase tracking-wide">
                                  <span>🎯</span>
                                  <span>Penerapan Praktis untuk Pendengar:</span>
                                </span>
                                <p className="text-slate-700 leading-normal">{opt.practical_application}</p>
                              </div>
                            )}

                            {/* Discussion Pillars */}
                            {opt.discussion_points && opt.discussion_points.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  📌 3 Pilar Bahasan Utama:
                                </span>
                                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                                  {opt.discussion_points.slice(0, 3).map((dp, idx) => (
                                    <li key={idx} className="leading-snug">{dp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Trigger Questions */}
                            {opt.suggested_questions && opt.suggested_questions.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  💬 Pemicu Obrolan:
                                </span>
                                <p className="text-xs text-slate-600 italic line-clamp-2">
                                  &ldquo;{opt.suggested_questions[0]}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTheme(opt);
                                openScheduleModal(opt.title, opt.description);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Jadwalkan tema ini ke Kalender Konten"
                            >
                              <CalendarPlus className="h-3 w-3" />
                              <span>Jadwalkan 📅</span>
                            </button>

                            <span
                              className={`text-xs font-bold flex items-center space-x-1 ${
                                isSelected ? 'text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md' : 'text-slate-400'
                              }`}
                            >
                              <span>{isSelected ? '✓ Tema Aktif' : 'Pilih Tema'}</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BANNER TEMA TERPILIH YANG AKAN DIBUATKAN NASKAH */}
              <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-transparent border-2 border-amber-400/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start md:items-center space-x-3.5 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-2xl bg-[#0B2545] text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    🎯
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 tracking-wider">
                        Tema Aktif untuk Naskah
                      </span>
                      {selectedTheme?.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {selectedTheme.category}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        (Naskah yang di-generate akan 100% membahas tema ini)
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-extrabold text-[#0B2545] font-display mt-0.5 truncate">
                      &quot;{selectedTheme ? selectedTheme.title : (themeKeyword.trim() || 'Pemanfaatan AI & Keterampilan Digital')}&quot;
                    </h3>
                    {selectedTheme?.practical_application && (
                      <p className="text-xs text-emerald-800 font-medium truncate mt-0.5">
                        🎯 {selectedTheme.practical_application}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => {
                      const currentVal = selectedTheme ? selectedTheme.title : themeKeyword;
                      const customTitle = prompt('Ubah/Kustomisasi Judul Tema Podcast:', currentVal);
                      if (customTitle && customTitle.trim()) {
                        const updated: PodcastThemeIdea = {
                          id: `edited-${Date.now()}`,
                          title: customTitle.trim(),
                          catchphrase: selectedTheme?.catchphrase || 'Tema pilihan instansi',
                          description: selectedTheme?.description || customTitle.trim(),
                          category: selectedTheme?.category || 'Kustom',
                          angle: selectedTheme?.angle || 'Perspektif aplikatif dunia kerja',
                          target_audience: selectedTheme?.target_audience || 'Pegawai muda kantor',
                          practical_application: selectedTheme?.practical_application || `Panduan praktis ${customTitle.trim()}`,
                          discussion_points: selectedTheme?.discussion_points || ['Pilar 1', 'Pilar 2', 'Pilar 3'],
                          suggested_questions: selectedTheme?.suggested_questions || [],
                          relatability_score: selectedTheme?.relatability_score || 98,
                        };
                        setSelectedTheme(updated);
                        setThemeKeyword(customTitle.trim());
                        showFeedback(`Judul tema diperbarui: "${customTitle.trim()}"`, 'success');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                    <span>Edit Judul</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const activeTitle = selectedTheme ? selectedTheme.title : (themeKeyword.trim() || 'Pemanfaatan AI & Keterampilan Digital');
                      const activeDesc = selectedTheme ? selectedTheme.description : `Tema Podcast: ${activeTitle}`;
                      openScheduleModal(activeTitle, activeDesc);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    title="Jadwalkan tema aktif ini langsung ke Kalender Konten"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-purple-600" />
                    <span>Simpan ke Kalender 📅</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveActiveThemeAsDraft}
                    disabled={savingThemeDraft}
                    className="px-3.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    title="Simpan tema aktif ini ke Arsip & Riwayat Studio Podcast"
                  >
                    {savingThemeDraft ? (
                      <div className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    <span>Simpan Draft 💾</span>
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 2: PENGATURAN PEMBICARA & ORANG YANG HADIR */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B2545] font-display">
                      Pilih Berapa Orang yang Hadir dalam Podcast
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tentukan jumlah narasumber & host; naskah akan membagi porsi dialog secara natural
                    </p>
                  </div>
                </div>

                {/* Edit Speaker Names Toggle */}
                <button
                  onClick={() => setIsEditingSpeakers(!isEditingSpeakers)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition flex items-center space-x-1.5 self-start md:self-auto cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                  <span>{isEditingSpeakers ? 'Selesai Ubah Nama' : 'Kustomisasi Nama & Peran'}</span>
                </button>
              </div>

              {/* SPEAKER COUNT SELECTOR BUTTONS */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider font-display block">
                  Jumlah Orang yang Hadir di Meja Podcast:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { count: 2, label: '2 Orang', desc: '1 Host + 1 Tamu (Obrolan Intim 1-on-1)' },
                    { count: 3, label: '3 Orang', desc: '1 Host + 2 Tamu (Dinamika PodHub Ideal)' },
                    { count: 4, label: '4 Orang', desc: '1 Host + 3 Tamu (Diskusi Panel Seru)' },
                    { count: 5, label: '5 Orang', desc: '2 Host/Co-host + 3 Tamu (Rame & Hidup)' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      onClick={() => setSpeakerCount(item.count)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        speakerCount === item.count
                          ? 'border-[#0B2545] bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20 ring-2 ring-[#0B2545]/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-extrabold font-display">
                          {item.label}
                        </span>
                        <Users className={`h-4 w-4 ${speakerCount === item.count ? 'text-amber-400' : 'text-slate-400'}`} />
                      </div>
                      <p className={`text-[11px] leading-snug ${speakerCount === item.count ? 'text-slate-200' : 'text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* SPEAKER PERSONAS DISPLAY / EDIT FORM */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-display">
                    Susunan Pembicara yang Akan Tampil ({speakers.length} Orang):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Setiap pembicara akan memiliki gaya bahasa dan intonasi khas
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {speakers.map((sp, idx) => {
                    const colorKey = sp.avatarColor || sp.avatar_color || 'blue';
                    const colorStyle = SPEAKER_COLOR_CLASSES[colorKey] || SPEAKER_COLOR_CLASSES.blue;
                    return (
                      <div
                        key={sp.id}
                        className={`p-3.5 rounded-xl border ${colorStyle.border} ${colorStyle.bg} space-y-2`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${colorStyle.badge}`}>
                            {sp.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditingSpeakers ? (
                              <input
                                type="text"
                                value={sp.name}
                                onChange={(e) => {
                                  const updated = [...speakers];
                                  updated[idx].name = e.target.value;
                                  setSpeakers(updated);
                                }}
                                className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 bg-white"
                                placeholder="Nama Pembicara"
                              />
                            ) : (
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {sp.name}
                              </h5>
                            )}

                            {isEditingSpeakers ? (
                              <input
                                type="text"
                                value={sp.role}
                                onChange={(e) => {
                                  const updated = [...speakers];
                                  updated[idx].role = e.target.value;
                                  setSpeakers(updated);
                                }}
                                className="w-full mt-1 px-2 py-0.5 text-[10px] rounded border border-slate-300 bg-white"
                                placeholder="Role/Peran"
                              />
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500 block">
                                {sp.role}
                              </span>
                            )}
                          </div>
                        </div>

                        {isEditingSpeakers ? (
                          <textarea
                            value={sp.persona}
                            onChange={(e) => {
                              const updated = [...speakers];
                              updated[idx].persona = e.target.value;
                              setSpeakers(updated);
                            }}
                            rows={2}
                            className="w-full p-1.5 text-[10px] rounded border border-slate-300 bg-white"
                            placeholder="Deskripsi karakter / sudut pandang"
                          />
                        ) : (
                          <p className="text-[11px] text-slate-600 italic leading-snug">
                            &quot;{sp.persona}&quot;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DURATION & ACTIONS */}
              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <span className="text-xs font-bold text-slate-600 font-display">
                    Estimasi Durasi Naskah:
                  </span>
                  <div className="flex items-center space-x-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDuration(d.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          selectedDuration === d.id
                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateScript}
                  disabled={generatingScript || (!selectedTheme && !themeKeyword)}
                  className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {generatingScript ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menulis Naskah PodHub {speakerCount} Orang...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      <span>Generate Naskah Podcast Lengkap 🎙️</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STEP 3: STUDIO SCRIPT VIEWER & TOOLS */}
            {currentEpisode && (
              <div id="script-preview-section" className="space-y-6 pt-4 animate-fadeIn">
                {/* SCRIPT HEADER & TOOLBAR */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0B2545] text-white uppercase tracking-wider">
                          Naskah Siap Rekaman
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-amber-700">
                          {currentEpisode.duration} Durasi
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-blue-700">
                          {currentEpisode.speaker_count} Pembicara
                        </span>
                      </div>
                      <h3 className="text-lg md:text-xl font-extrabold text-[#0B2545] font-display">
                        {currentEpisode.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Topik: <span className="font-semibold text-slate-700">&quot;{currentEpisode.topic}&quot;</span>
                      </p>
                    </div>

                    {/* ACTION TOOLBAR BUTTONS */}
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Schedule Episode to Calendar */}
                      <button
                        onClick={() => openScheduleModal(currentEpisode.title, `Topik: "${currentEpisode.topic}" | Durasi: ${currentEpisode.duration} | Pembicara: ${currentEpisode.speaker_count} Orang`)}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                        title="Jadwalkan episode ini ke Kalender Konten"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 text-amber-600" />
                        <span>Jadwalkan ke Kalender 📅</span>
                      </button>

                      {/* Teleprompter Button */}
                      <button
                        onClick={() => setIsTeleprompterOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                        title="Mode layar penuh untuk presenter saat take rekaman"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Mode Teleprompter 📺</span>
                      </button>

                      {/* Download PDF Button */}
                      <button
                        onClick={() => exportPodcastScriptToPDF(currentEpisode)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Unduh PDF</span>
                      </button>

                      {/* Download TXT Button */}
                      <button
                        onClick={() => exportPodcastScriptToTXT(currentEpisode)}
                        className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>TXT</span>
                      </button>

                      {/* Copy Script */}
                      <button
                        onClick={handleCopyScriptText}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        {copiedScript ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedScript ? 'Tersalin!' : 'Salin Naskah'}</span>
                      </button>

                      {/* Save to History Button */}
                      <button
                        onClick={handleSaveEpisode}
                        disabled={savingScript}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{savingScript ? 'Menyimpan...' : 'Simpan ke Arsip'}</span>
                      </button>
                    </div>
                  </div>

                  {/* FILTER BY SPEAKER (FOR REHEARSAL) */}
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display mr-1">
                      Filter Pembicara (Gladi Resik):
                    </span>
                    <button
                      onClick={() => setSelectedSpeakerFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        selectedSpeakerFilter === 'all'
                          ? 'bg-[#0B2545] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Dialog ({currentEpisode.speakers.length} Orang)
                    </button>
                    {currentEpisode.speakers.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => setSelectedSpeakerFilter(sp.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          selectedSpeakerFilter === sp.id
                            ? 'bg-[#0B2545] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sp.name} ({sp.role.split(' ')[0]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* SCRIPT SEGMENTS LIST */}
                <div className="space-y-6">
                  {currentEpisode.segments.map((segment) => {
                    // Filter lines if speaker filter is active
                    const filteredLines = selectedSpeakerFilter === 'all'
                      ? segment.dialogue
                      : segment.dialogue.filter((d) => d.speaker_id === selectedSpeakerFilter);

                    if (filteredLines.length === 0 && selectedSpeakerFilter !== 'all') {
                      return null;
                    }

                    return (
                      <div
                        key={segment.segment_number}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                      >
                        {/* Segment Header */}
                        <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <h4 className="text-sm font-extrabold text-[#0B2545] font-display">
                              {segment.title}
                            </h4>
                            {segment.summary && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {segment.summary}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
                            ⏱️ {segment.duration}
                          </span>
                        </div>

                        {/* Dialogue Stream */}
                        <div className="p-6 space-y-4">
                          {filteredLines.map((line, lineIdx) => {
                            const spObj = currentEpisode.speakers.find((s) => s.id === line.speaker_id);
                            const colorKey = spObj ? (spObj.avatarColor || spObj.avatar_color || 'blue') : 'blue';
                            const colorStyle = SPEAKER_COLOR_CLASSES[colorKey] || SPEAKER_COLOR_CLASSES.blue;

                            return (
                              <div
                                key={lineIdx}
                                className="flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50/60 transition group"
                              >
                                {/* Speaker Avatar Pill */}
                                <div
                                  className={`h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs flex-shrink-0 ${colorStyle.badge}`}
                                >
                                  {line.speaker_name.charAt(0)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 font-display">
                                      {line.speaker_name}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      [{line.speaker_role}]
                                    </span>

                                    {/* Cue / Acting Stage Direction */}
                                    {line.cue && (
                                      <span className="text-[10px] italic text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                        {line.cue}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-sm text-slate-700 leading-relaxed font-sans">
                                    &quot;{line.line}&quot;
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* KEY TAKEAWAYS & SOCIAL MEDIA PROMOTION CARD */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Takeaways */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <h4 className="text-sm font-bold text-[#0B2545] font-display">
                        Pesan Kunci / Key Takeaways untuk Anak Muda
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {currentEpisode.key_takeaways?.map((point, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-slate-600">
                          <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Social Media Promo Caption */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Share2 className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-bold text-[#0B2545] font-display">
                          Draft Caption Promosi Media Sosial
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          if (currentEpisode.social_caption) {
                            navigator.clipboard.writeText(currentEpisode.social_caption);
                            setCopiedCaption(true);
                            setTimeout(() => setCopiedCaption(false), 2000);
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedCaption ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCaption ? 'Tersalin!' : 'Salin Caption'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 whitespace-pre-line max-h-48 overflow-y-auto font-sans leading-relaxed">
                      {currentEpisode.social_caption}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ARSIP & RIWAYAT NASKAH PODCAST */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0B2545] font-display">
                  Arsip Naskah PodHub Kantor
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar episode podcast anak muda yang telah disimpan sebelumnya
                </p>
              </div>

              {/* Search History */}
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari berdasarkan judul atau topik..."
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs w-full sm:w-72 focus:outline-none focus:border-[#0B2545]"
              />
            </div>

            {loadingHistory ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Memuat riwayat podcast...
              </div>
            ) : historyEpisodes.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                <Mic className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Belum ada arsip naskah podcast tersimpan.
                </p>
                <p className="text-xs text-slate-400">
                  Buat episode podcast baru di tab Studio Generator lalu klik Simpan ke Arsip.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                          {ep.speaker_count} Pembicara
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ep.created_at ? new Date(ep.created_at).toLocaleDateString('id-ID') : ''}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#0B2545] leading-snug">
                        {ep.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Topik: &quot;{ep.topic}&quot;
                      </p>

                      <div className="flex items-center space-x-1.5 pt-1">
                        {ep.speakers?.map((sp) => (
                          <span
                            key={sp.id}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-semibold"
                          >
                            {sp.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setCurrentEpisode(ep);
                            setActiveTab('studio');
                            setTimeout(() => {
                              const el = document.getElementById('script-preview-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }, 200);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0B2545] text-white text-xs font-semibold hover:bg-[#134074] transition cursor-pointer"
                        >
                          Buka Naskah 🎙️
                        </button>
                        <button
                          onClick={() => openScheduleModal(ep.title, `Topik: "${ep.topic}" | Pembicara: ${ep.speaker_count} Orang`)}
                          className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                          title="Jadwalkan ke Kalender"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          <span>Jadwalkan</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => exportPodcastScriptToPDF(ep)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Unduh PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEpisode(ep.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Arsip"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TELEPROMPTER / FULLSCREEN STUDIO READER MODAL */}
        {/* ============================================================== */}
        {isTeleprompterOpen && currentEpisode && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md text-white flex flex-col">
            {/* Teleprompter Header Bar */}
            <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center space-x-3">
                <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                  STUDIO TELEPROMPTER MODE
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-xs font-semibold text-slate-300 truncate max-w-md">
                  {currentEpisode.title}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4">
                {/* Speed selector */}
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-slate-400">Kecepatan:</span>
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTeleprompterSpeed(s)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                        teleprompterSpeed === s ? 'bg-amber-400 text-slate-950' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Play / Pause Auto Scroll */}
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer ${
                    isAutoScrolling
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isAutoScrolling ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isAutoScrolling ? 'Jeda Scroll' : 'Mulai Scroll'}</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsTeleprompterOpen(false);
                    setIsAutoScrolling(false);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Teleprompter Scrollable Container */}
            <div
              id="teleprompter-content"
              className="flex-1 overflow-y-auto px-8 md:px-24 py-16 space-y-12 max-w-5xl mx-auto w-full select-none"
            >
              {currentEpisode.segments.map((seg) => (
                <div key={seg.segment_number} className="space-y-8">
                  <div className="pb-3 border-b border-amber-500/40 text-amber-400">
                    <h3 className="text-xl md:text-2xl font-black font-display uppercase tracking-wider">
                      {seg.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {seg.summary}
                    </p>
                  </div>

                  <div className="space-y-8">
                    {seg.dialogue.map((d, dIdx) => (
                      <div key={dIdx} className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                            {d.speaker_name} ({d.speaker_role})
                          </span>
                          {d.cue && (
                            <span className="text-xs italic text-amber-300">
                              {d.cue}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-100 font-sans">
                          &quot;{d.line}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: JADWALKAN KE KALENDER KONTEN */}
        {/* ============================================================== */}
        {scheduleModalOpen && scheduleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              onClick={() => setScheduleModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
            />

            {/* Modal Card */}
            <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full p-6 space-y-5 z-10 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#0B2545] to-blue-700 text-amber-400 flex items-center justify-center shadow-md">
                    <CalendarPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B2545] font-display">
                      Jadwalkan Podcast ke Kalender
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sinkronkan konten podcast ini ke Kalender Konten Instansi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Target Content Preview */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-200 text-purple-900 uppercase tracking-wide flex items-center space-x-1">
                    <Mic className="h-3 w-3" />
                    <span>Jadwal Siaran PodHub</span>
                  </span>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    Konten Terjadwal
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#0B2545] leading-snug">
                  {scheduleTarget.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {scheduleTarget.description}
                </p>
              </div>

              {/* Date Picker Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-display block">
                  Pilih Tanggal Publikasi / Tayang:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] transition cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Setelah disimpan, tema ini akan tampil di sel kalender dengan badge PodHub ungu dan dapat dibuka kembali kapan saja.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/calendar"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>Buka Kalender Konten →</span>
                </Link>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmSchedule}
                    disabled={schedulingLoading || !scheduleDate}
                    className="px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold shadow-md shadow-[#0B2545]/20 transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {schedulingLoading ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menjadwalkan...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        <span>Simpan ke Kalender 📅</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

