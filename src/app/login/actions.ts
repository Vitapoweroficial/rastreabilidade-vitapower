"use server";

import { redirect } from "next/navigation";
import { loginWorkspace, logoutWorkspace } from "@/lib/workspace-auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  try {
    await loginWorkspace(email, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível entrar.";
    redirect(`/login?erro=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}

export async function logoutAction() {
  await logoutWorkspace();
  redirect("/login");
}
