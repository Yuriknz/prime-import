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
import { fecharComanda } from "./actions";

const TAXA_SERVICO_PERCENTUAL = 10;

export function FecharContaDialog({ comandaId, total }: { comandaId: string; total: number }) {
  const [open, setOpen] = useState(false);
  const [pessoas, setPessoas] = useState(1);
  const [comTaxa, setComTaxa] = useState(false);
  const [isPending, startTransition] = useTransition();

  const valorFinal = comTaxa ? total * (1 + TAXA_SERVICO_PERCENTUAL / 100) : total;
  const valorPorPessoa = valorFinal / Math.max(1, pessoas);

  function handleFechar(metodo: "dinheiro" | "cartao") {
    startTransition(async () => {
      const result = await fecharComanda(comandaId, metodo, valorFinal);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>Fechar conta</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar conta</DialogTitle>
          <DialogDescription>Confira o total antes de marcar como pago.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-money">{formatCurrency(total)}</span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={comTaxa ? "outline" : "default"}
              size="sm"
              className="flex-1"
              onClick={() => setComTaxa(false)}
            >
              Sem taxa
            </Button>
            <Button
              type="button"
              variant={comTaxa ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setComTaxa(true)}
            >
              Com taxa (10%)
            </Button>
          </div>

          <div className="flex items-baseline justify-between border-t border-border/50 pt-3">
            <span className="font-medium">Total</span>
            <span className="font-money text-lg text-primary">{formatCurrency(valorFinal)}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pessoas">Dividir por quantas pessoas?</Label>
            <Input
              id="pessoas"
              type="number"
              min={1}
              value={pessoas}
              onChange={(event) => setPessoas(Math.max(1, Number(event.target.value) || 1))}
            />
            {pessoas > 1 && (
              <p className="text-sm text-muted-foreground">{formatCurrency(valorPorPessoa)} por pessoa</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => handleFechar("cartao")}>
            Marcar pago (Cartão)
          </Button>
          <Button disabled={isPending} onClick={() => handleFechar("dinheiro")}>
            Marcar pago (Dinheiro)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
