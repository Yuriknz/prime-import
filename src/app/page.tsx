import { redirect } from "next/navigation";
import { ROLE_HOME, getCurrentUsuario } from "@/lib/auth";

export default async function Home() {
  const usuario = await getCurrentUsuario();

  redirect(usuario ? ROLE_HOME[usuario.role] : "/login");
}
