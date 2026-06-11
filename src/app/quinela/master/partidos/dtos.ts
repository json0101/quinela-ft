export interface PartidoAdminDto {
  id: number;
  fechaPartido: string;
  torneoId: number;
  torneo: string;
  grupoId: number;
  grupo: string;
  equipoLocalId: number;
  equipoLocal: string;
  equipoVisitanteId: number;
  equipoVisitante: string;
  tipoPartidoId: number;
  tipoPartido: string;
  resultadoLocal?: number | null;
  resultadoVisitante?: number | null;
  ptsLocal?: number | null;
  ptsVisitante?: number | null;
  estado: string; // 'P' previa | 'E' en curso | 'T' terminado
  active: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface TorneoOption {
  id: number;
  descripcion: string;
}

export interface GrupoOption {
  id: number;
  nombre: string;
  torneoId: number;
}

export interface EquipoOption {
  id: number;
  nombre: string;
  torneoId: number;
}

export interface TipoPartidoOption {
  id: number;
  descripcion: string;
}
