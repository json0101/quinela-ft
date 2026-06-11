import { backendFetch } from "@/app/global-configuration/backend";
import QuinielasClient from "./ui/QuinielasClient";
import { QuinielaDto, TorneoOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function QuinielasPage() {
  const [resQ, resT] = await Promise.all([
    backendFetch("/master/quiniela"),
    backendFetch("/master/torneo"),
  ]);
  const quinielas = resQ.ok ? ((await resQ.json()) as QuinielaDto[]) : [];
  const torneos = resT.ok ? ((await resT.json()) as TorneoOption[]) : [];
  return <QuinielasClient initial={quinielas} torneos={torneos} />;
}
