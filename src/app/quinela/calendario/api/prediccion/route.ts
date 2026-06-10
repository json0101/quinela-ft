import { NextRequest } from "next/server";
import { bff } from "@/app/global-configuration/bff";

// Crea o actualiza la predicción del usuario para un partido.
export async function POST(req: NextRequest) {
  return bff(req, "/Prediccion/upsert", "POST");
}
