export interface UsuarioQuinielaDto {
  id: number;
  userId: number;
  userName: string;
  email: string;
  quinielaId: number;
  quiniela: string;
  active: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UsuarioOption {
  userId: number;
  userName: string;
  email: string;
}

export interface QuinielaOption {
  id: number;
  nombre: string;
}
