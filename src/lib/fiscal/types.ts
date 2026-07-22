export type ItemNfce = {
  descricao: string;
  ncm: string;
  cfop: string;
  unidadeComercial: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  cest?: string | null;
  csosn?: string | null;
  cst?: string | null;
  origem: number;
};

export type PagamentoNfce = {
  metodo: "dinheiro" | "cartao" | "pix";
  valor: number;
};

export type EmitirNfcePayload = {
  referenciaExterna: string;
  itens: ItemNfce[];
  pagamento: PagamentoNfce;
  valorTotal: number;
};

export type EmitirNfceResultado =
  | { ok: true; providerRef: string; chaveAcesso?: string; respostaCrua: unknown }
  | { ok: false; mensagem: string; respostaCrua?: unknown };

export interface FiscalProvider {
  emitir(payload: EmitirNfcePayload): Promise<EmitirNfceResultado>;
  consultar(providerRef: string): Promise<EmitirNfceResultado>;
  cancelar(providerRef: string, justificativa: string): Promise<{ ok: boolean; mensagem?: string }>;
}
