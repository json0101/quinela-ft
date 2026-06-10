import { PartidoCalendarioDto, PrediccionResumenDto } from "./dtos";

export type Draft = { local: string; visitante: string };

// Estado de un guardado en curso para una tarjeta ("saved" se representa con undefined).
export type SaveStatus = "saving" | "error" | undefined;

// Solo dígitos, máximo 2, tope 99 (permite 0 para marcadores 0-0).
export function sanitizeScore(valor: string): string {
  const digits = valor.replace(/\D/g, "").slice(0, 2);
  if (digits === "") return "";
  return String(Math.min(99, Number(digits)));
}

export function toNum(v: string): number | null {
  return v === "" ? null : Number(v);
}

// Convierte un resultado guardado (number | null) al string del input.
function toInput(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

// Inicializa los drafts de cada partido a partir de su predicción guardada.
export function buildDrafts(list: PartidoCalendarioDto[]): Record<number, Draft> {
  const d: Record<number, Draft> = {};
  for (const p of list) {
    d[p.id] = {
      local: toInput(p.prediccion?.team1Resultado),
      visitante: toInput(p.prediccion?.team2Resultado),
    };
  }
  return d;
}

export type SaveAction =
  | { kind: "save"; team1: number | null; team2: number | null }
  | { kind: "delete" }
  | { kind: "none" };

// Decide qué hacer al persistir un draft, dada la predicción ya guardada.
// - ambos vacíos + existe predicción -> borrar (soft delete)
// - ambos vacíos + no existe -> nada
// - igual a lo guardado -> nada
// - en otro caso -> guardar (uno puede ir en null)
export function decideSave(draft: Draft, prediccion: PrediccionResumenDto | null): SaveAction {
  const t1 = toNum(draft.local);
  const t2 = toNum(draft.visitante);

  if (t1 === null && t2 === null) {
    return prediccion ? { kind: "delete" } : { kind: "none" };
  }

  if (
    prediccion &&
    (prediccion.team1Resultado ?? null) === t1 &&
    (prediccion.team2Resultado ?? null) === t2
  ) {
    return { kind: "none" };
  }

  return { kind: "save", team1: t1, team2: t2 };
}

export type EstadoColor = "success" | "error" | "warning" | "info";
export type EstadoPred = { label: string; color: EstadoColor };

// Etiqueta de estado atada al estado REAL (server) + el guardado en curso, no solo a lo escrito.
export function estadoPrediccion(
  draft: Draft,
  prediccion: PrediccionResumenDto | null,
  status: SaveStatus,
): EstadoPred {
  if (status === "saving") return { label: "Guardando…", color: "info" };

  const hayLocal = draft.local !== "";
  const hayVisitante = draft.visitante !== "";
  if (!hayLocal && !hayVisitante) return { label: "Predicción no ingresada", color: "error" };
  if (!hayVisitante) return { label: "Ingrese el resultado del visitante", color: "error" };
  if (!hayLocal) return { label: "Ingrese el resultado del local", color: "error" };

  if (status === "error") return { label: "Error al guardar", color: "error" };

  // Verde SOLO si lo guardado en el server coincide con lo que está escrito.
  const guardado =
    prediccion !== null &&
    toInput(prediccion.team1Resultado) === draft.local &&
    toInput(prediccion.team2Resultado) === draft.visitante;
  if (guardado) return { label: "Predicción guardada", color: "success" };

  return { label: "Sin guardar", color: "warning" };
}
