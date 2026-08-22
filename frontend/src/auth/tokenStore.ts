// The access token lives only in this module-level variable, never in
// localStorage or sessionStorage: anything an XSS payload could read back
// out (web storage, cookies without httpOnly) is a stolen-session risk. A
// plain JS variable disappears on refresh/tab-close, which is why the
// refresh cookie exists to re-establish a session silently on load.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
