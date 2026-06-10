import { describe, it, expect } from "vitest";
import { PartidoCalendarioDto, PrediccionResumenDto } from "./dtos";
import { sanitizeScore, decideSave, estadoPrediccion, buildDrafts } from "./logic";

const pred = (t1: number | null, t2: number | null): PrediccionResumenDto => ({
  id: 1,
  team1Resultado: t1,
  team2Resultado: t2,
});

describe("sanitizeScore", () => {
  it("deja vacío lo no numérico y lo vacío", () => {
    expect(sanitizeScore("")).toBe("");
    expect(sanitizeScore("abc")).toBe("");
  });
  it("acepta 0 (para 0-0)", () => {
    expect(sanitizeScore("0")).toBe("0");
  });
  it("limita a 2 dígitos / tope 99", () => {
    expect(sanitizeScore("5")).toBe("5");
    expect(sanitizeScore("12")).toBe("12");
    expect(sanitizeScore("123")).toBe("12"); // se queda con los 2 primeros
    expect(sanitizeScore("99")).toBe("99");
  });
  it("filtra caracteres no numéricos intercalados", () => {
    expect(sanitizeScore("1a2")).toBe("12");
    expect(sanitizeScore("-3")).toBe("3");
  });
});

describe("decideSave", () => {
  it("ambos vacíos sin predicción -> none", () => {
    expect(decideSave({ local: "", visitante: "" }, null)).toEqual({ kind: "none" });
  });
  it("ambos vacíos con predicción -> delete (vaciar borra)", () => {
    expect(decideSave({ local: "", visitante: "" }, pred(2, 1))).toEqual({ kind: "delete" });
  });
  it("solo local sin predicción -> save con visitante null", () => {
    expect(decideSave({ local: "2", visitante: "" }, null)).toEqual({
      kind: "save",
      team1: 2,
      team2: null,
    });
  });
  it("igual a lo guardado -> none (no reenvía)", () => {
    expect(decideSave({ local: "2", visitante: "1" }, pred(2, 1))).toEqual({ kind: "none" });
  });
  it("0-0 igual a lo guardado -> none", () => {
    expect(decideSave({ local: "0", visitante: "0" }, pred(0, 0))).toEqual({ kind: "none" });
  });
  it("completar el visitante sobre una predicción parcial -> save", () => {
    expect(decideSave({ local: "2", visitante: "1" }, pred(2, null))).toEqual({
      kind: "save",
      team1: 2,
      team2: 1,
    });
  });
  it("cambia un valor -> save", () => {
    expect(decideSave({ local: "3", visitante: "1" }, pred(2, 1))).toEqual({
      kind: "save",
      team1: 3,
      team2: 1,
    });
  });
});

describe("estadoPrediccion", () => {
  it("guardando", () => {
    expect(estadoPrediccion({ local: "2", visitante: "1" }, null, "saving").color).toBe("info");
  });
  it("nada ingresado -> rojo 'no ingresada'", () => {
    const e = estadoPrediccion({ local: "", visitante: "" }, null, undefined);
    expect(e).toEqual({ label: "Predicción no ingresada", color: "error" });
  });
  it("falta visitante -> rojo", () => {
    expect(estadoPrediccion({ local: "2", visitante: "" }, null, undefined)).toEqual({
      label: "Ingrese el resultado del visitante",
      color: "error",
    });
  });
  it("falta local -> rojo", () => {
    expect(estadoPrediccion({ local: "", visitante: "1" }, null, undefined)).toEqual({
      label: "Ingrese el resultado del local",
      color: "error",
    });
  });
  it("error al guardar -> rojo", () => {
    expect(estadoPrediccion({ local: "2", visitante: "1" }, null, "error").color).toBe("error");
  });
  it("verde SOLO si coincide con lo guardado en server", () => {
    expect(estadoPrediccion({ local: "2", visitante: "1" }, pred(2, 1), undefined)).toEqual({
      label: "Predicción guardada",
      color: "success",
    });
  });
  it("completo pero aún no confirmado por server -> warning 'Sin guardar'", () => {
    // escrito 2-1 pero el server todavía tiene 2-0
    expect(estadoPrediccion({ local: "2", visitante: "1" }, pred(2, 0), undefined)).toEqual({
      label: "Sin guardar",
      color: "warning",
    });
  });
  it("completo sin predicción guardada -> warning", () => {
    expect(estadoPrediccion({ local: "2", visitante: "1" }, null, undefined).color).toBe("warning");
  });
});

describe("buildDrafts", () => {
  const partido = (id: number, prediccion: PrediccionResumenDto | null): PartidoCalendarioDto => ({
    id,
    fechaPartido: "2026-06-11T00:00:00Z",
    grupo: "A",
    estado: "P",
    local: { id: 1, nombre: "México" },
    visitante: { id: 2, nombre: "Sudáfrica" },
    prediccion,
  });

  it("predicción completa -> strings", () => {
    const d = buildDrafts([partido(1, pred(2, 1))]);
    expect(d[1]).toEqual({ local: "2", visitante: "1" });
  });
  it("predicción parcial (visitante null) NO muestra 'null'", () => {
    const d = buildDrafts([partido(1, pred(2, null))]);
    expect(d[1]).toEqual({ local: "2", visitante: "" });
  });
  it("0-0 se conserva como '0'", () => {
    const d = buildDrafts([partido(1, pred(0, 0))]);
    expect(d[1]).toEqual({ local: "0", visitante: "0" });
  });
  it("sin predicción -> ambos vacíos", () => {
    const d = buildDrafts([partido(1, null)]);
    expect(d[1]).toEqual({ local: "", visitante: "" });
  });
});
