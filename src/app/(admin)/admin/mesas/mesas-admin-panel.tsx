"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/lib/supabase/types";
import { criarMesa, excluirMesa } from "./actions";

type Mesa = Database["public"]["Tables"]["mesas"]["Row"];

const STATUS_LABEL: Record<Mesa["status"], string> = {
  livre: "Livre",
  ocupada: "Ocupada",
  aguardando_pagamento: "Aguard. pagamento",
};

export function MesasAdminPanel({ mesas }: { mesas: Mesa[] }) {
  const [novoNumero, setNovoNumero] = useState(mesas.length + 1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCriar() {
    startTransition(async () => {
      const result = await criarMesa(novoNumero);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleExcluir(mesaId: string) {
    startTransition(async () => {
      const result = await excluirMesa(mesaId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="novo-numero">Número da mesa</Label>
          <Input
            id="novo-numero"
            type="number"
            min={1}
            value={novoNumero}
            onChange={(event) => setNovoNumero(Number(event.target.value) || 0)}
            className="w-32"
          />
        </div>
        <Button disabled={isPending} onClick={handleCriar}>
          Adicionar mesa
        </Button>
      </div>

      {mesas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma mesa cadastrada ainda.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mesas.map((mesa) => (
              <TableRow key={mesa.id}>
                <TableCell>{mesa.numero}</TableCell>
                <TableCell>
                  <Badge variant={mesa.status === "livre" ? "secondary" : "default"}>
                    {STATUS_LABEL[mesa.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleExcluir(mesa.id)}
                  >
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
