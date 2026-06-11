import { backendFetch } from "@/app/global-configuration/backend";
import TorneosClient from "./ui/TorneosClient";
import { TorneoDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function TorneosPage() {
  const res = await backendFetch("/master/torneo");
  const torneos = res.ok ? ((await res.json()) as TorneoDto[]) : [];
  return <TorneosClient initial={torneos} />;
}
