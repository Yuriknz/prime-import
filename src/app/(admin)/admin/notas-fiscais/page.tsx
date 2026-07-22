import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackLink } from "@/components/back-link";
import { ReemitirButton } from "./reemitir-button";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  processando: "Processando",
  erro: "Erro",
};

export default async function NotasFiscaisPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: notas } = await supabase
    .from("notas_fiscais")
    .select("id, status, valor_total, tentativas, erro_mensagem, criada_em, comandas(mesa_id, mesas(numero))")
    .in("status", ["pendente", "processando", "erro"])
    .order("criada_em", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <BackLink href="/admin" label="Início" />
      <h2 className="font-heading text-xl">Notas fiscais pendentes</h2>

      {(notas?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma nota pendente ou com erro no momento.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mesa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tentativas</TableHead>
              <TableHead>Erro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notas?.map((nota) => (
              <TableRow key={nota.id}>
                <TableCell>{nota.comandas?.mesas?.numero ?? "—"}</TableCell>
                <TableCell className="font-money">{formatCurrency(Number(nota.valor_total))}</TableCell>
                <TableCell>
                  <Badge variant={nota.status === "erro" ? "destructive" : "secondary"}>
                    {STATUS_LABEL[nota.status] ?? nota.status}
                  </Badge>
                </TableCell>
                <TableCell>{nota.tentativas}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {nota.erro_mensagem ?? "—"}
                </TableCell>
                <TableCell>
                  <ReemitirButton notaId={nota.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
