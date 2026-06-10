import { DateTime } from "luxon";
import { backendFetch } from "@/app/global-configuration/backend";
import CalendarioClient from "./ui/CalendarioClient";
import { PartidoCalendarioDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  // Por defecto el calendario abre filtrado al día de hoy.
  const hoy = DateTime.now().toISODate() ?? "";
  const res = await backendFetch(`/partidos?desde=${hoy}&hasta=${hoy}`);
  const partidos = res.ok ? ((await res.json()) as PartidoCalendarioDto[]) : [];
  return <CalendarioClient initial={partidos} fechaDefault={hoy} />;
}
