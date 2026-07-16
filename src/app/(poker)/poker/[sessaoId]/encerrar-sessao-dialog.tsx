"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { encerrarSessao } from "./actions";

export function EncerrarSessaoDialog({
  sessaoId,
  tipo,
  totalArrecadado,
  taxaCasaPercentual,
  totalPago,
}: {
  sessaoId: string;
  tipo: "torneio" | "cash_game";
  totalArrecadado: number;
  taxaCasaPercentual: number;
  totalPago: number;
}) {
  const rakeSugerido = tipo === "torneio" ? totalArrecadado * (taxaCasaPercentual / 100) : 0;
  const [open, setOpen] = useState(false);
  const [rakeTotal, setRakeTotal] = useState(rakeSugerido);
  const [isPending, startTransition] = useTransition();

  const pool = totalArrecadado - rakeTotal;

  function handleEncerrar() {
    startTransition(async () => {
      const result = await encerrarSessao(sessaoId, rakeTotal);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>Encerrar sessão</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encerrar sessão</DialogTitle>
          <DialogDescription>Confira os totais antes de encerrar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Total arrecadado</span>
            <span className="font-money">{formatCurrency(totalArrecadado)}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rake-total">Rake total</Label>
            <Input
              id="rake-total"
              type="number"
              min={0}
              step="0.01"
              value={rakeTotal}
              onChange={(event) => setRakeTotal(Number(event.target.value) || 0)}
            />
            {tipo === "cash_game" && (
              <p className="text-xs text-muted-foreground">
                Referência de rake por pote (cobrado na mesa): R$2,00 acima de R$25 · R$10,00 de R$100,01 a
                R$200 · R$15,00 de R$200,01 a R$350 · R$30,00 acima de R$350. Potes divididos têm rake
                dividido proporcionalmente. Digite o total coletado na sessão.
              </p>
            )}
          </div>

          <div className="flex items-baseline justify-between border-t border-border/50 pt-3">
            <span className="font-medium">Pool / prêmios</span>
            <span className="font-money text-lg text-primary">{formatCurrency(pool)}</span>
          </div>

          <div className="flex items-baseline justify-between text-sm text-muted-foreground">
            <span>Já pago em cash-outs</span>
            <span className="font-money">{formatCurrency(totalPago)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button disabled={isPending} onClick={handleEncerrar}>
            {isPending ? "Encerrando…" : "Confirmar encerramento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
