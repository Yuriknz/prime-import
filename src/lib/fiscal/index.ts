import type { FiscalProvider } from "./types";
import { FocusNfeProvider } from "./focus-nfe";

/**
 * Troca de provedor fiscal é só trocar FISCAL_PROVIDER e implementar o adapter
 * correspondente (ex: PlugNotas) — nada além desta função muda.
 */
export function getFiscalProvider(): FiscalProvider {
  const provider = process.env.FISCAL_PROVIDER ?? "focus_nfe";

  switch (provider) {
    case "focus_nfe":
      return new FocusNfeProvider();
    default:
      throw new Error(`Provedor fiscal desconhecido: ${provider}`);
  }
}

export type { EmitirNfcePayload, EmitirNfceResultado, FiscalProvider, ItemNfce, PagamentoNfce } from "./types";
