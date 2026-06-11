import { backendFetch } from "@/app/global-configuration/backend";
import RankingClient from "./ui/RankingClient";
import { RankingDto, QuinielaOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  // Solo las quinielas a las que el usuario logueado tiene acceso (según usuarios_quinielas).
  const resQ = await backendFetch("/quinielas/mias");
  const quinielas = resQ.ok ? ((await resQ.json()) as QuinielaOption[]) : [];
  const quinielaId = quinielas[0]?.id ?? 0;

  let ranking: RankingDto[] = [];
  if (quinielaId) {
    const res = await backendFetch(`/Ranking?quinielaId=${quinielaId}`);
    ranking = res.ok ? ((await res.json()) as RankingDto[]) : [];
  }

  return <RankingClient initial={ranking} quinielas={quinielas} quinielaIdInicial={quinielaId} />;
}
