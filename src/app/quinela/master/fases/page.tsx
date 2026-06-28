import { backendFetch } from "@/app/global-configuration/backend";
import FasesClient from "./ui/FasesClient";
import { FaseDto, TorneoOption } from "./dtos";

export const dynamic = "force-dynamic";

export default async function FasesPage() {
  const [resF, resT] = await Promise.all([
    backendFetch("/master/fase"),
    backendFetch("/master/torneo"),
  ]);
  const fases = resF.ok ? ((await resF.json()) as FaseDto[]) : [];
  const torneos = resT.ok ? ((await resT.json()) as TorneoOption[]) : [];
  return <FasesClient initial={fases} torneos={torneos} />;
}
