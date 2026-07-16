"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth";

type ActionResult = { error?: string } | undefined;

async function requireUsuario() {
  const usuario = await getCurrentUsuario();
  if (!usuario) {
    redirect("/login");
  }
  return usuario;
}

export async function registrarParticipante(
  sessaoId: string,
  nomeJogador: string,
  buyInInicial: number
): Promise<ActionResult> {
  await requireUsuario();

  if (!nomeJogador.trim() || buyInInicial <= 0) {
    return { error: "Preencha nome e buy-in corretamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("participantes_sessao").insert({
    sessao_id: sessaoId,
    nome_jogador: nomeJogador.trim(),
    buy_in_inicial: buyInInicial,
  });

  if (error) {
    return { error: "Não foi possível registrar o participante." };
  }

  revalidatePath(`/poker/${sessaoId}`);
}

export async function registrarRebuy(
  sessaoId: string,
  participanteId: string,
  valor: number,
  tipo: "rebuy" | "addon" = "rebuy"
): Promise<ActionResult> {
  const usuario = await requireUsuario();

  if (valor <= 0) {
    return { error: "Valor inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rebuys").insert({
    participante_sessao_id: participanteId,
    valor,
    tipo,
    registrado_por: usuario.id,
  });

  if (error) {
    return { error: "Não foi possível registrar o rebuy." };
  }

  revalidatePath(`/poker/${sessaoId}`);
}

export async function cashoutParticipante(
  sessaoId: string,
  participanteId: string,
  valorCashout: number
): Promise<ActionResult> {
  await requireUsuario();

  if (valorCashout < 0) {
    return { error: "Valor inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("participantes_sessao")
    .update({ status: "cashout", valor_cashout: valorCashout })
    .eq("id", participanteId);

  if (error) {
    return { error: "Não foi possível registrar o cash-out." };
  }

  revalidatePath(`/poker/${sessaoId}`);
}

export async function eliminarParticipante(sessaoId: string, participanteId: string): Promise<ActionResult> {
  await requireUsuario();

  const supabase = await createClient();
  const { error } = await supabase
    .from("participantes_sessao")
    .update({ status: "eliminado" })
    .eq("id", participanteId);

  if (error) {
    return { error: "Não foi possível eliminar o participante." };
  }

  revalidatePath(`/poker/${sessaoId}`);
}

export async function encerrarSessao(sessaoId: string, rakeTotal: number): Promise<ActionResult> {
  await requireUsuario();

  if (rakeTotal < 0) {
    return { error: "Valor de rake inválido." };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("participantes_sessao")
    .select("id", { count: "exact", head: true })
    .eq("sessao_id", sessaoId)
    .eq("status", "ativo");

  if (count && count > 0) {
    return { error: "Ainda há participantes ativos. Resolva todos (cash-out ou eliminar) antes de encerrar." };
  }

  const { error } = await supabase
    .from("sessoes_poker")
    .update({ status: "encerrada", data_fim: new Date().toISOString(), rake_total: rakeTotal })
    .eq("id", sessaoId);

  if (error) {
    return { error: "Não foi possível encerrar a sessão." };
  }

  revalidatePath("/poker");
  redirect("/poker");
}
