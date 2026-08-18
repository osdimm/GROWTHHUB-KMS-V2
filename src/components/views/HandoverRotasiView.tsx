import React, { useState, useRef, useEffect } from 'react';
import { HandoverDoc } from '../../types';
import { downloadDocumentFile, readFileAsDataURL } from '../../utils/documentDownloader';
import { uploadFileToSupabaseStorage } from '../../services/supabaseService';
import { CustomSelect } from '../CustomSelect';
import { SpreadsheetPreview } from '../SpreadsheetPreview';
import { isSpreadsheetFile, isPdfFile, isImageFile, isLinkDocument, getEffectiveFileType, autoDetectFileType } from '../../utils/fileTypeHelper';

interface HandoverRotasiViewProps {
  handoverDocs: HandoverDoc[];
  onAddHandover: (doc: HandoverDoc) => void;
  onEditHandoverDoc?: (id: string, updated: Partial<HandoverDoc>) => void;
  onDeleteHandover: (id: string) => void;
  globalSearch: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserDivision?: string;
}

export const HandoverRotasiView: React.FC<HandoverRotasiViewProps> = ({
  handoverDocs,
  onAddHandover,
  onEditHandoverDoc,
  onDeleteHandover,
  globalSearch,
  currentUserRole = 'Admin',
  currentUserName = 'Dandi Pangestu',
  currentUserDivision
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Semua Periode');
  const [selectedDivision, setSelectedDivision] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Toast
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<HandoverDoc | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Dynamic Periods State (with localStorage persistence & automatic Supabase DB merging)
  const DEFAULT_PERIODS = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026'];

  const [periodsList, setPeriodsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kms_rotation_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading kms_rotation_periods:', e);
    }
    return DEFAULT_PERIODS;
  });
  const periods = ['Semua Periode', ...periodsList];

  // Helper to persist periodsList to localStorage
  const savePeriodsListToCache = (list: string[]) => {
    try {
      localStorage.setItem('kms_rotation_periods', JSON.stringify(list));
    } catch (e) {
      console.warn('Gagal menyimpan kms_rotation_periods:', e);
    }
  };

  // Automatically extract & merge unique rotation_period entries from Supabase DB (handoverDocs)
  useEffect(() => {
    if (handoverDocs && handoverDocs.length > 0) {
      const dbPeriods = handoverDocs
        .map((d) => d.rotationPeriod)
        .filter((p): p is string => Boolean(p && p.trim()));

      if (dbPeriods.length > 0) {
        setPeriodsList((prev) => {
          const merged = Array.from(new Set([...prev, ...dbPeriods]));
          if (merged.length !== prev.length || merged.some((val, idx) => val !== prev[idx])) {
            savePeriodsListToCache(merged);
            return merged;
          }
          return prev;
        });
      }
    }
  }, [handoverDocs]);

  // Admin Period Management Modal State
  const [showManagePeriodsModal, setShowManagePeriodsModal] = useState(false);
  const [newPeriodInput, setNewPeriodInput] = useState('');
  const [editingPeriodOldName, setEditingPeriodOldName] = useState<string | null>(null);
  const [editingPeriodNewName, setEditingPeriodNewName] = useState('');

  // Division Filter Dropdown State
  const [showDivDropdown, setShowDivDropdown] = useState(false);
  const divisionDropdownRef = useRef<HTMLDivElement>(null);

  // Delete Confirmation Modal State
  const [docToDelete, setDocToDelete] = useState<HandoverDoc | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (divisionDropdownRef.current && !divisionDropdownRef.current.contains(e.target as Node)) {
        setShowDivDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // New Handover Form
  const [uploadSource, setUploadSource] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [period, setPeriod] = useState<string>('');
  const [division, setDivision] = useState('');
  const [fileType, setFileType] = useState<'DOCX' | 'PDF' | 'XLSX' | 'PPTX' | 'LINK'>('DOCX');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const autoDetectFileType = (fileName: string): 'DOCX' | 'PDF' | 'XLSX' | 'PPTX' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return 'XLSX';
    if (['pptx', 'ppt'].includes(ext || '')) return 'PPTX';
    return 'DOCX';
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setFileError(null);
    const detected = autoDetectFileType(file.name);
    setFileType(detected);
    if (!title) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(nameWithoutExt);
    }
  };

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

  const query = globalSearch.toLowerCase();

  const filteredDocs = handoverDocs.filter((doc) => {
    const matchesSearch =
      !query ||
      doc.title.toLowerCase().includes(query) ||
      doc.author.toLowerCase().includes(query) ||
      doc.division.toLowerCase().includes(query) ||
      (doc.description && doc.description.toLowerCase().includes(query));

    const matchesDivision = selectedDivision === 'Semua' || doc.division === selectedDivision;
    const matchesPeriod =
      selectedPeriod === 'Semua Periode' || doc.rotationPeriod === selectedPeriod;

    return matchesSearch && matchesDivision && matchesPeriod;
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Admin Period Handlers
  const handleAddNewPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPeriodInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 7) {
      triggerToast('⚠️ Nama periode rotasi maksimal 7 karakter (contoh: "Q3 2026").');
      return;
    }
    if (periodsList.includes(trimmed)) {
      triggerToast(`⚠️ Periode "${trimmed}" sudah ada.`);
      return;
    }
    const updated = [...periodsList, trimmed];
    setPeriodsList(updated);
    savePeriodsListToCache(updated);
    setPeriod(trimmed);
    setSelectedPeriod(trimmed);
    setNewPeriodInput('');
    triggerToast(`✅ Periode rotasi "${trimmed}" berhasil ditambahkan.`);
  };

  const handleStartEditPeriod = (pName: string) => {
    setEditingPeriodOldName(pName);
    setEditingPeriodNewName(pName);
  };

  const handleSaveEditPeriod = (oldName: string) => {
    const trimmed = editingPeriodNewName.trim();
    if (!trimmed) return;
    if (trimmed.length > 7) {
      triggerToast('⚠️ Nama periode rotasi maksimal 7 karakter (contoh: "Q3 2026").');
      return;
    }
    if (trimmed === oldName) {
      setEditingPeriodOldName(null);
      return;
    }
    if (periodsList.includes(trimmed)) {
      triggerToast(`⚠️ Periode "${trimmed}" sudah ada.`);
      return;
    }
    const updated = periodsList.map((p) => (p === oldName ? trimmed : p));
    setPeriodsList(updated);
    savePeriodsListToCache(updated);
    if (selectedPeriod === oldName) setSelectedPeriod(trimmed);
    if (period === oldName) setPeriod(trimmed);
    setEditingPeriodOldName(null);
    triggerToast(`✅ Periode rotasi berhasil diperbarui menjadi "${trimmed}".`);
  };

  const handleDeletePeriod = (pName: string) => {
    if (periodsList.length <= 1) {
      return;
    }
    const updated = periodsList.filter((p) => p !== pName);
    setPeriodsList(updated);
    savePeriodsListToCache(updated);
    if (selectedPeriod === pName) setSelectedPeriod('Semua Periode');
    if (period === pName) {
      if (updated.length > 0) setPeriod(updated[0]);
    }
    triggerToast(`✅ Periode rotasi "${pName}" berhasil dihapus.`);
  };

  const handleOpenPreviewHandover = (doc: HandoverDoc) => {
    const newViews = (doc.views || 0) + 1;
    const updatedDoc = { ...doc, views: newViews };
    setPreviewDoc(updatedDoc);
    if (onEditHandoverDoc) {
      onEditHandoverDoc(doc.id, { views: newViews });
    }
  };

  const handleDownloadHandoverDoc = (doc: HandoverDoc) => {
    const newDownloads = (doc.downloads || 0) + 1;
    if (onEditHandoverDoc) {
      onEditHandoverDoc(doc.id, { downloads: newDownloads });
    }
    if (previewDoc && previewDoc.id === doc.id) {
      setPreviewDoc({ ...previewDoc, downloads: newDownloads });
    }
    downloadDocumentFile({
      title: doc.title,
      category: doc.division,
      author: doc.author || 'Tim Internal',
      date: doc.submitDate,
      summary: doc.description || `Dokumen handover operasional divisi ${doc.division} periode ${doc.rotationPeriod}.`,
      fileType: doc.fileType,
      fileUrl: doc.fileUrl,
      fileBlob: doc.fileBlob,
      linkUrl: doc.linkUrl
    });
    triggerToast(`Mengunduh berkas handover "${doc.title}"...`);
  };

  const handleOpenDeleteHandover = (doc: HandoverDoc, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDocToDelete(doc);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteHandover = () => {
    if (!docToDelete) return;
    onDeleteHandover(docToDelete.id);
    if (previewDoc && previewDoc.id === docToDelete.id) {
      setPreviewDoc(null);
    }
    setDocToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (isUploading) {
      triggerToast('⚠️ Sedang proses unggah, harap tunggu...');
      return;
    }

    if (!title.trim()) {
      setFileError('Judul dokumen handover wajib diisi.');
      return;
    }

    if (!period) {
      setFileError('Harap pilih Periode Rotasi terlebih dahulu.');
      return;
    }

    if (!division) {
      setFileError('Harap pilih Divisi terlebih dahulu.');
      return;
    }

    if (!selectedFile) {
      setFileError('Harap unggah berkas file handover (PDF, DOCX, XLSX, PPTX).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(40);
      const detectedType = autoDetectFileType(selectedFile.name);
      const finalFileType = detectedType;
      const finalContentType = 'file';

      const calculatedSize = formatFileSize(selectedFile.size);

      let createdFileUrl: string | undefined = undefined;
      if (selectedFile) {
        try {
          setUploadProgress(70);
          const storageUrl = await uploadFileToSupabaseStorage(selectedFile);
          createdFileUrl = storageUrl || (await readFileAsDataURL(selectedFile));
        } catch (err) {
          console.error('Error uploading or reading handover file:', err);
          createdFileUrl = await readFileAsDataURL(selectedFile);
        }
      }

      setUploadProgress(90);

      const newDoc: HandoverDoc = {
        id: `ho-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        fileType: finalFileType,
        fileSize: calculatedSize,
        rotationPeriod: period,
        division,
        submitDate: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        author: currentUserName,
        authorRole: currentUserRole as any,
        contentType: 'file',
        fileBlob: selectedFile || undefined,
        fileUrl: createdFileUrl,
        views: 1,
        downloads: 0
      };

      setUploadProgress(100);
      onAddHandover(newDoc);
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setLinkUrl('');
      setSelectedFile(null);
      setFileError(null);
      triggerToast(`Dokumen handover "${newDoc.title}" berhasil disimpan.`);
    } catch (err) {
      console.error('Failed to upload handover doc:', err);
      setFileError('Gagal mengunggah dokumen handover. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getBadgeClass = (type: HandoverDoc['fileType']) => {
    switch (type) {
      case 'PDF':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold shadow-2xs';
      case 'DOCX':
        return 'bg-sky-100 text-sky-800 border-sky-200 font-extrabold';
      case 'XLSX':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold';
      case 'PPTX':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-extrabold';
      case 'LINK':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-extrabold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-extrabold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Handover Rotasi</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manajemen dokumen serah terima tugas dan arsip pertanggungjawaban rotasi divisi.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center gap-3">
            {currentUserRole === 'Admin' && (
              <button
                onClick={() => setShowManagePeriodsModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                <span>Kelola & Edit Periode</span>
              </button>
            )}

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Unggah Handover Baru</span>
            </button>
          </div>

          {/* Dropdown Filter Divisi (Diletakkan di bawah tombol action) */}
          <div className="relative" ref={divisionDropdownRef}>
            <button
              type="button"
              onClick={() => setShowDivDropdown(!showDivDropdown)}
              className="flex items-center justify-between gap-2 px-4 py-2 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">filter_list</span>
                <span>Divisi: {selectedDivision}</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">expand_more</span>
            </button>

            {showDivDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in duration-150">
                <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                  {divisions.map((div) => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => {
                        setSelectedDivision(div);
                        setShowDivDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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

      {/* Periode Rotasi Filter Pills */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {periods.map((p, idx) => (
            <button
              key={`period-${p}-${idx}`}
              onClick={() => setSelectedPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedPeriod === p
                  ? 'bg-[#006194] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <span className="material-symbols-outlined text-[48px] text-slate-300 block mb-2">folder_off</span>
            <p className="font-medium text-slate-600">Belum ada dokumen handover yang tersedia untuk role Anda ({currentUserRole}).</p>
            <p className="text-xs text-slate-400 mt-1">Hak akses dokumen Handover Rotasi dibatasi khusus antar sesama role uploader.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpenPreviewHandover(doc)}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#006194] hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Top Header Row: Left = Divisi (Knowledge Base Category color style), Right = Format File */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Divisi Badge (Kiri Atas - Samakan persis dengan Kategori Knowledge Base) */}
                  <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-sky-950/80 text-[#006194] dark:text-sky-300 font-extrabold text-[11px] rounded-md flex items-center gap-1 border border-sky-200/80 shadow-2xs">
                    <span className="material-symbols-outlined text-[14px]">domain</span>
                    <span>{doc.division}</span>
                  </span>

                  {/* Format File Badge (Kanan Atas - Samakan persis ukurannya) */}
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold flex items-center gap-1 border ${getBadgeClass(
                      doc.fileType
                    )}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {doc.fileType === 'PDF'
                        ? 'picture_as_pdf'
                        : doc.fileType === 'XLSX'
                        ? 'table_chart'
                        : doc.fileType === 'PPTX'
                        ? 'slideshow'
                        : doc.fileType === 'LINK'
                        ? 'link'
                        : 'description'}
                    </span>
                    <span>{doc.fileType}</span>
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-[#006194] transition-colors">
                  {doc.title}
                </h4>

                {doc.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                )}

                {/* Periode Rotasi (Di tempat lokasi Divisi sebelumnya) */}
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">
                    calendar_today
                  </span>
                  <span className="font-bold text-slate-700">Periode: {doc.rotationPeriod}</span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span>{doc.submitDate}</span>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {isLinkDocument(doc) ? (
                    <a
                      href={doc.linkUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                      title="Buka Tautan Link"
                    >
                      <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                    </a>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadHandoverDoc(doc);
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Unduh Berkas"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => handleOpenDeleteHandover(doc, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Handover Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Unggah Handover Rotasi</h3>
                <p className="text-xs text-slate-500">Lengkapi formulir serah terima tugas dan aset rotasi divisi.</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Judul Handover
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Laporan Serah Terima Jabatan & Aset Q1 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#006194]/20 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Ringkasan
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan singkat mengenai rincian tugas, serah terima aset, atau panduan kerja..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006194]/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <CustomSelect
                  label="Periode Rotasi"
                  required
                  options={periodsList}
                  value={period}
                  onChange={(val) => {
                    setPeriod(val);
                    setFileError(null);
                  }}
                  placeholder="Pilih Periode Rotasi"
                />

                <CustomSelect
                  label="Divisi"
                  required
                  options={divisions.filter((d) => d !== 'Semua')}
                  value={division}
                  onChange={(val) => {
                    setDivision(val);
                    setFileError(null);
                  }}
                  placeholder="Pilih Divisi"
                />
              </div>

              {/* Unggah Berkas File */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Unggah Berkas File
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
                />

                {selectedFile ? (
                  <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-[#006194] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <span className="material-symbols-outlined text-xl">folder_zip</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {formatFileSize(selectedFile.size)} • Format Terdeteksi: <strong className="text-[#006194]">{fileType}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#006194] hover:bg-sky-50 text-[11px] font-bold rounded-lg shrink-0 transition-colors shadow-2xs"
                    >
                      Ganti Berkas
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    className="p-4 border-2 border-dashed border-sky-300/80 rounded-2xl text-center bg-sky-50/40 cursor-pointer hover:bg-sky-50/80 hover:border-[#006194] transition-all group"
                  >
                    <span className="material-symbols-outlined text-[#006194] text-[32px] group-hover:scale-110 transition-transform">
                      cloud_upload
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      Klik di sini untuk memilih berkas atau Drag & Drop file
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      PDF, DOCX, XLSX, PPTX (Format otomatis terbaca)
                    </p>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-xs font-bold text-[#006194]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Mengunggah berkas handover...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#006194] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {fileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-rose-600">error</span>
                  <span>{fileError}</span>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all ${
                    isUploading
                      ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      : 'bg-[#006194] text-white hover:bg-[#004b73]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${isUploading ? 'animate-spin' : ''}`}>
                    {isUploading ? 'sync' : 'upload_file'}
                  </span>
                  <span>{isUploading ? `Sedang Mengunggah (${uploadProgress}%)...` : 'Unggah Dokumen Handover'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-7">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                  {previewDoc.rotationPeriod}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs text-slate-700 border border-slate-200 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Divisi:</span>
                <span className="font-bold">{previewDoc.division}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format:</span>
                <span className="font-bold">{getEffectiveFileType(previewDoc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal Unggah:</span>
                <span className="font-bold">{previewDoc.submitDate}</span>
              </div>
              {previewDoc.author && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Pengunggah:</span>
                  <span className="font-bold">{previewDoc.author}</span>
                </div>
              )}
              {previewDoc.description && (
                <div className="pt-2 border-t border-slate-200/60 space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                    Catatan untuk Isi Dokumen:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {previewDoc.description}
                  </p>
                </div>
              )}
              {isLinkDocument(previewDoc) && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-slate-400 shrink-0">URL Tautan:</span>
                  {previewDoc.linkUrl || previewDoc.fileUrl ? (
                    <a
                      href={previewDoc.linkUrl || previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-700 hover:underline truncate flex items-center gap-1"
                    >
                      <span className="truncate">{previewDoc.linkUrl || previewDoc.fileUrl}</span>
                      <span className="material-symbols-outlined text-xs shrink-0">open_in_new</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Tautan URL tidak tersedia</span>
                  )}
                </div>
              )}
            </div>

            {/* Live Interactive In-App Document Reader Window for Handover */}
            {previewDoc.fileUrl && (
              <div className="mb-5 border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-900">
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">auto_stories</span>
                    <span className="font-bold tracking-wide">Pembaca Dokumen Handover</span>
                  </div>
                  <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                    Format: {previewDoc.fileType}
                  </span>
                </div>
                <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-900/60 min-h-[250px] max-h-[360px] overflow-y-auto font-sans">
                  {isSpreadsheetFile(previewDoc.fileType, previewDoc.fileUrl) ? (
                    <SpreadsheetPreview fileUrl={previewDoc.fileUrl} />
                  ) : isImageFile(previewDoc.fileType, previewDoc.fileUrl) ? (
                    <div className="bg-slate-950 p-2 rounded-xl flex items-center justify-center">
                      <img src={previewDoc.fileUrl} alt={previewDoc.title} className="max-h-[300px] object-contain rounded-lg shadow-md" />
                    </div>
                  ) : isPdfFile(previewDoc.fileType, previewDoc.fileUrl) ? (
                    <iframe
                      src={previewDoc.fileUrl}
                      className="w-full h-[300px] border-0 rounded-xl shadow-inner bg-white"
                      title="Pratinjau PDF Handover"
                    />
                  ) : previewDoc.fileUrl.startsWith('http') ? (
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(previewDoc.fileUrl)}&embedded=true`}
                      className="w-full h-[300px] border-0 rounded-xl shadow-inner bg-white"
                      title="Pratinjau Dokumen Handover"
                    />
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {isLinkDocument(previewDoc) ? (
                <a
                  href={previewDoc.linkUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setPreviewDoc(null);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Buka Tautan Link</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    handleDownloadHandoverDoc(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Unduh File</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola / Edit Periode Rotasi (Khusus Admin) */}
      {showManagePeriodsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl border border-amber-200">
                  <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Kelola & Edit Periode Rotasi</h3>
                  <p className="text-xs text-slate-500">
                    Akses Admin: Tambah periode baru atau ubah nama periode yang ada.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowManagePeriodsModal(false);
                  setEditingPeriodOldName(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Tambah Periode Baru */}
            <form onSubmit={handleAddNewPeriod} className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-2">
              <label className="text-xs font-bold text-amber-950 uppercase block">
                + Tambah Periode Rotasi Baru
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPeriodInput}
                  maxLength={7}
                  onChange={(e) => setNewPeriodInput(e.target.value)}
                  placeholder="Contoh: Q3 2026 (maks 7 karakter)"
                  className="flex-1 px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white font-bold text-xs rounded-xl hover:bg-amber-800 transition-colors shadow-2xs whitespace-nowrap flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Tambah</span>
                </button>
              </div>
            </form>

            {/* Daftar Periode Rotasi */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Daftar Periode Rotasi ({periodsList.length})
                </h4>
                <span className="text-[10px] font-semibold text-slate-400">Klik 'Edit' untuk mengubah nama</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {periodsList.map((p) => {
                  const isEditing = editingPeriodOldName === p;
                  const docCount = handoverDocs.filter((d) => d.rotationPeriod === p).length;

                  return (
                    <div
                      key={p}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingPeriodNewName}
                            maxLength={7}
                            onChange={(e) => setEditingPeriodNewName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#006194]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditPeriod(p)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-2xs"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPeriodOldName(null)}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-[#006194] font-extrabold text-xs rounded-lg shadow-2xs">
                              {p}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {docCount} Dokumen Handover
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditPeriod(p)}
                              className="px-2.5 py-1 text-slate-700 hover:text-[#006194] bg-white border border-slate-200 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-2xs"
                              title="Ubah Nama Periode"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePeriod(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Periode"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowManagePeriodsModal(false);
                  setEditingPeriodOldName(null);
                }}
                className="px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Hapus Dokumen Handover?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus dokumen handover <strong className="text-slate-900 dark:text-slate-100">"{docToDelete.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDocToDelete(null);
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteHandover}
                className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Ya, Hapus Dokumen
              </button>
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
