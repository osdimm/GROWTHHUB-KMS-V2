import React, { useState, useRef, useEffect } from 'react';
import { CategoryItem, ContentCategoryItem, KnowledgeArticle, PendingDoc } from '../../types';
import { downloadDocumentFile, readFileAsDataURL } from '../../utils/documentDownloader';
import {
  uploadFileToSupabaseStorage,
  saveContentCategoryToSupabase,
  deleteContentCategoryFromSupabase,
  logUserActivitySilent
} from '../../services/supabaseService';
import { CustomSelect } from '../CustomSelect';
import { SpreadsheetPreview } from '../SpreadsheetPreview';
import { isSpreadsheetFile, isPdfFile, isImageFile, isLinkDocument, getEffectiveFileType, autoDetectFileType } from '../../utils/fileTypeHelper';

export const ALL_DIVISIONS = [
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
];

interface KnowledgeBaseViewProps {
  categories: CategoryItem[];
  contentCategories: ContentCategoryItem[];
  articles: KnowledgeArticle[];
  onAddCategory: (cat: CategoryItem) => void;
  onEditCategory?: (id: string, updated: Partial<CategoryItem>, oldName?: string) => void;
  onDeleteCategory?: (id: string) => void;
  onAddContentCategory: (cat: ContentCategoryItem) => void;
  onEditContentCategory?: (id: string, updated: Partial<ContentCategoryItem>) => void;
  onDeleteContentCategory?: (id: string) => void;
  onAddArticle: (art: KnowledgeArticle) => void;
  onRequestVerification?: (doc: PendingDoc) => void;
  onEditArticle?: (id: string, updated: Partial<KnowledgeArticle>) => void;
  onDeleteArticle?: (id: string) => void;
  globalSearch: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserDivision?: string;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  categories,
  contentCategories,
  articles,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddContentCategory,
  onEditContentCategory,
  onDeleteContentCategory,
  onAddArticle,
  onRequestVerification,
  onEditArticle,
  onDeleteArticle,
  globalSearch,
  currentUserRole = 'Karyawan',
  currentUserName = 'Ananda Reva',
  currentUserDivision
}) => {
  const isAdmin = currentUserRole === 'Admin';

  const canDeleteArticle = (art: KnowledgeArticle) => {
    // 1. Admin can delete any article
    if (currentUserRole === 'Admin') return true;

    // 2. Only the author/contributor who uploaded it can delete their own article
    if (currentUserName && art.author && art.author.toLowerCase() === currentUserName.toLowerCase()) {
      return true;
    }

    // 3. Managers, Associates, or non-authors CANNOT delete articles!
    return false;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeContentCategory, setActiveContentCategory] = useState<string>('Semua');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('Semua');
  const [showDivDropdown, setShowDivDropdown] = useState(false);
  const divisionDropdownRef = useRef <HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (divisionDropdownRef.current && !divisionDropdownRef.current.contains(e.target as Node)) {
        setShowDivDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [showVerificationSuccessModal, setShowVerificationSuccessModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<KnowledgeArticle | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Article State
  const [articleToDelete, setArticleToDelete] = useState<KnowledgeArticle | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // New Content Category Form State (Form Modal Admin)
  const [newContentCatName, setNewContentCatName] = useState('');
  const [newContentCatDesc, setNewContentCatDesc] = useState('');

  // Edit Content Category State
  const [editingContentCategoryId, setEditingContentCategoryId] = useState<string | null>(null);
  const [editingContentCatName, setEditingContentCatName] = useState('');
  const [editingContentCatDesc, setEditingContentCatDesc] = useState('');

  // New Article Form State
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtDivision, setNewArtDivision] = useState<string>('Social Media Officer');
  const [newArtContentCategoryId, setNewArtContentCategoryId] = useState<string>(
    contentCategories[0]?.id || 'cc-002'
  );
  const [newArtSummary, setNewArtSummary] = useState('');
  const [newArtType, setNewArtType] = useState<'PDF' | 'DOCX' | 'E-Book' | 'Video' | 'Artikel' | 'LINK'>('PDF');
  const [newArtLinkUrl, setNewArtLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (contentCategories.length > 0 && !newArtContentCategoryId) {
      setNewArtContentCategoryId(contentCategories[0].id);
    }
  }, [contentCategories, newArtContentCategoryId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const autoDetectType = (fileName: string): KnowledgeArticle['fileType'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (['docx', 'doc'].includes(ext || '')) return 'DOCX';
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return 'XLSX';
    if (['pptx', 'ppt'].includes(ext || '')) return 'PPTX';
    return 'PDF';
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setFileError(null);
    const detected = autoDetectType(file.name);
    setNewArtType(detected);
    if (!newArtTitle) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setNewArtTitle(nameWithoutExt);
    }
  };

  const query = (searchQuery || globalSearch).toLowerCase();

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(query) ||
      a.summary.toLowerCase().includes(query) ||
      (a.author && a.author.toLowerCase().includes(query));

    const matchesContentCat =
      activeContentCategory === 'Semua' ||
      a.contentCategoryName === activeContentCategory ||
      a.contentCategoryId === activeContentCategory;

    const artDiv = a.division || a.category || '';
    const matchesDiv =
      selectedDivisionFilter === 'Semua' || artDiv.toLowerCase() === selectedDivisionFilter.toLowerCase();

    return matchesSearch && matchesContentCat && matchesDiv;
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Content Category Handlers (Modal Admin)
  const handleCreateContentCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newContentCatName.trim();
    if (!trimmedName) return;

    if (contentCategories.some((c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      triggerToast(`⚠️ Nama kategori "${trimmedName}" sudah ada. Silakan gunakan nama lain.`);
      return;
    }

    const newCat: ContentCategoryItem = {
      id: `cc-${Date.now()}`,
      name: trimmedName,
      description: newContentCatDesc.trim() || '',
      contentCount: 0
    };

    try {
      await saveContentCategoryToSupabase(newCat);
      onAddContentCategory(newCat);
      setNewContentCatName('');
      setNewContentCatDesc('');
      triggerToast(`Kategori konten baru "${newCat.name}" berhasil ditambahkan.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      triggerToast(`❌ Gagal menambahkan kategori: ${message}`);
    }
  };

  const handleStartEditContentCategory = (cat: ContentCategoryItem) => {
    setEditingContentCategoryId(cat.id);
    setEditingContentCatName(cat.name);
    setEditingContentCatDesc(cat.description || '');
  };

  const handleSaveEditContentCategory = async (cat: ContentCategoryItem) => {
    const trimmedName = editingContentCatName.trim();
    if (!trimmedName) return;

    if (
      contentCategories.some(
        (c) => c.id !== cat.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      triggerToast(`⚠️ Nama kategori "${trimmedName}" sudah ada. Silakan gunakan nama lain.`);
      return;
    }

    const updatedCat: ContentCategoryItem = {
      ...cat,
      name: trimmedName,
      description: editingContentCatDesc.trim()
    };

    try {
      await saveContentCategoryToSupabase(updatedCat);
      if (onEditContentCategory) {
        onEditContentCategory(cat.id, { name: trimmedName, description: editingContentCatDesc.trim() });
      }
      setEditingContentCategoryId(null);
      triggerToast(`Kategori "${trimmedName}" berhasil diperbarui.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      triggerToast(`❌ Gagal mengedit kategori: ${message}`);
    }
  };

  const handleDeleteContentCategoryItem = async (cat: ContentCategoryItem) => {
    const docCount = articles.filter(
      (a) => a.contentCategoryId === cat.id || a.contentCategoryName === cat.name
    ).length;

    if (docCount > 0) {
      triggerToast(
        `❌ Kategori ini masih dipakai oleh ${docCount} artikel. Pindahkan artikel ke kategori lain dulu sebelum menghapus.`
      );
      return;
    }

    try {
      await deleteContentCategoryFromSupabase(cat.id);
      if (onDeleteContentCategory) {
        onDeleteContentCategory(cat.id);
      }
      if (activeContentCategory === cat.name || activeContentCategory === cat.id) {
        setActiveContentCategory('Semua');
      }
      triggerToast(`Kategori konten "${cat.name}" berhasil dihapus.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      triggerToast(`❌ Gagal menghapus kategori: ${message}`);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleOpenPreviewArticle = (art: KnowledgeArticle) => {
    const newViews = (art.views || 0) + 1;
    const updatedArt = { ...art, views: newViews };
    setPreviewArticle(updatedArt);
    if (onEditArticle) {
      onEditArticle(art.id, { views: newViews });
    }
  };

  const handleDownloadDocument = (art: KnowledgeArticle) => {
    const isLink = isLinkDocument(art) || art.fileType === 'LINK' || art.contentType === 'link' || Boolean(art.linkUrl);
    const targetLink = art.linkUrl || art.fileUrl;

    if (isLink) {
      if (targetLink && targetLink.trim().length > 0) {
        const finalUrl = targetLink.startsWith('http') ? targetLink : `https://${targetLink}`;
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const newDownloads = (art.downloads || 0) + 1;
    if (onEditArticle) {
      onEditArticle(art.id, { downloads: newDownloads });
    }
    if (previewArticle && previewArticle.id === art.id) {
      setPreviewArticle({ ...previewArticle, downloads: newDownloads });
    }
    downloadDocumentFile({
      title: art.title,
      category: art.division || art.category || '',
      author: art.author,
      date: art.date,
      summary: art.summary,
      fileType: art.fileType,
      fileUrl: art.fileUrl,
      fileBlob: art.fileBlob,
      linkUrl: art.linkUrl
    });
    triggerToast(`Mengunduh berkas "${art.title}"...`);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (isUploading) {
      triggerToast('⚠️ Sedang proses unggah, harap tunggu...');
      return;
    }

    if (!newArtTitle.trim()) {
      setFileError('Judul dokumen wajib diisi.');
      return;
    }

    if (!newArtDivision) {
      setFileError('Harap pilih Divisi terlebih dahulu.');
      return;
    }

    const hasFile = Boolean(selectedFile);
    const hasLink = Boolean(newArtLinkUrl.trim());

    if (!hasFile && !hasLink) {
      setFileError('Harap unggah berkas file atau masukkan tautan link URL.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      setUploadProgress(40);
      const isLinkOnly = !hasFile && hasLink;
      const finalFileType = hasFile ? autoDetectFileType(selectedFile!.name) : 'LINK';
      const finalContentType = isLinkOnly ? 'link' : 'file';

      const calculatedFileSize = isLinkOnly
        ? 'Tautan Eksternal'
        : selectedFile
        ? formatFileSize(selectedFile.size)
        : '2.5 MB';

      const calculatedFileName = isLinkOnly
        ? `${newArtTitle}.link`
        : selectedFile
        ? selectedFile.name
        : `${newArtTitle.toLowerCase().replace(/\s+/g, '_')}.${finalFileType.toLowerCase()}`;

      let createdFileUrl: string | undefined = undefined;
      if (selectedFile) {
        try {
          setUploadProgress(70);
          const storageUrl = await uploadFileToSupabaseStorage(selectedFile);
          createdFileUrl = storageUrl || (await readFileAsDataURL(selectedFile));
        } catch (err) {
          console.error('Error uploading or reading file:', err);
          createdFileUrl = await readFileAsDataURL(selectedFile);
        }
      }

      setUploadProgress(90);

      const createdFileBlob = isLinkOnly ? undefined : (selectedFile || undefined);
      const selectedCatObj = contentCategories.find((c) => c.id === newArtContentCategoryId);

      const activeLinkUrl = isLinkOnly ? newArtLinkUrl.trim() : (hasLink ? newArtLinkUrl.trim() : undefined);
      const activeFileUrl = isLinkOnly ? newArtLinkUrl.trim() : createdFileUrl;

      const newArt: KnowledgeArticle = {
        id: `kb-${Date.now()}`,
        title: newArtTitle.trim(),
        division: newArtDivision,
        category: newArtDivision,
        contentCategoryId: newArtContentCategoryId || 'cc-002',
        contentCategoryName: selectedCatObj?.name || 'Materi Pelatihan',
        summary: newArtSummary.trim() || 'Ringkasan dokumen operasional.',
        author: currentUserName,
        date: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        fileType: finalFileType,
        views: 1,
        downloads: 0,
        contentType: finalContentType,
        linkUrl: activeLinkUrl,
        fileBlob: createdFileBlob,
        fileUrl: activeFileUrl
      };

      const newPendingDoc: PendingDoc = {
        id: `pv-${Date.now()}`,
        title: newArtTitle.trim(),
        category: newArtDivision,
        contentCategoryId: newArtContentCategoryId || 'cc-002',
        contentCategoryName: selectedCatObj?.name || 'Materi Pelatihan',
        author: currentUserName,
        submitDate: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        submitTime: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        fileName: calculatedFileName,
        fileSize: calculatedFileSize,
        description: newArtSummary.trim() || 'Ringkasan dokumen operasional.',
        tags: [newArtDivision],
        status: 'Menunggu Verifikasi',
        articleData: newArt,
        linkUrl: activeLinkUrl,
        fileUrl: activeFileUrl,
        fileBlob: createdFileBlob
      };

      setUploadProgress(100);

      if (onRequestVerification) {
        onRequestVerification(newPendingDoc);
      } else {
        onAddArticle(newArt);
      }

      setNewArtTitle('');
      setNewArtSummary('');
      setNewArtLinkUrl('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowAddArticleModal(false);

      logUserActivitySilent({
        userName: currentUserName,
        department: currentUserDivision,
        action: `Pengajuan dokumen Knowledge Base "${title}" (${selectedCategory})`
      });

      triggerToast('Dokumen Berhasil Dikirim');
    } catch (err) {
      console.error('Error creating article:', err);
      setFileError('Gagal memproses dokumen. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleOpenDeleteArticle = (art: KnowledgeArticle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArticleToDelete(art);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteArticle = () => {
    if (!articleToDelete) return;
    if (onDeleteArticle) {
      onDeleteArticle(articleToDelete.id);
    }
    setArticleToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Base</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pusat direktori aset pengetahuan, dokumentasi, SOP, dan materi pelatihan organisasi.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all shadow-2xs cursor-pointer"
                title="Admin: Kelola & Edit Kategori Konten Pengetahuan"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Kelola dan Edit Kategori Konten Pengetahuan</span>
              </button>
            )}

            {currentUserRole !== 'Manajer' && currentUserRole !== 'Associate' && (
              <button
                onClick={() => setShowAddArticleModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Unggah Konten</span>
              </button>
            )}
          </div>

          {/* Dropdown Filter Divisi (Diletakkan di bawah tombol Unggah Konten) */}
          <div className="relative" ref={divisionDropdownRef}>
            <button
              type="button"
              onClick={() => setShowDivDropdown(!showDivDropdown)}
              className="flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[18px]">filter_list</span>
                <span>Divisi: {selectedDivisionFilter}</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">expand_more</span>
            </button>

            {showDivDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in duration-150">
                <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                  {['Semua', ...ALL_DIVISIONS].map((div) => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => {
                        setSelectedDivisionFilter(div);
                        setShowDivDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selectedDivisionFilter === div
                          ? 'bg-sky-50 dark:bg-cyan-950/60 text-[#006194] dark:text-cyan-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
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

      {/* Articles & Documents Content View */}
      <div className="space-y-4">
        {/* Category Filter Pills (Sub-Navigasi Dynamic Tab per Kategori) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setActiveContentCategory('Semua')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeContentCategory === 'Semua'
                ? 'bg-[#006194] text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Semua Kategori
          </button>
          {contentCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveContentCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeContentCategory === cat.name || activeContentCategory === cat.id
                  ? 'bg-[#006194] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredArticles.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
              Tidak ada dokumen yang ditemukan untuk filter ini.
            </div>
          ) : (
            filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => handleOpenPreviewArticle(art)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-sky-950/80 text-[#006194] dark:text-sky-300 font-extrabold text-[11px] rounded-md flex items-center gap-1 border border-sky-200/80 shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">folder</span>
                      <span>{art.contentCategoryName || 'Materi Pelatihan'}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const effectiveType = getEffectiveFileType(art);
                        if (isLinkDocument(art)) {
                          return (
                            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[11px] font-extrabold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">link</span>
                              <span>LINK</span>
                            </span>
                          );
                        }
                        if (effectiveType === 'XLSX') {
                          return (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-extrabold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">table_chart</span>
                              <span>XLSX</span>
                            </span>
                          );
                        }
                        if (effectiveType === 'PDF') {
                          return (
                            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] font-extrabold flex items-center gap-1 shadow-2xs">
                              <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                              <span>PDF</span>
                            </span>
                          );
                        }
                        if (effectiveType === 'PPTX' || effectiveType === 'PPT') {
                          return (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-extrabold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">slideshow</span>
                              <span>PPTX</span>
                            </span>
                          );
                        }
                        if (effectiveType === 'DOCX' || effectiveType === 'DOC') {
                          return (
                            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 border border-sky-200 rounded text-[11px] font-extrabold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">description</span>
                              <span>DOCX</span>
                            </span>
                          );
                        }
                        return (
                          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-extrabold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">article</span>
                            <span>{effectiveType}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 hover:text-[#006194] dark:hover:text-cyan-400 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    Divisi: <span className="font-semibold text-slate-700 dark:text-slate-300">{art.division || art.category}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>{art.author || 'Anonim'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLinkDocument(art) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetUrl = art.linkUrl || art.fileUrl;
                          if (targetUrl && targetUrl.trim().length > 0) {
                            const finalUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
                            window.open(finalUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="p-1 text-[#006194] dark:text-indigo-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                        title="Buka Tautan Link"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(art);
                        }}
                        className="p-1 text-slate-500 hover:text-[#006194] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        title="Unduh Dokumentasi"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    )}

                    {canDeleteArticle(art) && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenDeleteArticle(art, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Category Management Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Kelola & Edit Kategori Konten Pengetahuan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Akses Admin: Tambah, edit, dan kelola kategori konten pengetahuan organisasi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setEditingContentCategoryId(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form "+ Tambah Kategori Baru" */}
            <form
              onSubmit={handleCreateContentCategory}
              className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-3"
            >
              <label className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase block">
                + Tambah Kategori Baru
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newContentCatName}
                  onChange={(e) => setNewContentCatName(e.target.value)}
                  placeholder="Contoh: Studi Kasus Lapangan"
                  className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-100"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white font-bold text-xs rounded-xl hover:bg-amber-800 transition-colors shadow-2xs whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Tambah</span>
                </button>
              </div>
              <input
                type="text"
                value={newContentCatDesc}
                onChange={(e) => setNewContentCatDesc(e.target.value)}
                placeholder="Deskripsi singkat kategori (opsional)"
                className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-400 font-normal text-slate-800 dark:text-slate-100"
              />
            </form>

            {/* List "Daftar Kategori Terdaftar (N)" */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Daftar Kategori Terdaftar ({contentCategories.length})
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {contentCategories.map((c) => {
                  const isEditing = editingContentCategoryId === c.id;
                  const docCount = articles.filter(
                    (a) => a.contentCategoryId === c.id || a.contentCategoryName === c.name
                  ).length;
                  const isDeleteDisabled = docCount > 0;

                  return (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2 flex-1">
                          <input
                            type="text"
                            value={editingContentCatName}
                            onChange={(e) => setEditingContentCatName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                          <input
                            type="text"
                            value={editingContentCatDesc}
                            onChange={(e) => setEditingContentCatDesc(e.target.value)}
                            placeholder="Deskripsi..."
                            className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveEditContentCategory(c)}
                              className="px-3 py-1 bg-[#006194] text-white text-xs font-bold rounded-md"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingContentCategoryId(null)}
                              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#006194] dark:text-cyan-300 font-extrabold text-xs rounded-lg">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              {docCount} Dokumen Konten
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditContentCategory(c)}
                              className="px-2.5 py-1 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>

                            {/* Tombol Hapus dengan Proteksi Deletion Guard */}
                            <button
                              type="button"
                              disabled={isDeleteDisabled}
                              onClick={() => handleDeleteContentCategoryItem(c)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDeleteDisabled
                                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                              }`}
                              title={
                                isDeleteDisabled
                                  ? `Kategori ini masih dipakai oleh ${docCount} artikel. Pindahkan artikel ke kategori lain dulu sebelum menghapus.`
                                  : 'Hapus Kategori'
                              }
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

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setEditingContentCategoryId(null);
                }}
                className="px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] shadow-sm cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Article Modal */}
      {showAddArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Unggah Konten</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Lengkapi formulir di bawah ini untuk menambahkan konten ke Knowledge Base.</p>
              </div>
              <button
                onClick={() => setShowAddArticleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Judul Dokumen / Konten <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newArtTitle}
                  onChange={(e) => setNewArtTitle(e.target.value)}
                  placeholder="Contoh: Panduan SOP Rekrutmen Q1 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#006194] dark:focus:border-cyan-400"
                  required
                />
              </div>

              {/* Grid 2 Kolom: Field Divisi & Field Kategori Konten */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 1: Pilih Divisi */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">
                    Divisi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newArtDivision}
                    onChange={(e) => setNewArtDivision(e.target.value)}
                    className="w-full h-[40px] px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#006194] dark:focus:border-cyan-400 cursor-pointer"
                    required
                  >
                    {ALL_DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Pilih Kategori Konten (Dinamis dari contentCategories) */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">
                    Kategori Konten <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newArtContentCategoryId}
                    onChange={(e) => setNewArtContentCategoryId(e.target.value)}
                    className="w-full h-[40px] px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#006194] dark:focus:border-cyan-400 cursor-pointer"
                    required
                  >
                    {contentCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Ringkasan
                </label>
                <textarea
                  value={newArtSummary}
                  onChange={(e) => setNewArtSummary(e.target.value)}
                  placeholder="Rincian singkat isi dokumen dan panduan yang terkandung..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#006194]/20 outline-none"
                />
              </div>

              {/* Unggah Berkas File */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Unggah Berkas File
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.mp4,.mov,.avi,.epub"
                />

                {selectedFile ? (
                  <div className="p-3.5 bg-sky-50/80 dark:bg-cyan-950/40 border border-sky-200 dark:border-cyan-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-[#006194] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-rose-500 hover:text-rose-700 p-1 text-xs font-bold shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#006194] dark:hover:border-cyan-400 rounded-xl text-center cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-slate-400 text-2xl block mb-1">cloud_upload</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Klik untuk memilih file</span>
                    <span className="text-[10px] text-slate-400 font-medium block">PDF, DOCX, XLSX, PPTX (Maks 100MB)</span>
                  </button>
                )}
              </div>

              {/* Tautan External Link (Opsional) */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Atau Masukkan Tautan Link Eksternal (Google Drive / Notion / Figma)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    link
                  </span>
                  <input
                    type="url"
                    value={newArtLinkUrl}
                    onChange={(e) => {
                      setNewArtLinkUrl(e.target.value);
                      setFileError(null);
                    }}
                    placeholder="https://drive.google.com/... atau Notion / Figma link"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
              </div>

              {isUploading && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-xs font-bold text-[#006194]">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Mengunggah berkas...
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

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all ${
                    isUploading
                      ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      : 'bg-[#006194] text-white hover:bg-[#004b73]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${isUploading ? 'animate-spin' : ''}`}>
                    {isUploading ? 'sync' : 'upload_file'}
                  </span>
                  <span>{isUploading ? `Sedang Mengunggah (${uploadProgress}%)...` : 'Unggah Konten'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Article Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="px-2.5 py-1 bg-sky-50 dark:bg-cyan-950/60 text-[#006194] dark:text-cyan-300 rounded-md text-[11px] font-bold">
                  {previewArticle.contentCategoryName || 'Materi Pelatihan'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {previewArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ringkasan Dokumentasi
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {previewArticle.summary}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006194] text-lg">
                  {isLinkDocument(previewArticle) ? 'link' : 'visibility'}
                </span>
                <span>{isLinkDocument(previewArticle) ? 'Informasi Tautan Eksternal' : 'Pratinjau Berkas'}</span>
              </h4>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-2">
                {isLinkDocument(previewArticle) ? (
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <span className="material-symbols-outlined text-2xl">link</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 block">
                          Tautan Terhubung Eksternal
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {previewArticle.title}
                        </h4>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">URL Alamat Tautan</span>
                      {previewArticle.linkUrl || previewArticle.fileUrl ? (
                        <a
                          href={previewArticle.linkUrl || previewArticle.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{previewArticle.linkUrl || previewArticle.fileUrl}</span>
                          <span className="material-symbols-outlined text-sm shrink-0">open_in_new</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Tautan URL tidak tersedia</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Dokumen ini berupa tautan eksternal yang diunggah oleh <strong>{previewArticle.author}</strong>. Klik tombol <strong>"Buka Tautan Link"</strong> di bawah untuk mengakses sumber daya ini.
                    </p>
                  </div>
                ) : isSpreadsheetFile(previewArticle.fileType, previewArticle.fileUrl) ? (
                  <SpreadsheetPreview
                    fileUrl={previewArticle.fileUrl}
                    fileName={previewArticle.title}
                  />
                ) : isPdfFile(previewArticle.fileType, previewArticle.fileUrl) && previewArticle.fileUrl ? (
                  <iframe
                    src={`${previewArticle.fileUrl}#toolbar=0`}
                    className="w-full h-[380px] border-0 rounded-xl shadow-inner bg-white"
                    title="Pratinjau Berkas PDF"
                  />
                ) : isImageFile(previewArticle.fileType, previewArticle.fileUrl) && previewArticle.fileUrl ? (
                  <div className="flex items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-xl">
                    <img
                      src={previewArticle.fileUrl}
                      alt={previewArticle.title}
                      className="max-h-[380px] max-w-full rounded-lg object-contain shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-6 max-w-2xl mx-auto space-y-5 text-slate-800 dark:text-slate-200 font-sans">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#006194]/10 text-[#006194] dark:text-cyan-300 text-[10px] font-extrabold rounded uppercase">
                            {previewArticle.division || previewArticle.category}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            TERVERIFIKASI & AKTIF
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                          {previewArticle.title}
                        </h2>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold block">FORMAT</span>
                        <span className="text-xs font-black text-[#006194] dark:text-cyan-400">{previewArticle.fileType}</span>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1 text-[#006194]">
                          <span className="material-symbols-outlined text-sm">article</span>
                          Bab 1: Ringkasan Eksekutif & Isi Dokumen
                        </h4>
                        <p className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-sm">
                          "{previewArticle.summary}"
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1 text-[#006194]">
                          <span className="material-symbols-outlined text-sm">assignment</span>
                          Bab 2: Petunjuk Operasional & Ketentuan Utama
                        </h4>
                        <div className="space-y-2 text-slate-600 dark:text-slate-400 pl-3 border-l-2 border-[#006194]/40">
                          <p>1. Dokumen ini merupakan panduan resmi untuk divisi <strong>{previewArticle.division || previewArticle.category}</strong> yang telah diverifikasi oleh Manajer.</p>
                          <p>2. Seluruh personel wajib mematuhi protokol, spesifikasi teknis, dan alur kerja yang tertera pada panduan ini.</p>
                          <p>3. Untuk koordinasi dan klarifikasi tambahan, hubungi penyusun dokumen: <strong>{previewArticle.author}</strong>.</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Penyusun: <strong className="text-slate-700 dark:text-slate-300">{previewArticle.author}</strong></span>
                        <span>Tanggal Terbit: <strong className="text-slate-700 dark:text-slate-300">{previewArticle.date}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100/60 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 mb-6">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Penulis</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{previewArticle.author}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Divisi</span>
                <span className="font-bold text-[#006194] dark:text-cyan-400">{previewArticle.division || previewArticle.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Format</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{previewArticle.fileType}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              {canDeleteArticle(previewArticle) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const art = previewArticle;
                      setPreviewArticle(null);
                      handleOpenDeleteArticle(art);
                    }}
                    className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>Hapus</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                {isLinkDocument(previewArticle) ? (
                  <a
                    href={previewArticle.linkUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerToast(`Membuka tautan "${previewArticle.title}"...`);
                      setPreviewArticle(null);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    <span>Buka Tautan Link</span>
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      handleDownloadDocument(previewArticle);
                      setPreviewArticle(null);
                    }}
                    className="px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] flex items-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Unduh Dokumen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirmModal && articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Hapus Dokumen Pengetahuan?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus dokumen <strong className="text-slate-900 dark:text-slate-100">"{articleToDelete.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteArticle}
                className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm"
              >
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Success Modal */}
      {showVerificationSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <div className="mb-2">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800 tracking-wider uppercase">
                ⌛ MENUNGGU VERIFIKASI
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-3">
              Dokumen berhasil dikirim dan sedang menunggu verifikasi dari Manajer
            </h3>

            <button
              onClick={() => setShowVerificationSuccessModal(false)}
              className="w-full sm:w-auto px-8 py-3 bg-[#006194] text-white rounded-xl font-bold text-sm hover:bg-[#004b73] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">menu_book</span>
              <span>KEMBALI KE KNOWLEDGE BASE</span>
            </button>
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
