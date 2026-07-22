import type { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { getFiscalProvider } from "./index";
import type { EmitirNfcePayload, ItemNfce, PagamentoNfce } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Monta o payload a partir da comanda, chama o provedor fiscal e grava o
 * resultado em `notas_fiscais`. Nunca lança exceção: qualquer falha (produto
 * sem cadastro fiscal, rede, timeout, erro do provedor) fica registrada como
 * `erro`/`pendente` na própria linha, para reprocessar depois — o chamador
 * (fecharComanda) não pode travar por causa da nota fiscal.
 */
export async function emitirNotaFiscalComanda(
  supabase: SupabaseServerClient,
  comandaId: string,
  pagamentoId: string
): Promise<void> {
  try {
    const [{ data: itens }, { data: pagamento }] = await Promise.all([
      supabase
        .from("itens_comanda")
        .select(
          "quantidade, preco_unitario_no_momento, produtos(nome, produtos_fiscais(ncm, cfop, unidade_comercial, cest, csosn, cst, origem))"
        )
        .eq("comanda_id", comandaId)
        .eq("cancelado", false),
      supabase.from("pagamentos").select("metodo, valor").eq("id", pagamentoId).single(),
    ]);

    if (!pagamento) {
      await marcarPendente(supabase, comandaId, pagamentoId, 0, "Pagamento não encontrado ao montar a nota.");
      return;
    }

    const valorTotal = Number(pagamento.valor);
    const itemSemCadastroFiscal = (itens ?? []).find((item) => !item.produtos?.produtos_fiscais);
    if (!itens || itens.length === 0 || itemSemCadastroFiscal) {
      const mensagem = itemSemCadastroFiscal
        ? `Produto "${itemSemCadastroFiscal.produtos?.nome}" sem cadastro fiscal (NCM/CFOP).`
        : "Comanda sem itens para emitir nota.";
      await marcarPendente(supabase, comandaId, pagamentoId, valorTotal, mensagem);
      return;
    }

    const itensNfce: ItemNfce[] = itens.map((item) => {
      const fiscal = item.produtos!.produtos_fiscais!;
      return {
        descricao: item.produtos!.nome,
        ncm: fiscal.ncm,
        cfop: fiscal.cfop,
        unidadeComercial: fiscal.unidade_comercial,
        quantidade: item.quantidade,
        valorUnitario: Number(item.preco_unitario_no_momento),
        valorTotal: item.quantidade * Number(item.preco_unitario_no_momento),
        cest: fiscal.cest,
        csosn: fiscal.csosn,
        cst: fiscal.cst,
        origem: fiscal.origem,
      };
    });

    const pagamentoNfce: PagamentoNfce = {
      metodo: pagamento.metodo === "dinheiro" || pagamento.metodo === "cartao" ? pagamento.metodo : "pix",
      valor: valorTotal,
    };

    const payload: EmitirNfcePayload = {
      referenciaExterna: comandaId,
      itens: itensNfce,
      pagamento: pagamentoNfce,
      valorTotal,
    };

    await supabase.from("notas_fiscais").upsert(
      {
        comanda_id: comandaId,
        pagamento_id: pagamentoId,
        status: "processando",
        valor_total: valorTotal,
        payload_enviado: payload as unknown as Json,
        atualizada_em: new Date().toISOString(),
      },
      { onConflict: "comanda_id" }
    );

    const resultado = await getFiscalProvider().emitir(payload);

    if (resultado.ok) {
      await supabase
        .from("notas_fiscais")
        .update({
          status: resultado.chaveAcesso ? "autorizada" : "processando",
          provider_ref: resultado.providerRef,
          chave_acesso: resultado.chaveAcesso ?? null,
          resposta_provider: resultado.respostaCrua as unknown as Json,
          autorizada_em: resultado.chaveAcesso ? new Date().toISOString() : null,
          atualizada_em: new Date().toISOString(),
        })
        .eq("comanda_id", comandaId);
    } else {
      await supabase
        .from("notas_fiscais")
        .update({
          status: "erro",
          erro_mensagem: resultado.mensagem,
          resposta_provider: (resultado.respostaCrua ?? null) as unknown as Json,
          tentativas: 1,
          atualizada_em: new Date().toISOString(),
        })
        .eq("comanda_id", comandaId);
    }
  } catch (error) {
    await marcarPendente(
      supabase,
      comandaId,
      pagamentoId,
      0,
      error instanceof Error ? error.message : "Falha inesperada ao emitir a nota fiscal."
    );
  }
}

async function marcarPendente(
  supabase: SupabaseServerClient,
  comandaId: string,
  pagamentoId: string,
  valorTotal: number,
  mensagem: string
): Promise<void> {
  await supabase.from("notas_fiscais").upsert(
    {
      comanda_id: comandaId,
      pagamento_id: pagamentoId,
      status: "pendente",
      valor_total: valorTotal,
      erro_mensagem: mensagem,
      atualizada_em: new Date().toISOString(),
    },
    { onConflict: "comanda_id", ignoreDuplicates: false }
  );
}

export async function reemitirNotaFiscal(supabase: SupabaseServerClient, notaId: string): Promise<void> {
  const { data: nota } = await supabase
    .from("notas_fiscais")
    .select("comanda_id, pagamento_id, tentativas")
    .eq("id", notaId)
    .single();

  if (!nota || !nota.pagamento_id) return;

  await supabase
    .from("notas_fiscais")
    .update({ tentativas: nota.tentativas + 1 })
    .eq("id", notaId);

  await emitirNotaFiscalComanda(supabase, nota.comanda_id, nota.pagamento_id);
}
