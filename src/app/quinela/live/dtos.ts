export interface QuinielaOption {
  id: number;
  nombre: string;
}

export interface EquipoLive {
  id: number;
  nombre: string;
  urlBandera?: string;
}

// Subconjunto de PartidoCalendarioDto que devuelve /partidos.
export interface PartidoLive {
  id: number;
  fechaPartido: string;
  estado: string; // 'P' | 'E' | 'T'
  local: EquipoLive;
  visitante: EquipoLive;
  resultadoLocal?: number | null;
  resultadoVisitante?: number | null;
}

export interface PrediccionLive {
  username: string;
  team1Resultado: number | null;
  team2Resultado: number | null;
}
