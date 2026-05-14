const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAgeSeconds}`,
    "path=/",
    "SameSite=Lax",
  ].join("; ");
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function getRefreshToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export function setTokens({ access_token, refresh_token, expires_in }: TokenPair): void {
  setCookie(ACCESS_TOKEN_COOKIE, access_token, expires_in);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
}

export function clearTokens(): void {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
