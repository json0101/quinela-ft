export interface EquipoDto {
  id: number;
  nombre: string;
  confederacion: string;
  anfitrion: boolean;
  active: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
