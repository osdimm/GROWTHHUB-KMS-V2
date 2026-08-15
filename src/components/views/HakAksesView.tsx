import React, { useState } from 'react';
import { User, UserRole } from '../../types';

interface HakAksesViewProps {
  users: User[];
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  globalSearch: string;
}

export const HakAksesView: React.FC<HakAksesViewProps> = ({
  users,
  onUpdateUserRole,
  globalSearch
}) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('Semua Divisi');
  const [showDivDropdown, setShowDivDropdown] = useState(false);
  const [divisionSearch, setDivisionSearch] = useState('');

  const divisions = Array.from(
    new Set([
      'Semua Divisi',
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
    const matchesDiv =
      selectedDivisionFilter === 'Semua Divisi' ||
      u.division.toLowerCase() === selectedDivisionFilter.toLowerCase();
    const matchesQuery =
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query) ||
      u.division.toLowerCase().includes(query);
    return matchesDiv && matchesQuery;
  });

  const handleRoleChange = (userId: string, userName: string, newRole: UserRole) => {
    onUpdateUserRole(userId, newRole);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hak Akses & Peran Pengguna</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Atur dan tetapkan peran (Admin, Manajer, Karyawan, Associate) untuk setiap anggota tim.
          </p>
        </div>

        {/* Division Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDivDropdown(!showDivDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-slate-500 text-[18px]">filter_list</span>
            <span>Divisi: {selectedDivisionFilter}</span>
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
                {filteredDivisions.map((div, idx) => (
                  <button
                    key={`div-hak-${div}-${idx}`}
                    onClick={() => {
                      setSelectedDivisionFilter(div);
                      setShowDivDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedDivisionFilter === div
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

      {/* User Role Assignment Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Daftar Peran Pengguna ({filteredUsers.length} Orang)</h3>
            <p className="text-xs text-slate-500">Pilih dropdown untuk menetapkan salah satu dari 4 peran terdaftar.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">Pengguna</th>
                <th className="px-6 py-3.5">Divisi</th>
                <th className="px-6 py-3.5">Peran Saat Ini</th>
                <th className="px-6 py-3.5">Ubah Peran (4 Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-sky-100 text-[#001d31] flex items-center justify-center font-bold text-xs">
                          {u.initials || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    {u.division}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      u.role === 'Admin'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : u.role === 'Manajer'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : u.role === 'Karyawan'
                        ? 'bg-sky-100 text-sky-800 border-sky-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u.id, u.name, e.target.value as UserRole)
                      }
                      className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194] outline-none"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manajer">Manajer</option>
                      <option value="Karyawan">Karyawan</option>
                      <option value="Associate">Associate</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-8 right-8 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 z-50 border border-slate-700/60 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-2xl shrink-0">check_circle</span>
          <span className="text-sm font-bold leading-relaxed">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

