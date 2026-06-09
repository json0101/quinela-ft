import { backendFetch } from "@/app/global-configuration/backend";
import TiposPartidoClient from "./ui/TiposPartidoClient";
import { TipoPartidoDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function TiposPartidoPage() {
  const res = await backendFetch("/master/tipopartido");
  const tipos = res.ok ? ((await res.json()) as TipoPartidoDto[]) : [];
  return <TiposPartidoClient initial={tipos} />;
}
