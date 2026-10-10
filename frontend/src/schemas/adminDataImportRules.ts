export type AdminImportKind = 'places' | 'images';

export function createAdminImportTemplate(kind: AdminImportKind) {
  const template = kind === 'places'
    ? { source: 'nguon-du-lieu', items: [{ source_place_id: 'id-dia-diem-tu-nguon', name: 'Tên địa điểm', province: 'Tên tỉnh theo mapping backend', category: 'cafe', latitude: 21.0285, longitude: 105.8542 }] }
    : { source: 'wikimedia', items: [{ source_image_id: 'id-anh-tu-nguon', source_place_id: 'id-dia-diem-da-import', image_url: 'https://upload.wikimedia.org/thay-bang-anh-that.jpg' }] };

  return { ...template, batch_id: `${kind}-${crypto.randomUUID()}` };
}

export function isAllowedPlaceImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (
      host === 'upload.wikimedia.org' ||
      host === 'thumb.wikimedia.org' ||
      host === 'res.cloudinary.com' ||
      host.endsWith('.cloudinary.com')
    );
  } catch {
    return false;
  }
}
