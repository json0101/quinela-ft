import { backendFetch } from "@/app/global-configuration/backend";
import GruposClient from "./ui/GruposClient";
import { GrupoDto, TorneoOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const [resG, resT] = await Promise.all([
    backendFetch("/master/grupo"),
    backendFetch("/master/torneo"),
  ]);
  const grupos = resG.ok ? ((await resG.json()) as GrupoDto[]) : [];
  const torneos = resT.ok ? ((await resT.json()) as TorneoOption[]) : [];
  return <GruposClient initial={grupos} torneos={torneos} />;
}
