export interface CloudinaryUploadConfig {
  cloudName: string;
  uploadPreset: string;
}

export function getCloudinaryUploadConfig(): CloudinaryUploadConfig | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) return null;

  return { cloudName, uploadPreset };
}
