import type { CloudinaryImageUploadView } from '@/types/cloudinaryUpload';

export function parseCloudinaryImageUploadResponse(
  value: unknown,
  cloudName: string,
): CloudinaryImageUploadView {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Cloudinary returned an invalid upload response.');
  }

  const response = value as Record<string, unknown>;
  if (response.resource_type !== 'image' || typeof response.public_id !== 'string' || !response.public_id.trim()) {
    throw new TypeError('Cloudinary response is missing valid image metadata.');
  }
  if (typeof response.secure_url !== 'string') {
    throw new TypeError('Cloudinary response is missing a secure image URL.');
  }

  const secureUrl = new URL(response.secure_url);
  if (
    secureUrl.protocol !== 'https:' ||
    secureUrl.hostname !== 'res.cloudinary.com' ||
    secureUrl.pathname.split('/')[1] !== cloudName
  ) {
    throw new TypeError('Cloudinary returned an unexpected image URL.');
  }

  return { publicId: response.public_id, secureUrl: secureUrl.toString() };
}
