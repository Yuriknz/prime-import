import type { EmitirNfcePayload, EmitirNfceResultado, FiscalProvider, PagamentoNfce } from "./types";

const BASE_URL_HOMOLOGACAO = "https://homologacao.focusnfe.com.br";
const BASE_URL_PRODUCAO = "https://api.focusnfe.com.br";

const TIMEOUT_MS = 8000;

// Tabela de meios de pagamento do SEFAZ (mesma usada pela Focus NFe).
const FORMA_PAGAMENTO: Record<PagamentoNfce["metodo"], string> = {
  dinheiro: "01",
  cartao: "03",
  pix: "17",
};

function baseUrl(): string {
  return process.env.FOCUS_NFE_AMBIENTE === "producao" ? BASE_URL_PRODUCAO : BASE_URL_HOMOLOGACAO;
}

function token(): string {
  const value = process.env.FOCUS_NFE_TOKEN;
  if (!value) {
    throw new Error("FOCUS_NFE_TOKEN não configurado.");
  }
  return value;
}

function montarPayloadFocusNfe(payload: EmitirNfcePayload) {
  return {
    natureza_operacao: "Venda",
    presenca_comprador: "1",
    modalidade_frete: "9",
    items: payload.itens.map((item, index) => ({
      numero_item: index + 1,
      codigo_produto: item.descricao,
      descricao: item.descricao,
      cfop: item.cfop,
      codigo_ncm: item.ncm,
      unidade_comercial: item.unidadeComercial,
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: item.valorUnitario,
      valor_bruto: item.valorTotal,
      unidade_tributavel: item.unidadeComercial,
      quantidade_tributavel: item.quantidade,
      valor_unitario_tributavel: item.valorUnitario,
      icms_origem: item.origem,
      icms_situacao_tributaria: item.csosn ?? item.cst,
      informacoes_adicionais_produto: item.cest ? `CEST: ${item.cest}` : undefined,
    })),
    formas_pagamento: [
      {
        forma_pagamento: FORMA_PAGAMENTO[payload.pagamento.metodo],
        valor_pagamento: payload.pagamento.valor,
      },
    ],
  };
}

export class FocusNfeProvider implements FiscalProvider {
  async emitir(payload: EmitirNfcePayload): Promise<EmitirNfceResultado> {
    try {
      const response = await fetch(`${baseUrl()}/v2/nfce?ref=${encodeURIComponent(payload.referenciaExterna)}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${token()}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(montarPayloadFocusNfe(payload)),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const corpo = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          mensagem: corpo?.mensagem ?? `Focus NFe retornou HTTP ${response.status}.`,
          respostaCrua: corpo,
        };
      }

      // Emissão de NFC-e via Focus NFe é assíncrona: status inicial vem como
      // "processando_autorizacao" — a autorização real chega por consulta ou webhook.
      return {
        ok: true,
        providerRef: corpo?.ref ?? payload.referenciaExterna,
        chaveAcesso: corpo?.chave_nfe ?? undefined,
        respostaCrua: corpo,
      };
    } catch (error) {
      return {
        ok: false,
        mensagem: error instanceof Error ? error.message : "Falha desconhecida ao chamar a Focus NFe.",
      };
    }
  }

  async consultar(providerRef: string): Promise<EmitirNfceResultado> {
    try {
      const response = await fetch(`${baseUrl()}/v2/nfce/${encodeURIComponent(providerRef)}`, {
        headers: { Authorization: `Basic ${Buffer.from(`${token()}:`).toString("base64")}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const corpo = await response.json().catch(() => null);

      if (!response.ok) {
        return { ok: false, mensagem: corpo?.mensagem ?? `Focus NFe retornou HTTP ${response.status}.`, respostaCrua: corpo };
      }

      if (corpo?.status === "autorizado") {
        return { ok: true, providerRef, chaveAcesso: corpo?.chave_nfe, respostaCrua: corpo };
      }

      return { ok: false, mensagem: corpo?.mensagem_sefaz ?? corpo?.status ?? "Ainda não autorizada.", respostaCrua: corpo };
    } catch (error) {
      return { ok: false, mensagem: error instanceof Error ? error.message : "Falha ao consultar a Focus NFe." };
    }
  }

  async cancelar(providerRef: string, justificativa: string): Promise<{ ok: boolean; mensagem?: string }> {
    try {
      const response = await fetch(`${baseUrl()}/v2/nfce/${encodeURIComponent(providerRef)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(`${token()}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ justificativa }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        const corpo = await response.json().catch(() => null);
        return { ok: false, mensagem: corpo?.mensagem ?? `Focus NFe retornou HTTP ${response.status}.` };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, mensagem: error instanceof Error ? error.message : "Falha ao cancelar na Focus NFe." };
    }
  }
}
