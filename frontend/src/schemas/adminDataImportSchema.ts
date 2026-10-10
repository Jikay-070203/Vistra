import { list, number, oneOf, record, string } from '@/schemas/apiSchemaHelpers';
import { isAllowedPlaceImageUrl } from '@/schemas/adminDataImportRules';
import type { AdminImportBatch, AdminImportResult, AdminPlaceImageImportItem, AdminPlaceImportItem } from '@/types/adminSystemDataApi';

function strict(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
  const data = record(value, label);
  for (const key of Object.keys(data)) {
    if (!fields.includes(key)) throw new TypeError(`${label}.${key}: trường không được backend hỗ trợ.`);
  }
  return data;
}

function text(value: unknown, label: string, max: number, min = 1): string {
  const parsed = string(value, label).trim();
  const length = Array.from(parsed).length;
  if (length < min || length > max) throw new TypeError(`${label}: độ dài phải từ ${min} đến ${max} ký tự.`);
  return parsed;
}

function ranged(value: unknown, label: string, min: number, max: number, integer = false): number {
  const parsed = number(value, label);
  if (parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    throw new TypeError(`${label}: phải là ${integer ? 'số nguyên' : 'số'} từ ${min} đến ${max}.`);
  }
  return parsed;
}

function optionalText(data: Record<string, unknown>, key: string, label: string, max: number, min = 0) {
  return data[key] === undefined ? {} : { [key]: data[key] === null ? null : text(data[key], `${label}.${key}`, max, min) };
}

function https(value: unknown, label: string): string {
  const parsed = text(value, label, 2000);
  if (!isAllowedPlaceImageUrl(parsed)) {
    throw new TypeError(`${label}: URL phải là HTTPS trên upload.wikimedia.org, thumb.wikimedia.org hoặc Cloudinary.`);
  }
  return parsed;
}

function parsePlace(value: unknown, index: number): AdminPlaceImportItem {
  const label = `items[${index}]`;
  const data = strict(value, ['source_place_id', 'name', 'province', 'category', 'latitude', 'longitude', 'address', 'metadata', 'source_updated_at'], label);
  return {
    source_place_id: text(data.source_place_id, `${label}.source_place_id`, 120),
    name: text(data.name, `${label}.name`, 300),
    province: text(data.province, `${label}.province`, 120),
    category: text(data.category, `${label}.category`, 80),
    latitude: ranged(data.latitude, `${label}.latitude`, -90, 90),
    longitude: ranged(data.longitude, `${label}.longitude`, -180, 180),
    ...optionalText(data, 'address', label, 1000),
    ...optionalText(data, 'source_updated_at', label, 40),
    ...(data.metadata !== undefined && { metadata: record(data.metadata, `${label}.metadata`) }),
  };
}

function parseImage(value: unknown, index: number): AdminPlaceImageImportItem {
  const label = `items[${index}]`;
  const data = strict(value, ['source_image_id', 'source_place_id', 'image_url', 'thumbnail_url', 'license', 'author', 'width', 'height', 'file_size_bytes', 'sha256', 'metadata'], label);
  const dimensions: Partial<AdminPlaceImageImportItem> = {};
  for (const key of ['width', 'height', 'file_size_bytes'] as const) {
    if (data[key] !== undefined) dimensions[key] = data[key] === null ? null : ranged(data[key], `${label}.${key}`,
      key === 'file_size_bytes' ? 0 : 1, key === 'file_size_bytes' ? 10 * 1024 * 1024 : 50000, true);
  }
  return {
    source_image_id: text(data.source_image_id, `${label}.source_image_id`, 160),
    source_place_id: text(data.source_place_id, `${label}.source_place_id`, 120),
    image_url: https(data.image_url, `${label}.image_url`),
    ...(data.thumbnail_url !== undefined && { thumbnail_url: data.thumbnail_url === null ? null : https(data.thumbnail_url, `${label}.thumbnail_url`) }),
    ...optionalText(data, 'license', label, 160),
    ...optionalText(data, 'author', label, 300),
    ...optionalText(data, 'sha256', label, 128, 32),
    ...dimensions,
    ...(data.metadata !== undefined && { metadata: record(data.metadata, `${label}.metadata`) }),
  };
}

function batch<T>(value: unknown, parse: (value: unknown, index: number) => T, maxItems: number, maxBytes: number): AdminImportBatch<T> {
  const data = strict(value, ['source', 'batch_id', 'items'], 'batch');
  const items = list(data.items, 'items');
  if (items.length < 1 || items.length > maxItems) throw new TypeError(`items: mỗi batch cần từ 1 đến ${maxItems} mục.`);
  const parsed = { source: text(data.source, 'source', 80), batch_id: text(data.batch_id, 'batch_id', 120), items: items.map(parse) };
  if (new TextEncoder().encode(JSON.stringify(parsed)).length > maxBytes) throw new TypeError(`Batch vượt giới hạn ${maxBytes / 1024 / 1024} MB.`);
  return parsed;
}

export const adminPlacesImportSchema = { parse: (value: unknown) => batch(value, parsePlace, 100, 2 * 1024 * 1024) };
export const adminPlaceImagesImportSchema = { parse: (value: unknown) => batch(value, parseImage, 50, 1024 * 1024) };
export const adminImportResultSchema = {
  parse(value: unknown): AdminImportResult {
    const data = record(value, 'import response');
    return {
      batch_id: string(data.batch_id, 'import.batch_id'),
      status: oneOf(data.status, ['completed', 'completed_with_errors', 'already_processed'] as const, 'import.status'),
      received: ranged(data.received, 'import.received', 0, Number.MAX_SAFE_INTEGER, true),
      inserted: ranged(data.inserted, 'import.inserted', 0, Number.MAX_SAFE_INTEGER, true),
      updated: ranged(data.updated, 'import.updated', 0, Number.MAX_SAFE_INTEGER, true),
      skipped: ranged(data.skipped, 'import.skipped', 0, Number.MAX_SAFE_INTEGER, true),
      failed: ranged(data.failed, 'import.failed', 0, Number.MAX_SAFE_INTEGER, true),
      errors: list(data.errors, 'import.errors').map((value, index) => {
        const item = record(value, `import.errors[${index}]`);
        return { index: ranged(item.index, 'error.index', 0, Number.MAX_SAFE_INTEGER, true),
          code: string(item.code, 'error.code'), message: string(item.message, 'error.message') };
      }),
    };
  },
};
