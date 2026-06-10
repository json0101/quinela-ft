import { NextRequest } from "next/server";
import { bff } from "@/app/global-configuration/bff";

// Reenvía el filtro ?desde=&hasta= al backend.
export async function GET(req: NextRequest) {
  return bff(req, `/partidos${req.nextUrl.search}`, "GET");
}
