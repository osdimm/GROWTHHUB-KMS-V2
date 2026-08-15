/**
 * Dynamic relative time utility function for KMS Growth Hub notifications & activities.
 */
export const getRelativeTime = (createdAt?: number, fallbackTime?: string): string => {
  if (!createdAt || typeof createdAt !== 'number' || createdAt < 1000000000000) {
    return fallbackTime || 'Baru saja';
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - createdAt);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Baru saja';
  }
  if (diffMin < 60) {
    return `${diffMin} menit yang lalu`;
  }
  if (diffHour < 24) {
    return `${diffHour} jam yang lalu`;
  }
  if (diffDay < 7) {
    return `${diffDay} hari yang lalu`;
  }

  const d = new Date(createdAt);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format local Date object to ISO string YYYY-MM-DD using local time (WIB-safe, no UTC timezone shift).
 */
function formatLocalDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Dipakai SEBELUM insert/upsert ke PostgreSQL / Supabase
 * Mengonversi "13 Agu 2026" / Date object -> "2026-08-13" (ISO YYYY-MM-DD).
 */
export function formatDateToISO(val?: string | Date | null): string {
  if (!val) {
    console.warn(`formatDateToISO: input kosong "${val}", fallback ke tanggal hari ini`);
    return formatLocalDateToISO(new Date());
  }

  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      console.warn(`formatDateToISO: Date object invalid "${val}", fallback ke tanggal hari ini`);
      return formatLocalDateToISO(new Date());
    }
    return formatLocalDateToISO(val);
  }

  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const parts = str.split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const monthMap: Record<string, string> = {
      'jan': '01', 'januari': '01',
      'feb': '02', 'februari': '02',
      'mar': '03', 'maret': '03',
      'apr': '04', 'april': '04',
      'mei': '05',
      'jun': '06', 'juni': '06',
      'jul': '07', 'juli': '07',
      'agu': '08', 'agst': '08', 'agustus': '08',
      'sep': '09', 'september': '09',
      'okt': '10', 'oktober': '10',
      'nov': '11', 'november': '11',
      'des': '12', 'desember': '12'
    };
    const month = monthMap[parts[1].toLowerCase()];
    const year = parts[2];
    if (month && year && /^\d{4}$/.test(year)) {
      return `${year}-${month}-${day}`;
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return formatLocalDateToISO(d);
  }

  console.warn(`formatDateToISO: gagal parse "${val}", fallback ke tanggal hari ini`);
  return formatLocalDateToISO(new Date());
}

/**
 * Dipakai SAAT RENDER TAMPILAN UI
 * Mengonversi ISO YYYY-MM-DD ("2026-08-13") -> Indonesian string ("13 Agu 2026").
 */
export function formatDateToIndonesian(val?: string | Date | null): string {
  if (!val) return '';
  let d: Date;
  if (val instanceof Date) {
    d = val;
  } else {
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, day] = str.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(str);
    }
  }

  if (isNaN(d.getTime())) return String(val);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export const calculateTimeAgo = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'Baru saja';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} hari lalu`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} bulan lalu`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} tahun lalu`;
};
