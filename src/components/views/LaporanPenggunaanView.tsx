import React, { useState } from 'react';
import { generateValidPDFBlob } from '../../utils/documentDownloader';
import { User, KnowledgeArticle, HandoverDoc, CategoryItem } from '../../types';

interface LaporanPenggunaanViewProps {
  globalSearch?: string;
  users?: User[];
  articles?: KnowledgeArticle[];
  handoverDocs?: HandoverDoc[];
  categories?: CategoryItem[];
}

export const LaporanPenggunaanView: React.FC<LaporanPenggunaanViewProps> = ({
  users = [],
  articles = [],
  handoverDocs = [],
  categories = []
}) => {
  const [periodTab, setPeriodTab] = useState<'Tahunan' | 'Bulanan' | 'Mingguan'>('Tahunan');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'Excel'>('PDF');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalUsersCount = users.length;
  const totalKbArticlesCount = articles.length;
  const totalHandoverDocsCount = handoverDocs.length;
  const totalUploadedDocs = totalKbArticlesCount + totalHandoverDocsCount;

  // Compute real views and downloads
  const totalViews = articles.reduce((acc, a) => acc + (a.views || 0), 0) + handoverDocs.reduce((acc, h) => acc + (h.views || 0), 0);
  const totalDownloads = articles.reduce((acc, a) => acc + (a.downloads || 0), 0) + handoverDocs.reduce((acc, h) => acc + (h.downloads || 0), 0);

  // Combine all uploaded documents (Articles + Handover Docs) for accurate download ranking
  const allDocs = [
    ...articles.map((a) => ({ ...a, docCategory: a.category })),
    ...handoverDocs.map((h) => ({ ...h, docCategory: h.division }))
  ];

  // Dynamic Popular Docs sorted strictly by: 1. Downloads (descending), 2. Views (descending)
  const popularDocs = [...allDocs]
    .sort((a, b) => {
      const diffDownloads = (b.downloads || 0) - (a.downloads || 0);
      if (diffDownloads !== 0) return diffDownloads;
      return (b.views || 0) - (a.views || 0);
    })
    .slice(0, 5)
    .map((doc, idx) => ({
      rank: idx + 1,
      title: doc.title,
      category: doc.docCategory || 'Umum',
      views: doc.views || 0,
      downloads: doc.downloads || 0
    }));

  const palette = [
    'bg-[#006194]', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600',
    'bg-rose-600', 'bg-sky-600', 'bg-teal-600', 'bg-purple-600',
    'bg-pink-600', 'bg-cyan-600', 'bg-blue-600', 'bg-violet-600',
    'bg-fuchsia-600', 'bg-lime-600', 'bg-orange-600', 'bg-teal-700'
  ];

  // Standard comprehensive list of all company divisions
  const ALL_DIVISIONS = [
    'Talent Development',
    'Learning Center',
    'Performance & Career',
    'Organization Development',
    'Corporate Culture',
    'Knowledge Management',
    'HR Operations',
    'Talent Acquisition',
    'Employee Relations',
    'Total Rewards',
    'People Analytics',
    'IT & Digital',
    'Finance & Accounting',
    'Legal & Compliance',
    'Marketing & PR',
    'General Affairs'
  ];

  // Combine categories prop and ALL_DIVISIONS to guarantee 100% complete division coverage
  const targetDivisions = Array.from(
    new Set([
      ...categories.map((c) => c.name),
      ...ALL_DIVISIONS
    ])
  );

  // Grand Total Access Activity (Views + Downloads combined)
  const grandTotalAccess = totalViews + totalDownloads;

  // Dynamic Division Access Stats (Views + Downloads combined into total access activity)
  const divisionStats = targetDivisions.map((divName, idx) => {
    const catArticles = articles.filter(
      (a) => a.category && a.category.trim().toLowerCase() === divName.trim().toLowerCase()
    );
    const catHandovers = handoverDocs.filter(
      (h) => h.division && h.division.trim().toLowerCase() === divName.trim().toLowerCase()
    );

    const catViews = catArticles.reduce((acc, a) => acc + (a.views || 0), 0) +
                     catHandovers.reduce((acc, h) => acc + (h.views || 0), 0);
    const catDownloads = catArticles.reduce((acc, a) => acc + (a.downloads || 0), 0) +
                         catHandovers.reduce((acc, h) => acc + (h.downloads || 0), 0);

    // Combined Views + Downloads total access metric
    const catTotalAccess = catViews + catDownloads;
    const docCount = catArticles.length + catHandovers.length;

    // Percentage of total platform access activity (0% if total access is 0)
    const progress = grandTotalAccess > 0
      ? Math.round((catTotalAccess / grandTotalAccess) * 100)
      : 0;

    return {
      name: divName,
      progress,
      count: `${catTotalAccess.toLocaleString('id-ID')} Akses (${catViews} Views, ${catDownloads} Unduhan)`,
      color: palette[idx % palette.length],
      catViews,
      catDownloads,
      catTotalAccess,
      docCount
    };
  }).sort((a, b) => b.catTotalAccess - a.catTotalAccess || b.docCount - a.docCount || a.name.localeCompare(b.name));

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmExport = () => {
    setShowExportModal(false);
    const dateStr = new Date().toISOString().split('T')[0];
    const nowFormatted = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const summaryMetrics = [
      { metric: 'Total Pengguna Terdaftar', value: `${totalUsersCount} Akun`, growth: '100% Aktif', status: 'Sesuai Database' },
      { metric: 'Total Dokumen Diunggah', value: `${totalUploadedDocs} Berkas`, growth: `${totalKbArticlesCount} KB / ${totalHandoverDocsCount} Handover`, status: 'Tersedia' },
      { metric: 'Total Akses / Views', value: `${totalViews.toLocaleString('id-ID')} Kali`, growth: '+18.4%', status: 'Aktif' },
      { metric: 'Estimasi Unduhan Berkas', value: `${totalDownloads.toLocaleString('id-ID')} Berkas`, growth: '+12.1%', status: 'Optimal' }
    ];

    if (exportFormat === 'Excel') {
      const filename = `Laporan_Analitik_KMS_GrowthHub_${periodTab.toLowerCase()}_${dateStr}.csv`;
      
      // UTF-8 BOM (\uFEFF) ensures Excel correctly recognizes characters and columns
      let csvContent = '\uFEFF';
      csvContent += `LAPORAN ANALITIK KMS GROWTH HUB\n`;
      csvContent += `Periode Laporan;,${periodTab}\n`;
      csvContent += `Tanggal Dihasilkan;,${nowFormatted}\n`;
      csvContent += `Diunduh Oleh;,Admin KMS Growth Hub\n\n`;

      csvContent += `1. RINGKASAN METRIK UTAMA PLATFORM\n`;
      csvContent += `Indikator Metrik;Nilai Terdata;Pertumbuhan;Status\n`;
      summaryMetrics.forEach((sm) => {
        csvContent += `"${sm.metric}";"${sm.value}";"${sm.growth}";"${sm.status}"\n`;
      });
      csvContent += `\n`;

      csvContent += `2. KONTRIBUSI AKSES PER DIVISI\n`;
      csvContent += `Nama Divisi;Jumlah Akses;Persentase Kontribusi;Tingkat Partisipasi\n`;
      divisionStats.forEach((d) => {
        csvContent += `"${d.name}";"${d.count}";${d.progress}%;${d.progress >= 80 ? 'Sangat Tinggi' : d.progress >= 70 ? 'Tinggi' : 'Sedang'}\n`;
      });
      csvContent += `\n`;

      csvContent += `3. PERINGKAT DOKUMEN PENGETAHUAN TERPOPULER\n`;
      csvContent += `Peringkat;Judul Dokumen;Kategori Divisi;Jumlah Views;Jumlah Unduhan\n`;
      popularDocs.forEach((doc) => {
        csvContent += `#${doc.rank};"${doc.title}";"${doc.category}";${doc.views};${doc.downloads}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerToast(`Laporan format Excel Spreadsheet ("${filename}") berhasil diunduh.`);
    } else {
      // PDF Format Export
      const filename = `Laporan_Analitik_KMS_GrowthHub_${periodTab.toLowerCase()}_${dateStr}.pdf`;

      // 1. Generate downloadable PDF document formatted structure
      const pdfSummary = `LAPORAN ANALITIK KONSUMSI PENGETAHUAN KMS GROWTH HUB 2026
Periode: ${periodTab} | Dihasilkan: ${nowFormatted}

METRIK UTAMA PLATFORM:
- Total Pengguna Terdaftar: ${totalUsersCount} Akun
- Total Dokumen Diunggah: ${totalUploadedDocs} Berkas (${totalKbArticlesCount} KB, ${totalHandoverDocsCount} Handover)
- Total Akses / Views: ${totalViews.toLocaleString('id-ID')} Kali
- Estimasi Unduhan Berkas: ${totalDownloads.toLocaleString('id-ID')} Berkas

DOKUMEN TERPOPULER:
${popularDocs.map((d) => `${d.rank}. ${d.title} (${d.views} views, ${d.downloads} unduhan)`).join('\n')}`;

      const blob = generateValidPDFBlob(
        `Laporan Analitik KMS (${periodTab})`,
        'Laporan Sistem',
        'Administrator KMS',
        nowFormatted,
        pdfSummary
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 2. Open printable formatted window for user to view / print directly as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${filename}</title>
              <style>
                body {
                  font-family: 'Segoe UI', Arial, sans-serif;
                  padding: 30px;
                  color: #0f172a;
                  line-height: 1.5;
                  background: #ffffff;
                }
                .header {
                  border-bottom: 3px solid #006194;
                  padding-bottom: 12px;
                  margin-bottom: 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
                }
                .brand {
                  font-size: 26px;
                  font-weight: 800;
                  color: #006194;
                  letter-spacing: -0.5px;
                }
                .sub-brand {
                  font-size: 13px;
                  color: #475569;
                  font-weight: 600;
                }
                .title-header {
                  font-size: 16px;
                  font-weight: 800;
                  margin-bottom: 16px;
                  color: #1e293b;
                  background: #f0fdf4;
                  border: 1px solid #bbf7d0;
                  padding: 10px 14px;
                  border-radius: 8px;
                }
                .meta-box {
                  background: #f8fafc;
                  border: 1px solid #cbd5e1;
                  padding: 12px 16px;
                  border-radius: 8px;
                  margin-bottom: 24px;
                  font-size: 12px;
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 8px;
                }
                .section-title {
                  font-size: 14px;
                  font-weight: 800;
                  color: #006194;
                  margin-top: 24px;
                  margin-bottom: 10px;
                  padding-bottom: 4px;
                  border-bottom: 1px solid #006194;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                  font-size: 11px;
                }
                table, th, td {
                  border: 1px solid #94a3b8;
                }
                th {
                  background: #e2e8f0;
                  color: #0f172a;
                  text-align: left;
                  padding: 8px 10px;
                  font-weight: 800;
                  text-transform: uppercase;
                  font-size: 10px;
                  letter-spacing: 0.5px;
                }
                td {
                  padding: 8px 10px;
                  color: #334155;
                }
                tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                .rank {
                  font-weight: 800;
                  color: #006194;
                  text-align: center;
                }
                .badge-green {
                  color: #15803d;
                  font-weight: 700;
                }
                .badge-[#006194] {
                  color: #006194;
                  font-weight: 700;
                }
                .footer {
                  margin-top: 30px;
                  border-top: 2px solid #e2e8f0;
                  padding-top: 12px;
                  font-size: 11px;
                  color: #64748b;
                  display: flex;
                  justify-content: space-between;
                }
                @media print {
                  body { padding: 15px; }
                  @page { margin: 1cm; size: A4; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="brand">Growth Hub</div>
                  <div class="sub-brand">Knowledge Management System (KMS)</div>
                </div>
                <div style="text-align: right; font-size: 11px; color: #475569;">
                  <div><strong>Status:</strong> Dokumen Resmi Terverifikasi</div>
                  <div><strong>Dihasilkan:</strong> ${nowFormatted}</div>
                </div>
              </div>

              <div class="title-header">
                Laporan Analitik Penggunaan KMS (${periodTab})
              </div>

              <div class="meta-box">
                <div><strong>Periode Evaluasi:</strong> ${periodTab} 2026</div>
                <div><strong>Format Dokumen:</strong> PDF Document (Lengkap)</div>
                <div><strong>Diunduh Oleh:</strong> Administrator KMS Growth Hub</div>
                <div><strong>Level Akses:</strong> Penuh (Admin Management)</div>
              </div>

              <!-- SECTION 1 -->
              <div class="section-title">1. Ringkasan Metrik Utama Platform</div>
              <table>
                <thead>
                  <tr>
                    <th>Indikator Metrik</th>
                    <th>Nilai Terdata</th>
                    <th>Pertumbuhan</th>
                    <th>Status Kinerja</th>
                  </tr>
                </thead>
                <tbody>
                  ${summaryMetrics.map((sm) => `
                    <tr>
                      <td><strong>${sm.metric}</strong></td>
                      <td>${sm.value}</td>
                      <td class="badge-green">${sm.growth}</td>
                      <td>${sm.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- SECTION 2 -->
              <div class="section-title">2. Kontribusi Akses Per Divisi</div>
              <table>
                <thead>
                  <tr>
                    <th>Nama Divisi / Departemen</th>
                    <th>Jumlah Akses Dokumen</th>
                    <th>Persentase Kontribusi</th>
                    <th>Tingkat Partisipasi</th>
                  </tr>
                </thead>
                <tbody>
                  ${divisionStats.map((d) => `
                    <tr>
                      <td><strong>${d.name}</strong></td>
                      <td>${d.count} kali</td>
                      <td><strong>${d.progress}%</strong></td>
                      <td>${d.progress >= 80 ? 'Sangat Tinggi' : d.progress >= 70 ? 'Tinggi' : 'Sedang'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- SECTION 3 -->
              <div class="section-title">3. Peringkat Dokumen Pengetahuan Terpopuler</div>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: center; width: 60px;">Peringkat</th>
                    <th>Judul Materi Pengetahuan</th>
                    <th>Kategori Divisi</th>
                    <th>Jumlah Views</th>
                    <th>Jumlah Unduhan</th>
                  </tr>
                </thead>
                <tbody>
                  ${popularDocs.map((doc) => `
                    <tr>
                      <td class="rank">#${doc.rank}</td>
                      <td><strong>${doc.title}</strong></td>
                      <td>${doc.category}</td>
                      <td>${doc.views} kali</td>
                      <td><strong>${doc.downloads} berkas</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">
                <div>Growth Hub KMS © 2026 — Laporan Analitik Pengetahuan Lengkap</div>
                <div>Diotorisasi oleh Administrator</div>
              </div>

              <script>
                setTimeout(() => {
                  window.print();
                }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      triggerToast(`Laporan format PDF ("${filename}") berhasil diunduh.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Penggunaan</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Metrik analitik penggunaan platform, retensi pengguna, dan konsumsi dokumen KMS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1">
            {(['Tahunan', 'Bulanan', 'Mingguan'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPeriodTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  periodTab === t
                    ? 'bg-[#006194] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Laporan</span>
          </button>
        </div>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Akses Sistem
            </span>
            <span className="p-2 bg-sky-100 text-[#006194] rounded-xl">
              <span className="material-symbols-outlined text-[24px]">touch_app</span>
            </span>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalViews.toLocaleString('id-ID')}</h3>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">visibility</span>
            <span>Akses dari {totalUploadedDocs} dokumen aktif ({periodTab})</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Estimasi Unduhan Berkas
            </span>
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <span className="material-symbols-outlined text-[24px]">download_for_offline</span>
            </span>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalDownloads.toLocaleString('id-ID')}</h3>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">description</span>
            <span>Dari {totalKbArticlesCount} materi Knowledge Base</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Division Progress & Popular Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Division Activity Progress Bar */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-slate-900">Aktivitas Akses Per Divisi</h3>
            <span className="text-[11px] font-extrabold text-[#006194] bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              {divisionStats.length} Divisi Terdata
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Persentase kontribusi total akses (Views + Unduhan disatukan) per departemen.</p>

          <div className="space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
            {divisionStats.map((d) => (
              <div key={d.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{d.name}</span>
                  <span className="font-semibold text-slate-500">
                    {d.count} — <span className="font-bold text-[#006194]">{d.progress}%</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.color} transition-all duration-1000`}
                    style={{ width: `${Math.max(d.progress, d.catTotalAccess > 0 ? 2 : 0)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Content Table */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Dokumen Paling Banyak Diunduh</h3>
            <p className="text-xs text-slate-500 mb-4">Peringkat materi pengetahuan berdasarkan frekuensi akses.</p>

            <div className="divide-y divide-slate-100">
              {popularDocs.map((doc) => (
                <div key={doc.rank} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-sky-100 text-[#006194] font-bold text-xs flex items-center justify-center shrink-0">
                      #{doc.rank}
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">{doc.category}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#006194]">{doc.downloads} Unduhan</p>
                    <p className="text-[10px] text-slate-400">{doc.views} Views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Export Laporan Analitik</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-5">
              Pilih format berkas yang ingin Anda unduh untuk periode <strong>{periodTab}</strong>:
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                onClick={() => setExportFormat('PDF')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all text-center ${
                  exportFormat === 'PDF'
                    ? 'border-[#006194] bg-sky-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-rose-600 text-[36px] block mx-auto mb-1">
                  picture_as_pdf
                </span>
                <span className="text-xs font-bold text-slate-800">PDF Document</span>
              </div>

              <div
                onClick={() => setExportFormat('Excel')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all text-center ${
                  exportFormat === 'Excel'
                    ? 'border-[#006194] bg-sky-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-emerald-600 text-[36px] block mx-auto mb-1">
                  table_chart
                </span>
                <span className="text-xs font-bold text-slate-800">Excel Spreadsheet</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleConfirmExport}
                className="px-5 py-2.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73]"
              >
                Download Laporan
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
