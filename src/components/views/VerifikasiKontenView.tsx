import React, { useState } from 'react';
import { PendingDoc } from '../../types';
import { downloadDocumentFile } from '../../utils/documentDownloader';
import { ALL_DIVISIONS } from './KnowledgeBaseView';

interface VerifikasiKontenViewProps {
  pendingDocs: PendingDoc[];
  onApproveDoc?: (id: string, note?: string) => void;
  onRejectDoc?: (id: string, note?: string) => void;
  globalSearch?: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserDivision?: string;
}

export const VerifikasiKontenView: React.FC<VerifikasiKontenViewProps> = ({
  pendingDocs,
  onApproveDoc,
  onRejectDoc,
  globalSearch = '',
  currentUserRole = 'Admin',
  currentUserName = 'Dandi Pangestu',
  currentUserDivision
}) => {
  const [selectedId, setSelectedId] = useState<string>(pendingDocs[0]?.id || '');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('Semua');
  const [verificationNote, setVerificationNote] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const query = globalSearch.toLowerCase();

  const canApproveOrReject = (doc?: PendingDoc) => {
    if (!doc) return false;
    if (currentUserRole === 'Admin') return true;
    if (currentUserRole !== 'Manajer') return false;

    if (currentUserDivision) {
      const matchCat = doc.category.toLowerCase() === currentUserDivision.toLowerCase();
      const matchSub = doc.subDivision && doc.subDivision.toLowerCase() === currentUserDivision.toLowerCase();
      return matchCat || matchSub;
    }
    return false;
  };

  // Dynamic list of divisions for the filter dropdown
  const divisionOptions = Array.from(
    new Set([
      ...ALL_DIVISIONS,
      ...pendingDocs.map((d) => d.category).filter(Boolean),
      ...pendingDocs.map((d) => d.subDivision).filter((d): d is string => Boolean(d))
    ])
  );

  const filteredList = pendingDocs.filter((doc) => {
    // 1. ONLY show documents that are strictly "Menunggu Verifikasi" (Hide approved/rejected ones)
    if (doc.status !== 'Menunggu Verifikasi') {
      return false;
    }

    // 2. Division Filter (Gaya Forum Diskusi)
    if (selectedDivisionFilter !== 'Semua' && selectedDivisionFilter !== 'Semua Divisi') {
      const matchDiv =
        doc.category.toLowerCase() === selectedDivisionFilter.toLowerCase() ||
        (doc.subDivision && doc.subDivision.toLowerCase() === selectedDivisionFilter.toLowerCase());
      if (!matchDiv) return false;
    }

    const matchesQuery =
      doc.title.toLowerCase().includes(query) ||
      doc.author.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query);
    return matchesQuery;
  });

  const selectedDoc = filteredList.find((d) => d.id === selectedId) || filteredList[0];

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = () => {
    if (!selectedDoc) return;
    const currentDocId = selectedDoc.id;
    if (onApproveDoc) {
      onApproveDoc(currentDocId, verificationNote);
    }
    triggerToast(`Dokumen "${selectedDoc.title}" berhasil DISETUJUI dan dipublikasikan ke Knowledge Base.`);
    setVerificationNote('');
    const remaining = filteredList.filter((d) => d.id !== currentDocId);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    }
  };

  const handleReject = () => {
    if (!selectedDoc) return;
    const currentDocId = selectedDoc.id;
    if (onRejectDoc) {
      onRejectDoc(currentDocId, verificationNote);
    }
    triggerToast(`Dokumen "${selectedDoc.title}" DITOLAK. Notifikasi dikirimkan ke pengunggah.`);
    setVerificationNote('');
    const remaining = filteredList.filter((d) => d.id !== currentDocId);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Konten</h2>
            <span className="px-3 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
              Khusus Role Manajer
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Tinjau, evaluasi, dan setujui pengajuan dokumen Knowledge Base sebelum dipublikasikan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-sky-50 border border-sky-200 text-[#006194] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <span>
              Antrean: {pendingDocs.filter((d) => d.status === 'Menunggu Verifikasi').length} Dokumen Pending
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Antrean List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006194]">pending_actions</span>
                <span>Antrean Verifikasi</span>
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                {filteredList.length} Item
              </span>
            </div>

            {/* Division Filter Select (Gaya Forum Diskusi) */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  filter_alt
                </span>
                <select
                  value={selectedDivisionFilter}
                  onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-[#006194] outline-none cursor-pointer shadow-2xs"
                >
                  <option value="Semua">Semua Divisi</option>
                  {divisionOptions.map((d, idx) => (
                    <option key={`div-verif-${d}-${idx}`} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDivisionFilter !== 'Semua' && (
                <button
                  type="button"
                  onClick={() => setSelectedDivisionFilter('Semua')}
                  className="px-2.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center shrink-0 cursor-pointer"
                  title="Reset Filter Divisi"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Pending Cards Queue */}
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada dokumen yang sesuai dengan antrean ini.
              </div>
            ) : (
              filteredList.map((doc) => {
                const isSelected = doc.id === selectedDoc?.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-sky-50 border-2 border-[#006194] shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider ${
                          isSelected
                            ? 'bg-[#006194] text-white shadow-2xs'
                            : 'bg-sky-100 dark:bg-sky-950/80 text-[#006194] dark:text-sky-300'
                        }`}
                      >
                        {doc.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-700'
                            : doc.status === 'Ditolak'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <h4
                      className={`font-bold text-xs leading-snug line-clamp-2 mb-1 ${
                        isSelected ? 'text-slate-900' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {doc.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] mt-2">
                      <span
                        className={`font-semibold truncate max-w-[140px] ${
                          isSelected ? 'text-slate-800' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        👤 {doc.author}
                      </span>
                      <span
                        className={`font-medium ${
                          isSelected ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {doc.submitDate}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Document Details & Decision Controls */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          {selectedDoc ? (
            <>
              {/* Document Title & Category Header */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-sky-100 text-[#006194] text-[11px] font-bold rounded">
                    {selectedDoc.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      selectedDoc.status === 'Disetujui'
                        ? 'bg-emerald-100 text-emerald-700'
                        : selectedDoc.status === 'Ditolak'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedDoc.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedDoc.title}
                </h3>
              </div>

              {/* Information Card (Sub Divisi, Kontributor, Diajukan Pada) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                      JUDUL DOKUMEN
                    </span>
                    <span className="font-bold text-slate-900">{selectedDoc.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                      SUB DIVISI
                    </span>
                    <span className="font-bold text-slate-800">{selectedDoc.subDivision}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                      KONTRIBUTOR
                    </span>
                    <span className="font-bold text-slate-800">👤 {selectedDoc.author}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                      KETERANGAN
                    </span>
                    <span className="font-semibold text-slate-700">
                      Diajukan pada {selectedDoc.submitDate} pukul {selectedDoc.submitTime}
                    </span>
                  </div>
                </div>

                {selectedDoc.description && (
                  <div className="pt-3 border-t border-slate-200/60">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1">
                      DESKRIPSI / RINGKASAN
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {selectedDoc.description}
                    </p>
                  </div>
                )}
              </div>

              {/* File or Link Section */}
              {(() => {
                const rawFileUrl = selectedDoc.fileUrl || selectedDoc.articleData?.fileUrl || '';
                const isRawFileUrlLink =
                  rawFileUrl.startsWith('http://') ||
                  rawFileUrl.startsWith('https://') ?
                  !rawFileUrl.includes('/storage/v1/object/public/') : false;

                const explicitLinkUrl =
                  selectedDoc.linkUrl ||
                  selectedDoc.articleData?.linkUrl ||
                  (selectedDoc.fileName && (selectedDoc.fileName.startsWith('http://') || selectedDoc.fileName.startsWith('https://')) ? selectedDoc.fileName : '') ||
                  (isRawFileUrlLink ? rawFileUrl : '');

                const isLinkUrl =
                  Boolean(explicitLinkUrl) ||
                  selectedDoc.articleData?.contentType === 'link' ||
                  selectedDoc.articleData?.fileType === 'LINK' ||
                  (selectedDoc.fileName && selectedDoc.fileName.toLowerCase().endsWith('.link')) ||
                  selectedDoc.fileSize === 'Tautan Eksternal';

                const targetUrl = explicitLinkUrl || (isRawFileUrlLink ? rawFileUrl : '');
                const fileUrl = rawFileUrl;

                if (isLinkUrl) {
                  return (
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-xl">link</span>
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                            TAUTAN TERHUBUNG (KLIK URL DI BAWAH)
                          </span>
                          {targetUrl ? (
                            <a
                              href={targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1.5 truncate max-w-full"
                              title={`Buka ${targetUrl}`}
                            >
                              <span className="truncate">{targetUrl}</span>
                              <span className="material-symbols-outlined text-sm shrink-0">open_in_new</span>
                            </a>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 italic">
                              Tautan URL tidak tersedia
                            </span>
                          )}
                        </div>
                      </div>

                      {targetUrl && (
                        <a
                          href={targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shrink-0 transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base">open_in_new</span>
                          <span>Buka Tautan</span>
                        </a>
                      )}
                    </div>
                  );
                }

                // FILE TYPE DETECTION FOR PREVIEW
                const isPdf =
                  (selectedDoc.fileName && selectedDoc.fileName.toLowerCase().endsWith('.pdf')) ||
                  selectedDoc.articleData?.fileType === 'PDF' ||
                  (fileUrl && fileUrl.toLowerCase().includes('.pdf'));

                const isImage =
                  (selectedDoc.fileName && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(selectedDoc.fileName)) ||
                  (fileUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl));

                return (
                  <div className="space-y-3">
                    {/* File Header Bar & Download Button */}
                    <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#006194] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-xl">
                            {isPdf ? 'picture_as_pdf' : 'description'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {selectedDoc.fileName || selectedDoc.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Ukuran Berkas: {selectedDoc.fileSize}
                          </p>
                        </div>
                      </div>

                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          downloadDocumentFile({
                            title: selectedDoc.title,
                            category: selectedDoc.category,
                            author: selectedDoc.author,
                            date: selectedDoc.submitDate,
                            summary: selectedDoc.description || `Dokumen diajukan oleh ${selectedDoc.author} untuk divisi ${selectedDoc.subDivision}.`,
                            fileType: selectedDoc.articleData?.fileType || (isPdf ? 'PDF' : 'DOCX'),
                            fileUrl: fileUrl,
                            fileBlob: selectedDoc.fileBlob || selectedDoc.articleData?.fileBlob,
                            linkUrl: selectedDoc.articleData?.linkUrl
                          });
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#006194] text-white hover:bg-[#004b73] text-xs font-bold rounded-xl flex items-center justify-center gap-2 shrink-0 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Unduh Dokumen</span>
                      </a>
                    </div>

                    {/* In-Page Interactive File Content Preview */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/80 p-3 space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#006194] text-sm">visibility</span>
                          Pratinjau Berkas Dokumen
                        </span>
                        <span className="text-[10px] font-extrabold text-[#006194] bg-sky-100 px-2 py-0.5 rounded">
                          {selectedDoc.articleData?.fileType || (isPdf ? 'PDF' : 'DOCX')}
                        </span>
                      </div>

                      {isPdf && fileUrl ? (
                        <iframe
                          src={`${fileUrl}#toolbar=0`}
                          className="w-full h-[320px] border border-slate-200 rounded-lg shadow-inner bg-white"
                          title="Pratinjau Berkas PDF"
                        />
                      ) : isImage && fileUrl ? (
                        <div className="flex items-center justify-center p-3 bg-white rounded-lg border border-slate-200">
                          <img
                            src={fileUrl}
                            alt={selectedDoc.title}
                            className="max-h-[320px] max-w-full rounded object-contain"
                          />
                        </div>
                      ) : (
                        /* Document Reader View (Interactive Document Layout) */
                        <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-4 sm:p-5 space-y-4 text-slate-800 font-sans">
                          <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-3">
                            <div>
                              <span className="px-2 py-0.5 bg-[#006194]/10 text-[#006194] text-[10px] font-extrabold rounded uppercase">
                                {selectedDoc.category} • {selectedDoc.subDivision}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                                {selectedDoc.title}
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                              PENDING VERIFIKASI
                            </span>
                          </div>

                          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                            <div>
                              <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wide mb-1 flex items-center gap-1 text-[#006194]">
                                <span className="material-symbols-outlined text-sm">article</span>
                                Ringkasan Isi Dokumen
                              </h5>
                              <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-serif text-xs italic">
                                "{selectedDoc.description || `Dokumen panduan operasional diajukan oleh ${selectedDoc.author} untuk divisi ${selectedDoc.subDivision}.`}"
                              </p>
                            </div>

                            <div>
                              <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wide mb-1 flex items-center gap-1 text-[#006194]">
                                <span className="material-symbols-outlined text-sm">assignment</span>
                                Ketentuan Poin Utama Dokumen
                              </h5>
                              <div className="space-y-1.5 text-slate-600 pl-3 border-l-2 border-[#006194]/40 text-[11px]">
                                <p>1. Pengajuan dokumen ini ditujukan untuk standardisasi operasional divisi <strong>{selectedDoc.subDivision || selectedDoc.category}</strong>.</p>
                                <p>2. Setelah diverifikasi dan disetujui Manajer, dokumen ini akan otomatis terpublikasi di Knowledge Base.</p>
                                <p>3. Pengunggah dokumen: <strong>{selectedDoc.author}</strong> ({selectedDoc.submitDate}).</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Decision Section & Catatan Manajer */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Catatan Manajer
                </label>
                <textarea
                  rows={3}
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  disabled={!canApproveOrReject(selectedDoc)}
                  placeholder={canApproveOrReject(selectedDoc) ? "Masukkan catatan verifikasi manajer di sini (opsional)..." : "Anda hanya dapat memberikan catatan untuk dokumen divisi Anda."}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006194]/20 focus:border-[#006194] disabled:opacity-60"
                />

                {canApproveOrReject(selectedDoc) ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      Dokumen disetujui akan langsung dipublikasikan ke Knowledge Base divisi {selectedDoc.category}.
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={handleReject}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                        <span>Tolak</span>
                      </button>

                      <button
                        onClick={handleApprove}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-[#006194] text-white hover:bg-[#004b73] rounded-xl font-bold text-xs transition-all shadow-md shadow-[#006194]/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-base">check</span>
                        <span>Setujui & Publikasikan</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-900 text-xs font-medium">
                    <span className="material-symbols-outlined text-amber-600 shrink-0 text-lg">lock</span>
                    <span>
                      🔒 Dokumen ini diajukan untuk divisi <strong>{selectedDoc.category}</strong>. Hanya <strong>Manajer Divisi {selectedDoc.category}</strong> atau Admin yang berhak menyetujui atau menolak pengajuan ini.
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-24 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Semua Pengajuan Selesai Diverifikasi</h3>
                <p className="text-xs text-slate-400 mt-1">Tidak ada dokumen baru yang menunggu tindakan verifikasi saat ini.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 z-50 border border-slate-700/60 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          {!toast.includes('⚠️') && !toast.includes('❌') && !toast.toLowerCase().includes('salah') && !toast.toLowerCase().includes('gagal') ? (
            <span className="material-symbols-outlined text-emerald-400 text-2xl shrink-0">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0">info</span>
          )}
          <span className="text-sm font-bold leading-relaxed">{toast}</span>
        </div>
      )}
    </div>
  );
};
