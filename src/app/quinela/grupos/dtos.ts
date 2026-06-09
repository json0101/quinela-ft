export interface GrupoEquipoTablaDto {
  equipoId: number;
  equipo: string;
  urlBandera?: string;
  posicion: number;
  pts: number;
  gf: number;
  gc: number;
  diff: number;
}

export interface GrupoTablaDto {
  id: number;
  nombre: string;
  equipos: GrupoEquipoTablaDto[];
}
