import { NextRequest } from "next/server";
import { bff } from "@/app/global-configuration/bff";

// Soft delete (desactiva) la predicción del usuario.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return bff(req, `/Prediccion/${id}`, "DELETE");
}
