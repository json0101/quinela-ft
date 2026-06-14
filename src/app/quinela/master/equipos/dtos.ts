export interface EquipoDto {
  id: number;
  nombre: string;
  confederacion: string;
  anfitrion: boolean;
  urlBandera?: string;
  // Ids del API externo (worldcup26.ir) para sincronizar resultados.
  equipoIdApi?: string;
  equipoIdApiLargo?: string;
  torneoId: number;
  torneo: string;
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
