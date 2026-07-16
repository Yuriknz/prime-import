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
import { atualizarProduto, criarProduto } from "./actions";

type ProdutoSetor = Database["public"]["Enums"]["produto_setor"];

const SETORES: { value: ProdutoSetor; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "cozinha", label: "Cozinha" },
  { value: "churrasqueira", label: "Churrasqueira" },
];

export type ProdutoExistente = {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  setorDestino: ProdutoSetor;
  disponivel: boolean;
};

export function ProdutoDialog({
  produto,
  triggerLabel,
}: {
  produto?: ProdutoExistente;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [preco, setPreco] = useState(produto?.preco ?? 0);
  const [categoria, setCategoria] = useState(produto?.categoria ?? "");
  const [setorDestino, setSetorDestino] = useState<ProdutoSetor>(produto?.setorDestino ?? "bar");
  const [disponivel, setDisponivel] = useState(produto?.disponivel ?? true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSalvar() {
    startTransition(async () => {
      const dados = { nome, preco, categoria, setorDestino };
      const result = produto
        ? await atualizarProduto(produto.id, { ...dados, disponivel })
        : await criarProduto(dados);

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
      <DialogTrigger render={<Button variant={produto ? "outline" : "default"} size={produto ? "sm" : "default"} />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{produto ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="produto-nome">Nome</Label>
            <Input id="produto-nome" value={nome} onChange={(event) => setNome(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="produto-categoria">Categoria</Label>
            <Input
              id="produto-categoria"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="produto-preco">Preço</Label>
            <Input
              id="produto-preco"
              type="number"
              min={0}
              step="0.01"
              value={preco}
              onChange={(event) => setPreco(Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Setor</Label>
            <div className="flex gap-2">
              {SETORES.map((setor) => (
                <Button
                  key={setor.value}
                  type="button"
                  variant={setorDestino === setor.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSetorDestino(setor.value)}
                >
                  {setor.label}
                </Button>
              ))}
            </div>
          </div>
          {produto && (
            <div className="space-y-1.5">
              <Label>Disponibilidade</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={disponivel ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDisponivel(true)}
                >
                  Disponível
                </Button>
                <Button
                  type="button"
                  variant={!disponivel ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDisponivel(false)}
                >
                  Indisponível
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button disabled={isPending || !nome.trim() || !categoria.trim()} onClick={handleSalvar}>
            {isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
