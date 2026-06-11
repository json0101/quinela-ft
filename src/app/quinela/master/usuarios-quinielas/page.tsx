import { backendFetch } from "@/app/global-configuration/backend";
import UsuariosQuinielasClient from "./ui/UsuariosQuinielasClient";
import { UsuarioQuinielaDto, UsuarioOption, QuinielaOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function UsuariosQuinielasPage() {
  const [resA, resU, resQ] = await Promise.all([
    backendFetch("/master/usuarioquiniela"),
    backendFetch("/master/usuarioquiniela/usuarios"),
    backendFetch("/master/quiniela"),
  ]);
  const accesos = resA.ok ? ((await resA.json()) as UsuarioQuinielaDto[]) : [];
  const usuarios = resU.ok ? ((await resU.json()) as UsuarioOption[]) : [];
  const quinielas = resQ.ok ? ((await resQ.json()) as QuinielaOption[]) : [];
  return <UsuariosQuinielasClient initial={accesos} usuarios={usuarios} quinielas={quinielas} />;
}
