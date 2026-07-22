import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackLink } from "@/components/back-link";

// Brasil não observa horário de verão desde 2019 — offset fixo é seguro aqui.
const OFFSET_SAO_PAULO = "-03:00";

const diaFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

function diaSaoPaulo(iso: string) {
  return diaFormatter.format(new Date(iso));
}

function formatDiaLabel(diaIso: string) {
  const [ano, mes, dia] = diaIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function periodoPadrao() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { inicio: toIso(inicioMes), fim: toIso(hoje) };
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const defaults = periodoPadrao();
  const inicio = params.inicio || defaults.inicio;
  const fim = params.fim || defaults.fim;
  const inicioTs = `${inicio}T00:00:00${OFFSET_SAO_PAULO}`;
  const fimTs = `${fim}T23:59:59${OFFSET_SAO_PAULO}`;

  const supabase = await createClient();

  const [{ data: pagamentos }, { data: itens }] = await Promise.all([
    supabase
      .from("pagamentos")
      .select("valor, taxa_servico_valor, confirmado_em, comandas(garcom_id, usuarios(nome))")
      .eq("status", "pago")
      .gte("confirmado_em", inicioTs)
      .lte("confirmado_em", fimTs),
    supabase
      .from("itens_comanda")
      .select("quantidade, preco_unitario_no_momento, lancado_em, produtos(nome)")
      .eq("cancelado", false)
      .gte("lancado_em", inicioTs)
      .lte("lancado_em", fimTs),
  ]);

  const vendasPorDia = new Map<string, { total: number; qtd: number }>();
  let totalVendas = 0;
  for (const pagamento of pagamentos ?? []) {
    const dia = diaSaoPaulo(pagamento.confirmado_em!);
    const atual = vendasPorDia.get(dia) ?? { total: 0, qtd: 0 };
    atual.total += Number(pagamento.valor);
    atual.qtd += 1;
    vendasPorDia.set(dia, atual);
    totalVendas += Number(pagamento.valor);
  }
  const diasOrdenados = Array.from(vendasPorDia.entries()).sort(([a], [b]) => a.localeCompare(b));
  const qtdPagamentos = pagamentos?.length ?? 0;
  const ticketMedio = qtdPagamentos > 0 ? totalVendas / qtdPagamentos : 0;

  const porProduto = new Map<string, { quantidade: number; receita: number }>();
  for (const item of itens ?? []) {
    const nome = item.produtos?.nome ?? "—";
    const atual = porProduto.get(nome) ?? { quantidade: 0, receita: 0 };
    atual.quantidade += item.quantidade;
    atual.receita += item.quantidade * Number(item.preco_unitario_no_momento);
    porProduto.set(nome, atual);
  }
  const produtosMaisVendidos = Array.from(porProduto.entries())
    .sort(([, a], [, b]) => b.quantidade - a.quantidade)
    .slice(0, 10);

  const porGarcom = new Map<string, { vendas: number; comissao: number }>();
  for (const pagamento of pagamentos ?? []) {
    const nome = pagamento.comandas?.usuarios?.nome ?? "—";
    const atual = porGarcom.get(nome) ?? { vendas: 0, comissao: 0 };
    atual.vendas += Number(pagamento.valor);
    atual.comissao += Number(pagamento.taxa_servico_valor);
    porGarcom.set(nome, atual);
  }
  const comissoes = Array.from(porGarcom.entries()).sort(([, a], [, b]) => b.comissao - a.comissao);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <BackLink href="/admin" label="Início" />
      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="inicio">De</Label>
          <Input id="inicio" name="inicio" type="date" defaultValue={inicio} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fim">Até</Label>
          <Input id="fim" name="fim" type="date" defaultValue={fim} />
        </div>
        <Button type="submit">Filtrar</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Vendas no período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-money text-lg text-primary">{formatCurrency(totalVendas)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagamentos</p>
              <p className="font-money text-lg">{qtdPagamentos}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ticket médio</p>
              <p className="font-money text-lg">{formatCurrency(ticketMedio)}</p>
            </div>
          </div>
          {diasOrdenados.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diasOrdenados.map(([dia, dados]) => (
                  <TableRow key={dia}>
                    <TableCell>{formatDiaLabel(dia)}</TableCell>
                    <TableCell>{dados.qtd}</TableCell>
                    <TableCell className="font-money">{formatCurrency(dados.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {produtosMaisVendidos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item vendido no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosMaisVendidos.map(([nome, dados]) => (
                  <TableRow key={nome}>
                    <TableCell>{nome}</TableCell>
                    <TableCell>{dados.quantidade}</TableCell>
                    <TableCell className="font-money">{formatCurrency(dados.receita)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comissão por garçom</CardTitle>
        </CardHeader>
        <CardContent>
          {comissoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma comanda fechada no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Garçom</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoes.map(([nome, dados]) => (
                  <TableRow key={nome}>
                    <TableCell>{nome}</TableCell>
                    <TableCell className="font-money">{formatCurrency(dados.vendas)}</TableCell>
                    <TableCell className="font-money">{formatCurrency(dados.comissao)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
