import { UsuarioQuinielaDto, QuinielaOption } from "./dtos";

type AccesoMin = Pick<UsuarioQuinielaDto, "userId" | "quinielaId" | "active">;

// Ids de quinielas a las que el usuario tiene acceso ACTIVO según la tabla usuarios_quinielas.
export function quinielaIdsConAcceso(accesos: AccesoMin[], userId: number): number[] {
  return accesos.filter((a) => a.active && a.userId === userId).map((a) => a.quinielaId);
}

// Las quinielas que un usuario puede VER: solo aquellas donde tiene acceso activo.
// Misma regla que el backend (GET /quinielas/mias).
export function quinielasVisiblesParaUsuario(
  quinielas: QuinielaOption[],
  accesos: AccesoMin[],
  userId: number,
): QuinielaOption[] {
  const ids = new Set(quinielaIdsConAcceso(accesos, userId));
  return quinielas.filter((q) => ids.has(q.id));
}

// Quinielas que aún se le pueden ASIGNAR a un usuario (las que no tiene), conservando
// la que se está editando para que siga visible en el combo.
export function quinielasAsignables(
  quinielas: QuinielaOption[],
  accesos: AccesoMin[],
  userId: number,
  quinielaActualId?: number,
): QuinielaOption[] {
  const ids = new Set(quinielaIdsConAcceso(accesos, userId));
  return quinielas.filter((q) => !ids.has(q.id) || q.id === quinielaActualId);
}
