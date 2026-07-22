"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reemitirNota } from "./actions";

export function ReemitirButton({ notaId }: { notaId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleReemitir() {
    startTransition(async () => {
      const result = await reemitirNota(notaId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={handleReemitir}>
      {isPending ? "Reemitindo…" : "Reemitir"}
    </Button>
  );
}
