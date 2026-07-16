import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackLink } from "@/components/back-link";
import { Cardapio } from "./cardapio";
import { FecharContaDialog } from "./fechar-conta-dialog";

const PEDIDO_STATUS_LABEL: Record<string, string> = {
  enviado: "Enviado",
  em_preparo: "Em preparo",
  pronto: "Pronto",
};

export default async function ComandaPage({
  params,
}: {
  params: Promise<{ comandaId: string }>;
}) {
  await requireRole(["garcom", "admin"]);
  const { comandaId } = await params;

  const supabase = await createClient();

  const { data: comanda } = await supabase
    .from("comandas")
    .select("id, status, mesas(numero)")
    .eq("id", comandaId)
    .single();

  if (!comanda) {
    notFound();
  }

  const [{ data: itens }, { data: produtos }] = await Promise.all([
    supabase
      .from("itens_comanda")
      .select("id, quantidade, preco_unitario_no_momento, produtos(nome), pedidos(status)")
      .eq("comanda_id", comandaId)
      .eq("cancelado", false)
      .order("lancado_em"),
    supabase
      .from("produtos")
      .select("id, nome, preco, categoria")
      .eq("disponivel", true)
      .order("categoria")
      .order("nome"),
  ]);

  const total = (itens ?? []).reduce(
    (sum, item) => sum + item.quantidade * Number(item.preco_unitario_no_momento),
    0
  );
  const aberta = comanda.status !== "fechada";

  return (
    <div className="flex flex-1 flex-col gap-4 pb-4">
      <div className="px-4 pt-4">
        <BackLink href="/mesas" label="Mesas" />
      </div>
      <Card className="mx-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Mesa {comanda.mesas?.numero}</CardTitle>
          <Badge variant={comanda.status === "aberta" ? "secondary" : "destructive"}>
            {comanda.status === "aberta" ? "Aberta" : comanda.status === "fechada" ? "Fechada" : "Aguardando pagamento"}
          </Badge>
        </CardHeader>
        <CardContent className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Total corrente</span>
          <span className="font-money text-xl text-primary">{formatCurrency(total)}</span>
        </CardContent>
      </Card>

      {aberta && <Cardapio comandaId={comandaId} produtos={produtos ?? []} />}

      {(itens?.length ?? 0) > 0 && (
        <div className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens!.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.produtos?.nome}</TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell className="font-money">
                    {formatCurrency(item.quantidade * Number(item.preco_unitario_no_momento))}
                  </TableCell>
                  <TableCell>{PEDIDO_STATUS_LABEL[item.pedidos?.status ?? ""] ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {aberta && total > 0 && (
        <div className="px-4">
          <FecharContaDialog comandaId={comandaId} total={total} />
        </div>
      )}
    </div>
  );
}
