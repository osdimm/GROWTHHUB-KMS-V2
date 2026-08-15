import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';

interface ProfilPenggunaViewProps {
  currentUser: User;
  onUpdateUser?: (updated: Partial<User>) => void;
}

export const ProfilPenggunaView: React.FC<ProfilPenggunaViewProps> = ({
  currentUser,
  onUpdateUser
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [division, setDivision] = useState(currentUser.division);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar || '');

  // Modal State for Photo Upload / Camera Icon
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(currentUser.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDefaultPass = !currentUser.password || currentUser.password === 'password123' || currentUser.mustChangePassword;
  const actualCurrentPassword = currentUser.password || 'password123';

  // Password reset fields
  const [oldPassword, setOldPassword] = useState(isDefaultPass ? 'password123' : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setDivision(currentUser.division);
    setAvatarUrl(currentUser.avatar || '');
    setTempAvatar(currentUser.avatar || '');
    if (isDefaultPass && !oldPassword) {
      setOldPassword('password123');
    }
  }, [currentUser, isDefaultPass]);

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const isChangingPassword = !!(oldPassword || newPassword || confirmPassword || isDefaultPass);

    if (isChangingPassword) {
      // 1. Verifikasi Kata Sandi Saat Ini (password123 atau password terbaru)
      const isValidOldPass =
        oldPassword === actualCurrentPassword ||
        oldPassword === 'password123' ||
        (currentUser.password && oldPassword === currentUser.password);

      if (!oldPassword || !isValidOldPass) {
        triggerToast('⚠️ Kata sandi saat ini salah.');
        return;
      }

      // 2. Verifikasi Kata Sandi Baru
      if (!newPassword) {
        triggerToast('⚠️ Silakan masukkan kata sandi baru Anda.');
        return;
      }

      // 3. Verifikasi Panjang Kata Sandi Baru Minimal 8 Karakter
      if (newPassword.length < 8) {
        triggerToast('⚠️ Kata sandi kurang dari 8 karakter.');
        return;
      }

      // 4. Verifikasi Tidak Sama dengan Kata Sandi Default
      if (isDefaultPass && newPassword === 'password123') {
        triggerToast('⚠️ Kata sandi baru tidak boleh sama dengan kata sandi default ("password123").');
        return;
      }

      // 5. Verifikasi Konfirmasi Kata Sandi Baru
      if (newPassword !== confirmPassword) {
        triggerToast('⚠️ Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (onUpdateUser) {
        onUpdateUser({
          name,
          email,
          division,
          avatar: avatarUrl,
          ...(newPassword ? { password: newPassword, mustChangePassword: false } : {})
        });
      }

      if (newPassword) {
        triggerToast('✅ Kata sandi Anda berhasil diperbarui!');
      }
    }, 800);
  };

  const handleOpenAvatarModal = () => {
    setTempAvatar(avatarUrl);
    setShowAvatarModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setTempAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = () => {
    setAvatarUrl(tempAvatar);
    if (onUpdateUser) {
      onUpdateUser({
        avatar: tempAvatar
      });
    }
    setShowAvatarModal(false);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return {
          label: 'Administrator System',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'Manajer':
        return {
          label: 'Manajer Divisi',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
      case 'Karyawan':
        return {
          label: 'Karyawan / Staf',
          badgeClass: 'bg-sky-100 text-[#006194] border-sky-200'
        };
      case 'Associate':
      default:
        return {
          label: 'Associate / Magang',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
        };
    }
  };

  const roleBadgeInfo = getRoleBadgeStyle(currentUser.role);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Peringatan Ubah Password (HANYA tampil di layar Profil Pengguna) */}
      {(currentUser.mustChangePassword || isDefaultPass) && (
        <div className="bg-amber-500 text-white p-4.5 rounded-2xl shadow-lg border border-amber-600 flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl shrink-0 text-amber-100 animate-bounce">
              lock_reset
            </span>
            <div>
              <strong className="block text-sm font-bold text-white">⚠️ PERINGATAN UBAH PASSWORD PAKSA</strong>
              <span className="text-amber-50 leading-relaxed block mt-0.5">
                Akun Anda menggunakan kata sandi default (<strong>password123</strong>). Demi keamanan akun Anda, silakan ubah kata sandi pada formulir di bawah ini.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Profil Pengguna</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola informasi identitas, foto avatar, dan kredensial akses akun KMS Anda.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Avatar Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-28 h-28 rounded-full object-cover border-4 border-[#006194] shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#006194] text-white font-extrabold text-2xl flex items-center justify-center border-4 border-sky-100 shadow-md">
                {currentUser.initials || name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={handleOpenAvatarModal}
              className="absolute bottom-0 right-0 p-2.5 bg-[#006194] text-white rounded-full shadow-lg hover:bg-[#004b73] hover:scale-110 transition-all cursor-pointer border-2 border-white focus:ring-4 focus:ring-sky-200"
              title="Klik untuk Mengubah Foto Profil"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500 font-medium">{email}</p>
            <div className="mt-2.5 flex flex-wrap justify-center sm:justify-start gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border ${roleBadgeInfo.badgeClass}`}
              >
                {roleBadgeInfo.label}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                Divisi: {division}
              </span>
            </div>
          </div>
        </div>

        {/* Data Diri Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006194]">badge</span>
            <span>Informasi Diri</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-600 uppercase block">
                  Alamat Email
                </label>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Terkunci
                </span>
              </div>
              <input
                type="email"
                value={email}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-bold cursor-not-allowed"
                title="Alamat email terkunci dan tidak dapat diubah oleh pengguna."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Peran / Hak Akses
              </label>
              <input
                type="text"
                value={currentUser.role}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-bold cursor-not-allowed uppercase tracking-wide"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Divisi Kerja
              </label>
              <input
                type="text"
                value={currentUser.division}
                disabled
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-bold cursor-not-allowed uppercase tracking-wide"
              />
            </div>
          </div>
        </div>

        {/* Keamanan & Sandi Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006194]">lock_reset</span>
            <span>Ubah Kata Sandi</span>
          </h4>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Ketik kata sandi lama..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showOldPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNewPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[#006194] text-white rounded-xl font-bold text-sm hover:bg-[#004b73] active:scale-95 transition-all shadow-md shadow-[#006194]/20 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">
                  autorenew
                </span>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal Ubah Foto Profil */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-[#006194] rounded-xl">
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ubah Foto Profil</h3>
                  <p className="text-xs text-slate-500">
                    Semua role ({currentUser.role}) dapat memperbarui foto avatar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative">
                {tempAvatar ? (
                  <img
                    src={tempAvatar}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#006194] shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#006194] text-white font-black text-2xl flex items-center justify-center border-4 border-sky-100 shadow-md">
                    {currentUser.initials || name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 mt-2">
                Pratinjau Foto Profil
              </span>
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Unggah dari Perangkat
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#006194] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs hover:scale-[1.01]"
              >
                <span className="material-symbols-outlined text-lg">
                  upload_file
                </span>
                <span>Pilih Berkas Foto dari Perangkat (JPG/PNG)</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Maksimal ukuran file: 5MB. Format yang didukung: JPG, PNG, WEBP.
              </p>
            </div>

            {/* Reset / Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTempAvatar('')}
                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">no_accounts</span>
                <span>Hapus Foto (Pakai Inisial)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  className="px-4 py-2 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Simpan Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 z-50 border border-slate-700/60 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          {!toastMessage.includes('⚠️') && !toastMessage.includes('❌') && !toastMessage.toLowerCase().includes('salah') && !toastMessage.toLowerCase().includes('gagal') ? (
            <span className="material-symbols-outlined text-emerald-400 text-2xl shrink-0">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0">info</span>
          )}
          <span className="text-sm font-bold leading-relaxed">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

