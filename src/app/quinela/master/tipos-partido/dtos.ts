export interface TipoPartidoDto {
  id: number;
  descripcion: string;
  ptsPartidoVictoria: number;
  ptsPartidoEmpate: number;
  ptsQuinelaResultadoExacto: number;
  ptsQuinelaResultadoAcertado: number;
  active: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}
