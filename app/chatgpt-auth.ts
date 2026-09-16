import { cookies } from "next/headers";
import {verifySession,demoEnabled} from "@/lib/session";
// Cookie-based demo auth (replaces the Cloudflare "Sign in with ChatGPT" mock). No password — one click signs in.
export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };
const COOKIE = "ledger_user";
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw || !demoEnabled()) return null;
  try {
    const u = verifySession(raw);
    if (!u) return null;
    return { userId: u.userId, email: u.email, fullName: u.fullName || null, displayName: u.fullName || u.email };
  } catch {
    return null;
  }
}
export async function requireChatGPTUser(): Promise<ChatGPTUser | null> {
  return getChatGPTUser();
}
export function chatGPTSignInPath(): string { return "/"; }
export function chatGPTSignOutPath(): string { return "/"; }
