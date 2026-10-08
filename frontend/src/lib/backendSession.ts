import { cookies } from 'next/headers';
import { getBackendServerUrl } from '@/config/backendConfig';
import { API_ENDPOINTS } from '@/constants/endpoints';
import { authResponseSchema } from '@/schemas/authSchema';
import type { AuthView } from '@/types/auth';

/** Server Component/Route Handler only. Never send the session token to client JS. */
export async function readBackendSession(): Promise<AuthView | null> {
  const token = (await cookies()).get('vistra_session')?.value;
  if (!token) return null;
  const url = new URL(API_ENDPOINTS.AUTH.ME, getBackendServerUrl());
  const response = await fetch(url, {
    headers: { Cookie: `vistra_session=${token}`, Accept: 'application/json' },
    cache: 'no-store',
    redirect: 'manual',
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Backend session check failed (${response.status})`);
  return authResponseSchema.parse(await response.json());
}

export async function requireBackendAdmin(): Promise<AuthView | null> {
  const session = await readBackendSession();
  return session?.user.role === 'admin' ? session : null;
}
