export interface FaseDto {
  id: number;
  descripcion: string;
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
