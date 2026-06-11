import { DateTime } from "luxon";
import { backendFetch } from "@/app/global-configuration/backend";
import CalendarioClient from "./ui/CalendarioClient";
import { PartidoCalendarioDto, QuinielaOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  // Solo las quinielas a las que el usuario logueado tiene acceso (según usuarios_quinielas).
  const resQ = await backendFetch("/quinielas/mias");
  const quinielas = resQ.ok ? ((await resQ.json()) as QuinielaOption[]) : [];
  const quinielaId = quinielas[0]?.id ?? 0;

  // Por defecto el calendario abre filtrado al día de hoy, para la primera quiniela.
  const hoy = DateTime.now().toISODate() ?? "";
  let partidos: PartidoCalendarioDto[] = [];
  if (quinielaId) {
    const res = await backendFetch(`/partidos?quinielaId=${quinielaId}&desde=${hoy}&hasta=${hoy}`);
    partidos = res.ok ? ((await res.json()) as PartidoCalendarioDto[]) : [];
  }

  return (
    <CalendarioClient
      initial={partidos}
      fechaDefault={hoy}
      quinielas={quinielas}
      quinielaIdInicial={quinielaId}
    />
  );
}
