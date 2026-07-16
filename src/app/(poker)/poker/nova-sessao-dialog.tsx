"use client";

import { useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/lib/supabase/types";
import { criarSessao } from "./actions";

type SessaoTipo = Database["public"]["Enums"]["sessao_tipo"];

export function NovaSessaoDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<SessaoTipo>("torneio");
  const [buyInValor, setBuyInValor] = useState(50);
  const [taxaCasaPercentual, setTaxaCasaPercentual] = useState(15);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCriar() {
    startTransition(async () => {
      const result = await criarSessao({ nome, tipo, buyInValor, taxaCasaPercentual });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      router.push(`/poker/${result.sessaoId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nova sessão</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova sessão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipo === "torneio" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setTipo("torneio")}
            >
              Torneio
            </Button>
            <Button
              type="button"
              variant={tipo === "cash_game" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setTipo("cash_game")}
            >
              Cash game
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome da sessão</Label>
            <Input id="nome" value={nome} onChange={(event) => setNome(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buyInValor">Valor do buy-in</Label>
            <Input
              id="buyInValor"
              type="number"
              min={0}
              step="0.01"
              value={buyInValor}
              onChange={(event) => setBuyInValor(Number(event.target.value) || 0)}
            />
          </div>

          {tipo === "torneio" && (
            <div className="space-y-1.5">
              <Label htmlFor="taxaCasaPercentual">Taxa da casa (%)</Label>
              <Input
                id="taxaCasaPercentual"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxaCasaPercentual}
                onChange={(event) => setTaxaCasaPercentual(Number(event.target.value) || 0)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button disabled={isPending} onClick={handleCriar}>
            {isPending ? "Criando…" : "Criar sessão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
