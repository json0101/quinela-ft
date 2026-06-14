import { describe, it, expect } from "vitest";
import { medallaPorPosicion, medallasDelRanking } from "./logic";

// La posición la asigna el backend (ranking de competición estándar con el
// criterio de desempate). Aquí verificamos que el FT muestre la medalla correcta
// para cada posición, incluyendo los empates: oro=1, plata=2, bronce=3.
const conPosiciones = (...posiciones: number[]) => posiciones.map((posicion) => ({ posicion }));

describe("medallaPorPosicion", () => {
  it("oro/plata/bronce para 1/2/3 y nada de 4 en adelante", () => {
    expect(medallaPorPosicion(1)).toBe("oro");
    expect(medallaPorPosicion(2)).toBe("plata");
    expect(medallaPorPosicion(3)).toBe("bronce");
    expect(medallaPorPosicion(4)).toBeNull();
    expect(medallaPorPosicion(6)).toBeNull();
  });
});

describe("medallasDelRanking", () => {
  it("5 empatados en pts: uno con más exactos va 1º (oro), los otros 4 comparten 2º (plata), sin bronce", () => {
    // Mismo escenario del test del BK: ganador (5 pts, 2 exactos) en posición 1
    // y los otros 4 (5 pts a puro acertado) empatados en posición 2.
    const medallas = medallasDelRanking(conPosiciones(1, 2, 2, 2, 2));
    expect(medallas).toEqual(["oro", "plata", "plata", "plata", "plata"]);
    expect(medallas).not.toContain("bronce");
  });

  it("sin empates (15,14,13 pts): oro, plata, bronce", () => {
    expect(medallasDelRanking(conPosiciones(1, 2, 3))).toEqual(["oro", "plata", "bronce"]);
  });

  it("dos empatados en 1º (15,15) + uno en 14: dos oros y el tercero bronce (no plata)", () => {
    // El tercero no puede ser 2º porque hay dos en 1º: salta a la posición 3.
    const medallas = medallasDelRanking(conPosiciones(1, 1, 3));
    expect(medallas).toEqual(["oro", "oro", "bronce"]);
    expect(medallas).not.toContain("plata");
  });

  it("25 (oro), 20 (plata) y tres empatados en 3º: los tres con bronce", () => {
    expect(medallasDelRanking(conPosiciones(1, 2, 3, 3, 3))).toEqual([
      "oro",
      "plata",
      "bronce",
      "bronce",
      "bronce",
    ]);
  });
});
