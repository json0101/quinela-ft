"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTime } from "luxon";
import config_local from "@/app/global-configuration/config-local";
import { EquipoCalendarioDto, PartidoCalendarioDto, QuinielaOption } from "../dtos";
import {
  Draft,
  SaveStatus,
  buildDrafts,
  sanitizeScore,
  decideSave,
  estadoPrediccion,
} from "../logic";

// Colores del Mundial para los puntos: verde (exacto), azul (acertado), rojo (sin puntos).
const PTS_COLOR: Record<string, string> = {
  exacto: "#1B8A3A",
  acertado: "#0A3D91",
  ninguno: "#E4002B",
};

function estadoChip(estado: string): { label: string; color: "default" | "info" | "success" } {
  switch (estado) {
    case "E":
      return { label: "En vivo", color: "success" };
    case "T":
      return { label: "Finalizado", color: "default" };
    default:
      return { label: "No iniciado", color: "info" };
  }
}

// Bandera arriba y nombre debajo.
function Equipo({ equipo }: { equipo: EquipoCalendarioDto }) {
  return (
    <Stack sx={{ alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
      {equipo.urlBandera ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/img/flags/${equipo.urlBandera}`}
          alt={equipo.nombre}
          width={48}
          height={34}
          style={{ objectFit: "cover", border: "1px solid #eee", borderRadius: 4 }}
        />
      ) : (
        <Box sx={{ width: 48, height: 34, bgcolor: "action.hover", borderRadius: 1 }} />
      )}
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
        {equipo.nombre}
      </Typography>
    </Stack>
  );
}

export default function CalendarioClient({
  initial,
  fechaDefault,
  quinielas,
  quinielaIdInicial,
}: {
  initial: PartidoCalendarioDto[];
  fechaDefault: string;
  quinielas: QuinielaOption[];
  quinielaIdInicial: number;
}) {
  // Default: el día de hoy (viene del server para evitar desfase de zona horaria).
  const hoy = fechaDefault ? DateTime.fromISO(fechaDefault) : DateTime.now();
  const [partidos, setPartidos] = useState<PartidoCalendarioDto[]>(initial);
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() => buildDrafts(initial));
  const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({});
  const [quinielaId, setQuinielaId] = useState<number>(quinielaIdInicial);
  const [desde, setDesde] = useState<DateTime | null>(hoy);
  const [hasta, setHasta] = useState<DateTime | null>(hoy);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  // Refs siempre con el último estado, para que el guardado con debounce lea valores frescos.
  const partidosRef = useRef(partidos);
  const draftsRef = useRef(drafts);
  const quinielaIdRef = useRef(quinielaId);
  const mountedRef = useRef(true);
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  useEffect(() => { partidosRef.current = partidos; }, [partidos]);
  useEffect(() => { draftsRef.current = drafts; }, [drafts]);
  useEffect(() => { quinielaIdRef.current = quinielaId; }, [quinielaId]);

  // Borra (soft delete) la predicción. Usado por el botón y al vaciar ambos campos.
  const eliminarPrediccion = async (partidoId: number, prediccionId: number) => {
    try {
      const res = await fetch(`/quinela/calendario/api/prediccion/${prediccionId}`, { method: "DELETE" });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(e.message ?? "Error al limpiar");
      }
      if (mountedRef.current) {
        setPartidos((cur) => cur.map((x) => (x.id === partidoId ? { ...x, prediccion: null } : x)));
        setDrafts((prev) => ({ ...prev, [partidoId]: { local: "", visitante: "" } }));
        setSaveStatus((prev) => {
          const n = { ...prev };
          delete n[partidoId];
          return n;
        });
        setToast({ msg: "Predicción eliminada", sev: "success" });
      }
    } catch (err) {
      if (mountedRef.current) setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    }
  };

  // Crea/actualiza/borra según corresponda. No bloquea los inputs (corre en segundo plano).
  const guardarPrediccion = async (partidoId: number) => {
    const p = partidosRef.current.find((x) => x.id === partidoId);
    if (!p || p.estado !== "P") return;

    const draft = draftsRef.current[partidoId] ?? { local: "", visitante: "" };
    const action = decideSave(draft, p.prediccion ?? null);

    if (action.kind === "none") return;
    if (action.kind === "delete") {
      await eliminarPrediccion(partidoId, p.prediccion!.id);
      return;
    }

    if (mountedRef.current) setSaveStatus((prev) => ({ ...prev, [partidoId]: "saving" }));
    try {
      const res = await fetch("/quinela/calendario/api/prediccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quinielaId: quinielaIdRef.current, partidoId, team1Resultado: action.team1, team2Resultado: action.team2 }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(e.message ?? "Error al guardar");
      }
      const saved = (await res.json()) as { id: number; team1Resultado: number | null; team2Resultado: number | null };
      if (mountedRef.current) {
        setPartidos((cur) =>
          cur.map((x) =>
            x.id === partidoId
              ? { ...x, prediccion: { id: saved.id, team1Resultado: saved.team1Resultado, team2Resultado: saved.team2Resultado } }
              : x,
          ),
        );
        setSaveStatus((prev) => {
          const n = { ...prev };
          delete n[partidoId];
          return n;
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setSaveStatus((prev) => ({ ...prev, [partidoId]: "error" }));
        setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
      }
    }
  };

  // Guarda de inmediato todos los pendientes (antes de filtrar/recargar) para no perder nada.
  const flushPendientes = async () => {
    const ids = Object.keys(timersRef.current).map(Number);
    ids.forEach((id) => {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    });
    await Promise.all(ids.map((id) => guardarPrediccion(id)));
  };

  // Al desmontar: marca desmontado y FLUSHEA lo pendiente (el fetch persiste aunque el
  // componente se vaya), evitando perder lo que el usuario alcanzó a escribir.
  useEffect(() => {
    mountedRef.current = true; // re-arma en (re)montaje, incluido el doble montaje de StrictMode
    const timers = timersRef.current;
    return () => {
      mountedRef.current = false;
      Object.entries(timers).forEach(([id, t]) => {
        clearTimeout(t);
        delete timers[Number(id)];
        void guardarPrediccion(Number(id));
      });
    };
    // Solo al desmontar; guardarPrediccion lee datos vía refs, así que el closure inicial es válido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargar = async (d: DateTime | null, h: DateTime | null, qid: number = quinielaIdRef.current) => {
    await flushPendientes(); // persistir pendientes antes de recargar

    if (d && h && d.toMillis() > h.toMillis()) {
      setToast({ msg: "La fecha 'Desde' no puede ser mayor que 'Hasta'.", sev: "error" });
      return;
    }
    if (!qid) {
      setPartidos([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("quinielaId", String(qid));
      const dIso = d?.toISODate();
      const hIso = h?.toISODate();
      if (dIso) params.set("desde", dIso);
      if (hIso) params.set("hasta", hIso);
      const res = await fetch(`/quinela/calendario/api?${params.toString()}`);
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(e.message ?? "Error al filtrar");
      }
      const data = (await res.json()) as PartidoCalendarioDto[];
      setPartidos(data);
      setDrafts(buildDrafts(data));
      setSaveStatus({});
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltro = () => {
    setDesde(null);
    setHasta(null);
    void cargar(null, null);
  };

  const cambiarQuiniela = (qid: number) => {
    setQuinielaId(qid);
    quinielaIdRef.current = qid;
    void cargar(desde, hasta, qid);
  };

  const setDraft = (id: number, campo: keyof Draft, valor: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: sanitizeScore(valor) } }));
    // Guarda solo después de que el usuario deja de escribir (no bloquea el input).
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    timersRef.current[id] = setTimeout(() => {
      delete timersRef.current[id];
      void guardarPrediccion(id);
    }, 700);
  };

  const onLimpiarBoton = async (p: PartidoCalendarioDto) => {
    if (!p.prediccion) return;
    if (timersRef.current[p.id]) {
      clearTimeout(timersRef.current[p.id]);
      delete timersRef.current[p.id];
    }
    setSavingId(p.id);
    await eliminarPrediccion(p.id, p.prediccion.id);
    if (mountedRef.current) setSavingId(null);
  };

  const scoreInputSx = { width: 56, "& input": { textAlign: "center", px: 0.5 } } as const;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Calendario · Mundial 2026
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Fechas y enfrentamientos. Ingresa tu predicción en los partidos en previa.
      </Typography>

      {/* Selector de quiniela + filtro por rango de fecha del partido. */}
      <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale="es">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 1.5, alignItems: { sm: "center" }, mb: 3, flexWrap: "wrap" }}
        >
          <TextField
            select
            label="Quiniela"
            size="small"
            value={quinielas.length ? quinielaId : ""}
            onChange={(e) => cambiarQuiniela(Number(e.target.value))}
            sx={{ minWidth: 200 }}
          >
            {quinielas.map((q) => (
              <MenuItem key={q.id} value={q.id}>{q.nombre}</MenuItem>
            ))}
          </TextField>
          <DatePicker
            label="Desde"
            value={desde}
            onChange={(v) => setDesde(v)}
            format="dd/MM/yyyy"
            maxDate={hasta ?? undefined}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="Hasta"
            value={hasta}
            onChange={(v) => setHasta(v)}
            format="dd/MM/yyyy"
            minDate={desde ?? undefined}
            slotProps={{ textField: { size: "small" } }}
          />
          <Button variant="contained" onClick={() => cargar(desde, hasta)} disabled={loading}>
            Filtrar
          </Button>
          <Button variant="text" onClick={limpiarFiltro} disabled={loading}>
            Limpiar
          </Button>
        </Stack>
      </LocalizationProvider>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        {partidos.map((p) => {
          const chip = estadoChip(p.estado);
          // Se muestra en UTC para que el día de la tarjeta coincida con el del filtro.
          const fecha = DateTime.fromISO(p.fechaPartido, { zone: "utc" }).toFormat(config_local.format_date);
          const enPrevia = p.estado === "P";
          const draft = drafts[p.id] ?? { local: "", visitante: "" };
          const ep = enPrevia ? estadoPrediccion(draft, p.prediccion ?? null, saveStatus[p.id]) : null;

          return (
            <Card key={p.id} variant="outlined">
              <CardContent>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {fecha}
                  </Typography>
                  <Stack direction="row" sx={{ gap: 0.5 }}>
                    <Chip label={`Grupo ${p.grupo}`} size="small" variant="outlined" />
                    <Chip label={chip.label} size="small" color={chip.color} />
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 1.5 }} />

                <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1 }}>
                  <Equipo equipo={p.local} />

                  {enPrevia ? (
                    // Inputs de predicción: local a la derecha de su bandera, visitante a la izquierda.
                    <>
                      <TextField
                        type="text"
                        size="small"
                        value={draft.local}
                        onChange={(e) => setDraft(p.id, "local", e.target.value)}
                        sx={{ ...scoreInputSx, alignSelf: "center" }}
                        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 2, pattern: "[0-9]*" } }}
                      />
                      <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 700, alignSelf: "center" }}>
                        VS
                      </Typography>
                      <TextField
                        type="text"
                        size="small"
                        value={draft.visitante}
                        onChange={(e) => setDraft(p.id, "visitante", e.target.value)}
                        sx={{ ...scoreInputSx, alignSelf: "center" }}
                        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 2, pattern: "[0-9]*" } }}
                      />
                    </>
                  ) : (
                    // Resultado real del partido (se actualizará el dato).
                    <Typography variant="h6" sx={{ fontWeight: 800, alignSelf: "center", px: 1, whiteSpace: "nowrap" }}>
                      {p.resultadoLocal ?? "—"} <span style={{ color: "#9e9e9e" }}>-</span> {p.resultadoVisitante ?? "—"}
                    </Typography>
                  )}

                  <Equipo equipo={p.visitante} />
                </Stack>

                {enPrevia ? (
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 1.5, gap: 1 }}>
                    <Chip size="small" label={ep!.label} color={ep!.color} variant="filled" />
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => onLimpiarBoton(p)}
                      disabled={savingId === p.id || !p.prediccion}
                    >
                      Limpiar predicción
                    </Button>
                  </Stack>
                ) : (
                  // Footer: predicción guardada + puntos ganados (colores del mundial).
                  <Box sx={{ mt: 1.5 }}>
                    <Divider sx={{ mb: 1 }} />
                    {p.prediccion ? (
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Predicción guardada:{" "}
                          <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                            {p.prediccion.team1Resultado ?? "—"} - {p.prediccion.team2Resultado ?? "—"}
                          </Box>
                        </Typography>
                        {p.categoriaPuntos ? (
                          <Chip
                            size="small"
                            label={`${p.puntosGanados ?? 0} pts`}
                            sx={{ bgcolor: PTS_COLOR[p.categoriaPuntos], color: "#fff", fontWeight: 700 }}
                          />
                        ) : null}
                      </Stack>
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Sin predicción
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}

        {partidos.length === 0 && (
          <Typography color="text.secondary">No hay partidos para mostrar.</Typography>
        )}
      </Box>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? (
          <Alert severity={toast.sev} onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
