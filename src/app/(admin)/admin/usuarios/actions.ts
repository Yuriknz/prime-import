"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];
type ActionResult = { error?: string } | undefined;

// createServiceClient() ignora RLS por completo — por isso requireRole(['admin'])
// é obrigatório aqui no início, não é só uma checagem de UX como nas outras telas.
export async function criarUsuario(dados: {
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
}): Promise<ActionResult> {
  await requireRole(["admin"]);

  if (!dados.nome.trim() || !dados.email.trim() || dados.senha.length < 6) {
    return { error: "Preencha nome, email e uma senha com pelo menos 6 caracteres." };
  }

  const service = createServiceClient();
  const { error } = await service.auth.admin.createUser({
    email: dados.email.trim(),
    password: dados.senha,
    email_confirm: true,
    user_metadata: { nome: dados.nome.trim(), role: dados.role },
  });

  if (error) {
    const mensagem = error.message.toLowerCase().includes("already")
      ? "Esse email já está cadastrado."
      : "Não foi possível criar o usuário.";
    return { error: mensagem };
  }

  revalidatePath("/admin/usuarios");
}

export async function atualizarUsuario(
  usuarioId: string,
  dados: { role?: UserRole; ativo?: boolean }
): Promise<ActionResult> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { error } = await supabase.from("usuarios").update(dados).eq("id", usuarioId);

  if (error) {
    return { error: "Não foi possível atualizar o usuário." };
  }

  revalidatePath("/admin/usuarios");
}
