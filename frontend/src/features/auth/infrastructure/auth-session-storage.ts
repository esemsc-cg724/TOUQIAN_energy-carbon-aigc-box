// src/features/auth/infrastructure/auth-session-storage.ts

export const AUTH_SESSION_STORAGE_KEY = 'aigc.auth.session.v1';

export type AuthSession = Readonly<{
  accessToken: string;
  accountId: number;
  refreshToken: string;
  role?: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function toAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value)) {
    return null;
  }

  const { accessToken, accountId, refreshToken, role } = value;

  if (
    typeof accessToken !== 'string' ||
    !accessToken ||
    typeof refreshToken !== 'string' ||
    !refreshToken ||
    typeof accountId !== 'number'
  ) {
    return null;
  }

  return {
    accessToken,
    accountId,
    refreshToken,
    ...(typeof role === 'string' && role ? { role } : {}),
  };
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readAuthSession(): AuthSession | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    return toAuthSession(JSON.parse(rawSession));
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable in restricted browsers.
  }
}

export function removeAuthSession(): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in restricted browsers.
  }
}
