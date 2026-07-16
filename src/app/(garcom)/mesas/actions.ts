"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth";

type EntrarNaMesaResult = { comandaId: string } | { error: string };

/**
 * Abre uma comanda nova na mesa, ou — se outro garçom acabou de abrir a mesma
 * mesa (índice único uniq_comanda_mesa_aberta barra o insert com 23505) —
 * entra na comanda já aberta em vez de falhar.
 */
export async function entrarNaMesa(mesaId: string): Promise<EntrarNaMesaResult> {
  const usuario = await getCurrentUsuario();
  if (!usuario) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: comanda, error } = await supabase
    .from("comandas")
    .insert({ mesa_id: mesaId, garcom_id: usuario.id })
    .select("id")
    .single();

  if (!error && comanda) {
    return { comandaId: comanda.id };
  }

  if (error?.code === "23505") {
    const { data: existente } = await supabase
      .from("comandas")
      .select("id")
      .eq("mesa_id", mesaId)
      .neq("status", "fechada")
      .single();

    if (existente) {
      return { comandaId: existente.id };
    }
  }

  return { error: "Não foi possível abrir a mesa. Tente novamente." };
}
