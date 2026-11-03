'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { apiFetch, getToken, ContentIdea, IdeaItem, getAbsoluteUrl } from '@/utils/api';
import { 
  Search, 
  Calendar, 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  FolderOpen, 
  ArrowRight,
  TrendingUp,
  Tag,
  Video,
  ExternalLink,
  FileSpreadsheet,
  Download,
  Building2,
  Shield,
  Layers
} from 'lucide-react';
import { 
  exportHistoryItemToPDF, 
  exportHistoryItemToExcel 
} from '@/utils/exportUtils';

export default function HistoryPage() {
  const router = useRouter();
  
  // History States
  const [historyItems, setHistoryItems] = useState<ContentIdea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI helpers
  const [copiedCaptionId, setCopiedCaptionId] = useState<number | null>(null);
  const [copiedIdeaIndex, setCopiedIdeaIndex] = useState<{ itemId: number; ideaIdx: number } | null>(null);

  const fetchHistory = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const endpoint = query ? `/api/content/history?q=${encodeURIComponent(query)}` : '/api/content/history';
      const data = await apiFetch<ContentIdea[]>(endpoint);
      setHistoryItems(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat ide konten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    } else {
      fetchHistory();
    }
  }, [router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(searchQuery);
  };

  // Instant search on clear or change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val === '') {
      fetchHistory('');
    }
  };

  const handleCopyCaption = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCaptionId(id);
    setTimeout(() => setCopiedCaptionId(null), 2000);
  };

  const handleCopyIdea = (idea: IdeaItem, itemId: number, ideaIdx: number) => {
    let text = `*${idea.title}*\nFormat: ${idea.format || '-'}\n${idea.summary}`;
    if (idea.reference_url) {
      text += `\nReferensi/Contoh: ${idea.reference_url}`;
    }
    navigator.clipboard.writeText(text);
    setCopiedIdeaIndex({ itemId, ideaIdx });
    setTimeout(() => setCopiedIdeaIndex(null), 2000);
  };

  const formatFriendlyDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden pt-16 md:pt-0 bg-[#F8FAFC]">
      <Sidebar />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto bg-[#F8FAFC]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-slate-200/80 gap-4 animate-slideUp">
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
                <span className="text-[9.5px] text-slate-600 font-semibold">Arsip & Publikasi Digital</span>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-extrabold text-[#0B2545] tracking-tight">
              Arsip & Riwayat Konten Instansi
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              Kelola dan ekspor dokumentasi naskah serta ide posting yang telah disimpan oleh pegawai.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari kata kunci tema atau caption..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] transition-all"
            />
          </form>
        </div>

        {/* Content list or loader */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-12">
            <div className="h-9 w-9 rounded-full border-3 border-amber-500 border-t-[#0B2545] animate-spin"></div>
            <p className="text-xs font-extrabold text-slate-500 font-display">Memuat Arsip Konten Komdigi...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 bg-rose-50 border border-rose-200 rounded-xl max-w-lg mx-auto text-xs font-bold">
            {error}
          </div>
        ) : historyItems.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-2xs text-center max-h-[460px]">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#0B2545] mb-3">
              <FolderOpen className="h-7 w-7 text-[#0B2545]" />
            </div>
            <h4 className="font-display font-extrabold text-base text-[#0B2545]">
              Arsip Konten Masih Kosong
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed font-medium">
              {searchQuery 
                ? 'Tidak ditemukan hasil pencarian untuk kata kunci tersebut. Silakan coba kata kunci lain.' 
                : 'Belum ada naskah publikasi yang disimpan. Silakan buat konten baru melalui kalender.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/calendar')}
                className="mt-5 px-4 py-2.5 bg-[#0B2545] hover:bg-[#081C35] text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition border-b-2 border-amber-500 cursor-pointer shadow-xs"
              >
                <span>Mulai Buat Ide Konten</span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
              </button>
            )}
          </div>
        ) : (
          /* History Items list */
          <div className="space-y-5">
            {historyItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-2xs hover:shadow-md transition duration-200 relative overflow-hidden animate-slideUp"
              >
                {/* Date & Theme Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-4 space-y-3 md:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0B2545] flex items-center justify-center text-amber-400 shadow-2xs flex-shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-sm text-[#0B2545] leading-snug">
                        {item.theme}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" />
                        <span>Jadwal Tayang: {formatFriendlyDate(item.date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => exportHistoryItemToPDF(item)}
                      className="text-[10px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                      title="Ekspor Riwayat Konten ke PDF"
                    >
                      <FileText className="h-3.5 w-3.5 text-rose-600" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => exportHistoryItemToExcel(item)}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                      title="Ekspor Riwayat Konten ke Excel"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Excel</span>
                    </button>
                    <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center space-x-1">
                      <Tag className="h-3 w-3 text-slate-400" />
                      <span>Disimpan: {new Date(item.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>

                {/* Body split: Left generated ideas (if exist), Right caption */}
                <div className={`grid grid-cols-1 gap-5 ${item.ideas && item.ideas.length > 0 ? 'lg:grid-cols-2' : ''}`}>
                  
                  {item.ideas && item.ideas.length > 0 && (
                    /* Left: Ideas List */
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-[#0B2545]">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                        <h4 className="text-xs font-extrabold tracking-wider uppercase font-display">
                          Rekomendasi Ide Konten ({item.ideas.length} Poin)
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {item.ideas.map((idea, idx) => (
                          <div 
                            key={idx} 
                            className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 relative group transition"
                          >
                            <button
                              onClick={() => handleCopyIdea(idea, item.id, idx)}
                              className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:bg-white hover:text-slate-700 transition"
                              title="Salin Ide"
                            >
                              {copiedIdeaIndex?.itemId === item.id && copiedIdeaIndex?.ideaIdx === idx ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="px-1.5 py-0.2 rounded bg-[#0B2545] text-amber-400 text-[9px] font-extrabold uppercase">
                                Ide 0{idx + 1}
                              </span>
                              {idea.pillar && (
                                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold border ${
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
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {idea.format}
                                </span>
                              )}
                            </div>
                            <h5 className="font-display font-extrabold text-xs text-[#0B2545] leading-snug pr-6">
                              {idea.title}
                            </h5>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1 pr-4">
                              {idea.summary}
                            </p>
                            {idea.reference_url && (
                              <div className="mt-2.5">
                                <a
                                  href={getAbsoluteUrl(idea.reference_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center space-x-1 text-[9.5px] font-bold px-2 py-1 rounded-md border transition ${
                                    idea.format?.toLowerCase().includes('carousel') || idea.format?.toLowerCase().includes('poster') || idea.format?.toLowerCase().includes('infografis')
                                      ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                                      : 'text-teal-700 bg-teal-50 hover:bg-teal-100 border-teal-200'
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
                                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Right: Caption Pane */}
                  <div className="space-y-3 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[#0B2545]">
                        <FileText className="h-4 w-4 text-amber-600" />
                        <h4 className="text-xs font-extrabold tracking-wider uppercase font-display">
                          Naskah Caption Resmi
                        </h4>
                      </div>
                      
                      <button
                        onClick={() => handleCopyCaption(item.caption, item.id)}
                        className="text-[10px] font-bold text-[#0B2545] bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedCaptionId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-amber-700" />
                            <span>Salin Caption</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex-1 p-4 rounded-xl bg-slate-900 text-slate-100 font-sans text-xs leading-relaxed whitespace-pre-wrap max-h-[320px] overflow-y-auto border border-slate-950 font-medium">
                      {item.caption}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
