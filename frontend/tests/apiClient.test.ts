import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "../src/api/client";
import { getAccessToken, setAccessToken } from "../src/auth/tokenStore";

describe("apiFetch 401 -> refresh -> retry-once", () => {
  beforeEach(() => {
    setAccessToken("expired-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it("silently refreshes on a 401 and replays the original request exactly once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "fresh-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ ok: boolean }>("/api/projects");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBe("fresh-token");

    const retryCall = fetchMock.mock.calls[2];
    const retryHeaders = retryCall[1].headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("throws the original 401 if the refresh attempt also fails, without looping", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Invalid or expired access token" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/projects")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not attempt a refresh for a non-401 error", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ error: "Not found" }), { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/projects/missing")).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
