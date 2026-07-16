import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/back-link";
import { ParticipantesLista, type Participante } from "./participantes-lista";
import { RegistrarParticipanteForm } from "./registrar-participante-form";
import { EncerrarSessaoDialog } from "./encerrar-sessao-dialog";

const TIPO_LABEL: Record<string, string> = {
  torneio: "Torneio",
  cash_game: "Cash game",
};

export default async function SessaoPokerPage({
  params,
}: {
  params: Promise<{ sessaoId: string }>;
}) {
  await requireRole(["operador_poker", "admin"]);
  const { sessaoId } = await params;

  const supabase = await createClient();

  const { data: sessao } = await supabase.from("sessoes_poker").select("*").eq("id", sessaoId).single();

  if (!sessao) {
    notFound();
  }

  const { data: participantesRaw } = await supabase
    .from("participantes_sessao")
    .select("id, nome_jogador, buy_in_inicial, status, valor_cashout, rebuys(valor)")
    .eq("sessao_id", sessaoId)
    .order("criado_em");

  const participantes: Participante[] = (participantesRaw ?? []).map((participante) => {
    const totalRebuys = (participante.rebuys ?? []).reduce((sum, rebuy) => sum + Number(rebuy.valor), 0);
    return {
      id: participante.id,
      nomeJogador: participante.nome_jogador,
      buyInInicial: Number(participante.buy_in_inicial),
      totalRebuys,
      totalInvestido: Number(participante.buy_in_inicial) + totalRebuys,
      status: participante.status,
      valorCashout: participante.valor_cashout !== null ? Number(participante.valor_cashout) : null,
    };
  });

  const totalArrecadado = participantes.reduce((sum, participante) => sum + participante.totalInvestido, 0);
  const totalPago = participantes
    .filter((participante) => participante.status === "cashout")
    .reduce((sum, participante) => sum + (participante.valorCashout ?? 0), 0);
  const hasAtivo = participantes.some((participante) => participante.status === "ativo");
  const aberta = sessao.status === "aberta";
  const rakeSugerido =
    aberta && sessao.tipo === "torneio" ? totalArrecadado * (Number(sessao.taxa_casa_percentual) / 100) : null;
  const premioRealEstimado = rakeSugerido !== null ? totalArrecadado - rakeSugerido : null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <BackLink href="/poker" label="Sessões" />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{sessao.nome}</CardTitle>
          <Badge variant={aberta ? "default" : "secondary"}>{aberta ? "Aberta" : "Encerrada"}</Badge>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            {TIPO_LABEL[sessao.tipo]} · buy-in {formatCurrency(sessao.buy_in_valor)}
            {sessao.tipo === "torneio" && ` · taxa da casa ${sessao.taxa_casa_percentual}%`}
          </p>
          <div className="flex items-baseline justify-between pt-2 text-foreground">
            <span>Total arrecadado</span>
            <span className="font-money text-lg text-primary">{formatCurrency(totalArrecadado)}</span>
          </div>
          {premioRealEstimado !== null && (
            <div className="flex items-baseline justify-between text-foreground">
              <span>Prêmio real estimado</span>
              <span className="font-money text-lg">{formatCurrency(premioRealEstimado)}</span>
            </div>
          )}
          {premioRealEstimado !== null && (
            <p className="text-xs">
              (rake de {sessao.taxa_casa_percentual}% já descontado — antes do add-on, ajusta ao vivo)
            </p>
          )}
          {!aberta && sessao.rake_total !== null && (
            <div className="flex items-baseline justify-between">
              <span>Rake</span>
              <span className="font-money">{formatCurrency(sessao.rake_total)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {aberta && <RegistrarParticipanteForm sessaoId={sessaoId} buyInPadrao={Number(sessao.buy_in_valor)} />}

      <ParticipantesLista
        sessaoId={sessaoId}
        participantes={participantes}
        buyInPadrao={Number(sessao.buy_in_valor)}
        sessaoAberta={aberta}
      />

      {aberta && !hasAtivo && participantes.length > 0 && (
        <EncerrarSessaoDialog
          sessaoId={sessaoId}
          tipo={sessao.tipo}
          totalArrecadado={totalArrecadado}
          taxaCasaPercentual={Number(sessao.taxa_casa_percentual)}
          totalPago={totalPago}
        />
      )}
    </div>
  );
}
