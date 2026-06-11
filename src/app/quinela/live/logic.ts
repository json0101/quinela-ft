import { PrediccionLive, PartidoLive } from "./dtos";

export type CategoriaLive = "exacto" | "acertado" | "ninguno" | null;

// Clasifica la predicción de un usuario contra el marcador real del partido.
// null si el partido aún no tiene resultado o la predicción está incompleta.
export function categoriaPrediccion(
  pred: Pick<PrediccionLive, "team1Resultado" | "team2Resultado">,
  resultadoLocal: number | null | undefined,
  resultadoVisitante: number | null | undefined,
): CategoriaLive {
  if (
    resultadoLocal == null ||
    resultadoVisitante == null ||
    pred.team1Resultado == null ||
    pred.team2Resultado == null
  ) {
    return null;
  }
  if (pred.team1Resultado === resultadoLocal && pred.team2Resultado === resultadoVisitante) {
    return "exacto";
  }
  if (Math.sign(pred.team1Resultado - pred.team2Resultado) === Math.sign(resultadoLocal - resultadoVisitante)) {
    return "acertado";
  }
  return "ninguno";
}

// Etiqueta legible del estado del partido.
export function estadoLabel(estado: string): string {
  switch (estado) {
    case "P":
      return "Previa";
    case "E":
      return "En curso";
    case "T":
      return "Terminado";
    default:
      return estado;
  }
}

// Texto del marcador real ("2 - 1" o "—" si no hay).
export function marcador(p: Pick<PartidoLive, "resultadoLocal" | "resultadoVisitante">): string {
  return p.resultadoLocal != null && p.resultadoVisitante != null
    ? `${p.resultadoLocal} - ${p.resultadoVisitante}`
    : "—";
}
