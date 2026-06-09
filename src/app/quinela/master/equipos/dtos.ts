export interface EquipoDto {
  id: number;
  nombre: string;
  confederacion: string;
  anfitrion: boolean;
  urlBandera?: string;
  active: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
