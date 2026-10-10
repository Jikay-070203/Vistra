export interface UploadSessionToken {
  accountId: string;
  generation: number;
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
