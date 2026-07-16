"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { entrarNaMesa } from "./actions";

type Mesa = Database["public"]["Tables"]["mesas"]["Row"];

const STATUS_LABEL: Record<Mesa["status"], string> = {
  livre: "Livre",
  ocupada: "Ocupada",
  aguardando_pagamento: "Aguard. pagamento",
};

const STATUS_VARIANT: Record<Mesa["status"], "secondary" | "default" | "destructive"> = {
  livre: "secondary",
  ocupada: "default",
  aguardando_pagamento: "destructive",
};

export function MesasGrid({ initialMesas }: { initialMesas: Mesa[] }) {
  const [mesas, setMesas] = useState(initialMesas);
  const [pendingMesaId, setPendingMesaId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("mesas-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mesas" },
        (payload) => {
          setMesas((current) => {
            if (payload.eventType === "DELETE") {
              const removidaId = (payload.old as Partial<Mesa>).id;
              return current.filter((mesa) => mesa.id !== removidaId);
            }
            const novaMesa = payload.new as Mesa;
            const existe = current.some((mesa) => mesa.id === novaMesa.id);
            return existe
              ? current.map((mesa) => (mesa.id === novaMesa.id ? novaMesa : mesa))
              : [...current, novaMesa].sort((a, b) => a.numero - b.numero);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleClick(mesa: Mesa) {
    if (pendingMesaId) return;
    setPendingMesaId(mesa.id);
    startTransition(async () => {
      const result = await entrarNaMesa(mesa.id);
      setPendingMesaId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.push(`/comandas/${result.comandaId}`);
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
      {mesas.map((mesa) => (
        <Card
          key={mesa.id}
          role="button"
          tabIndex={0}
          onClick={() => handleClick(mesa)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") handleClick(mesa);
          }}
          className={cn(
            "cursor-pointer items-center gap-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:ring-primary/40 active:translate-y-0",
            pendingMesaId === mesa.id && "opacity-50"
          )}
        >
          <span className="font-heading text-2xl">{mesa.numero}</span>
          <Badge variant={STATUS_VARIANT[mesa.status]}>{STATUS_LABEL[mesa.status]}</Badge>
        </Card>
      ))}
    </div>
  );
}
