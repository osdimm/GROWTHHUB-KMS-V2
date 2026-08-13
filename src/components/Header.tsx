import React, { useState, useRef, useEffect } from 'react';
import { NavigationTab, User, UserRole, AppNotification } from '../types';
import { getRelativeTime } from '../utils/dateUtils';

export type ThemeMode = 'light' | 'dark' | 'system';

interface HeaderProps {
  title?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: NavigationTab) => void;
  onLogoutClick: () => void;
  onOpenMobileSidebar?: () => void;
  currentUser?: User;
  onSwitchUserRole?: (role: UserRole) => void;
  notifications?: AppNotification[];
  onClearNotifications?: () => void;
  onDeleteNotification?: (id: string) => void;
  activeTab?: NavigationTab;
  themeMode?: ThemeMode;
  setThemeMode?: (mode: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  searchQuery,
  setSearchQuery,
  setActiveTab,
  onLogoutClick,
  onOpenMobileSidebar,
  currentUser,
  onSwitchUserRole,
  notifications = [],
  onClearNotifications,
  onDeleteNotification,
  activeTab,
  themeMode = 'system',
  setThemeMode
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [, setTick] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Auto-refresh relative timestamps every 30 seconds while notification panel is open
  useEffect(() => {
    if (!showNotifications) return;
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Cari di KMS Growth Hub (artikel, dokumen, kegiatan)...';
      case 'knowledge-base':
        return 'Cari artikel pengetahuan, panduan, atau SOP...';
      case 'verifikasi-konten':
        return 'Cari dokumen dalam antrean verifikasi...';
      case 'handover-rotasi':
        return 'Cari dokumen handover rotasi...';
      case 'forum-diskusi':
        return 'Cari topik atau balasan forum diskusi...';
      case 'data-pengguna':
        return 'Cari nama, email, atau divisi pengguna...';
      case 'hak-akses':
        return 'Cari pengguna untuk atur hak akses...';
      case 'laporan-penggunaan':
        return 'Cari laporan penggunaan atau statistik...';
      case 'profil-pengguna':
        return 'Cari informasi akun pengguna...';
      default:
        return 'Cari pengetahuan, pengguna, atau laporan...';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showSearchBar =
    activeTab !== 'dashboard' &&
    activeTab !== 'laporan-penggunaan' &&
    activeTab !== 'profil-pengguna';

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] h-[64px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4 lg:px-8">
      {/* Left Container: Search Bar + Mepet Theme Easter Egg */}
      <div className="flex items-center flex-1 max-w-xl sm:max-w-2xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 mr-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* 1. Search Bar (Hanya tampil pada tab yang membutuhkan pencarian) */}
        {showSearchBar && (
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getSearchPlaceholder()}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-transparent dark:border-slate-700 rounded-full text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#006194] dark:focus:border-cyan-400 focus:ring-2 focus:ring-[#006194]/10 transition-all"
            />
          </div>
        )}

        {/* 2. Tombol Toggle Tema (Easter Egg Tersembunyi - MEPET/menempel di ujung kanan search bar) */}
        <div className="relative flex items-center shrink-0 ml-1 sm:ml-1.5" ref={themeRef}>
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border-0 outline-none cursor-pointer focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700 transition-none select-none shrink-0"
            aria-label="Toggle Theme Easter Egg"
          >
            <span className="material-symbols-outlined text-[18px] text-white dark:text-slate-900 opacity-0 select-none pointer-events-none">
              {themeMode === 'light' ? 'light_mode' : themeMode === 'dark' ? 'dark_mode' : 'desktop_windows'}
            </span>
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-150 text-xs">
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                Pilihan Mode Tampilan
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setThemeMode) setThemeMode('light');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                  themeMode === 'light'
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-base text-amber-500">light_mode</span>
                <span>Light (Terang)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (setThemeMode) setThemeMode('dark');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                  themeMode === 'dark'
                    ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-base text-indigo-500">dark_mode</span>
                <span>Dark (Gelap)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (setThemeMode) setThemeMode('system');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                  themeMode === 'system'
                    ? 'bg-sky-50 text-sky-900 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-base text-sky-500">desktop_windows</span>
                <span>System (Sistem)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls Container (Jarak NORMAL ke Notifikasi & Profile) */}
      <div className="flex items-center gap-3 shrink-0 ml-4 sm:ml-6">
        {/* 3. Ikon Lonceng Notifikasi */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-[#006194] dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative"
            title="Notifikasi"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in duration-200">
              <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800 dark:text-white">Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-extrabold text-[#006194] dark:text-cyan-300 bg-sky-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full border border-sky-200 dark:border-cyan-800">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {notifications.length > 0 && onClearNotifications && (
                  <button
                    onClick={onClearNotifications}
                    className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-[#006194] dark:hover:text-cyan-400"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Belum ada notifikasi baru.
                </div>
              ) : (
                <div className="max-h-[440px] overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                  {notifications.map((n, idx) => {
                    const isReplyNotif =
                      n.id.startsWith('notif-reply-') ||
                      n.title?.toLowerCase().includes('balasan') ||
                      n.title?.toLowerCase().includes('komentar') ||
                      n.desc?.toLowerCase().includes('membalas komentar');
                    return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border transition-all shadow-xs space-y-2 ${
                        n.type === 'rejected'
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 ring-1 ring-rose-300/40 dark:ring-rose-900/40'
                          : n.type === 'approved'
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                          : !n.read
                          ? 'bg-sky-50/90 dark:bg-slate-800 border-sky-200 dark:border-cyan-700/80 ring-1 ring-sky-200/50 dark:ring-cyan-500/30'
                          : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {n.type === 'rejected' ? (
                            <span className="material-symbols-outlined text-rose-500 text-base shrink-0">cancel</span>
                          ) : n.type === 'approved' ? (
                            <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check_circle</span>
                          ) : n.type === 'pending' ? (
                            <span className="material-symbols-outlined text-amber-500 text-base shrink-0">hourglass_top</span>
                          ) : (
                            <span className="material-symbols-outlined text-[#006194] dark:text-cyan-400 text-base shrink-0">notifications</span>
                          )}
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {n.title || `Notifikasi Sistem`}
                          </span>
                        </div>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] shrink-0 font-medium">
                          {getRelativeTime(n.createdAt, n.time)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line break-words pl-5">
                        {n.desc}
                      </p>

                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">
                          {n.author ? `Oleh: ${n.author}` : `Notifikasi #${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {isReplyNotif && onDeleteNotification && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification(n.id);
                              }}
                              className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-bold flex items-center gap-0.5 hover:underline bg-rose-100/70 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-300/80 dark:border-rose-800 transition-colors"
                              title="Hapus Notifikasi Balasan Ini"
                            >
                              <span className="material-symbols-outlined text-[10px]">delete</span>
                              <span>Hapus</span>
                            </button>
                          )}
                          {!n.read && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Belum dibaca
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block shrink-0"></div>

        {/* User Profile Container (4. Nama User + Badge Role, 5. Avatar User Paling Kanan) */}
        <div className="flex items-center gap-3 p-1.5 shrink-0" ref={profileRef}>
          {/* 4. Nama User + Badge Role */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{currentUser?.name || 'Dandi Pangestu'}</p>
            <p className="text-[10px] font-extrabold text-[#006194] dark:text-cyan-300 uppercase tracking-wider bg-sky-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-sky-200 dark:border-cyan-800 inline-block">
              {currentUser?.role || 'Admin'}
            </p>
          </div>
          {/* 5. Avatar User (Paling Kanan) */}
          <div className="relative shrink-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name || 'User Avatar'}
                className="w-9 h-9 rounded-full object-cover border-2 border-[#006194]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#006194] text-white flex items-center justify-center font-bold text-xs border-2 border-[#006194] shadow-sm">
                {currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
