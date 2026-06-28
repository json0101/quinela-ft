import { NextRequest } from "next/server";
import { bff } from "@/app/global-configuration/bff";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return bff(req, `/master/fase/${id}`, "PUT");
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return bff(req, `/master/fase/${id}`, "DELETE");
}
