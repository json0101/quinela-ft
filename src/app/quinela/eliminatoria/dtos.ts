export interface BracketPartidoDto {
  id: number;
  fecha: string;
  ronda: string; // R32 | R16 | QF | SF | TERCER_PUESTO | FINAL
  local: string;
  visitante: string;
  estado: string; // 'P' | 'E' | 'T'
  golesLocal?: number | null;
  golesVisitante?: number | null;
  penalesLocal?: number | null;
  penalesVisitante?: number | null;
  ganador?: string | null;
  // Ids de los partidos cuyos ganadores alimentan este (para dibujar el árbol).
  fuenteLocalId?: number | null;
  fuenteVisitanteId?: number | null;
  // Archivo de bandera de cada equipo (en /public/img/flags), si el equipo está resuelto.
  localBandera?: string | null;
  visitanteBandera?: string | null;
  // El partido aún no tiene definidos sus dos participantes (salen del árbol).
  porDefinirse: boolean;
}

export interface BracketRondaDto {
  ronda: string;
  partidos: BracketPartidoDto[];
}

export interface BracketPreviewDto {
  torneoId: number;
  rondas: BracketRondaDto[];
}
