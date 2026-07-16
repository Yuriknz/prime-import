import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NovaSessaoDialog } from "./nova-sessao-dialog";

const TIPO_LABEL: Record<string, string> = {
  torneio: "Torneio",
  cash_game: "Cash game",
};

export default async function PokerListaSessoesPage() {
  const supabase = await createClient();
  const { data: sessoes } = await supabase
    .from("sessoes_poker")
    .select("id, nome, tipo, buy_in_valor, status, criado_em")
    .order("status")
    .order("criado_em", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl">Sessões</h2>
        <NovaSessaoDialog />
      </div>

      {(sessoes?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma sessão criada ainda.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sessoes?.map((sessao) => (
          <Link key={sessao.id} href={`/poker/${sessao.id}`}>
            <Card className="p-4">
              <CardHeader className="flex-row items-center justify-between p-0">
                <CardTitle>{sessao.nome}</CardTitle>
                <Badge variant={sessao.status === "aberta" ? "default" : "secondary"}>
                  {sessao.status === "aberta" ? "Aberta" : "Encerrada"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-0 text-sm text-muted-foreground">
                <span>{TIPO_LABEL[sessao.tipo]} · buy-in {formatCurrency(sessao.buy_in_valor)}</span>
                <span>{formatDateTime(sessao.criado_em)}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
