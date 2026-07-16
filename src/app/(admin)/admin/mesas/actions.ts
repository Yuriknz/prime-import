"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

type ActionResult = { error?: string } | undefined;

export async function criarMesa(numero: number): Promise<ActionResult> {
  await requireRole(["admin"]);

  if (!Number.isInteger(numero) || numero <= 0) {
    return { error: "Número de mesa inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mesas").insert({ numero });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma mesa com esse número." };
    }
    return { error: "Não foi possível criar a mesa." };
  }

  revalidatePath("/admin/mesas");
}

export async function excluirMesa(mesaId: string): Promise<ActionResult> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { error } = await supabase.from("mesas").delete().eq("id", mesaId);

  if (error) {
    if (error.code === "23503") {
      return { error: "Mesa tem histórico de comandas, não pode ser removida." };
    }
    return { error: "Não foi possível remover a mesa." };
  }

  revalidatePath("/admin/mesas");
}
