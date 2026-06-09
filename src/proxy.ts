import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import config_local from "@/app/global-configuration/config-local";

// Guarda de autenticación (reemplaza el antiguo middleware en Next 16).
// Protege todo /quinela/*: sin cookie de sesión, redirige al login.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(config_local.sessionCookieName)?.value;
  if (!token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/quinela/:path*"],
};
