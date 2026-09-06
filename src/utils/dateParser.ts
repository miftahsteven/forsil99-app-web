/**
 * Utility cerdas untuk mem-parsing berbagai format tanggal rilis:
 * - ISO string: "2026-09-09T19:09:00+07:00", "2026-09-09T09:19:00"
 * - Tanggal spasi: "2026-09-09 19:09:00", "2026-09-09 19:09"
 * - Bahasa Indonesia: "09 September 2026 19:09", "09 september 2026 1909"
 */

const MONTH_MAP: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agt: 8,
  agu: 8,
  september: 9,
  sep: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  desember: 12,
  des: 12,
};

export function parseFlexibleDate(input: string | null | undefined): Date | null {
  if (!input || typeof input !== 'string') return null;

  const raw = input.trim();
  if (!raw) return null;

  // 1. Coba parse jika format ISO murni (misal "2026-09-09T19:09:00+07:00")
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const directDate = new Date(raw);
    if (!isNaN(directDate.getTime())) {
      // Jika raw tidak memiliki timezone offset, asumsikan WIB (+07:00)
      if (!raw.includes('+') && !raw.includes('Z')) {
        const wibDate = new Date(`${raw.replace(' ', 'T')}+07:00`);
        if (!isNaN(wibDate.getTime())) return wibDate;
      }
      return directDate;
    }
  }

  // 2. Format Indonesia seperti: "09 September 2026 19:09" atau "09 september 2026 1909"
  try {
    const cleaned = raw.toLowerCase().replace(/[,.-]/g, ' ');
    const parts = cleaned.split(/\s+/).filter(Boolean);

    let day: number | null = null;
    let month: number | null = null;
    let year: number | null = null;
    let hour: number = 0;
    let minute: number = 0;
    let second: number = 0;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (MONTH_MAP[p]) {
        month = MONTH_MAP[p];
        continue;
      }
      // Deteksi Tahun (misal 2026)
      if (/^20\d{2}$/.test(p) && year === null) {
        year = parseInt(p, 10);
        continue;
      }
      if (/^\d{1,2}$/.test(p) && !p.includes(':')) {
        if (day === null) {
          day = parseInt(p, 10);
          continue;
        }
      }
      // Waktu berformat "19:09" atau "19:09:00"
      if (p.includes(':')) {
        const timeParts = p.split(':');
        hour = parseInt(timeParts[0] || '0', 10);
        minute = parseInt(timeParts[1] || '0', 10);
        second = parseInt(timeParts[2] || '0', 10);
        continue;
      }
      // Waktu 4 digit tanpa titik dua (misal "1909" -> jam 19 menit 09)
      if (/^[0-2]\d[0-5]\d$/.test(p)) {
        hour = parseInt(p.slice(0, 2), 10);
        minute = parseInt(p.slice(2, 4), 10);
        continue;
      }
    }

    if (day !== null && month !== null && year !== null) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const isoStr = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+07:00`;
      const parsed = new Date(isoStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Gagal mem-parsing format tanggal:', input, err);
  }

  return null;
}

/**
 * Memformat objek Date ke tampilan teks ramah pengguna: "09 September 2026 • 19:09 WIB"
 */
export function formatReleaseText(date: Date): string {
  if (!date || isNaN(date.getTime())) return '09 September • 19:09 WIB';

  // Format dalam timezone Asia/Jakarta (WIB)
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const find = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const day = find('day');
  const month = find('month');
  const hour = find('hour');
  const minute = find('minute');

  return `${day} ${month} • ${hour}:${minute} WIB`;
}
