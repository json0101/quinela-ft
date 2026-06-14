import { RankingDto } from "./dtos";

export type Medalla = "oro" | "plata" | "bronce";

// La posición la calcula el backend (ranking de competición estándar, aplicando
// el criterio de desempate: pts, luego exactos, luego atinados). Aquí solo
// mapeamos posición -> medalla: oro (1), plata (2), bronce (3).
//
// Como los empatados comparten posición, TODOS los que queden en 1/2/3 reciben
// la misma medalla (p. ej. cuatro empatados en 2º => los cuatro llevan plata).
// Y como las posiciones consumidas por empates se saltan, puede no haber plata
// (dos en 1º => el siguiente es 3º = bronce) ni bronce (uno en 1º + cuatro en
// 2º => la siguiente posición sería la 6ª).
export function medallaPorPosicion(posicion: number): Medalla | null {
  switch (posicion) {
    case 1:
      return "oro";
    case 2:
      return "plata";
    case 3:
      return "bronce";
    default:
      return null;
  }
}

// Medalla por cada fila del ranking (en el mismo orden que llega).
export function medallasDelRanking(rows: Pick<RankingDto, "posicion">[]): (Medalla | null)[] {
  return rows.map((r) => medallaPorPosicion(r.posicion));
}

// Estilo de cada medalla (MUI Chip color no incluye dorado/plateado/bronce, así
// que usamos colores propios vía sx).
export const MEDALLA_ESTILO: Record<Medalla, { label: string; bg: string; fg: string }> = {
  oro: { label: "Oro", bg: "#FFD700", fg: "#4a3b00" },
  plata: { label: "Plata", bg: "#C0C0C0", fg: "#2b2b2b" },
  bronce: { label: "Bronce", bg: "#CD7F32", fg: "#2e1a00" },
};
