"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Database } from "@/lib/supabase/types";

type ProdutoSetor = Database["public"]["Enums"]["produto_setor"];
type ActionResult = { error?: string } | undefined;

export async function criarProduto(dados: {
  nome: string;
  preco: number;
  categoria: string;
  setorDestino: ProdutoSetor;
}): Promise<ActionResult> {
  await requireRole(["admin"]);

  if (!dados.nome.trim() || !dados.categoria.trim() || dados.preco < 0) {
    return { error: "Preencha os campos corretamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("produtos").insert({
    nome: dados.nome.trim(),
    preco: dados.preco,
    categoria: dados.categoria.trim(),
    setor_destino: dados.setorDestino,
  });

  if (error) {
    return { error: "Não foi possível criar o produto." };
  }

  revalidatePath("/admin/produtos");
}

export async function atualizarProduto(
  produtoId: string,
  dados: {
    nome: string;
    preco: number;
    categoria: string;
    setorDestino: ProdutoSetor;
    disponivel: boolean;
  }
): Promise<ActionResult> {
  await requireRole(["admin"]);

  if (!dados.nome.trim() || !dados.categoria.trim() || dados.preco < 0) {
    return { error: "Preencha os campos corretamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("produtos")
    .update({
      nome: dados.nome.trim(),
      preco: dados.preco,
      categoria: dados.categoria.trim(),
      setor_destino: dados.setorDestino,
      disponivel: dados.disponivel,
    })
    .eq("id", produtoId);

  if (error) {
    return { error: "Não foi possível atualizar o produto." };
  }

  revalidatePath("/admin/produtos");
}
