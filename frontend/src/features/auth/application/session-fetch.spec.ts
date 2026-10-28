// src/features/auth/application/session-fetch.spec.ts

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../infrastructure/login.graphql", () => ({
  requestLoginWithPassword: vi.fn(),
}));

import { getAccessToken, isAuthenticated } from "./auth-session";
import { fetchWithSession } from "./session-fetch";
import { writeAuthSession } from "../infrastructure/auth-session-storage";

const replace = vi.fn();
const fetchMock = vi.fn<typeof fetch>();
function token(exp: number) {
  return `header.${btoa(JSON.stringify({ exp }))}.signature`;
}
function save(accessToken: string) {
  writeAuthSession({
    accountId: 13,
    accessToken,
    refreshToken: "test-refresh-token",
  });
}
function options(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

beforeEach(() => {
  const storage = new Map<string, string>();
  replace.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", {
    location: {
      pathname: "/ppt-risk-report",
      search: "?projectId=P-1",
      hash: "",
      replace,
    },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("PPT session expiry and rejected credentials", () => {
  it("accepts an unexpired session and clears expired or malformed cached sessions", () => {
    save(token(Date.now() / 1000 + 60));
    expect(isAuthenticated()).toBe(true);
    for (const stale of [
      token(Date.now() / 1000 - 1),
      "broken-token",
      "h.e30.s",
    ]) {
      save(stale);
      expect(isAuthenticated()).toBe(false);
      expect(getAccessToken()).toBeNull();
    }
  });

  it("redirects before sending expired credentials and preserves the return page", async () => {
    const stale = token(Date.now() / 1000 - 1);
    save(stale);
    await expect(fetchWithSession("/graphql", options(stale))).rejects.toThrow(
      "登录已过期",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith(
      "/login?reason=session-expired&redirect=%2Fppt-risk-report%3FprojectId%3DP-1",
    );
  });

  it.each([
    () => new Response("", { status: 401 }),
    () =>
      Response.json({
        errors: [
          { message: "JWT 认证失败", extensions: { code: "UNAUTHENTICATED" } },
        ],
      }),
    () =>
      Response.json({
        errors: [{ extensions: { code: "JWT_TOKEN_EXPIRED" } }],
      }),
  ])(
    "clears a server-rejected local session without retrying the request",
    async (response) => {
      const current = token(Date.now() / 1000 + 60);
      save(current);
      fetchMock.mockResolvedValue(response());
      await expect(
        fetchWithSession("/graphql", options(current)),
      ).rejects.toThrow("登录状态已失效");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBeNull();
      expect(replace).toHaveBeenCalledTimes(1);
    },
  );

  it("preserves forbidden/business responses, their readable body, and the session", async () => {
    const current = token(Date.now() / 1000 + 60);
    save(current);
    const body = { errors: [{ extensions: { code: "FORBIDDEN" } }] };
    fetchMock.mockResolvedValue(Response.json(body, { status: 403 }));
    const response = await fetchWithSession("/graphql", options(current));
    expect(await response.json()).toEqual(body);
    expect(getAccessToken()).toBe(current);
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not log out on network failures or public requests", async () => {
    const current = token(Date.now() / 1000 + 60);
    save(current);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(
      fetchWithSession("/graphql", options(current)),
    ).rejects.toThrow("Failed to fetch");
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));
    expect((await fetchWithSession("/public-resource")).status).toBe(401);
    expect(replace).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe(current);
  });

  it("ignores failures from an older session after a new login", async () => {
    const oldToken = token(Date.now() / 1000 + 60);
    const newToken = token(Date.now() / 1000 + 120);
    save(oldToken);
    fetchMock.mockImplementation(async () => {
      save(newToken);
      return new Response("", { status: 401 });
    });
    await fetchWithSession("/graphql", options(oldToken));
    expect(getAccessToken()).toBe(newToken);
    expect(replace).not.toHaveBeenCalled();
  });
});
