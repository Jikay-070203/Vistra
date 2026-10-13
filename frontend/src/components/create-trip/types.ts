export interface LocalImageAttachment {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  uploadStatus: 'uploading' | 'uploaded' | 'failed';
  cloudinaryPublicId?: string;
  imageUrl?: string;
  uploadError?: string;
  analysisError?: string;
}

export type PaceType = 'relaxed' | 'normal' | 'busy';
