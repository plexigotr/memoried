import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access")?.value;

  return Boolean(verifySessionToken(token, "admin", "admin"));
}

export async function hasEditSession(code: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(`edit_access_${code}`)?.value;

  return Boolean(verifySessionToken(token, "edit", code));
}

export async function getAccountPhone() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_phone")?.value;

  return verifySessionToken(token, "account")?.subject || null;
}
