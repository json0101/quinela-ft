import { backendFetch } from "@/app/global-configuration/backend";
import PartidosClient from "./ui/PartidosClient";
import { PartidoAdminDto, TorneoOption, GrupoOption, EquipoOption, TipoPartidoOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function PartidosPage() {
  const [resP, resT, resG, resE, resTp] = await Promise.all([
    backendFetch("/master/partido"),
    backendFetch("/master/torneo"),
    backendFetch("/master/grupo"),
    backendFetch("/master/equipo"),
    backendFetch("/master/tipopartido"),
  ]);
  const partidos = resP.ok ? ((await resP.json()) as PartidoAdminDto[]) : [];
  const torneos = resT.ok ? ((await resT.json()) as TorneoOption[]) : [];
  const grupos = resG.ok ? ((await resG.json()) as GrupoOption[]) : [];
  const equipos = resE.ok ? ((await resE.json()) as EquipoOption[]) : [];
  const tipos = resTp.ok ? ((await resTp.json()) as TipoPartidoOption[]) : [];
  return <PartidosClient initial={partidos} torneos={torneos} grupos={grupos} equipos={equipos} tipos={tipos} />;
}
