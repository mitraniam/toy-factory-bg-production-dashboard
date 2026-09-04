import { cookies } from "next/headers";

export const COOKIE_NAME = "toy_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  }
  return value;
}

async function sign(payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time comparison of two equal-length hex strings. */
function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Constant-time comparison for arbitrary strings (password check). */
function timingSafeEqualString(a: string, b: string) {
  const encoder = new TextEncoder();
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is missing.");
  return timingSafeEqualString(password, expected);
}

export async function makeAdminSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `admin:${expires}`;
  return `${payload}.${await sign(payload)}`;
}

/**
 * Verifies the signed session cookie using Web Crypto, so the same check runs
 * in the Node runtime (route handlers) and on the Edge (middleware).
 */
export async function verifyAdminSession(value?: string | null) {
  if (!value) return false;
  const match = value.match(/^admin:(\d+)\.([a-f0-9]{64})$/);
  if (!match) return false;
  const expires = Number(match[1]);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;

  const payload = `admin:${expires}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqualHex(match[2], expected);
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return verifyAdminSession(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function setAdminSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, await makeAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
