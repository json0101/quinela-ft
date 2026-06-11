import { backendFetch } from "@/app/global-configuration/backend";
import EquiposClient from "./ui/EquiposClient";
import { EquipoDto, TorneoOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  const [resE, resT] = await Promise.all([
    backendFetch("/master/equipo"),
    backendFetch("/master/torneo"),
  ]);
  const equipos = resE.ok ? ((await resE.json()) as EquipoDto[]) : [];
  const torneos = resT.ok ? ((await resT.json()) as TorneoOption[]) : [];
  return <EquiposClient initial={equipos} torneos={torneos} />;
}
