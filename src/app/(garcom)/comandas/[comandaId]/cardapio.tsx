"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { enviarPedido } from "./actions";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
};

export function Cardapio({ comandaId, produtos }: { comandaId: string; produtos: Produto[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const categorias = useMemo(() => Array.from(new Set(produtos.map((p) => p.categoria))), [produtos]);
  const produtosPorId = useMemo(() => new Map(produtos.map((p) => [p.id, p])), [produtos]);

  const cartItems = useMemo(
    () => Object.entries(cart).map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
    [cart]
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantidade, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const produto = produtosPorId.get(item.produtoId);
    return sum + (produto ? produto.preco * item.quantidade : 0);
  }, 0);

  function updateQty(produtoId: string, delta: number) {
    setCart((current) => {
      const next = Math.max(0, (current[produtoId] ?? 0) + delta);
      if (next === 0) {
        const rest = { ...current };
        delete rest[produtoId];
        return rest;
      }
      return { ...current, [produtoId]: next };
    });
  }

  function handleEnviar() {
    if (cartItems.length === 0 || isPending) return;
    startTransition(async () => {
      const result = await enviarPedido(comandaId, cartItems);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Pedido enviado.");
      setCart({});
      router.refresh();
    });
  }

  if (categorias.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Nenhum produto disponível no cardápio.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs defaultValue={categorias[0]} className="px-4">
        <TabsList>
          {categorias.map((categoria) => (
            <TabsTrigger key={categoria} value={categoria}>
              {categoria}
            </TabsTrigger>
          ))}
        </TabsList>
        {categorias.map((categoria) => (
          <TabsContent key={categoria} value={categoria} className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-2">
            {produtos
              .filter((produto) => produto.categoria === categoria)
              .map((produto) => {
                const quantidade = cart[produto.id] ?? 0;
                return (
                  <Card key={produto.id} className="flex-row items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{produto.nome}</p>
                      <p className="font-money text-sm text-muted-foreground">
                        {formatCurrency(produto.preco)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={quantidade === 0}
                        onClick={() => updateQty(produto.id, -1)}
                      >
                        −
                      </Button>
                      <span className="w-4 text-center font-money">{quantidade}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQty(produto.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </TabsContent>
        ))}
      </Tabs>

      {cartCount > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border/50 bg-card p-3">
          <div className="flex items-center gap-2">
            <Badge>{cartCount}</Badge>
            <span className="font-money">{formatCurrency(cartTotal)}</span>
          </div>
          <Button onClick={handleEnviar} disabled={isPending}>
            {isPending ? "Enviando…" : "Enviar pedido"}
          </Button>
        </div>
      )}
    </div>
  );
}
