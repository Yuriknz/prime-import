"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { reemitirNotaFiscal } from "@/lib/fiscal/emitir-nota";

type ActionResult = { error?: string } | undefined;

export async function reemitirNota(notaId: string): Promise<ActionResult> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  await reemitirNotaFiscal(supabase, notaId);

  revalidatePath("/admin/notas-fiscais");
  return undefined;
}
