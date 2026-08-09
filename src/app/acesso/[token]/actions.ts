"use server";

import { redirect } from "next/navigation";
import { acceptWorkspaceInvite } from "@/lib/workspace-auth";

export async function activateWorkspaceAccessAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password !== confirmPassword) redirect(`/acesso/${encodeURIComponent(token)}?erro=${encodeURIComponent("As senhas não coincidem.")}`);
  try {
    await acceptWorkspaceInvite(token, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível ativar o acesso.";
    redirect(`/acesso/${encodeURIComponent(token)}?erro=${encodeURIComponent(message)}`);
  }
  redirect("/admin");
}
