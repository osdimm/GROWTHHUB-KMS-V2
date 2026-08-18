import React, { useState } from 'react';
import { User } from '../../types';
import { GrowthHubLogo } from '../GrowthHubLogo';
import { getProfilesFromSupabase, saveProfileToSupabase } from '../../services/supabaseService';
import { verifyPassword } from '../../utils/cryptoUtils';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterAssociate?: (newUser: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess
}) => {
  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    let currentUsersList = [...users];

    try {
      const liveProfiles = await getProfilesFromSupabase();
      if (liveProfiles && liveProfiles.length > 0) {
        const existingIds = new Set(liveProfiles.map((u) => u.id));
        const merged = [...liveProfiles];
        for (const u of users) {
          if (!existingIds.has(u.id)) {
            merged.push(u);
          }
        }
        currentUsersList = merged;
      }
    } catch (err) {
      console.warn('Error fetching live profiles for login, fallback to local users:', err);
    }

    // Find matching user by email or fallback by name
    const matchedUser = currentUsersList.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.name.toLowerCase() === cleanEmail ||
        cleanEmail.includes(u.email.toLowerCase().split('@')[0])
    );

    if (matchedUser) {
      if (matchedUser.status === 'Nonaktif') {
        setIsLoading(false);
        setLoginError('Akun ini sedang nonaktif. Silakan hubungi Administrator.');
        return;
      }

      const expectedPassword = matchedUser.password || 'password123';
      const authResult = await verifyPassword(passwordInput, expectedPassword);

      if (!authResult.isValid) {
        setIsLoading(false);
        setLoginError('Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.');
        return;
      }

      // If user had legacy plain text password, automatically upgrade password to SHA-256 hash in database
      let finalUser = matchedUser;
      if (authResult.needsUpgrade && authResult.newHash) {
        finalUser = {
          ...matchedUser,
          password: authResult.newHash
        };
        saveProfileToSupabase(finalUser).catch((err) =>
          console.error('Auto-upgrade hashed password to Supabase failed:', err)
        );
      }

      setIsLoading(false);
      onLoginSuccess(finalUser);
    } else {
      setIsLoading(false);
      setLoginError('Email tidak ditemukan. Silakan periksa kembali data login Anda.');
    }
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-[460px] bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col p-8 md:p-10 my-auto">
          {/* Logo Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center mb-4 p-3 shadow-sm">
              <GrowthHubLogo className="w-full h-full" iconColor="#0B2545" dotColor="#FFC800" />
            </div>
            <h1 className="text-3xl font-bold text-[#006194] tracking-tight">Growth Hub</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Knowledge Management System
            </p>
          </div>

          {/* ================= LOGIN FORM ================= */}
          {loginError && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl animate-in fade-in duration-200 text-xs">
              <span className="material-symbols-outlined shrink-0 text-lg text-rose-600">error</span>
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Gagal Masuk</span>
                <p className="leading-relaxed">{loginError}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  mail
                </span>
                <input
                  id="email"
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Masukkan email terdaftar"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block" htmlFor="password">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194] focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#006194] text-white rounded-xl font-bold text-sm hover:bg-[#004b73] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#006194]/20 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">autorenew</span>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <span className="material-symbols-outlined text-lg">login</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 text-xs text-slate-500">
        <div>© 2024 GROWTH HUB KMS. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-6 font-medium">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Growth Hub KMS Privacy Policy: Data perusahaan dilindungi dengan enkripsi AES-256.');
            }}
            className="hover:text-[#006194] transition-colors"
          >
            PRIVACY POLICY
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Growth Hub KMS Terms of Service: Akses terbatas untuk personel terotorisasi.');
            }}
            className="hover:text-[#006194] transition-colors"
          >
            TERMS OF SERVICE
          </a>
        </div>
      </footer>
    </div>
  );
};
