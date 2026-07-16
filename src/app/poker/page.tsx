import { requireRole } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PokerPage() {
  const usuario = await requireRole(["operador_poker", "admin"]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Olá, {usuario.nome}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>O painel de sessões de poker (buy-in, rebuy, cash-out) chega na Fase 4.</p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Sair
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
