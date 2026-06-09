import { backendFetch } from "@/app/global-configuration/backend";
import GruposClient from "./ui/GruposClient";
import { GrupoDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const res = await backendFetch("/master/grupo");
  const grupos = res.ok ? ((await res.json()) as GrupoDto[]) : [];
  return <GruposClient initial={grupos} />;
}
