import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface DataPenggunaViewProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (id: string, updated: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  globalSearch: string;
}

export const DataPenggunaView: React.FC<DataPenggunaViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  globalSearch
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('Semua');
  const [showDivDropdown, setShowDivDropdown] = useState(false);
  const [divisionSearch, setDivisionSearch] = useState('');
  const divisionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        divisionDropdownRef.current &&
        !divisionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDivDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Modals & Toast State
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Multi-Select & Bulk Delete State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkDeleteConfirmModal, setShowBulkDeleteConfirmModal] = useState(false);

  // Bulk Import Excel/CSV State
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedUsers, setParsedUsers] = useState<
    Array<{
      name: string;
      email: string;
      role: UserRole;
      division: string;
      password: string;
      valid: boolean;
      errorNote?: string;
    }>
  >([]);

  // Edit User State
  const [editUserTarget, setEditUserTarget] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Karyawan');
  const [editDivision, setEditDivision] = useState('Talent Development');

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Karyawan');
  const [newDivision, setNewDivision] = useState('Talent Development');

  const divisions = Array.from(
    new Set([
      'Semua',
      'Talent Acquisition',
      'Talent Development',
      'Organizational Development',
      'Employee Benefit',
      'Administration',
      'Graphic Design',
      'Copywriting',
      'Content Coordinator',
      'Video Editor',
      'Public Relation',
      'Social Media Officer',
      'Key Opinion Leader Coordinator',
      'Representative',
      'Program Specialist',
      'Project Representative',
      'Community & Digital Marketing'
    ])
  );

  const filteredDivisions = divisions.filter((d) =>
    d.toLowerCase().includes(divisionSearch.toLowerCase())
  );

  const query = globalSearch.toLowerCase();

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query);

    const matchesDivision =
      selectedDivision === 'Semua' || u.division === selectedDivision;

    return matchesSearch && matchesDivision;
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper Excel/CSV Parser
  const parseCSVOrExcelContent = (textContent: string) => {
    const lines = textContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return [];
    }

    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';') && !firstLine.includes(',')) {
      delimiter = ';';
    } else if (firstLine.includes('\t')) {
      delimiter = '\t';
    }

    const parseLine = (line: string) => {
      return line.split(delimiter).map((col) => col.replace(/^["']|["']$/g, '').trim());
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase());

    const nameIdx = headers.findIndex((h) => h.includes('nama') || h.includes('full name') || h.includes('name'));
    const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('surel') || h.includes('alamat'));
    const roleIdx = headers.findIndex((h) => h.includes('peran') || h.includes('hak') || h.includes('akses') || h.includes('role'));
    const divIdx = headers.findIndex((h) => h.includes('divisi') || h.includes('departemen') || h.includes('division'));

    const results: Array<{
      name: string;
      email: string;
      role: UserRole;
      division: string;
      password: string;
      valid: boolean;
      errorNote?: string;
    }> = [];

    const existingEmails = new Set(users.map((u) => u.email.trim().toLowerCase()));
    const seenImportEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : cols[0] || '';
      const email = (emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx] : cols[1] || '').trim();
      const rawRole = roleIdx !== -1 && cols[roleIdx] ? cols[roleIdx] : cols[2] || '';
      const division = divIdx !== -1 && cols[divIdx] ? cols[divIdx] : cols[3] || 'Talent Development';

      let role: UserRole = 'Karyawan';
      const lowerRole = rawRole.toLowerCase();
      if (lowerRole.includes('admin')) {
        role = 'Admin';
      } else if (lowerRole.includes('manajer') || lowerRole.includes('manager')) {
        role = 'Manajer';
      } else if (lowerRole.includes('magang') || lowerRole.includes('intern') || lowerRole.includes('associate')) {
        role = 'Associate';
      } else {
        role = 'Karyawan';
      }

      const password = 'password123';

      let valid = true;
      let errorNote = undefined;

      const lowerEmail = email.toLowerCase();

      if (!name || name.length < 2) {
        valid = false;
        errorNote = 'Nama tidak boleh kosong';
      } else if (!email || !email.includes('@')) {
        valid = false;
        errorNote = 'Format email tidak valid';
      } else if (existingEmails.has(lowerEmail)) {
        valid = false;
        errorNote = 'Email sudah terdaftar di sistem';
      } else if (seenImportEmails.has(lowerEmail)) {
        valid = false;
        errorNote = 'Email duplikat dalam berkas';
      } else {
        seenImportEmails.add(lowerEmail);
      }

      results.push({
        name,
        email,
        role,
        division: division || 'Talent Development',
        password,
        valid,
        errorNote
      });
    }

    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSVOrExcelContent(text);
        setParsedUsers(parsed);
        if (parsed.length === 0) {
          setImportError('Gagal membaca data dari file. Pastikan baris header mengandung: Nama Lengkap, Alamat Email, Peran, Divisi.');
        }
      }
    };
    reader.onerror = () => {
      setImportError('Gagal membaca file berkas.');
    };
    reader.readAsText(file);
  };

  const handleRemoveParsedUser = (index: number) => {
    setParsedUsers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmImport = () => {
    const validUsers = parsedUsers.filter((u) => u.valid);
    if (validUsers.length === 0) {
      setImportError('Tidak ada data pengguna valid yang dapat diimpor.');
      return;
    }

    // Periksa apakah ada email yang sudah terdaftar di sistem
    const existingEmails = new Set(users.map((u) => u.email.trim().toLowerCase()));
    const duplicateUsers = validUsers.filter((u) => existingEmails.has(u.email.trim().toLowerCase()));

    if (duplicateUsers.length > 0) {
      const dupEmail = duplicateUsers[0].email;
      const errorMsg = `Email "${dupEmail}" sudah terdaftar dalam sistem. Data tidak dapat disimpan.`;
      setImportError(errorMsg);
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    validUsers.forEach((pu, idx) => {
      const initials = pu.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const newUser: User = {
        id: `u-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: pu.name,
        email: pu.email,
        role: pu.role,
        division: pu.division,
        status: 'Aktif',
        joinDate: todayStr,
        initials,
        password: 'password123',
        mustChangePassword: true
      };
      onAddUser(newUser);
    });

    setParsedUsers([]);
    setShowImportModal(false);
    setImportFileName('');
    setImportError(null);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);

    if (!newName.trim()) {
      setAddUserError('Nama pengguna wajib diisi.');
      return;
    }

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddUserError('Format email tidak valid.');
      return;
    }

    const emailExists = users.some(
      (u) => u.email.toLowerCase() === newEmail.trim().toLowerCase()
    );
    if (emailExists) {
      setAddUserError('Email sudah terdaftar di sistem.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const initials = newName.trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      division: newDivision,
      status: 'Aktif',
      joinDate: todayStr,
      initials,
      password: 'password123',
      mustChangePassword: true
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewRole('Karyawan');
    setNewDivision('Talent Development');
    setAddUserError(null);
  };

  const handleOpenEditModal = (user: User) => {
    setEditUserTarget(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDivision(user.division || 'Talent Development');
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserTarget || !editName || !editEmail) return;

    const trimmedEmail = editEmail.trim();
    const isDuplicate = users.some(
      (u) => u.id !== editUserTarget.id && u.email.trim().toLowerCase() === trimmedEmail.toLowerCase()
    );

    if (isDuplicate) {
      return;
    }

    const initials = editName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    onUpdateUser(editUserTarget.id, {
      name: editName,
      email: trimmedEmail,
      role: editRole,
      division: editDivision,
      initials,
      mustChangePassword: false
    });

    setEditUserTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteUser(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFilteredIds = filteredUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    } else {
      const filteredSet = new Set(filteredUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    selectedUserIds.forEach((id) => onDeleteUser(id));
    setSelectedUserIds([]);
    setShowBulkDeleteConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola data pengguna sistem seperti menambah, mengubah, dan menghapus akun pengguna.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 active:scale-95 transition-all shadow-sm"
            title="Impor beberapa peserta sekaligus via file Excel / CSV"
          >
            <span className="material-symbols-outlined text-[18px]">file_upload</span>
            <span>Impor Excel / CSV</span>
          </button>

          <button
            onClick={() => {
              setAddUserError(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Tambah Data</span>
          </button>

          {/* Division Filter Dropdown */}
          <div className="relative" ref={divisionDropdownRef}>
            <button
              onClick={() => setShowDivDropdown(!showDivDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all"
            >
              <span className="material-symbols-outlined text-slate-500 text-[18px]">filter_list</span>
              <span>Divisi: {selectedDivision}</span>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">expand_more</span>
            </button>

            {showDivDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in duration-150">
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={divisionSearch}
                      onChange={(e) => setDivisionSearch(e.target.value)}
                      placeholder="Cari divisi..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-lg text-xs focus:ring-1 focus:ring-[#006194] outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                  {filteredDivisions.map((div) => (
                    <button
                      key={div}
                      onClick={() => {
                        setSelectedDivision(div);
                        setShowDivDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        selectedDivision === div
                          ? 'bg-sky-50 text-[#006194] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Total Summary Stat Card */}
        <div className="xl:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengguna
            </span>
            <span className="material-symbols-outlined text-[#006194]">groups</span>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">{users.length}</div>
          <div className="flex items-center gap-1 mt-2 text-[#006194] text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>12% dari bulan lalu</span>
          </div>
        </div>

        {/* User Table Card */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-lg">Daftar Personel ({filteredUsers.length} Orang)</h3>
          </div>

          {/* Bulk Delete Bar */}
          {selectedUserIds.length > 0 && (
            <div className="px-5 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <span className="material-symbols-outlined text-rose-600 text-base">check_box</span>
                <span>Terpilih {selectedUserIds.length} pengguna</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="px-3 py-1.5 bg-white border border-rose-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Batal Pilih
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirmModal(true)}
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  <span>Hapus ({selectedUserIds.length}) Pengguna Terpilih</span>
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-[#006194] focus:ring-[#006194] w-4 h-4 cursor-pointer"
                      title="Pilih Semua"
                    />
                  </th>
                  <th className="px-5 py-3.5">Pengguna</th>
                  <th className="px-5 py-3.5">Peran</th>
                  <th className="px-5 py-3.5">Divisi</th>
                  <th className="px-5 py-3.5">Tanggal Bergabung</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada pengguna yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${selectedUserIds.includes(u.id) ? 'bg-sky-50/40' : ''}`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => handleToggleSelectUser(u.id)}
                          className="rounded border-slate-300 text-[#006194] focus:ring-[#006194] w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-sky-100 text-[#001d31] flex items-center justify-center font-bold text-xs">
                              {u.initials || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold uppercase tracking-wider">
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {u.division || 'Talent Development'}
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                        {u.joinDate}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-500 hover:text-[#006194] transition-colors"
                            title="Edit Data Pengguna"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                            title="Hapus Data Pengguna"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30">
            <span>
              Menampilkan {filteredUsers.length} dari {users.length} pengguna
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="w-8 h-8 flex items-center justify-center font-bold text-[#006194]">
                1
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900">Tambah Data Pengguna</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              {addUserError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-rose-600 text-base shrink-0">error</span>
                  <span>{addUserError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Budi Darmawan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (addUserError) setAddUserError(null);
                  }}
                  placeholder="budi.d@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                    Peran / Hak Akses
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006194]/20"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manajer">Manajer</option>
                    <option value="Karyawan">Karyawan</option>
                    <option value="Associate">Associate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                    Divisi
                  </label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006194]/20"
                  >
                    {divisions.filter((d) => d !== 'Semua').map((d, idx) => (
                      <option key={`div-new-${d}-${idx}`} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#006194] text-white hover:bg-[#004b73] transition-all"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel / CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">table_chart</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Impor Banyak Pengguna (Export / File Excel)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tambahkan peserta sekaligus dari berkas Excel/CSV sesuai format baku sistem.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setParsedUsers([]);
                  setImportFileName('');
                  setImportError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-1">
              {/* Baku Format Notice */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-500 text-base">info</span>
                    Ketentuan Kolom Baku Excel / CSV
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  Format header kolom wajib baku sama seperti pengisian data manual:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center font-bold text-slate-800">
                    Nama Lengkap
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center font-bold text-slate-800">
                    Alamat Email
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center font-bold text-slate-800">
                    Peran / Hak Akses
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center font-bold text-slate-800">
                    Divisi
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-center font-bold text-amber-900">
                    Password <span className="text-[10px] text-amber-700">(password123)</span>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:border-emerald-500/50 bg-slate-50/50 transition-colors relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="material-symbols-outlined text-3xl text-emerald-600 mb-1">
                  cloud_upload
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {importFileName ? (
                    <span className="text-emerald-700 underline">{importFileName}</span>
                  ) : (
                    'Klik atau tarik file Excel / CSV ke sini'
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung file .CSV, .XLSX, atau teks berpemisah koma/titik-koma
                </p>
              </div>

              {/* Error Message */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-base shrink-0">error</span>
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Pratinjau Peserta Hasil Impor ({parsedUsers.length} data)
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                      Password Default: password123
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2">Nama Lengkap</th>
                          <th className="px-3 py-2">Alamat Email</th>
                          <th className="px-3 py-2">Peran</th>
                          <th className="px-3 py-2">Divisi</th>
                          <th className="px-3 py-2">Password</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedUsers.map((pu, idx) => (
                          <tr
                            key={idx}
                            className={pu.valid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                          >
                            <td className="px-3 py-2.5 font-bold text-slate-900">
                              {pu.name || '-'}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px]">
                              {pu.email || '-'}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 bg-slate-100 font-bold rounded text-[10px] text-slate-700">
                                {pu.role}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {pu.division}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[10px] font-mono">
                                password123
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {pu.valid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[10px]" title={pu.errorNote}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  {pu.errorNote || 'Error'}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveParsedUser(idx)}
                                className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                title="Hapus dari daftar"
                              >
                                <span className="material-symbols-outlined text-base">close</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {(() => {
              const hasInvalidUsers = parsedUsers.some((u) => !u.valid);
              const validUsersCount = parsedUsers.filter((u) => u.valid).length;
              const isImportDisabled =
                Boolean(importError) ||
                parsedUsers.length === 0 ||
                validUsersCount === 0 ||
                hasInvalidUsers;

              return (
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {importError ? (
                      <span className="text-rose-600 font-bold">Format file atau data tidak valid</span>
                    ) : hasInvalidUsers ? (
                      <span className="text-rose-600 font-bold">Terdapat data tidak valid dalam berkas</span>
                    ) : parsedUsers.length > 0 ? (
                      `${validUsersCount} pengguna siap diimpor`
                    ) : (
                      'Pilih file Excel/CSV untuk memulai.'
                    )}
                  </span>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={isImportDisabled}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      <span>
                        Proses & Impor {validUsersCount} Pengguna
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Data Pengguna</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah informasi nama, email, peran, dan divisi kerja
                </p>
              </div>
              <button
                onClick={() => setEditUserTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Budi Darmawan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="budi.d@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                    Peran / Hak Akses
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006194]/20"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manajer">Manajer</option>
                    <option value="Karyawan">Karyawan</option>
                    <option value="Associate">Associate</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                    Divisi Kerja
                  </label>
                  <select
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006194]/20"
                  >
                    {divisions.filter((d) => d !== 'Semua').map((d, idx) => (
                      <option key={`div-edit-${d}-${idx}`} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#006194] text-white hover:bg-[#004b73] transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px]">delete_forever</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Konfirmasi Hapus Data Pengguna
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data pengguna{' '}
              <strong className="text-slate-900">{deleteTarget.name}</strong> ({deleteTarget.email})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">delete_sweep</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Massal Pengguna Terpilih?</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-700 font-bold">{selectedUserIds.length} akun pengguna</strong> yang telah dicentang? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirmModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 mr-auto"
                title="Tutup"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm"
              >
                Ya, Hapus {selectedUserIds.length} Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
