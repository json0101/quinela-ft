export interface RankingDto {
  id: number;
  // Posición en la tabla (1 = primero). La calcula el backend con el criterio de
  // desempate; los empatados comparten posición y la siguiente se "salta".
  posicion: number;
  usuario: string;
  pts: number;
  resultadoAtinado: number;
  resultadoExacto: number;
}

export interface QuinielaOption {
  id: number;
  nombre: string;
}

export interface EquipoPrediccion {
  nombre: string;
  urlBandera?: string;
}

export interface PrediccionUsuarioDto {
  partidoId: number;
  fechaPartido: string;
  tipoPartido: string;
  local: EquipoPrediccion;
  visitante: EquipoPrediccion;
  team1Resultado: number | null;
  team2Resultado: number | null;
  resultadoLocal: number | null;
  resultadoVisitante: number | null;
  puntos: number;
  categoria: "exacto" | "acertado" | "ninguno" | null;
  guardadaEn: string; // ISO UTC
}
