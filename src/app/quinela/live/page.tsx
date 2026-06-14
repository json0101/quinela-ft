import { DateTime } from "luxon";
import { backendFetch } from "@/app/global-configuration/backend";
import { TEGUS_TZ } from "@/app/global-configuration/fechas";
import LiveClient from "./ui/LiveClient";
import { QuinielaOption, PartidoLive, PrediccionLive } from "./dtos";

export const dynamic = "force-dynamic";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ quinielaId?: string; partidoId?: string }>;
}) {
  const sp = await searchParams;

  // Solo las quinielas a las que el usuario tiene acceso.
  const resQ = await backendFetch("/quinielas/mias");
  const quinielas = resQ.ok ? ((await resQ.json()) as QuinielaOption[]) : [];
  const quinielaId = Number(sp.quinielaId) || quinielas[0]?.id || 0;

  // Solo los partidos EN JUEGO (estado 'E'): los que se están jugando ahora.
  // Se excluyen los que aún no inician ('P') y los terminados ('T').
  const hoy = DateTime.now().setZone(TEGUS_TZ).toISODate() ?? "";
  let partidos: PartidoLive[] = [];
  if (quinielaId) {
    const resP = await backendFetch(`/partidos?quinielaId=${quinielaId}`);
    const todos = resP.ok ? ((await resP.json()) as PartidoLive[]) : [];
    partidos = todos.filter((p) => p.estado === "E");
  }
  const pedido = Number(sp.partidoId);
  const partidoId = partidos.some((p) => p.id === pedido) ? pedido : partidos[0]?.id || 0;

  // Predicciones de TODOS los usuarios para ese partido en esa quiniela.
  let predicciones: PrediccionLive[] = [];
  if (quinielaId && partidoId) {
    const resPr = await backendFetch(`/prediccion/live?quinielaId=${quinielaId}&partidoId=${partidoId}`);
    predicciones = resPr.ok ? ((await resPr.json()) as PrediccionLive[]) : [];
  }

  return (
    <LiveClient
      quinielas={quinielas}
      quinielaId={quinielaId}
      partidos={partidos}
      partidoId={partidoId}
      predicciones={predicciones}
      fecha={hoy}
    />
  );
}
