export interface UploadSessionToken {
  accountId: string;
  generation: number;
}

type ImageAnalysisAttachment = {
  id: string;
  uploadStatus: 'uploading' | 'uploaded' | 'failed';
  imageUrl?: string;
};

export function isImageBatchReadyForAnalysis(attachments: readonly ImageAnalysisAttachment[]): boolean {
  return attachments.length > 0 && attachments.every(attachment =>
    attachment.uploadStatus === 'uploaded' && Boolean(attachment.imageUrl)
  );
}

export function isCurrentDnaAnalysisRequest(
  requestId: number,
  currentRequestId: number,
  requestedBatch: readonly ImageAnalysisAttachment[],
  currentBatch: readonly ImageAnalysisAttachment[],
): boolean {
  return requestId === currentRequestId && requestedBatch.length === currentBatch.length &&
    requestedBatch.every((attachment, index) => {
      const current = currentBatch[index];
      return current !== undefined && attachment.id === current.id &&
        attachment.uploadStatus === current.uploadStatus && attachment.imageUrl === current.imageUrl;
    });
}

export function getDnaAnalysisStatusAfterBatchChange(
  analysisStarted: boolean,
  attachmentCount: number,
  uploadFailed = false,
): 'idle' | 'loading' | 'error' {
  if (attachmentCount === 0) return 'idle';
  if (uploadFailed) return analysisStarted ? 'error' : 'idle';
  return analysisStarted ? 'loading' : 'idle';
}

export function isCurrentUploadSession(
  token: UploadSessionToken,
  currentAccountId: string | null,
  currentGeneration: number,
): boolean {
  return currentAccountId !== null && token.accountId === currentAccountId && token.generation === currentGeneration;
}

export function abortPendingUpload(controllers: Map<string, AbortController>, attachmentId: string): void {
  controllers.get(attachmentId)?.abort();
  controllers.delete(attachmentId);
}
