import { NextRequest, NextResponse } from "next/server";
import config_local from "./config-local";

/**
 * Proxy genérico FT -> backend para los route handlers. Adjunta el JWT de la
 * cookie, reenvía el cuerpo y normaliza errores a { message }.
 */
export async function bff(req: NextRequest, backendPath: string, method: string): Promise<NextResponse> {
  const token = req.cookies.get(config_local.sessionCookieName)?.value;
  const hasBody = method === "POST" || method === "PUT" || method === "PATCH";
  const body = hasBody ? await req.text() : undefined;

  const res = await fetch(`${config_local.backendBaseUrl}${backendPath}`, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const text = await res.text();

  if (!res.ok) {
    let message = "Ocurrió un error. Inténtalo de nuevo.";
    try {
      const payload = JSON.parse(text);
      if (payload?.message) message = payload.message;
    } catch {
      /* sin JSON */
    }
    return NextResponse.json({ message }, { status: res.status });
  }

  if (!text) return new NextResponse(null, { status: res.status });
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
