export interface EquipoCalendarioDto {
  id: number;
  nombre: string;
  urlBandera?: string;
}

export interface PrediccionResumenDto {
  id: number;
  team1Resultado: number | null;
  team2Resultado: number | null;
}

export interface PartidoCalendarioDto {
  id: number;
  fechaPartido: string; // ISO (UTC) desde el backend
  grupo: string;
  estado: string; // 'P' previa, 'E' en curso, 'T' terminado
  local: EquipoCalendarioDto;
  visitante: EquipoCalendarioDto;
  resultadoLocal?: number | null;
  resultadoVisitante?: number | null;
  prediccion?: PrediccionResumenDto | null;
  puntosGanados?: number | null;
  categoriaPuntos?: "exacto" | "acertado" | "ninguno" | null;
}
