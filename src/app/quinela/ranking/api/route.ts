import { NextRequest } from "next/server";
import { bff } from "@/app/global-configuration/bff";

// Reenvía ?quinielaId= al backend.
export async function GET(req: NextRequest) {
  return bff(req, `/Ranking${req.nextUrl.search}`, "GET");
}
