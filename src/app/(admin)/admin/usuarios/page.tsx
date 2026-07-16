import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { BackLink } from "@/components/back-link";
import { NovoUsuarioDialog } from "./novo-usuario-dialog";
import { UsuariosLista } from "./usuarios-lista";

export default async function UsuariosPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome, email, role, ativo")
    .order("nome");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <BackLink href="/admin" label="Início" />
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl">Usuários</h2>
        <NovoUsuarioDialog />
      </div>
      <UsuariosLista usuarios={usuarios ?? []} />
    </div>
  );
}
