import { DateTime } from "luxon";

// El backend SIEMPRE envía y guarda las fechas en UTC. En la app se muestran en
// hora de Tegucigalpa (Honduras, UTC-6 todo el año). Estas utilidades centralizan
// la conversión para usarse en todas las pantallas.
export const TEGUS_TZ = "America/Tegucigalpa";

// UTC ISO del backend -> texto formateado en hora de Tegucigalpa (para mostrar).
export function fmtTegus(iso: string | null | undefined, formato = "dd/MM/yyyy HH:mm"): string {
  if (!iso) return "—";
  const dt = DateTime.fromISO(iso, { zone: "utc" }).setZone(TEGUS_TZ);
  return dt.isValid ? dt.toFormat(formato) : "—";
}

// UTC ISO del backend -> valor para un <input type="datetime-local"> en hora de
// Tegucigalpa (yyyy-MM-ddTHH:mm), para que el usuario edite en su hora local.
export function utcIsoToTegusInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const dt = DateTime.fromISO(iso, { zone: "utc" }).setZone(TEGUS_TZ);
  return dt.isValid ? dt.toFormat("yyyy-MM-dd'T'HH:mm") : "";
}

// Valor de un <input type="datetime-local"> (hora de Tegucigalpa) -> UTC ISO,
// para enviarlo al backend (que lo guarda en UTC).
export function tegusInputToUtcIso(input: string | null | undefined): string {
  if (!input) return "";
  const dt = DateTime.fromISO(input, { zone: TEGUS_TZ }).toUTC();
  return dt.isValid ? dt.toISO() ?? "" : "";
}
