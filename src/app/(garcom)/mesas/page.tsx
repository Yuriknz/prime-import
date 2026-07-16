import { createClient } from "@/lib/supabase/server";
import { MesasGrid } from "./mesas-grid";

export default async function MesasPage() {
  const supabase = await createClient();
  const { data: mesas } = await supabase.from("mesas").select("*").order("numero");

  return <MesasGrid initialMesas={mesas ?? []} />;
}
