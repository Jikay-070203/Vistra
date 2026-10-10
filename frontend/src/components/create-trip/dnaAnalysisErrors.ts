export interface RejectedDnaSource {
  url: string;
  message: string;
}

export interface RejectedDnaAttachment extends RejectedDnaSource {
  name: string;
}

export function readRejectedDnaSources(responseData: unknown): RejectedDnaSource[] {
  if (typeof responseData !== 'object' || responseData === null || Array.isArray(responseData)) return [];
  const detail = (responseData as Record<string, unknown>).detail;
  if (typeof detail !== 'object' || detail === null || Array.isArray(detail)) return [];
  const sources = (detail as Record<string, unknown>).sources;
  if (!Array.isArray(sources)) return [];

  return sources.flatMap((value): RejectedDnaSource[] => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
    const source = value as Record<string, unknown>;
    if (source.status !== 'rejected' || typeof source.url !== 'string') return [];
    const message = source.error === 'IMAGE_TOO_LARGE'
      ? 'Ảnh vượt quá giới hạn 5 MB.'
      : source.error === 'UNSUPPORTED_IMAGE_TYPE'
        ? 'Định dạng ảnh không được hỗ trợ.'
        : source.error === 'IMAGE_UNAVAILABLE'
          ? 'Không thể truy cập ảnh từ Cloudinary.'
          : typeof source.error === 'string'
            ? `Máy chủ từ chối ảnh (${source.error}).`
            : 'Máy chủ từ chối ảnh này.';
    return [{ url: source.url, message }];
  });
}

export function matchRejectedDnaAttachments(
  responseData: unknown,
  attachments: Array<{ name: string; imageUrl?: string }>,
): RejectedDnaAttachment[] {
  const rejectedByUrl = new Map(readRejectedDnaSources(responseData).map(source => [source.url, source.message]));
  return attachments.flatMap(attachment => {
    const message = attachment.imageUrl ? rejectedByUrl.get(attachment.imageUrl) : undefined;
    return message && attachment.imageUrl ? [{ name: attachment.name, url: attachment.imageUrl, message }] : [];
  });
}
