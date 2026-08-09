"use server";

import { redirect } from "next/navigation";
import { loginWorkspace, logoutWorkspace } from "@/lib/workspace-auth";
import { assertWorkspaceLoginAllowed, recordWorkspaceLoginAttempt } from "@/lib/workspace-login-security";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    await assertWorkspaceLoginAllowed(email);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acesso temporariamente bloqueado.";
    redirect(`/login?erro=${encodeURIComponent(message)}`);
  }

  try {
    await loginWorkspace(email, password);
    await recordWorkspaceLoginAttempt(email, true).catch(() => undefined);
  } catch (error) {
    await recordWorkspaceLoginAttempt(email, false).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Não foi possível entrar.";
    redirect(`/login?erro=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}

export async function logoutAction() {
  await logoutWorkspace();
  redirect("/login");
}
