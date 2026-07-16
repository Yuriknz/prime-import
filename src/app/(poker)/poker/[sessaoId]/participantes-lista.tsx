"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { cashoutParticipante, eliminarParticipante, registrarRebuy } from "./actions";

export type Participante = {
  id: string;
  nomeJogador: string;
  buyInInicial: number;
  totalRebuys: number;
  totalInvestido: number;
  status: "ativo" | "eliminado" | "cashout";
  valorCashout: number | null;
};

const STATUS_LABEL: Record<Participante["status"], string> = {
  ativo: "Ativo",
  eliminado: "Eliminado",
  cashout: "Cash-out",
};

const STATUS_VARIANT: Record<Participante["status"], "default" | "destructive" | "secondary"> = {
  ativo: "default",
  eliminado: "destructive",
  cashout: "secondary",
};

function ValorDialog({
  triggerLabel,
  triggerVariant,
  title,
  defaultValue,
  onConfirm,
}: {
  triggerLabel: ReactNode;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  title: string;
  defaultValue: number;
  onConfirm: (valor: number) => Promise<{ error?: string } | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirmar() {
    startTransition(async () => {
      const result = await onConfirm(valor);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={triggerVariant} />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="valor-dialog">Valor</Label>
          <Input
            id="valor-dialog"
            type="number"
            min={0}
            step="0.01"
            value={valor}
            onChange={(event) => setValor(Number(event.target.value) || 0)}
          />
        </div>
        <DialogFooter>
          <Button disabled={isPending} onClick={handleConfirmar}>
            {isPending ? "Salvando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EliminarButton({ sessaoId, participanteId }: { sessaoId: string; participanteId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarParticipante(sessaoId, participanteId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="destructive" disabled={isPending} onClick={handleEliminar}>
      Eliminar
    </Button>
  );
}

export function ParticipantesLista({
  sessaoId,
  participantes,
  buyInPadrao,
  sessaoAberta,
}: {
  sessaoId: string;
  participantes: Participante[];
  buyInPadrao: number;
  sessaoAberta: boolean;
}) {
  if (participantes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum participante registrado ainda.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Jogador</TableHead>
          <TableHead>Buy-in</TableHead>
          <TableHead>Rebuys</TableHead>
          <TableHead>Investido</TableHead>
          <TableHead>Status</TableHead>
          {sessaoAberta && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {participantes.map((participante) => (
          <TableRow key={participante.id}>
            <TableCell>{participante.nomeJogador}</TableCell>
            <TableCell className="font-money">{formatCurrency(participante.buyInInicial)}</TableCell>
            <TableCell className="font-money">{formatCurrency(participante.totalRebuys)}</TableCell>
            <TableCell className="font-money">{formatCurrency(participante.totalInvestido)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[participante.status]}>
                {STATUS_LABEL[participante.status]}
                {participante.status === "cashout" &&
                  participante.valorCashout !== null &&
                  ` · ${formatCurrency(participante.valorCashout)}`}
              </Badge>
            </TableCell>
            {sessaoAberta && (
              <TableCell>
                {participante.status === "ativo" && (
                  <div className="flex gap-1.5">
                    <ValorDialog
                      triggerLabel="Rebuy"
                      title={`Rebuy — ${participante.nomeJogador}`}
                      defaultValue={buyInPadrao}
                      onConfirm={(valor) => registrarRebuy(sessaoId, participante.id, valor)}
                    />
                    <ValorDialog
                      triggerLabel="Cash-out"
                      triggerVariant="outline"
                      title={`Cash-out — ${participante.nomeJogador}`}
                      defaultValue={participante.totalInvestido}
                      onConfirm={(valor) => cashoutParticipante(sessaoId, participante.id, valor)}
                    />
                    <EliminarButton sessaoId={sessaoId} participanteId={participante.id} />
                  </div>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
