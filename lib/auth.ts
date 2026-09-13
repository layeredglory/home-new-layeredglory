import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "lg_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

function secret(): string {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
  return s;
}

function sign(exp: number): string {
  const mac = createHmac("sha256", secret()).update(String(exp)).digest("hex");
  return `${exp}.${mac}`;
}

export function verifyPassword(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(secret());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const exp = Date.now() + MAX_AGE * 1000;
  (await cookies()).set(COOKIE, sign(exp), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [expStr, mac] = raw.split(".");
  const exp = Number(expStr);
  if (!exp || exp < Date.now() || !mac) return false;
  try {
    const expected = createHmac("sha256", secret()).update(expStr).digest("hex");
    return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch {
    return false;
  }
}
