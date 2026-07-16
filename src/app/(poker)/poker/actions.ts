"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

type SessaoTipo = Database["public"]["Enums"]["sessao_tipo"];

type CriarSessaoResult = { sessaoId: string } | { error: string };

export async function criarSessao(dados: {
  nome: string;
  tipo: SessaoTipo;
  buyInValor: number;
  taxaCasaPercentual: number;
}): Promise<CriarSessaoResult> {
  const usuario = await getCurrentUsuario();
  if (!usuario) {
    redirect("/login");
  }

  if (!dados.nome.trim() || dados.buyInValor <= 0) {
    return { error: "Preencha nome e buy-in corretamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessoes_poker")
    .insert({
      nome: dados.nome.trim(),
      tipo: dados.tipo,
      buy_in_valor: dados.buyInValor,
      taxa_casa_percentual: dados.taxaCasaPercentual,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível criar a sessão. Tente novamente." };
  }

  return { sessaoId: data.id };
}
