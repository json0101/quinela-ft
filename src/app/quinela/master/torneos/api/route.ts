import { NextRequest } from "next/server";
import { bff } from "@/app/global-configuration/bff";

export async function GET(req: NextRequest) {
  return bff(req, "/master/torneo", "GET");
}

export async function POST(req: NextRequest) {
  return bff(req, "/master/torneo", "POST");
}
