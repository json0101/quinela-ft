import { describe, it, expect } from "vitest";
import { UsuarioQuinielaDto, QuinielaOption } from "./dtos";
import {
  quinielaIdsConAcceso,
  quinielasVisiblesParaUsuario,
  quinielasAsignables,
} from "./logic";

// Mismo escenario que el seed del backend: Jason (1) -> 1,2,3; Elmer (2) -> solo 2 (Tegra).
const acceso = (userId: number, quinielaId: number, active = true): UsuarioQuinielaDto => ({
  id: userId * 10 + quinielaId,
  userId,
  userName: userId === 1 ? "jason.hernandez" : "elmer.romero",
  email: "",
  quinielaId,
  quiniela: "",
  active,
});

const QUINIELAS: QuinielaOption[] = [
  { id: 1, nombre: "Quiniela Cattrachas" },
  { id: 2, nombre: "Quiniela Tegra" },
  { id: 3, nombre: "Quiniela Impex" },
];

const ACCESOS: UsuarioQuinielaDto[] = [
  acceso(1, 1),
  acceso(1, 2),
  acceso(1, 3),
  acceso(2, 2),
];

describe("quinielaIdsConAcceso", () => {
  it("Elmer solo tiene la quiniela 2 (Tegra)", () => {
    expect(quinielaIdsConAcceso(ACCESOS, 2)).toEqual([2]);
  });
  it("Jason tiene las 3", () => {
    expect(quinielaIdsConAcceso(ACCESOS, 1).sort()).toEqual([1, 2, 3]);
  });
  it("ignora accesos inactivos", () => {
    const conInactivo = [...ACCESOS, acceso(2, 1, false)];
    expect(quinielaIdsConAcceso(conInactivo, 2)).toEqual([2]);
  });
  it("usuario sin accesos no tiene ninguna", () => {
    expect(quinielaIdsConAcceso(ACCESOS, 999)).toEqual([]);
  });
});

describe("quinielasVisiblesParaUsuario", () => {
  it("Elmer solo ve la quiniela Tegra", () => {
    const vis = quinielasVisiblesParaUsuario(QUINIELAS, ACCESOS, 2);
    expect(vis.map((q) => q.nombre)).toEqual(["Quiniela Tegra"]);
  });
  it("Jason ve las 3 quinielas", () => {
    const vis = quinielasVisiblesParaUsuario(QUINIELAS, ACCESOS, 1);
    expect(vis.map((q) => q.id).sort()).toEqual([1, 2, 3]);
  });
  it("un acceso inactivo no hace visible la quiniela", () => {
    const conInactivo = [...ACCESOS, acceso(2, 1, false)];
    const vis = quinielasVisiblesParaUsuario(QUINIELAS, conInactivo, 2);
    expect(vis.map((q) => q.id)).toEqual([2]);
  });
  it("usuario sin accesos no ve ninguna", () => {
    expect(quinielasVisiblesParaUsuario(QUINIELAS, ACCESOS, 999)).toEqual([]);
  });
});

describe("quinielasAsignables", () => {
  it("a Elmer solo se le pueden asignar las que aún no tiene (1 y 3)", () => {
    const asign = quinielasAsignables(QUINIELAS, ACCESOS, 2);
    expect(asign.map((q) => q.id)).toEqual([1, 3]);
  });
  it("al editar conserva la quiniela actual aunque ya la tenga", () => {
    const asign = quinielasAsignables(QUINIELAS, ACCESOS, 2, 2);
    expect(asign.map((q) => q.id).sort()).toEqual([1, 2, 3]);
  });
  it("a Jason no se le puede asignar ninguna nueva", () => {
    expect(quinielasAsignables(QUINIELAS, ACCESOS, 1)).toEqual([]);
  });
});
