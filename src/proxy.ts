import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import config_local from "@/app/global-configuration/config-local";

// Nodo del menú que devuelve el backend (GET /Menu) según los permisos del usuario.
type MenuItem = {
  route: string;
  children?: MenuItem[];
};

// Aplana el menú a la lista de rutas navegables (descarta padres con route "#").
function collectRoutes(items: MenuItem[]): string[] {
  const acc: string[] = [];
  for (const it of items ?? []) {
    if (it.route && it.route !== "#") acc.push(it.route);
    if (it.children?.length) acc.push(...collectRoutes(it.children));
  }
  return acc;
}

// La ruta está permitida si coincide con una screen del menú o cuelga de ella
// (p. ej. /quinela/master/grupos/edit/5 cae bajo /quinela/master/grupos).
function isRouteAllowed(pathname: string, menu: MenuItem[]): boolean {
  // El dashboard base siempre se permite (no es una screen del menú).
  if (pathname === "/quinela" || pathname === "/quinela/") return true;

  return collectRoutes(menu).some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

// Guarda de autenticación + autorización (reemplaza el antiguo middleware en Next 16).
// 1) Sin sesión -> login.
// 2) Con sesión -> valida que la ruta esté en el menú del usuario (permisos del back).
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(config_local.sessionCookieName)?.value;
  const { pathname } = request.nextUrl;

  // 1) Sin sesión -> login (guardando a dónde iba).
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Los route handlers (BFF) bajo /quinela/**/api/** se dejan pasar: ya adjuntan el token
  // y el back valida. Esta guarda protege la navegación a PANTALLAS, no las llamadas de datos.
  if (pathname.split("/").includes("api")) {
    return NextResponse.next();
  }

  // 2) Autorización por menú: consultar las screens a las que el usuario tiene acceso.
  try {
    const res = await fetch(`${config_local.backendBaseUrl}/Menu`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Token inválido/expirado -> login.
    if (res.status === 401 || res.status === 403) {
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    if (res.ok) {
      const menu = (await res.json()) as MenuItem[];
      if (!isRouteAllowed(pathname, menu)) {
        // Sin permiso para esta screen -> de vuelta al dashboard.
        const url = new URL("/quinela", request.url);
        url.searchParams.set("denied", pathname);
        return NextResponse.redirect(url);
      }
    }
    // Si el back responde con otro estado, dejamos pasar para no romper la navegación
    // ante un fallo transitorio (la screen igual valida el token en sus llamadas).
  } catch (error) {
    console.log("proxy: no se pudo obtener el menú para autorizar la ruta", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/quinela/:path*"],
};
