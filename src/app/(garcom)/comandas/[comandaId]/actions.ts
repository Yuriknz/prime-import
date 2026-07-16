"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth";

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
  valor: number
): Promise<ActionResult> {
  const usuario = await getCurrentUsuario();
  if (!usuario) {
    redirect("/login");
  }

  if (valor <= 0) {
    return { error: "Valor inválido." };
  }

  const supabase = await createClient();

  const { error: pagamentoError } = await supabase.from("pagamentos").insert({
    comanda_id: comandaId,
    valor,
    metodo,
    status: "pago",
    confirmado_em: new Date().toISOString(),
  });

  if (pagamentoError) {
    return { error: "Não foi possível registrar o pagamento." };
  }

  const { error: comandaError } = await supabase
    .from("comandas")
    .update({ status: "fechada", fechada_em: new Date().toISOString() })
    .eq("id", comandaId);

  if (comandaError) {
    return { error: "Pagamento registrado, mas não foi possível fechar a comanda. Avise o admin." };
  }

  revalidatePath("/mesas");
  redirect("/mesas");
}
