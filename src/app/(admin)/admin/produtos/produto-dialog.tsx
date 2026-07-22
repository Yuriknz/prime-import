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
import { atualizarDadosFiscais, atualizarProduto, criarProduto } from "./actions";

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
  fiscal?: {
    ncm: string;
    cfop: string;
    unidadeComercial: string;
    cest: string;
    csosn: string;
    cst: string;
    origem: number;
  };
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
  const [ncm, setNcm] = useState(produto?.fiscal?.ncm ?? "");
  const [cfop, setCfop] = useState(produto?.fiscal?.cfop ?? "5102");
  const [unidadeComercial, setUnidadeComercial] = useState(produto?.fiscal?.unidadeComercial ?? "UN");
  const [cest, setCest] = useState(produto?.fiscal?.cest ?? "");
  const [csosn, setCsosn] = useState(produto?.fiscal?.csosn ?? "500");
  const [cst, setCst] = useState(produto?.fiscal?.cst ?? "");
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

      if (produto && ncm.trim()) {
        const fiscalResult = await atualizarDadosFiscais(produto.id, {
          ncm,
          cfop,
          unidadeComercial,
          cest,
          csosn,
          cst,
          origem: 0,
        });
        if (fiscalResult?.error) {
          toast.error(fiscalResult.error);
          return;
        }
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
          {produto && (
            <div className="space-y-3 border-t border-border/50 pt-3">
              <Label className="text-sm font-medium">Dados fiscais (NFC-e)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="produto-ncm">NCM</Label>
                  <Input id="produto-ncm" value={ncm} onChange={(event) => setNcm(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="produto-cfop">CFOP</Label>
                  <Input id="produto-cfop" value={cfop} onChange={(event) => setCfop(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="produto-cest">CEST (bebidas)</Label>
                  <Input id="produto-cest" value={cest} onChange={(event) => setCest(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="produto-unidade">Unidade</Label>
                  <Input
                    id="produto-unidade"
                    value={unidadeComercial}
                    onChange={(event) => setUnidadeComercial(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="produto-csosn">CSOSN (Simples Nacional)</Label>
                  <Input id="produto-csosn" value={csosn} onChange={(event) => setCsosn(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="produto-cst">CST (regime normal)</Label>
                  <Input id="produto-cst" value={cst} onChange={(event) => setCst(event.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Preencha NCM para salvar os dados fiscais. Informe CSOSN ou CST.
              </p>
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
