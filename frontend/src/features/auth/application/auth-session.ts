// src/features/auth/application/auth-session.ts

import {
  type AuthSession,
  readAuthSession,
  removeAuthSession,
  writeAuthSession,
} from "../infrastructure/auth-session-storage";
import { requestLoginWithPassword } from "../infrastructure/login.graphql";

export type { AuthSession };

export type LoginWithPasswordParams = Readonly<{
  loginName: string;
  loginPassword: string;
}>;

export async function loginWithPassword(
  params: LoginWithPasswordParams,
): Promise<AuthSession> {
  const session = await requestLoginWithPassword({
    loginName: params.loginName.trim(),
    loginPassword: params.loginPassword,
  });

  writeAuthSession(session);

  return session;
}

export function getAuthSession(): AuthSession | null {
  return readAuthSession();
}

export function getAccessToken(): string | null {
  return readAuthSession()?.accessToken ?? null;
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  // This only detects stale local sessions; the server still verifies the JWT signature.
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT");
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(
      atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")),
    );
    if (
      typeof claims === "object" &&
      claims !== null &&
      "exp" in claims &&
      typeof claims.exp === "number" &&
      Number.isFinite(claims.exp) &&
      claims.exp * 1000 > Date.now()
    )
      return true;
  } catch {
    // Malformed cached credentials require a new login too.
  }

  clearAuthSession();
  return false;
}

export function redirectToLogin(): void {
  clearAuthSession();
  if (window.location.pathname === "/login") return;
  const returnPath =
    window.location.pathname + window.location.search + window.location.hash;
  window.location.replace(
    `/login?reason=session-expired&redirect=${encodeURIComponent(returnPath)}`,
  );
}

export function clearAuthSession(): void {
  removeAuthSession();
}
