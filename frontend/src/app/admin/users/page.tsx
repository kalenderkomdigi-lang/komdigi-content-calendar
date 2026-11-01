'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { apiFetch, getToken, getCurrentUser, User as UserType } from '@/utils/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  User, 
  Trash2, 
  Edit3, 
  X, 
  AlertTriangle,
  Shield,
  RefreshCw,
  MoreVertical,
  ChevronDown,
  UserCheck,
  Calendar
} from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();

  // User States
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Action Menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Form States (Add/Edit)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pegawai',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check Admin Access
  useEffect(() => {
    const token = getToken();
    const currentUser = getCurrentUser();

    if (!token) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      setCurrentUserId(currentUser.id);
      if (currentUser.role !== 'admin') {
        alert('Akses Ditolak: Anda bukan Administrator.');
        router.push('/calendar');
      }
    }
  }, [router]);

  // Close action menu on click outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openMenuId]);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 5000);
  };

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/admin/users?q=${encodeURIComponent(searchQuery)}`
        : '/api/admin/users';
      const data = await apiFetch<UserType[]>(url);
      setUsers(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengguna';
      showFeedback(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({ name: '', email: '', password: '', role: 'pegawai' });
    setIsAddModalOpen(true);
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      showFeedback('Kata sandi minimal 6 karakter', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      showFeedback(`Akun pegawai "${formData.name}" berhasil dibuat!`, 'success');
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat akun';
      showFeedback(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u: UserType) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email,
      password: '',
      role: u.role || 'pegawai',
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  // Handle Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const payload: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      await apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      showFeedback(`Data akun "${formData.name}" berhasil diperbarui!`, 'success');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui akun';
      showFeedback(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (u: UserType) => {
    if (currentUserId && u.id === currentUserId) {
      showFeedback('Anda tidak dapat menghapus akun Anda sendiri!', 'error');
      return;
    }
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  // Handle Confirm Delete
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      showFeedback(`Akun "${selectedUser.email}" berhasil dihapus.`, 'info');
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus akun';
      showFeedback(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Computed statistics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const pegawaiCount = users.filter((u) => u.role !== 'admin').length;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden pt-16 md:pt-0 bg-[#F8FAFC]">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Sticky page header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
          <div className="px-4 md:px-8 py-4 md:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200/90 shadow-2xs">
                    <Image
                      src="/komdigi-icon.png"
                      alt="Komdigi"
                      width={12}
                      height={12}
                      className="object-contain"
                    />
                    <span className="text-[9px] font-black text-[#0B2545] tracking-wider uppercase font-display">
                      KOMDIGI RI
                    </span>
                    <span className="text-[8px] text-slate-300 font-bold">•</span>
                    <span className="text-[9px] text-amber-600 font-extrabold uppercase">
                      Panel Administrator
                    </span>
                  </div>
                </div>
                <h1 className="text-lg md:text-xl font-display font-extrabold text-[#0B2545] tracking-tight">
                  Manajemen Akun Pegawai
                </h1>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 hidden sm:block">
                  Kelola akses pegawai, delegasi hak admin, dan arsip kepegawaian BLSDM.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={openCreateModal}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0B2545] hover:bg-[#134074] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0B2545]/15 border-b-2 border-amber-500 cursor-pointer shrink-0"
              >
                <UserPlus className="h-4 w-4 text-amber-400" />
                <span>Tambah Akun Pegawai</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 px-4 md:px-8 py-5 space-y-5">
          {/* Feedback Toast */}
          {feedbackMsg.text && (
            <div
              className={`fixed top-20 md:top-4 right-4 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border flex items-center space-x-2.5 animate-slideIn max-w-sm ${
                feedbackMsg.type === 'error'
                  ? 'bg-rose-900 text-rose-100 border-rose-700'
                  : feedbackMsg.type === 'info'
                  ? 'bg-[#0B2545] text-amber-300 border-amber-500/40'
                  : 'bg-emerald-900 text-emerald-100 border-emerald-700'
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button onClick={() => setFeedbackMsg({ text: '', type: '' })} className="ml-2 text-white/60 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Total Akun
                </p>
                <p className="text-lg md:text-xl font-display font-extrabold text-[#0B2545] leading-tight">
                  {totalUsers}
                </p>
              </div>
            </div>

            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Pegawai
                </p>
                <p className="text-lg md:text-xl font-display font-extrabold text-[#0B2545] leading-tight">
                  {pegawaiCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Admin
                </p>
                <p className="text-lg md:text-xl font-display font-extrabold text-[#0B2545] leading-tight">
                  {adminCount}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email pegawai..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]/20 transition shadow-2xs"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 rounded-xl border border-slate-200 transition cursor-pointer shadow-2xs shrink-0"
              title="Segarkan Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading && 'animate-spin'}`} />
            </button>
          </div>

          {/* ============================================ */}
          {/* DESKTOP TABLE VIEW */}
          {/* ============================================ */}
          <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-[#0B2545] text-white text-[10px] font-bold font-display uppercase tracking-wider">
                    <th className="py-3 px-4 w-[30%]">Pegawai / Nama</th>
                    <th className="py-3 px-4 w-[28%]">Email Kedinasan</th>
                    <th className="py-3 px-4 w-[15%]">Role</th>
                    <th className="py-3 px-4 w-[15%]">Terdaftar</th>
                    <th className="py-3 px-4 text-center w-[12%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-2"></div>
                        <span className="text-xs font-semibold">Memuat data akun pegawai...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold text-slate-500">Tidak ada akun ditemukan</p>
                        <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isAdmin = u.role === 'admin';
                      const isSelf = currentUserId && u.id === currentUserId;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Name & Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                                isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#0B2545]'
                              }`}>
                                {u.name ? u.name.charAt(0) : u.email.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">{u.name || 'Pegawai Komdigi'}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[8px] font-extrabold uppercase shrink-0">
                                      Anda
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-mono truncate max-w-[200px]">
                            {u.email}
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                              isAdmin
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                              <span>{isAdmin ? 'Admin' : 'Pegawai'}</span>
                            </span>
                          </td>

                          {/* Created At */}
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center space-x-1">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B2545] hover:bg-slate-100 transition cursor-pointer"
                                title="Edit Akun"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(u)}
                                disabled={Boolean(isSelf)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  isSelf
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={isSelf ? 'Tidak bisa menghapus akun sendiri' : 'Hapus Akun'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================ */}
          {/* MOBILE CARD VIEW */}
          {/* ============================================ */}
          <div className="md:hidden space-y-3">
            {loading && users.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-2"></div>
                <span className="text-xs font-semibold">Memuat data...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-500">Tidak ada akun ditemukan</p>
              </div>
            ) : (
              users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isSelf = currentUserId && u.id === currentUserId;

                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3"
                  >
                    {/* Top row: avatar + name + action menu */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase shrink-0 ${
                          isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#0B2545]'
                        }`}>
                          {u.name ? u.name.charAt(0) : u.email.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {u.name || 'Pegawai Komdigi'}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[8px] font-extrabold uppercase">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* 3-dot menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === u.id ? null : u.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openMenuId === u.id && (
                          <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 w-40 animate-scaleUp">
                            <button
                              onClick={() => openEditModal(u)}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                              <span>Edit Akun</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              disabled={Boolean(isSelf)}
                              className={`w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold transition ${
                                isSelf
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus Akun</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom row: role + date */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                        isAdmin
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        <span>{isAdmin ? 'Administrator' : 'Pegawai'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer info */}
          <div className="text-center py-4 text-[10px] text-slate-400">
            Menampilkan {users.length} akun terdaftar • Sistem BLSDM Komdigi
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: TAMBAH AKUN PEGAWAI */}
      {/* ============================================================== */}
      {mounted && isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-scaleUp">
            <div className="p-4 bg-[#0B2545] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-white">
                    Tambah Akun Pegawai Baru
                  </h3>
                  <p className="text-[10px] text-sky-200">
                    Buat kredensial akses resmi BLSDM Komdigi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso, S.T."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-1 focus:ring-[#0B2545]/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Email Kedinasan
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama.pegawai@komdigi.go.id"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-1 focus:ring-[#0B2545]/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-1 focus:ring-[#0B2545]/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Hak Akses / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white transition cursor-pointer"
                >
                  <option value="pegawai">Pegawai (Akses Konten & Podcast)</option>
                  <option value="admin">Administrator (Akses Penuh)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#134074] rounded-xl transition shadow-md border-b-2 border-amber-500 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT AKUN PEGAWAI */}
      {/* ============================================================== */}
      {mounted && isEditModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-scaleUp">
            <div className="p-4 bg-[#0B2545] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-white">
                    Perbarui Akun Pegawai
                  </h3>
                  <p className="text-[10px] text-sky-200">
                    ID Akun: #{selectedUser?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-1 focus:ring-[#0B2545]/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Email Kedinasan
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-1 focus:ring-[#0B2545]/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Wewenang / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white transition cursor-pointer"
                >
                  <option value="pegawai">Pegawai</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wider mb-1">
                  Reset Kata Sandi (Opsional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-[#0B2545] focus:bg-white focus:ring-1 focus:ring-[#0B2545]/20 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#134074] rounded-xl transition shadow-md border-b-2 border-amber-500 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Menyimpan...' : 'Perbarui Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================== */}
      {/* MODAL 3: KONFIRMASI HAPUS */}
      {/* ============================================================== */}
      {mounted && isDeleteModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div
            onClick={() => setIsDeleteModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 text-center animate-scaleUp">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display font-extrabold text-base text-slate-900 mb-1">
              Hapus Akun Pegawai?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">{selectedUser?.email}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
