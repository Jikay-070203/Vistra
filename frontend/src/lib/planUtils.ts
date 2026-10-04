/**
 * Utility functions for Plan displays and neutral code generation (FIX-14)
 */

export function getPlanDisplayCode(id: string): string {
  if (!id) return 'VST-00000';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(5, '0');
  return `VST-${code.slice(0, 5)}`;
}
