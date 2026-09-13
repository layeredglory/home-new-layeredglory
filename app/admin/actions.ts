"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, isAuthed, verifyPassword } from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const pw = String(formData.get("password") ?? "");
  if (!verifyPassword(pw)) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function setStatus(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!id || !["new", "checked", "done"].includes(status)) return;
  await ensureSchema();
  await sql()`UPDATE applications SET status = ${status} WHERE id = ${id}`;
  revalidatePath("/admin");
}

export async function removeApplication(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");
  const id = Number(formData.get("id"));
  if (!id) return;
  await ensureSchema();
  await sql()`DELETE FROM applications WHERE id = ${id}`;
  revalidatePath("/admin");
}
