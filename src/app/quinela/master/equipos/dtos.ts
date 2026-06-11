export interface EquipoDto {
  id: number;
  nombre: string;
  confederacion: string;
  anfitrion: boolean;
  urlBandera?: string;
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
