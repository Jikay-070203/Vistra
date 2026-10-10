export const MAX_TRIP_IMAGES = 3;
export const MAX_TRIP_IMAGE_BYTES = 5 * 1024 * 1024;

export interface ImageFileLike {
  name: string;
  type: string;
  size: number;
}

export type ImageRejectionReason = 'unsupported_type' | 'too_large' | 'too_many';

export interface ImageSelectionResult<T extends ImageFileLike> {
  accepted: T[];
  rejected: Array<{ file: T; reason: ImageRejectionReason }>;
}

export function validateImageSelection<T extends ImageFileLike>(
  currentAttachmentCount: number,
  files: readonly T[],
): ImageSelectionResult<T> {
  const accepted: T[] = [];
  const rejected: ImageSelectionResult<T>['rejected'] = [];

  for (const file of files) {
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      rejected.push({ file, reason: 'unsupported_type' });
    } else if (file.size > MAX_TRIP_IMAGE_BYTES) {
      rejected.push({ file, reason: 'too_large' });
    } else {
      accepted.push(file);
    }
  }

  if (currentAttachmentCount + accepted.length > MAX_TRIP_IMAGES) {
    return {
      accepted: [],
      rejected: [
        ...rejected,
        ...accepted.map((file) => ({ file, reason: 'too_many' as const })),
      ],
    };
  }

  return { accepted, rejected };
}
