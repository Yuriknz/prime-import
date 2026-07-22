"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth";
import { emitirNotaFiscalComanda } from "@/lib/fiscal/emitir-nota";

type ActionResult = { error?: string } | undefined;

export async function enviarPedido(
  comandaId: string,
  itens: { produtoId: string; quantidade: number }[]
): Promise<ActionResult> {
  if (itens.length === 0) {
    return { error: "Carrinho vazio." };
  }

  const usuario = await getCurrentUsuario();
  if (!usuario) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("enviar_pedido", {
    p_comanda_id: comandaId,
    p_itens: itens.map((item) => ({ produto_id: item.produtoId, quantidade: item.quantidade })),
  });

  if (error) {
    return { error: "Não foi possível enviar o pedido. Tente novamente." };
  }

  revalidatePath(`/comandas/${comandaId}`);
}

export async function fecharComanda(
  comandaId: string,
  metodo: "dinheiro" | "cartao",
  valor: number,
  taxaServicoValor: number
): Promise<ActionResult> {
  const usuario = await getCurrentUsuario();
  if (!usuario) {
    redirect("/login");
  }

  if (valor <= 0 || taxaServicoValor < 0) {
    return { error: "Valor inválido." };
  }

  const supabase = await createClient();

  const { data: pagamento, error: pagamentoError } = await supabase
    .from("pagamentos")
    .insert({
      comanda_id: comandaId,
      valor,
      taxa_servico_valor: taxaServicoValor,
      metodo,
      status: "pago",
      confirmado_em: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (pagamentoError || !pagamento) {
    return { error: "Não foi possível registrar o pagamento." };
  }

  const { error: comandaError } = await supabase
    .from("comandas")
    .update({ status: "fechada", fechada_em: new Date().toISOString() })
    .eq("id", comandaId);

  if (comandaError) {
    return { error: "Pagamento registrado, mas não foi possível fechar a comanda. Avise o admin." };
  }

  // Contingência: a emissão da NFC-e nunca pode travar o fechamento da
  // comanda (ex: bar cheio, internet instável). Qualquer falha fica
  // registrada como pendente/erro em `notas_fiscais` para reprocessar depois.
  try {
    await Promise.race([
      emitirNotaFiscalComanda(supabase, comandaId, pagamento.id),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout_emissao_nfce")), 6000)),
    ]);
  } catch {
    // Garante que a nota fica reprocessável mesmo se o timeout estourou com a
    // linha presa em "processando" (upsert sobrescreve o status existente).
    await supabase
      .from("notas_fiscais")
      .upsert(
        { comanda_id: comandaId, pagamento_id: pagamento.id, status: "pendente", valor_total: valor },
        { onConflict: "comanda_id" }
      );
  }

  revalidatePath("/mesas");
  redirect("/mesas");
}
