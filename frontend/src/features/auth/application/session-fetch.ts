// src/features/auth/application/session-fetch.ts

import {
  getAccessToken,
  isAuthenticated,
  redirectToLogin,
} from "./auth-session";

const authCodes = new Set([
  "UNAUTHENTICATED",
  "TOKEN_INVALID",
  "TOKEN_INVALID_AFTER_REFRESH",
  "JWT_TOKEN_EXPIRED",
  "JWT_TOKEN_INVALID",
  "JWT_TOKEN_NOT_BEFORE",
  "JWT_TOKEN_VERIFICATION_FAILED",
  "JWT_AUTHENTICATION_FAILED",
]);

function isAuthError(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  if (
    "code" in value &&
    typeof value.code === "string" &&
    authCodes.has(value.code)
  )
    return true;
  if ("extensions" in value && isAuthError(value.extensions)) return true;
  return (
    "errors" in value &&
    Array.isArray(value.errors) &&
    value.errors.some(isAuthError)
  );
}

/** Handle expired local credentials for legacy GraphQL and REST calls without retrying writes. */
export async function fetchWithSession(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  const token = getAccessToken();
  const usesLocalSession =
    Boolean(token) && headers.get("Authorization") === `Bearer ${token}`;

  if (usesLocalSession && !isAuthenticated()) {
    redirectToLogin();
    throw new Error("登录已过期，请重新登录。");
  }

  const response = await fetch(input, init);
  // A late response from the old session must not invalidate a newer login.
  if (!usesLocalSession || getAccessToken() !== token) return response;

  let rejected = response.status === 401;
  if (
    !rejected &&
    response.headers.get("Content-Type")?.includes("application/json")
  ) {
    const payload: unknown = await response
      .clone()
      .json()
      .catch(() => null);
    rejected = isAuthError(payload);
  }
  if (rejected && getAccessToken() === token) {
    redirectToLogin();
    throw new Error("登录状态已失效，请重新登录。");
  }
  return response;
}
