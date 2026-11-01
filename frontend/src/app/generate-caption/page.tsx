'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { apiFetch, getToken, getApiBaseUrl } from '@/utils/api';
import { 
  Sparkles, 
  FileText, 
  Save, 
  Copy, 
  Check, 
  Info,
  Calendar,
  PenTool,
  Upload,
  Trash2,
  ImageIcon,
  Building2,
  Shield,
  Send
} from 'lucide-react';

export default function GenerateCaptionPage() {
  const router = useRouter();

  // Form States
  const [customTheme, setCustomTheme] = useState('');
  const [publishDate, setPublishDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Loading & Action States
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Output States
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Check URL parameters for theme/date (e.g. from Reminder Notification)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get('theme');
      if (themeParam) {
        setCustomTheme(themeParam);
      }
      const dateParam = params.get('date');
      if (dateParam) {
        setPublishDate(dateParam);
      }
    }
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 4000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showFeedback('Harap unggah file gambar yang valid (JPG, PNG, WEBP).', 'error');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        showFeedback('Ukuran file terlalu besar. Maksimal 20MB.', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Generate Caption based on theme and/or image upload (at least one required)
  const handleGenerateContent = async () => {
    if (!customTheme.trim() && !imageFile) {
      showFeedback('Masukkan tema atau unggah gambar terlebih dahulu.', 'error');
      return;
    }

    setGenerating(true);
    setGeneratedCaption('');

    try {
      const formData = new FormData();
      if (customTheme.trim()) {
        formData.append('theme', customTheme);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/content/generate-caption`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      setGeneratedCaption(data.caption);
      showFeedback('Caption publikasi resmi berhasil dibuat!', 'success');
    } catch (err: any) {
      showFeedback('Gagal membuat caption: ' + err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Save generated content to database (with empty ideas array)
  const handleSaveContent = async () => {
    if (!generatedCaption) {
      showFeedback('Pastikan caption sudah dibuat sebelum menyimpan.', 'error');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/api/content/save', {
        method: 'POST',
        body: JSON.stringify({
          date: publishDate,
          theme: customTheme,
          ideas: [],
          caption: generatedCaption,
        }),
      });
      showFeedback('Berhasil menyimpan caption ke Riwayat Konten Instansi!', 'success');
    } catch (err: any) {
      showFeedback('Gagal menyimpan konten: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden pt-16 md:pt-0 bg-[#F8FAFC]">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto bg-[#F8FAFC]">
        
        {/* Corporate Header */}
        <div className="pb-6 mb-6 border-b border-slate-200/80 animate-slideUp">
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
              <span className="text-[9.5px] text-slate-600 font-semibold">Publikasi Informasi Resmi</span>
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-[#0B2545] tracking-tight">
            Generator Caption Publikasi Instansi
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Buat caption resmi berstandar instansi pemerintah berdasarkan topik edukasi publik atau analisis visual gambar.
          </p>
        </div>

        {/* Feedback Floating Banner */}
        {feedbackMsg.text && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs font-bold border ${
            feedbackMsg.type === 'error' 
              ? 'bg-rose-900 text-rose-100 border-rose-700' 
              : 'bg-[#0B2545] text-amber-300 border-amber-500/40'
          } animate-slideUp`}>
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Split Layout Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Configuration */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5 animate-slideUp">
            
            {/* Header Badge */}
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="h-9 w-9 rounded-xl bg-[#0B2545] flex items-center justify-center text-amber-400 shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm tracking-tight text-[#0B2545]">
                  Form Parameter Naskah
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Standar Penyampaian Komdigi</span>
              </div>
            </div>

            {/* Input Theme */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#0B2545] uppercase tracking-wider">
                Tema / Topik Edukasi Publik
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3.5 flex items-center pointer-events-none text-slate-400">
                  <PenTool className="h-4 w-4" />
                </span>
                <textarea
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="Contoh: Pembukaan Beasiswa Digital Talent Scholarship 2026 atau Panduan Keamanan Data..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0B2545] focus:bg-white transition-all placeholder-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Image Upload Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#0B2545] uppercase tracking-wider">
                Unggah Lampiran Visual (Opsional)
              </label>
              
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-amber-50/40 hover:border-amber-400 transition-all p-4 bg-slate-50">
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <Upload className="h-6 w-6 text-[#0B2545] mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Klik untuk Unggah Infografis / Foto</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Format JPG, PNG, WEBP hingga 20MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl relative flex items-center space-x-3">
                  <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imagePreview} 
                      alt="Upload Preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#0B2545] truncate">
                      {imageFile?.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Ukuran: {imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : 0} MB
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveImage}
                    className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition"
                    title="Hapus Gambar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Input Publish Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#0B2545] uppercase tracking-wider">
                Jadwal Publikasi Konten
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0B2545] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleGenerateContent}
              disabled={generating || (!customTheme.trim() && !imageFile)}
              className="w-full py-3 bg-[#0B2545] hover:bg-[#081C35] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed border-b-2 border-amber-500 cursor-pointer"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-amber-400 animate-spin"></span>
                  <span>Menyusun Caption Publikasi Resmi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Generate Caption Resmi AI</span>
                </>
              )}
            </button>

            {generatedCaption && (
              <button
                onClick={handleSaveContent}
                disabled={saving}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                    <span>Menyimpan ke Arsip...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Caption ke Riwayat Konten</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column: Output Showcase */}
          <div className="lg:col-span-7 space-y-6 animate-slideUp">
            
            {/* Loading State */}
            {generating && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs flex flex-col items-center justify-center min-h-[380px] space-y-4">
                <div className="h-10 w-10 rounded-full border-3 border-amber-500 border-t-[#0B2545] animate-spin"></div>
                <div className="text-center">
                  <h4 className="font-display font-extrabold text-sm text-[#0B2545]">Memproses Naskah Caption Resmi</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Asisten Komdigi sedang merancang struktur naskah yang baku, ramah, dan komunikatif bagi masyarakat...
                  </p>
                </div>
              </div>
            )}

            {!generating && !generatedCaption && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs flex flex-col items-center justify-center min-h-[380px] text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#0B2545]">
                  <FileText className="h-7 w-7 text-[#0B2545]" />
                </div>
                <div className="max-w-md">
                  <h4 className="font-display font-extrabold text-base text-[#0B2545]">
                    Hasil Caption Siap Publikasi
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Silakan isi form topik edukasi di sebelah kiri (atau lampirkan foto infografis), lalu klik tombol <strong className="text-[#0B2545]">Generate Caption Resmi AI</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Generated Caption Showcase */}
            {!generating && generatedCaption && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Header Output */}
                <div className="p-4 bg-[#0B2545] text-white flex items-center justify-between border-b border-amber-500/30">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4.5 w-4.5 text-amber-400" />
                    <span className="font-display font-extrabold text-xs tracking-tight">
                      Draft Caption Resmi BLSDM Komdigi
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCaption}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-[#0B2545] font-extrabold rounded-lg text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedCaption ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#0B2545]" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin Caption</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Caption Body */}
                <div className="p-6 bg-slate-50/50 min-h-[300px]">
                  <pre className="text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {generatedCaption}
                  </pre>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-[11px]">Format: Bahasa Indonesia Baku Instansi (Sapaan khas Digiers)</span>
                  <button
                    onClick={handleCopyCaption}
                    className="text-[#0B2545] hover:underline font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin ke Clipboard</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
