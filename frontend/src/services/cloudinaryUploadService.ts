import { getCloudinaryUploadConfig, type CloudinaryUploadConfig } from '@/config/cloudinaryConfig';
import { getCloudinaryImageUploadUrl } from '@/constants/externalEndpoints';
import { parseCloudinaryImageUploadResponse } from '@/schemas/cloudinaryUploadSchema';
import type { CloudinaryImageUploadView } from '@/types/cloudinaryUpload';

export async function uploadCloudinaryImage(
  file: File,
  config: CloudinaryUploadConfig | null = getCloudinaryUploadConfig(),
  signal?: AbortSignal,
): Promise<CloudinaryImageUploadView> {
  if (!config) {
    throw new Error('Thiếu cấu hình tải ảnh Cloudinary. Hãy thiết lập hai biến NEXT_PUBLIC_CLOUDINARY_* trong môi trường frontend.');
  }

  const body = new FormData();
  body.set('file', file);
  body.set('upload_preset', config.uploadPreset);

  let response: Response;
  try {
    response = await fetch(getCloudinaryImageUploadUrl(config.cloudName), {
      method: 'POST',
      body,
      credentials: 'omit',
      signal,
    });
  } catch {
    throw new Error('Không thể kết nối Cloudinary. Vui lòng thử tải ảnh lại.');
  }

  if (!response.ok) {
    throw new Error(`Cloudinary từ chối tải ảnh (HTTP ${response.status}). Hãy kiểm tra upload preset hoặc thử lại.`);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error('Cloudinary trả về phản hồi không hợp lệ.');
  }

  try {
    return parseCloudinaryImageUploadResponse(result, config.cloudName);
  } catch {
    throw new Error('Cloudinary trả về thông tin ảnh không hợp lệ.');
  }
}
