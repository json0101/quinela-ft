import { NextRequest } from "next/server";
import { bff } from "@/app/global-configuration/bff";

// Reenvía ?quinielaId=&username= al backend (predicciones del usuario en partidos terminados).
export async function GET(req: NextRequest) {
  return bff(req, `/prediccion/usuario${req.nextUrl.search}`, "GET");
}
