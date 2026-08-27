import { getAccessToken, setAccessToken } from "../auth/tokenStore";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RefreshResponse {
  accessToken: string;
}

export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include"
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await res.json()) as RefreshResponse;
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, allowRetry = true): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });

  // A 401 here means the in-memory access token expired (15 min TTL). Try
  // exactly once to refresh via the httpOnly cookie and replay the original
  // request before giving up — this is what makes the short token lifetime
  // invisible to the user.
  if (res.status === 401 && allowRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response had no JSON body; fall back to statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { headers, credentials: "include" });
  if (!res.ok) {
    throw new ApiError(res.status, "Failed to download file");
  }
  return res.blob();
}

export { API_URL };
