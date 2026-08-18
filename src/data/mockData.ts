import {
  User,
  CategoryItem,
  ContentCategoryItem,
  KnowledgeArticle,
  HandoverDoc,
  ForumTopic,
  ActivityLog,
  PopularTopic,
  PendingDoc,
  AppNotification
} from '../types';

export const initialUsers: User[] = [
  {
    id: 'u-1786602532352-16-ks54',
    name: 'Prasetyo Ajiiii',
    email: 'prasetyo.aji@gmail.com',
    role: 'Admin',
    division: 'Administration',
    status: 'Aktif',
    joinDate: '13 Agu 2026',
    initials: 'PA',
    password: 'password123'
  },
  {
    id: 'u-admin-sys',
    name: 'Admin System',
    email: 'admin@growthhub.com',
    role: 'Admin',
    division: 'Administration',
    status: 'Aktif',
    joinDate: '01 Jan 2025',
    initials: 'AS',
    password: 'password123'
  },
  {
    id: 'u-admin',
    name: 'Dandi Pangestu',
    email: 'dandi.p@gmail.com',
    role: 'Admin',
    division: 'Administration',
    status: 'Aktif',
    joinDate: '12 Okt 2023',
    initials: 'DP',
    password: 'password123'
  },
  {
    id: 'u-manajer',
    name: 'Andi Darmawan',
    email: 'andi.darmawan@gmail.com',
    role: 'Manajer',
    division: 'Talent Development',
    status: 'Aktif',
    joinDate: '10 Mar 2023',
    initials: 'AD',
    password: 'password123'
  },
  {
    id: 'u-karyawan',
    name: 'Ananda Reva',
    email: 'ananda.reva@gmail.com',
    role: 'Karyawan',
    division: 'Graphic Design',
    status: 'Aktif',
    joinDate: '05 Jan 2024',
    initials: 'AR',
    password: 'password123'
  },
  {
    id: 'u-associate',
    name: 'Rahmawati',
    email: 'rahmawati@gmail.com',
    role: 'Associate',
    division: 'Public Relation',
    status: 'Aktif',
    joinDate: '12 Jan 2024',
    initials: 'RW',
    password: 'password123',
    mustChangePassword: true
  },
  {
    id: 'u-5',
    name: 'Ahmad Sulistyo',
    email: 'ahmad.s@gmail.com',
    role: 'Manajer',
    division: 'Graphic Design',
    status: 'Aktif',
    joinDate: '10 Mar 2023',
    initials: 'AS',
    password: 'password123'
  },
  {
    id: 'u-6',
    name: 'Diana Putri',
    email: 'diana.putri@gmail.com',
    role: 'Karyawan',
    division: 'Talent Acquisition',
    status: 'Aktif',
    joinDate: '18 Agu 2023',
    initials: 'DP',
    password: 'password123'
  },
  {
    id: 'u-7',
    name: 'Rizky Kurniawan',
    email: 'rizky.k@gmail.com',
    role: 'Admin',
    division: 'Social Media Officer',
    status: 'Aktif',
    joinDate: '01 Des 2023',
    initials: 'RK',
    password: 'password123'
  },
  {
    id: 'u-8',
    name: 'Siti Maryam',
    email: 'siti.maryam@gmail.com',
    role: 'Associate',
    division: 'Public Relation',
    status: 'Aktif',
    joinDate: '12 Jan 2024',
    initials: 'SM',
    password: 'password123'
  },
  {
    id: 'u-9',
    name: 'Budi Pratama',
    email: 'budi.p@gmail.com',
    role: 'Manajer',
    division: 'Administration',
    status: 'Aktif',
    joinDate: '15 Jul 2022',
    initials: 'BP',
    password: 'password123'
  },
  {
    id: 'u-10',
    name: 'Andi Nugraha',
    email: 'andi.n@gmail.com',
    role: 'Admin',
    division: 'Program Specialist',
    status: 'Aktif',
    joinDate: '04 Mei 2023',
    initials: 'AN',
    password: 'password123'
  },
  {
    id: 'u-11',
    name: 'Linda Wijaya',
    email: 'linda.w@gmail.com',
    role: 'Manajer',
    division: 'Talent Acquisition',
    status: 'Aktif',
    joinDate: '20 Sep 2023',
    initials: 'LW',
    password: 'password123'
  },
  {
    id: 'u-12',
    name: 'Dedi Santoso',
    email: 'dedi.s@gmail.com',
    role: 'Karyawan',
    division: 'Administration',
    status: 'Aktif',
    joinDate: '11 Nov 2023',
    initials: 'DS',
    password: 'password123'
  }
];

export const initialCategories: CategoryItem[] = [
  { id: 'cat-1', code: '01', name: 'Talent Acquisition', description: 'Proses rekrutmen, strategi pencarian kandidat, dan seleksi karyawan baru.', contentCount: 48, icon: 'person_search' },
  { id: 'cat-2', code: '02', name: 'Talent Development', description: 'Program pelatihan, pengembangan skill, dan perencanaan karir karyawan.', contentCount: 56, icon: 'psychology' },
  { id: 'cat-3', code: '03', name: 'Organizational Development', description: 'Struktur organisasi, budaya perusahaan, dan efektivitas kerja.', contentCount: 32, icon: 'account_tree' },
  { id: 'cat-4', code: '04', name: 'Employee Benefit', description: 'Kompensasi, asuransi kesehatan, cuti, dan kesejahteraan karyawan.', contentCount: 65, icon: 'featured_play_list' },
  { id: 'cat-5', code: '05', name: 'Administration', description: 'Dokumentasi operasional kantor, inventaris, dan surat-menyurat.', contentCount: 86, icon: 'inventory_2' },
  { id: 'cat-6', code: '06', name: 'Graphic Design', description: 'Aset visual, branding, logo, dan desain grafis promosi.', contentCount: 112, icon: 'palette' },
  { id: 'cat-7', code: '07', name: 'Copywriting', description: 'Penulisan naskah, caption, artikel, dan konten teks kreatif.', contentCount: 95, icon: 'edit_note' },
  { id: 'cat-8', code: '08', name: 'Content Coordinator', description: 'Manajemen jadwal konten, koordinasi tim kreatif, dan kalender editorial.', contentCount: 42, icon: 'calendar_month' },
  { id: 'cat-9', code: '09', name: 'Video Editor', description: 'Penyuntingan video, animasi, motion graphics, dan post-produksi.', contentCount: 78, icon: 'movie' },
  { id: 'cat-10', code: '10', name: 'Public Relation', description: 'Press release, kontak media, dan materi publikasi luar.', contentCount: 54, icon: 'campaign' },
  { id: 'cat-11', code: '11', name: 'Social Media Officer', description: 'Pengelolaan akun media sosial, engagement audiens, dan optimasi konten.', contentCount: 142, icon: 'share' },
  { id: 'cat-12', code: '12', name: 'Key Opinion Leader Coordinator', description: 'Manajemen influencer, kolaborasi KOL, dan partnership program.', contentCount: 29, icon: 'groups_3' },
  { id: 'cat-13', code: '13', name: 'Representative', description: 'Layanan pelanggan, perwakilan organisasi, dan penanganan keluhan.', contentCount: 37, icon: 'support_agent' },
  { id: 'cat-14', code: '14', name: 'Program Specialist', description: 'Pengembangan program khusus, monitoring efektivitas, dan evaluasi hasil.', contentCount: 21, icon: 'stars' },
  { id: 'cat-15', code: '15', name: 'Project Representative', description: 'Koordinasi antar departemen untuk proyek khusus dan reporting.', contentCount: 18, icon: 'assignment_ind' },
  { id: 'cat-16', code: '16', name: 'Community & Digital Marketing', description: 'Pemasaran digital, manajemen komunitas, dan kampanye iklan online.', contentCount: 124, icon: 'ads_click' }
];

export const initialContentCategories: ContentCategoryItem[] = [
  { id: 'cc-001', name: 'SOP & Panduan Kerja', description: 'Standard Operating Procedure dan alur kerja.', contentCount: 3 },
  { id: 'cc-002', name: 'Materi Pelatihan', description: 'Silabus, modul pembinaan, dan bahan ajar.', contentCount: 2 },
  { id: 'cc-003', name: 'Best Practices & Studi Kasus', description: 'Pengalaman lapangan dan studi kasus.', contentCount: 1 }
];

export const initialArticles: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'Panduan Produksi Konten Viral v2.1',
    division: 'Social Media Officer',
    category: 'Social Media Officer',
    contentCategoryId: 'cc-001',
    contentCategoryName: 'SOP & Panduan Kerja',
    summary: 'Standar operasional prosedur untuk pembuatan konten video pendek di platform TikTok & Reels.',
    author: 'Siti Maryam',
    date: '12 Okt 2023',
    fileType: 'DOCX',
    views: 1240
  },
  {
    id: 'kb-2',
    title: 'Growth Hub Brand Guidelines 2026',
    division: 'Graphic Design',
    category: 'Graphic Design',
    contentCategoryId: 'cc-001',
    contentCategoryName: 'SOP & Panduan Kerja',
    summary: 'Pedoman visual resmi termasuk palet warna, tipografi, dan aset tata letak.',
    author: 'Ahmad Sulistyo',
    date: '05 Jan 2026',
    fileType: 'PDF',
    views: 3120
  },
  {
    id: 'kb-3',
    title: 'Kebijakan Karir Content Creator',
    division: 'Talent Development',
    category: 'Talent Development',
    contentCategoryId: 'cc-002',
    contentCategoryName: 'Materi Pelatihan',
    summary: 'Dokumen rincian jenjang karir, KPI mingguan, dan evaluasi performa.',
    author: 'Andi Darmawan',
    date: '28 Des 2023',
    fileType: 'PDF',
    views: 890
  },
  {
    id: 'kb-4',
    title: 'Etika Berkomunikasi di Media Sosial',
    division: 'Public Relation',
    category: 'Public Relation',
    contentCategoryId: 'cc-003',
    contentCategoryName: 'Best Practices & Studi Kasus',
    summary: 'Protokol komunikasi eksternal dan manajemen krisis saat menghadapi keluhan publik.',
    author: 'Rina Amelia',
    date: '15 Feb 2026',
    fileType: 'PDF',
    views: 1890
  },
  {
    id: 'kb-5',
    title: 'Template Laporan Progres Konten',
    division: 'Administration',
    category: 'Administration',
    contentCategoryId: 'cc-001',
    contentCategoryName: 'SOP & Panduan Kerja',
    summary: 'Format standar administrasi untuk pelaporan data analitik konten setiap bulan.',
    author: 'Budi Pratama',
    date: '02 Mar 2026',
    fileType: 'DOCX',
    views: 2450
  },
  {
    id: 'kb-6',
    title: 'Visi Produk & Roadmap Kreatif 2026',
    division: 'Program Specialist',
    category: 'Program Specialist',
    contentCategoryId: 'cc-002',
    contentCategoryName: 'Materi Pelatihan',
    summary: 'Rencana jangka panjang Chief Product Officer untuk otomatisasi alur kerja media.',
    author: 'Andi Nugraha',
    date: '10 Jan 2026',
    fileType: 'PPTX',
    views: 1560
  }
];

export const initialHandoverDocs: HandoverDoc[] = [
  {
    id: 'ho-1',
    title: 'Laporan Koordinasi Vendor',
    fileType: 'DOCX',
    fileSize: '2.4 MB',
    rotationPeriod: 'Q4 2025',
    division: 'Talent Development',
    submitDate: '12 Des 2025',
    author: 'Budi Setiawan',
    authorRole: 'Manajer',
    description: 'Catatan serah terima daftar vendor pelatihan, perjanjian kerja sama (MOU), serta histori tagihan aktif.'
  },
  {
    id: 'ho-2',
    title: 'Panduan Operasional Q3',
    fileType: 'PDF',
    fileSize: '5.1 MB',
    rotationPeriod: 'Q3 2025',
    division: 'Organizational Development',
    submitDate: '28 Sep 2025',
    author: 'Sarah Jenkins',
    authorRole: 'Manajer',
    description: 'Ringkasan panduan evaluasi efektivitas struktur tim dan standar operasional penilaian kerja kuartal 3.'
  },
  {
    id: 'ho-3',
    title: 'Kontak Stakeholder Utama',
    fileType: 'XLSX',
    fileSize: '1.2 MB',
    rotationPeriod: 'Q4 2025',
    division: 'Public Relation',
    submitDate: '05 Jan 2025',
    author: 'Rina Pratama',
    authorRole: 'Karyawan',
    description: 'Daftar kontak eksternal partner media, perwakilan instansi, serta catatan hubungan pers aktif.'
  },
  {
    id: 'ho-4',
    title: 'Laporan Audit Internal Q2',
    fileType: 'PDF',
    fileSize: '3.8 MB',
    rotationPeriod: 'Q2 2025',
    division: 'Employee Benefit',
    submitDate: '15 Jun 2025',
    author: 'David Chen',
    authorRole: 'Karyawan',
    description: 'Hasil audit klaim asuransi kesehatan karyawan dan rekomendasi penyesuaian fasilitas kebugaran.'
  },
  {
    id: 'ho-5',
    title: 'Strategi Marketing 2025',
    fileType: 'PPTX',
    fileSize: '12.5 MB',
    rotationPeriod: 'Q4 2025',
    division: 'Community & Digital Marketing',
    submitDate: '20 Des 2025',
    author: 'Anita Wijaya',
    authorRole: 'Manajer'
  },
  {
    id: 'ho-6',
    title: 'Inventaris Aset Kantor',
    fileType: 'XLSX',
    fileSize: '0.8 MB',
    rotationPeriod: 'Q3 2025',
    division: 'Administration',
    submitDate: '05 Okt 2025',
    author: 'Budi Pratama',
    authorRole: 'Karyawan'
  },
  {
    id: 'ho-7',
    title: 'SOP Rekrutmen Karyawan',
    fileType: 'DOCX',
    fileSize: '1.5 MB',
    rotationPeriod: 'Q1 2025',
    division: 'Talent Acquisition',
    submitDate: '12 Jan 2025',
    author: 'Johnathan Doe',
    authorRole: 'Manajer'
  },
  {
    id: 'ho-8',
    title: 'Notulensi Rapat Direksi',
    fileType: 'PDF',
    fileSize: '2.1 MB',
    rotationPeriod: 'Q4 2025',
    division: 'Project Representative',
    submitDate: '28 Des 2025',
    author: 'Mike Kim',
    authorRole: 'Karyawan'
  },
  {
    id: 'ho-9',
    title: 'Laporan Pajak Tahunan',
    fileType: 'PDF',
    fileSize: '4.2 MB',
    rotationPeriod: 'Q1 2025',
    division: 'Program Specialist',
    submitDate: '02 Feb 2025',
    author: 'Alex Linden',
    authorRole: 'Karyawan'
  },
  {
    id: 'ho-10',
    title: 'Panduan Penggunaan Software',
    fileType: 'PDF',
    fileSize: '6.7 MB',
    rotationPeriod: 'Q3 2025',
    division: 'Content Coordinator',
    submitDate: '18 Sep 2025',
    author: 'Sarah Chen',
    authorRole: 'Karyawan'
  }
];

export const initialForumTopics: ForumTopic[] = [
  {
    id: 'ft-1',
    title: 'Strategi Implementasi ISO 9001',
    category: 'Administration',
    author: 'Budi Pratama (Administration)',
    authorRole: 'Manager Administration',
    authorInitials: 'BP',
    date: '24 Okt 2023',
    time: '09:15 WIB',
    views: 320,
    commentCount: 2,
    tags: ['ISO 9001', 'COMPLIANCE', 'ADMINISTRATION'],
    content: `Selamat pagi rekan-rekan. Kita akan segera memulai audit internal untuk ISO 9001. Mohon masing-masing divisi memastikan dokumentasi SOP sudah ter-update di Knowledge Base.\n\nApakah ada kendala teknis dalam pengunggahan file dokumen terbaru?`,
    comments: [
      {
        id: 'fc-1',
        author: 'Ani (Administration)',
        authorRole: 'Administration Specialist',
        initials: 'AA',
        content: 'Untuk divisi Administration, dokumen kelengkapan operasional sudah 90% siap. Tinggal menunggu verifikasi akhir.',
        timestamp: '24 Okt 2023, 10:20 WIB',
        likes: 4
      },
      {
        id: 'fc-2',
        author: 'Rian (IT Support)',
        authorRole: 'IT Support Specialist',
        initials: 'RS',
        content: 'Pak Budi, sistem perpustakaan dokumen sudah stabil kembali. Rekan-rekan sudah dapat mengunggah file revisi.',
        timestamp: '24 Okt 2023, 11:45 WIB',
        likes: 2
      }
    ]
  },
  {
    id: 'ft-2',
    title: 'Teknik Color Grading Video Pendek',
    category: 'Video Editor',
    author: 'Alex Rivera',
    authorRole: 'Video Editor Lead',
    date: '25 Okt 2023',
    time: '14:00 WIB',
    views: 142,
    commentCount: 2,
    tags: ['VIDEO', 'CREATIVE', 'EDITING'],
    content: `Halo rekan-rekan Editor! Seringkali kita merasa hasil video kurang 'pop' saat menggunakan setting standar. Kuncinya bukan hanya pada LUT, melainkan pada pemahaman Color Space dan koreksi primer yang tepat. Silakan cek panduan grading yang sudah saya unggah di Knowledge Base. Mari diskusikan workflow grading kalian di bawah ini!`,
    comments: [
      {
        id: 'fc-3',
        author: 'Sarah Klein',
        authorRole: 'Content Creator',
        initials: 'SK',
        content: 'Terima kasih insight-nya! Saya baru mencoba DaVinci Resolve nodes untuk grading. Apakah ada urutan node tertentu yang disarankan untuk footage S-Log3 agar hasilnya tidak muddy?',
        timestamp: '25 Okt 2023, 15:10 WIB',
        likes: 3
      },
      {
        id: 'fc-4',
        author: 'Alex Rivera',
        authorRole: 'Video Editor Lead',
        initials: 'AR',
        content: 'Untuk S-Log3, saya biasanya mulai dengan Noise Reduction di node pertama (jika low-light), lalu Primary Balance, baru CST ke Rec.709.',
        timestamp: '25 Okt 2023, 15:25 WIB',
        likes: 5
      }
    ]
  },
  {
    id: 'ft-3',
    title: 'Panduan Branding Creative & Visual Assets 2026',
    category: 'Graphic Design',
    author: 'Ahmad Sulistyo',
    authorRole: 'Lead Designer',
    date: '22 Okt 2023',
    time: '11:00 WIB',
    views: 210,
    commentCount: 0,
    tags: ['BRANDING', 'DESIGN', 'GRAPHIC'],
    content: 'Pembaruan panduan aset logo, warna, dan tipografi untuk kuartal mendatang di divisi Graphic Design.',
    comments: []
  },
  {
    id: 'ft-4',
    title: 'Optimasi Kampanye Social Media & Komunitas 2026',
    category: 'Community & Digital Marketing',
    author: 'Siti Maryam',
    authorRole: 'Digital Marketing Lead',
    date: '20 Okt 2023',
    time: '16:30 WIB',
    views: 450,
    commentCount: 0,
    tags: ['MARKETING', 'DIGITAL', 'COMMUNITY'],
    content: 'Penyesuaian strategi pilar konten bulanan dan keterlibatan komunitas online di seluruh channel digital KMS Growth Hub.',
    comments: []
  },
  {
    id: 'ft-5',
    title: 'SOP Pelaksanaan Onboarding & Pelatihan Karyawan',
    category: 'Talent Development',
    author: 'Andi Darmawan',
    authorRole: 'Manager Talent Development',
    date: '18 Nov 2023',
    time: '10:00 WIB',
    views: 285,
    commentCount: 0,
    tags: ['ONBOARDING', 'DEVELOPMENT', 'TALENT'],
    content: 'Diskusi pembaruan alur pembelajaran dan sertifikasi internal untuk mendukung pengembangan kompetensi karyawan baru.',
    comments: []
  },
  {
    id: 'ft-6',
    title: 'Standar Penulisan Content Brief & Copywriting',
    category: 'Copywriting',
    author: 'Ananda Reva',
    authorRole: 'Senior Copywriter',
    date: '02 Des 2023',
    time: '13:20 WIB',
    views: 198,
    commentCount: 0,
    tags: ['COPYWRITING', 'CONTENT', 'WRITING'],
    content: 'Panduan penyusunan headline dan tone-of-voice resmi KMS Growth Hub untuk seluruh materi publikasi.',
    comments: []
  }
];

export const initialActivities: ActivityLog[] = [
  {
    id: 'act-1',
    user: 'Alex Linden',
    department: 'Departemen IT',
    action: 'Memperbarui "Protokol Keamanan"',
    timeAgo: '2m yang lalu',
    status: 'BERHASIL',
    userInitials: 'AL'
  },
  {
    id: 'act-2',
    user: 'Sarah Chen',
    department: 'Manajemen Proyek',
    action: 'Menghapus "Aset Q1 Lama"',
    timeAgo: '15m yang lalu',
    status: 'TERTUNDA',
    userInitials: 'SC'
  },
  {
    id: 'act-3',
    user: 'Mike Kim',
    department: 'Operasi Bisnis',
    action: 'Unggah Massal (12 item)',
    timeAgo: '1j yang lalu',
    status: 'BERHASIL',
    userInitials: 'MK'
  }
];

export const popularTopicsList: PopularTopic[] = [
  { id: 1, rank: 1, title: 'Keamanan Onboarding', searches: 1240, trend: 'up' },
  { id: 2, rank: 2, title: 'Roadmap Proyek Q3', searches: 984, trend: 'up' },
  { id: 3, rank: 3, title: 'Dokumentasi API', searches: 856, trend: 'neutral' },
  { id: 4, rank: 4, title: 'Tunjangan HR 2024', searches: 742, trend: 'down' }
];

export const initialPendingDocs: PendingDoc[] = [
  {
    id: 'pv-1',
    title: 'Strategi Wawancara Kerja & Seleksi Talent Q3',
    category: 'Talent Acquisition',
    author: 'Ananda Reva',
    subDivision: 'Graphic Design',
    submitDate: '28 Jul 2026',
    submitTime: '10:45 AM',
    fileName: 'talent_acquisition_strategy.pdf',
    fileSize: '3.4 MB',
    description: 'Panduan mendalam mengenai metode evaluasi kandidat dan standar wawancara rekrutmen terbaru.',
    tags: ['Recruitment', 'Interview', 'Hiring'],
    status: 'Menunggu Verifikasi',
    articleData: {
      id: 'kb-approved-pv-1',
      title: 'Strategi Wawancara Kerja & Seleksi Talent Q3',
      division: 'Talent Acquisition',
      category: 'Talent Acquisition',
      contentCategoryId: 'cc-002',
      contentCategoryName: 'Materi Pelatihan',
      summary: 'Panduan mendalam mengenai metode evaluasi kandidat dan standar wawancara rekrutmen terbaru.',
      author: 'Ananda Reva',
      date: '28 Jul 2026',
      fileType: 'PDF',
      views: 1,
      contentType: 'file'
    }
  },
  {
    id: 'pv-2',
    title: 'Modul Pelatihan Kepemimpinan & Perencanaan Karir',
    category: 'Talent Development',
    author: 'Dandi Pangestu',
    subDivision: 'Administration',
    submitDate: '28 Jul 2026',
    submitTime: '09:15 AM',
    fileName: 'leadership_training_module.pdf',
    fileSize: '2.1 MB',
    description: 'Silabus komprehensif mengenai program pembinaan talenta internal dan indikator jenjang karir.',
    tags: ['Training', 'Career', 'Leadership'],
    status: 'Menunggu Verifikasi',
    articleData: {
      id: 'kb-approved-pv-2',
      title: 'Modul Pelatihan Kepemimpinan & Perencanaan Karir',
      division: 'Talent Development',
      category: 'Talent Development',
      contentCategoryId: 'cc-002',
      contentCategoryName: 'Materi Pelatihan',
      summary: 'Silabus komprehensif mengenai program pembinaan talenta internal dan indikator jenjang karir.',
      author: 'Dandi Pangestu',
      date: '28 Jul 2026',
      fileType: 'PDF',
      views: 1,
      contentType: 'file'
    }
  },
  {
    id: 'pv-3',
    title: 'SOP Penyuntingan Video Shorts & Reels 2026',
    category: 'Video Editor',
    author: 'Ananda Reva',
    subDivision: 'Video Editor',
    submitDate: '27 Jul 2026',
    submitTime: '04:30 PM',
    fileName: 'video_editing_sop.pdf',
    fileSize: '1.8 MB',
    description: 'Standar resolusi, alur animasi, dan rasio pemotongan klip video promosi.',
    tags: ['Video', 'Editing', 'Reels'],
    status: 'Menunggu Verifikasi',
    articleData: {
      id: 'kb-approved-pv-3',
      title: 'SOP Penyuntingan Video Shorts & Reels 2026',
      division: 'Video Editor',
      category: 'Video Editor',
      contentCategoryId: 'cc-001',
      contentCategoryName: 'SOP & Panduan Kerja',
      summary: 'Standar resolusi, alur animasi, dan rasio pemotongan klip video promosi.',
      author: 'Ananda Reva',
      date: '27 Jul 2026',
      fileType: 'PDF',
      views: 1,
      contentType: 'file'
    }
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Pengajuan Verifikasi Konten Baru',
    desc: 'Ananda Reva mengajukan "SOP Penyuntingan Video Shorts & Reels 2026" untuk diverifikasi Manajer.',
    time: '10m yang lalu',
    createdAt: Date.now() - 10 * 60 * 1000,
    type: 'pending',
    targetRoles: ['Manajer'],
    read: false
  },
  {
    id: 'notif-2',
    title: '✅ Konten Disetujui & Dipublikasikan',
    desc: 'Dokumen "Modul Pelatihan Kepemimpinan & Perencanaan Karir" yang Anda unggah telah DISETUJUI oleh Manajer (Andi Darmawan).',
    time: '25m yang lalu',
    createdAt: Date.now() - 25 * 60 * 1000,
    type: 'approved',
    targetUserName: 'Dandi Pangestu',
    targetUserId: 'u-admin',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Pengajuan Dalam Verifikasi',
    desc: 'Dokumen "SOP Penyuntingan Video Shorts & Reels 2026" yang Anda unggah sedang menunggu tinjauan Manajer.',
    time: '45m yang lalu',
    createdAt: Date.now() - 45 * 60 * 1000,
    type: 'info',
    targetUserName: 'Ananda Reva',
    targetUserId: 'u-karyawan',
    read: false
  },
  {
    id: 'notif-4',
    title: 'Sistem Knowledge Base',
    desc: 'Selamat datang di KMS Growth Hub. Selalu pastikan dokumen dan materi rotasi selalu diperbarui.',
    time: '1j yang lalu',
    createdAt: Date.now() - 60 * 60 * 1000,
    type: 'info',
    read: false
  }
];

