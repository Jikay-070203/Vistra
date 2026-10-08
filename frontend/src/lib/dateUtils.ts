/**
 * Date formatting and parsing utility for VISTRA
 * Enforces dd/MM/yyyy HH:mm format in Asia/Ho_Chi_Minh timezone (FIX-13)
 */

export function formatDateTimeVN(val: Date | string | number | undefined | null): string {
  if (!val) return 'Chưa rõ';

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return 'Chưa rõ';
    return formatParts(val);
  }

  if (typeof val === 'number') {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Chưa rõ';
    return formatParts(d);
  }

  const str = String(val).trim();
  if (!str) return 'Chưa rõ';

  // Already standard: dd/MM/yyyy HH:mm
  if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  // Already date only: dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return `${str} 00:00`;
  }

  // Legacy: "Hôm nay lúc HH:mm" or "Hôm nay HH:mm"
  const todayMatch = str.match(/^Hôm nay(?:\s+lúc)?\s+(\d{1,2}:\d{2})/i);
  if (todayMatch) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const time = todayMatch[1].padStart(5, '0');
    return `${dd}/${mm}/${yyyy} ${time}`;
  }

  // Legacy: "Đã chốt ngày dd/MM/yyyy"
  const chotMatch = str.match(/^Đã chốt ngày\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (chotMatch) {
    const parts = chotMatch[1].split('/');
    const dd = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const yyyy = parts[2];
    return `${dd}/${mm}/${yyyy} 12:00`;
  }

  // Malformed smashed string: "23:34:112/10/2026" or "HH:mm:ssdd/MM/yyyy"
  const smashedMatch = str.match(/^(\d{2}:\d{2})(?::\d{2})?(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (smashedMatch) {
    const [, time, d, m, y] = smashedMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${time}`;
  }

  // Try standard Date parsing (e.g. ISO strings)
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatParts(parsed);
  }

  return 'Chưa rõ';
}

function formatParts(d: Date): string {
  // Use Intl to ensure Asia/Ho_Chi_Minh timezone
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }
}

export function getNowFormattedVN(): string {
  return formatParts(new Date());
}

/** Travel dates are calendar dates; UTC avoids local DST changing the trip length. */
export function endDateFromDuration(startDate: string | null, durationDays: number): string | null {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !Number.isInteger(durationDays) || durationDays < 1) return null;
  const date = new Date(startDate + 'T00:00:00.000Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== startDate) return null;
  date.setUTCDate(date.getUTCDate() + durationDays - 1);
  return date.toISOString().slice(0, 10);
}
