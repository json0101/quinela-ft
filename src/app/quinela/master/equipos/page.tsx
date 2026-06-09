import { backendFetch } from "@/app/global-configuration/backend";
import EquiposClient from "./ui/EquiposClient";
import { EquipoDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  const res = await backendFetch("/master/equipo");
  const equipos = res.ok ? ((await res.json()) as EquipoDto[]) : [];
  return <EquiposClient initial={equipos} />;
}
