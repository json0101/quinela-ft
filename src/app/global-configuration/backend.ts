import { cookies } from "next/headers";
import config_local from "./config-local";

/**
 * Llama al backend desde un Server Component / Route Handler, adjuntando el JWT
 * guardado en la cookie de sesión (httpOnly).
 */
export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = (await cookies()).get(config_local.sessionCookieName)?.value;
  return fetch(`${config_local.backendBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

/** Lee el token directo de un NextRequest (para los route handlers BFF). */
export function tokenFromRequest(cookieValue: string | undefined): string | undefined {
  return cookieValue;
}

/** El backend devuelve el token como string JSON (entre comillas). Lo normaliza. */
export function unwrapToken(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}
