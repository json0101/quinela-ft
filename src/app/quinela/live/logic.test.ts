import { describe, it, expect } from "vitest";
import { categoriaPrediccion, estadoLabel, marcador } from "./logic";

const pred = (t1: number | null, t2: number | null) => ({ team1Resultado: t1, team2Resultado: t2 });

describe("categoriaPrediccion", () => {
  it("null si el partido no tiene resultado", () => {
    expect(categoriaPrediccion(pred(2, 1), null, null)).toBeNull();
  });
  it("null si la predicción está incompleta", () => {
    expect(categoriaPrediccion(pred(2, null), 2, 1)).toBeNull();
  });
  it("exacto cuando coincide el marcador", () => {
    expect(categoriaPrediccion(pred(2, 1), 2, 1)).toBe("exacto");
  });
  it("acertado cuando coincide solo el ganador", () => {
    expect(categoriaPrediccion(pred(3, 1), 2, 1)).toBe("acertado");
  });
  it("acertado cuando ambos predicen empate (distinto marcador)", () => {
    expect(categoriaPrediccion(pred(0, 0), 1, 1)).toBe("acertado");
  });
  it("ninguno cuando falla el ganador", () => {
    expect(categoriaPrediccion(pred(0, 2), 2, 1)).toBe("ninguno");
  });
});

describe("estadoLabel", () => {
  it("traduce los estados", () => {
    expect(estadoLabel("P")).toBe("Previa");
    expect(estadoLabel("E")).toBe("En curso");
    expect(estadoLabel("T")).toBe("Terminado");
  });
});

describe("marcador", () => {
  it("muestra el marcador o guion", () => {
    expect(marcador({ resultadoLocal: 2, resultadoVisitante: 1 })).toBe("2 - 1");
    expect(marcador({ resultadoLocal: null, resultadoVisitante: null })).toBe("—");
  });
});
