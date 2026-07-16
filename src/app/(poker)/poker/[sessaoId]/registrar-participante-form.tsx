"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { registrarParticipante } from "./actions";

export function RegistrarParticipanteForm({
  sessaoId,
  buyInPadrao,
}: {
  sessaoId: string;
  buyInPadrao: number;
}) {
  const [nome, setNome] = useState("");
  const [buyIn, setBuyIn] = useState(buyInPadrao);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRegistrar() {
    if (!nome.trim()) return;
    startTransition(async () => {
      const result = await registrarParticipante(sessaoId, nome, buyIn);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setNome("");
      setBuyIn(buyInPadrao);
      router.refresh();
    });
  }

  return (
    <Card className="p-3">
      <CardHeader className="p-0">
        <CardTitle className="text-sm">Registrar participante</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-0 pt-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="nome-jogador">Nome</Label>
          <Input id="nome-jogador" value={nome} onChange={(event) => setNome(event.target.value)} />
        </div>
        <div className="w-full space-y-1 sm:w-32">
          <Label htmlFor="buy-in-inicial">Buy-in</Label>
          <Input
            id="buy-in-inicial"
            type="number"
            min={0}
            step="0.01"
            value={buyIn}
            onChange={(event) => setBuyIn(Number(event.target.value) || 0)}
          />
        </div>
        <Button disabled={isPending || !nome.trim()} onClick={handleRegistrar}>
          {isPending ? "Adicionando…" : "Adicionar"}
        </Button>
      </CardContent>
    </Card>
  );
}
