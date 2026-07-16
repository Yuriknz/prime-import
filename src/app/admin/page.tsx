import { requireRole } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const usuario = await requireRole(["admin"]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Olá, {usuario.nome}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>O painel administrativo completo (relatórios, cardápio, mesas, usuários) chega na Fase 5.</p>
          <p className="text-sm">Enquanto isso, o domínio de comandas está disponível em /mesas.</p>
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
