import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { MesasAdminPanel } from "./mesas-admin-panel";

export default async function MesasAdminPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: mesas } = await supabase.from("mesas").select("*").order("numero");

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h2 className="font-heading text-xl">Mesas</h2>
      <MesasAdminPanel mesas={mesas ?? []} />
    </div>
  );
}
