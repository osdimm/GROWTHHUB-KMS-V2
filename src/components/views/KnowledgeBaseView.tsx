import React, { useState, useRef } from 'react';
import { CategoryItem, KnowledgeArticle, PendingDoc } from '../../types';
import { downloadDocumentFile, readFileAsDataURL } from '../../utils/documentDownloader';
import { uploadFileToSupabaseStorage } from '../../services/supabaseService';
import { CustomSelect } from '../CustomSelect';
import { SpreadsheetPreview } from '../SpreadsheetPreview';
import { isSpreadsheetFile, isPdfFile, isImageFile } from '../../utils/fileTypeHelper';

interface KnowledgeBaseViewProps {
  categories: CategoryItem[];
  articles: KnowledgeArticle[];
  onAddCategory: (cat: CategoryItem) => void;
  onEditCategory?: (id: string, updated: Partial<CategoryItem>, oldName?: string) => void;
  onDeleteCategory?: (id: string) => void;
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
  articles,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
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

  const canEditOrDeleteArticle = (art: KnowledgeArticle) => {
    if (currentUserRole === 'Admin') return true;
    if (currentUserRole === 'Associate') return false;

    // Karyawan & Manajer: can ONLY edit/delete if article category matches their division or they are the author!
    if (currentUserDivision && art.category && art.category.toLowerCase() === currentUserDivision.toLowerCase()) {
      return true;
    }
    if (currentUserName && art.author && art.author.toLowerCase() === currentUserName.toLowerCase()) {
      return true;
    }
    return false;
  };
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'articles'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Semua');

  // Modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [showVerificationSuccessModal, setShowVerificationSuccessModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<KnowledgeArticle | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Article Form State
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [showEditArticleModal, setShowEditArticleModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');

  // Delete Article State
  const [articleToDelete, setArticleToDelete] = useState<KnowledgeArticle | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // New Category Form
  const [newCatCode, setNewCatCode] = useState('17');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('folder');

  // Edit Category State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryDesc, setEditingCategoryDesc] = useState('');

  // New Article Form
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtCat, setNewArtCat] = useState('');
  const [newArtSummary, setNewArtSummary] = useState('');
  const [newArtType, setNewArtType] = useState<'PDF' | 'DOCX' | 'E-Book' | 'Video' | 'Artikel' | 'LINK'>('PDF');
  const [newArtLinkUrl, setNewArtLinkUrl] = useState('');
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

  const autoDetectType = (fileName: string): 'PDF' | 'DOCX' | 'E-Book' | 'Video' | 'Artikel' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (['docx', 'doc'].includes(ext || '')) return 'DOCX';
    if (['epub', 'mobi'].includes(ext || '')) return 'E-Book';
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'Video';
    return 'Artikel';
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setFileError(null);
    const detected = autoDetectType(file.name);
    setNewArtType(detected);
    if (!newArtTitle) {
      // Auto fill title if empty
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setNewArtTitle(nameWithoutExt);
    }
  };

  const query = (searchQuery || globalSearch).toLowerCase();

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.code.includes(query) ||
      c.description.toLowerCase().includes(query)
  );

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(query) ||
      a.summary.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategoryFilter === 'Semua' || a.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCatName.trim();
    if (!trimmedName) return;

    if (categories.some((c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      triggerToast(`⚠️ Nama divisi "${trimmedName}" sudah ada. Silakan gunakan nama lain.`);
      return;
    }

    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      code: newCatCode || String(categories.length + 1).padStart(2, '0'),
      name: trimmedName,
      description: newCatDesc || 'Divisi terdaftar organisasi.',
      contentCount: 0,
      icon: newCatIcon || 'folder'
    };

    onAddCategory(newCat);
    setNewCatName('');
    setNewCatDesc('');
    triggerToast(`Divisi baru "${newCat.name}" berhasil ditambahkan.`);
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
    setEditingCategoryDesc(cat.description || '');
  };

  const handleSaveEditCategory = (cat: CategoryItem) => {
    const trimmedName = editingCategoryName.trim();
    if (!trimmedName) return;

    if (
      categories.some((c) => c.id !== cat.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase())
    ) {
      triggerToast(`⚠️ Nama divisi "${trimmedName}" sudah ada. Silakan gunakan nama lain.`);
      return;
    }

    if (onEditCategory) {
      onEditCategory(cat.id, { name: trimmedName, description: editingCategoryDesc }, cat.name);
      triggerToast(`Divisi "${trimmedName}" berhasil diperbarui.`);
    }
    setEditingCategoryId(null);
  };

  const handleDeleteCategoryItem = (cat: CategoryItem) => {
    if (onDeleteCategory) {
      onDeleteCategory(cat.id);
      if (selectedCategoryFilter === cat.name) {
        setSelectedCategoryFilter('Semua');
      }
      triggerToast(`Divisi "${cat.name}" berhasil dihapus.`);
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
    const newDownloads = (art.downloads || 0) + 1;
    if (onEditArticle) {
      onEditArticle(art.id, { downloads: newDownloads });
    }
    if (previewArticle && previewArticle.id === art.id) {
      setPreviewArticle({ ...previewArticle, downloads: newDownloads });
    }
    downloadDocumentFile({
      title: art.title,
      category: art.category,
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

    if (!newArtCat) {
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
      const finalFileType = hasFile ? autoDetectType(selectedFile!.name) : 'LINK';
      const finalContentType = hasLink ? 'link' : 'file';

      const calculatedFileSize = hasLink
        ? 'Tautan Eksternal'
        : selectedFile
        ? formatFileSize(selectedFile.size)
        : '2.5 MB';

      const calculatedFileName = hasLink
        ? `${newArtTitle}.link`
        : selectedFile
        ? selectedFile.name
        : `${newArtTitle.toLowerCase().replace(/\s+/g, '_')}.${finalFileType.toLowerCase()}`;

      let createdFileUrl: string | undefined = undefined;
      if (selectedFile && !hasLink) {
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

      const createdFileBlob = hasLink ? undefined : (selectedFile || undefined);

      const newArt: KnowledgeArticle = {
        id: `kb-${Date.now()}`,
        title: newArtTitle.trim(),
        category: newArtCat,
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
        linkUrl: hasLink ? newArtLinkUrl.trim() : undefined,
        fileBlob: createdFileBlob,
        fileUrl: createdFileUrl
      };

      const newPendingDoc: PendingDoc = {
        id: `pv-${Date.now()}`,
        title: newArtTitle.trim(),
        category: newArtCat,
        author: currentUserName,
        subDivision: newArtCat,
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
        tags: [newArtCat],
        status: 'Menunggu Verifikasi',
        articleData: newArt,
        fileBlob: createdFileBlob,
        fileUrl: createdFileUrl
      };

      setUploadProgress(100);

      if (onRequestVerification) {
        onRequestVerification(newPendingDoc);
      } else {
        onAddArticle(newArt);
      }

      setShowAddArticleModal(false);
      setNewArtTitle('');
      setNewArtSummary('');
      setNewArtLinkUrl('');
      setSelectedFile(null);
      setFileError(null);
      setShowVerificationSuccessModal(true);
    } catch (error) {
      console.error('Failed to create article:', error);
      setFileError('Gagal mengunggah dokumen. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Article Edit & Delete Handlers
  const handleOpenEditArticle = (art: KnowledgeArticle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingArticle(art);
    setEditTitle(art.title);
    setEditCategory(art.category);
    setEditSummary(art.summary);
    setEditLinkUrl(art.linkUrl || '');
    setShowEditArticleModal(true);
  };

  const handleSaveEditArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editTitle.trim()) return;

    const hasLink = Boolean(editLinkUrl.trim());
    const finalFileType = hasLink && editingArticle.fileType === 'LINK' ? 'LINK' : editingArticle.fileType;

    const updated: Partial<KnowledgeArticle> = {
      title: editTitle.trim(),
      category: editCategory,
      summary: editSummary.trim(),
      fileType: finalFileType,
      contentType: hasLink ? 'link' : editingArticle.contentType || 'file',
      linkUrl: hasLink ? editLinkUrl.trim() : undefined
    };

    if (onEditArticle) {
      onEditArticle(editingArticle.id, updated);
    }

    if (previewArticle?.id === editingArticle.id) {
      setPreviewArticle({ ...previewArticle, ...updated } as KnowledgeArticle);
    }

    setShowEditArticleModal(false);
    setEditingArticle(null);
    triggerToast(`Dokumen "${editTitle}" berhasil diperbarui.`);
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

    if (previewArticle?.id === articleToDelete.id) {
      setPreviewArticle(null);
    }

    setShowDeleteConfirmModal(false);
    triggerToast(`Dokumen "${articleToDelete.title}" berhasil dihapus.`);
    setArticleToDelete(null);
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

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all shadow-2xs"
              title="Admin: Tambah atau Edit Divisi"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Kelola & Edit Divisi</span>
            </button>
          )}

          {currentUserRole !== 'Manajer' && currentUserRole !== 'Associate' && (
            <button
              onClick={() => setShowAddArticleModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Unggah Konten</span>
            </button>
          )}
        </div>
      </div>

      {/* Articles & Documents Content View */}
      <div className="space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('Semua')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'Semua'
                ? 'bg-[#006194] text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Semua Divisi
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryFilter(c.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryFilter === c.name
                  ? 'bg-[#006194] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredArticles.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                Tidak ada dokumen yang ditemukan untuk divisi ini.
              </div>
            ) : (
              filteredArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleOpenPreviewArticle(art)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-sky-50 text-[#006194] border border-sky-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {art.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {art.fileType === 'LINK' || art.linkUrl ? (
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[11px] font-extrabold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">link</span>
                            <span>LINK</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold">
                            {art.fileType}
                          </span>
                        )}

                        {canEditOrDeleteArticle(art) && (
                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditArticle(art, e)}
                              className="p-1 text-slate-400 hover:text-[#006194] hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit Dokumen"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenDeleteArticle(art, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Dokumen"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-[#006194] transition-colors">
                      {art.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span>{art.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {art.fileType === 'LINK' || art.contentType === 'link' || art.linkUrl ? (
                        <a
                          href={art.linkUrl || 'https://drive.google.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 shadow-2xs"
                          title="Buka Tautan Link"
                        >
                          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                          <span>Buka Link</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadDocument(art);
                          }}
                          className="px-2.5 py-1 bg-sky-50 text-[#006194] border border-sky-200 rounded-lg text-xs font-bold hover:bg-[#006194] hover:text-white transition-all flex items-center gap-1 shadow-2xs"
                          title="Unduh Dokumen Ini"
                        >
                          <span className="material-symbols-outlined text-[15px]">download</span>
                          <span>Unduh</span>
                        </button>
                      )}
                      <span className="text-slate-300">•</span>
                      <span>{art.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {/* Modal Kelola / Edit Divisi (Khusus Admin) */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl border border-amber-200">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Kelola & Edit Divisi</h3>
                  <p className="text-xs text-slate-500">
                    Akses Admin: Tambah divisi baru atau ubah nama/deskripsi divisi yang ada.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setEditingCategoryId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Tambah Divisi Baru */}
            <form onSubmit={handleCreateCategory} className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
              <label className="text-xs font-bold text-amber-950 uppercase block">
                + Tambah Divisi Baru
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Digital Analytics"
                  className="flex-1 px-3.5 py-2 bg-white border border-amber-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white font-bold text-xs rounded-xl hover:bg-amber-800 transition-colors shadow-2xs whitespace-nowrap flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Tambah</span>
                </button>
              </div>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Deskripsi singkat divisi (opsional)"
                className="w-full px-3.5 py-1.5 bg-white border border-amber-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-400 font-normal"
              />
            </form>

            {/* Daftar Divisi Terdaftar */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Daftar Divisi Terdaftar ({categories.length})
                </h4>
                <span className="text-[10px] font-semibold text-slate-400">Klik 'Edit' untuk mengubah nama</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {categories.map((c) => {
                  const isEditing = editingCategoryId === c.id;
                  const docCount = articles.filter((a) => a.category === c.name).length;

                  return (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2 flex-1">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#006194]"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editingCategoryDesc}
                            onChange={(e) => setEditingCategoryDesc(e.target.value)}
                            placeholder="Deskripsi divisi"
                            className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-[#006194]"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEditCategory(c)}
                              className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-2xs"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryId(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-[#006194] font-extrabold text-xs rounded-lg shadow-2xs shrink-0">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium truncate">
                              {docCount} Dokumen Konten
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditCategory(c)}
                              className="px-2.5 py-1 text-slate-700 hover:text-[#006194] bg-white border border-slate-200 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-2xs"
                              title="Ubah Nama/Deskripsi Divisi"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategoryItem(c)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Divisi"
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
                  setShowAddCategoryModal(false);
                  setEditingCategoryId(null);
                }}
                className="px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] shadow-sm"
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Unggah Konten</h3>
                <p className="text-xs text-slate-500">Lengkapi formulir di bawah ini untuk menambahkan konten ke Knowledge Base.</p>
              </div>
              <button
                onClick={() => setShowAddArticleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Judul Dokumen / Konten
                </label>
                <input
                  type="text"
                  value={newArtTitle}
                  onChange={(e) => setNewArtTitle(e.target.value)}
                  placeholder="Contoh: Panduan SOP Rekrutmen Q1 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#006194]/20 outline-none"
                  required
                />
              </div>

              <CustomSelect
                label="Divisi"
                required
                options={categories.map((c) => c.name)}
                value={newArtCat}
                onChange={(val) => {
                  setNewArtCat(val);
                  setFileError(null);
                }}
                placeholder="Pilih Divisi"
              />

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Ringkasan
                </label>
                <textarea
                  value={newArtSummary}
                  onChange={(e) => setNewArtSummary(e.target.value)}
                  placeholder="Rincian singkat isi dokumen dan panduan yang terkandung..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#006194]/20 outline-none"
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
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.mp4,.mov,.avi,.epub"
                />

                {selectedFile ? (
                  <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-[#006194] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <span className="material-symbols-outlined text-xl">description</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {formatFileSize(selectedFile.size)} • Format Terdeteksi: <strong className="text-[#006194]">{newArtType}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#006194] hover:bg-sky-50 text-[11px] font-bold rounded-lg shrink-0 transition-colors shadow-2xs"
                    >
                      Ganti File
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
                    className="p-4 border-2 border-dashed border-sky-300/80 rounded-xl text-center bg-sky-50/40 cursor-pointer hover:bg-sky-50/80 hover:border-[#006194] transition-all group"
                  >
                    <span className="material-symbols-outlined text-[#006194] text-[32px] group-hover:scale-110 transition-transform">
                      cloud_upload
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      Klik di sini untuk memilih berkas atau Drag & Drop file
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      PDF, DOCX, XLSX, MP4, E-Book (Format otomatis terbaca)
                    </p>
                  </div>
                )}
              </div>

              {/* Sematkan Tautan Link / URL */}
              <div className="space-y-1.5 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                <label className="text-xs font-bold text-indigo-950 uppercase block">
                  Atau Sematkan Tautan Link / URL
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-[18px]">
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
                    className="w-full pl-9 pr-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
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

              <div className="flex justify-end pt-4 border-t border-slate-100">
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
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-7">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="px-2.5 py-1 bg-sky-50 text-[#006194] rounded-md text-[11px] font-bold">
                  {previewArticle.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {previewArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ringkasan Dokumen
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {previewArticle.summary}
              </p>
            </div>

            {/* Live Interactive In-App Document Reader Window */}
            <div className="mb-5 border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-900">
              <div className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">auto_stories</span>
                  <span className="font-bold tracking-wide">Pembaca Dokumen Langsung (In-App Reader)</span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 rounded-full text-[10px] font-bold">
                    ✨ Tanpa Unduh
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <span className="bg-slate-200 dark:bg-slate-700/80 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">Format: {previewArticle.fileType}</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-900/60 min-h-[300px] max-h-[420px] overflow-y-auto font-sans">
                {previewArticle.fileUrl && isSpreadsheetFile(previewArticle.fileType, previewArticle.fileUrl) ? (
                  <SpreadsheetPreview fileUrl={previewArticle.fileUrl} />
                ) : previewArticle.fileUrl && isImageFile(previewArticle.fileType, previewArticle.fileUrl) ? (
                  <div className="bg-slate-950 p-2 rounded-xl flex items-center justify-center">
                    <img src={previewArticle.fileUrl} alt={previewArticle.title} className="max-h-[360px] object-contain rounded-lg shadow-md" />
                  </div>
                ) : previewArticle.fileUrl && isPdfFile(previewArticle.fileType, previewArticle.fileUrl) ? (
                  <iframe
                    src={previewArticle.fileUrl}
                    className="w-full h-[360px] border-0 rounded-xl shadow-inner bg-white"
                    title="Pratinjau PDF Langsung"
                  />
                ) : previewArticle.fileUrl && previewArticle.fileUrl.startsWith('http') ? (
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(previewArticle.fileUrl)}&embedded=true`}
                    className="w-full h-[360px] border-0 rounded-xl shadow-inner bg-white"
                    title="Pratinjau Dokumen Langsung"
                  />
                ) : (
                  /* Formatted Interactive Document Paper View for Office Docs / Articles */
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 max-w-2xl mx-auto space-y-5 text-slate-800 font-sans">
                    <div className="border-b border-slate-200 pb-4 flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#006194]/10 text-[#006194] text-[10px] font-extrabold rounded uppercase">
                            {previewArticle.category}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            TERVERIFIKASI & AKTIF
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-slate-900 leading-tight">
                          {previewArticle.title}
                        </h2>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold block">FORMAT</span>
                        <span className="text-xs font-black text-[#006194]">{previewArticle.fileType}</span>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                      <div>
                        <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1 text-[#006194]">
                          <span className="material-symbols-outlined text-sm">article</span>
                          Bab 1: Ringkasan Eksekutif & Isi Dokumen
                        </h4>
                        <p className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 leading-relaxed font-serif text-sm">
                          "{previewArticle.summary}"
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1 text-[#006194]">
                          <span className="material-symbols-outlined text-sm">assignment</span>
                          Bab 2: Petunjuk Operasional & Ketentuan Utama
                        </h4>
                        <div className="space-y-2 text-slate-600 pl-3 border-l-2 border-[#006194]/40">
                          <p>1. Dokumen ini merupakan panduan resmi untuk divisi <strong>{previewArticle.category}</strong> yang telah diverifikasi oleh Manajer.</p>
                          <p>2. Seluruh personel wajib mematuhi protokol, spesifikasi teknis, dan alur kerja yang tertera pada panduan ini.</p>
                          <p>3. Untuk koordinasi dan klarifikasi tambahan, hubungi penyusun dokumen: <strong>{previewArticle.author}</strong>.</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Penyusun: <strong className="text-slate-700">{previewArticle.author}</strong></span>
                        <span>Tanggal Terbit: <strong className="text-slate-700">{previewArticle.date}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100/60 rounded-xl text-xs text-slate-600 mb-6">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Penulis</span>
                <span className="font-bold text-slate-800">{previewArticle.author}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Divisi</span>
                <span className="font-bold text-[#006194]">{previewArticle.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Format</span>
                <span className="font-bold text-slate-800">{previewArticle.fileType}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              {canEditOrDeleteArticle(previewArticle) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const art = previewArticle;
                      setPreviewArticle(null);
                      handleOpenEditArticle(art);
                    }}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    <span>Edit Dokumen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const art = previewArticle;
                      setPreviewArticle(null);
                      handleOpenDeleteArticle(art);
                    }}
                    className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>Hapus</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                {previewArticle.fileType === 'LINK' || previewArticle.linkUrl ? (
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

      {/* Edit Article Modal */}
      {showEditArticleModal && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006194]">edit_note</span>
                <h3 className="text-lg font-bold text-slate-900">Edit Konten Pengetahuan</h3>
              </div>
              <button
                onClick={() => setShowEditArticleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditArticle} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Judul Dokumen / Konten
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#006194]/20 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Divisi
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#006194]/20 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Ringkasan
                </label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#006194]/20 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  URL Tautan Berkas / Link (Opsional)
                </label>
                <input
                  type="url"
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#006194] text-white hover:bg-[#004b73] shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Article Confirmation Modal */}
      {showDeleteConfirmModal && articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Hapus Dokumen Pengetahuan?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus dokumen <strong className="text-slate-900">"{articleToDelete.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>

            <div className="mb-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200 tracking-wider uppercase">
                ⌛ MENUNGGU VERIFIKASI
              </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-2 mb-3">
              Dokumen Berhasil Dikirim
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-md">
              Terima kasih atas kontribusi Anda. Dokumen Anda kini sedang dalam proses verifikasi dan menunggu persetujuan dari Manager sebelum dipublikasikan ke Knowledge Base untuk seluruh tim.
            </p>

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
        <div className="fixed bottom-6 right-6 bg-[#2d3133] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          {!toastMessage.includes('⚠️') && !toastMessage.includes('❌') && !toastMessage.toLowerCase().includes('salah') && !toastMessage.toLowerCase().includes('gagal') && (
            <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
          )}
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
