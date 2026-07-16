"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME } from "@/lib/auth";

export type LoginState = { error?: string } | undefined;

const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou senha inválidos.",
};

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return { error: "Informe email e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: ERROR_MESSAGES[error?.message ?? ""] ?? "Não foi possível entrar. Tente novamente." };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("role, ativo")
    .eq("id", data.user.id)
    .single();

  if (!usuario || !usuario.ativo) {
    await supabase.auth.signOut();
    return { error: "Usuário sem acesso. Fale com o administrador." };
  }

  redirect(ROLE_HOME[usuario.role]);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
