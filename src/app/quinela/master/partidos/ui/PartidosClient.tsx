"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import {
  PartidoAdminDto,
  TorneoOption,
  GrupoOption,
  EquipoOption,
  TipoPartidoOption,
  FaseOption,
} from "../dtos";
import { fmtTegus, utcIsoToTegusInput, tegusInputToUtcIso } from "@/app/global-configuration/fechas";

interface FormValues {
  fechaPartido: string;
  torneoId: number;
  grupoId: number;
  faseId: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  tipoPartidoId: number;
  estado: string;
  resultadoLocal: number | "";
  resultadoVisitante: number | "";
  partidoIdApi: string;
  active: boolean;
  // "Por definirse": el partido de eliminatoria se arma solo del árbol (sin grupo/equipos).
  porDefinirse: boolean;
  // ¿Aplica definición por penales? (solo eliminatoria).
  aplicaDefinicionPenales: boolean;
  // Definición de eliminatoria (solo se usan cuando la fase no es "Grupos").
  partidoSeDefiniraEnPenales: "" | "true" | "false";
  penalesAnotadosLocal: number | "";
  penalesAnotadosVisitante: number | "";
  equipoGanadorId: number; // 0 = sin definir
  partidoGanadorLocalId: number; // 0 = sin definir
  partidoGanadorVisitanteId: number; // 0 = sin definir
}

// La fase "Grupos" usa la lógica clásica; cualquier otra fase es eliminatoria
// (habilita penales / equipo ganador / árbol). Espeja al backend (FasesConocidas).
const esFaseGrupos = (f?: FaseOption) => (f?.descripcion ?? "").trim().toLowerCase() === "grupos";
const faseDefaultDe = (fases: FaseOption[], torneoId: number) => {
  const de = fases.filter((f) => f.torneoId === torneoId);
  return (de.find(esFaseGrupos) ?? de[0])?.id ?? 0;
};

const DEFINIRA_PENALES_OPCIONES = [
  { value: "", label: "Sin definir" },
  { value: "true", label: "Sí" },
  { value: "false", label: "No" },
];

const ESTADO_OPCIONES = [
  { value: "P", label: "Previa" },
  { value: "E", label: "En curso" },
  { value: "T", label: "Terminado" },
];

const ESTADOS: Record<string, { label: string; color: "default" | "warning" | "success" }> = {
  P: { label: "Previa", color: "default" },
  E: { label: "En curso", color: "warning" },
  T: { label: "Terminado", color: "success" },
};


export default function PartidosClient({
  initial,
  torneos,
  grupos,
  equipos,
  tipos,
  fases,
}: {
  initial: PartidoAdminDto[];
  torneos: TorneoOption[];
  grupos: GrupoOption[];
  equipos: EquipoOption[];
  tipos: TipoPartidoOption[];
  fases: FaseOption[];
}) {
  const router = useRouter();
  const theme = useTheme();
  // En móvil el formulario va a pantalla completa para capturar cómodamente.
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartidoAdminDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  // Filtro por equipo (solo en cliente, sobre los partidos ya cargados).
  const [filtro, setFiltro] = useState("");
  const partidosFiltrados = filtro.trim()
    ? initial.filter((p) =>
        `${p.equipoLocal ?? ""} ${p.equipoVisitante ?? ""}`.toLowerCase().includes(filtro.trim().toLowerCase()))
    : initial;

  const defaultTorneo = torneos[0]?.id ?? 0;
  const faltanCatalogos = torneos.length === 0 || grupos.length === 0 || equipos.length < 2 || tipos.length === 0;

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        fechaPartido: "",
        torneoId: defaultTorneo,
        grupoId: 0,
        faseId: faseDefaultDe(fases, defaultTorneo),
        equipoLocalId: 0,
        equipoVisitanteId: 0,
        tipoPartidoId: tipos[0]?.id ?? 0,
        estado: "P",
        resultadoLocal: "",
        resultadoVisitante: "",
        partidoIdApi: "",
        active: true,
        porDefinirse: false,
        aplicaDefinicionPenales: true,
        partidoSeDefiniraEnPenales: "",
        penalesAnotadosLocal: "",
        penalesAnotadosVisitante: "",
        equipoGanadorId: 0,
        partidoGanadorLocalId: 0,
        partidoGanadorVisitanteId: 0,
      },
    });

  const torneoSel = Number(watch("torneoId"));
  const estadoSel = String(watch("estado"));
  const faseSel = Number(watch("faseId"));
  const exigeGoles = estadoSel === "E" || estadoSel === "T";
  const gruposDe = grupos.filter((g) => g.torneoId === torneoSel);
  const equiposDe = equipos.filter((e) => e.torneoId === torneoSel);
  const fasesDe = fases.filter((f) => f.torneoId === torneoSel);
  // Eliminatoria = la fase seleccionada no es "Grupos": habilita los campos extra.
  const esEliminatoria = !esFaseGrupos(fases.find((f) => f.id === faseSel));
  // "Por definirse": solo aplica en eliminatoria; el partido se arma del árbol.
  const porDefinirse = esEliminatoria && Boolean(watch("porDefinirse"));
  // Equipo ya resuelto: el ganador del partido del árbol seleccionado (si ese partido terminó).
  const ganLocalSel = Number(watch("partidoGanadorLocalId"));
  const ganVisitSel = Number(watch("partidoGanadorVisitanteId"));
  const localResuelto = initial.find((p) => p.id === ganLocalSel)?.equipoGanador || "";
  const visitanteResuelto = initial.find((p) => p.id === ganVisitSel)?.equipoGanador || "";
  // Partidos del mismo torneo para armar el árbol (excluye el que se edita).
  const partidosDe = initial.filter((p) => p.torneoId === torneoSel && (!editing || p.id !== editing.id));

  // Al cambiar de torneo, reubica las selecciones dependientes a opciones válidas.
  const onTorneoChange = (id: number) => {
    setValue("torneoId", id);
    const gs = grupos.filter((g) => g.torneoId === id);
    const es = equipos.filter((e) => e.torneoId === id);
    setValue("grupoId", gs[0]?.id ?? 0);
    setValue("faseId", faseDefaultDe(fases, id));
    setValue("equipoLocalId", es[0]?.id ?? 0);
    setValue("equipoVisitanteId", es[1]?.id ?? 0);
    setValue("porDefinirse", false);
  };

  const openNew = () => {
    setEditing(null);
    const gs = grupos.filter((g) => g.torneoId === defaultTorneo);
    const es = equipos.filter((e) => e.torneoId === defaultTorneo);
    reset({
      fechaPartido: "",
      torneoId: defaultTorneo,
      grupoId: gs[0]?.id ?? 0,
      faseId: faseDefaultDe(fases, defaultTorneo),
      equipoLocalId: es[0]?.id ?? 0,
      equipoVisitanteId: es[1]?.id ?? 0,
      tipoPartidoId: tipos[0]?.id ?? 0,
      estado: "P",
      resultadoLocal: "",
      resultadoVisitante: "",
      partidoIdApi: "",
      active: true,
      porDefinirse: false,
      aplicaDefinicionPenales: true,
      partidoSeDefiniraEnPenales: "",
      penalesAnotadosLocal: "",
      penalesAnotadosVisitante: "",
      equipoGanadorId: 0,
      partidoGanadorLocalId: 0,
      partidoGanadorVisitanteId: 0,
    });
    setOpen(true);
  };

  const openEdit = (p: PartidoAdminDto) => {
    setEditing(p);
    reset({
      fechaPartido: utcIsoToTegusInput(p.fechaPartido),
      torneoId: p.torneoId,
      grupoId: p.grupoId,
      faseId: p.faseId,
      equipoLocalId: p.equipoLocalId,
      equipoVisitanteId: p.equipoVisitanteId,
      tipoPartidoId: p.tipoPartidoId,
      estado: p.estado,
      resultadoLocal: p.resultadoLocal ?? "",
      resultadoVisitante: p.resultadoVisitante ?? "",
      partidoIdApi: p.partidoIdApi ?? "",
      active: p.active,
      porDefinirse: p.porDefinirse,
      aplicaDefinicionPenales: p.aplicaDefinicionPenales,
      partidoSeDefiniraEnPenales:
        p.partidoSeDefiniraEnPenales == null ? "" : p.partidoSeDefiniraEnPenales ? "true" : "false",
      penalesAnotadosLocal: p.penalesAnotadosLocal ?? "",
      penalesAnotadosVisitante: p.penalesAnotadosVisitante ?? "",
      equipoGanadorId: p.equipoGanadorId ?? 0,
      partidoGanadorLocalId: p.partidoGanadorLocalId ?? 0,
      partidoGanadorVisitanteId: p.partidoGanadorVisitanteId ?? 0,
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    // "Por definirse": el partido se arma del árbol; no aplican equipos/grupo/estado.
    const porDef = esEliminatoria && values.porDefinirse;
    if (!porDef && Number(values.equipoLocalId) === Number(values.equipoVisitanteId)) {
      setToast({ msg: "El equipo local y el visitante no pueden ser el mismo.", sev: "error" });
      return;
    }
    const jugado = !porDef && (values.estado === "E" || values.estado === "T");
    if (jugado && (values.resultadoLocal === "" || values.resultadoVisitante === "")) {
      setToast({ msg: "Captura los goles de ambos equipos para un partido en curso o terminado.", sev: "error" });
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/quinela/master/partidos/api/${editing.id}` : "/quinela/master/partidos/api";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaPartido: tegusInputToUtcIso(values.fechaPartido),
          torneoId: Number(values.torneoId),
          grupoId: porDef ? null : Number(values.grupoId) || null,
          faseId: Number(values.faseId),
          equipoLocalId: porDef ? null : Number(values.equipoLocalId),
          equipoVisitanteId: porDef ? null : Number(values.equipoVisitanteId),
          tipoPartidoId: Number(values.tipoPartidoId),
          estado: porDef ? "P" : values.estado,
          resultadoLocal: jugado ? Number(values.resultadoLocal) : null,
          resultadoVisitante: jugado ? Number(values.resultadoVisitante) : null,
          partidoIdApi: porDef ? null : values.partidoIdApi.trim() || null,
          active: values.active,
          porDefinirse: porDef,
          // ¿Aplica penales? solo en eliminatoria; en grupos el backend lo guarda false.
          aplicaDefinicionPenales: esEliminatoria ? values.aplicaDefinicionPenales : false,
          // Penales/equipo ganador: solo en eliminatoria con equipos (no en "por definirse").
          partidoSeDefiniraEnPenales:
            porDef || values.partidoSeDefiniraEnPenales === "" ? null : values.partidoSeDefiniraEnPenales === "true",
          penalesAnotadosLocal:
            porDef || values.penalesAnotadosLocal === "" ? null : Number(values.penalesAnotadosLocal),
          penalesAnotadosVisitante:
            porDef || values.penalesAnotadosVisitante === "" ? null : Number(values.penalesAnotadosVisitante),
          equipoGanadorId: porDef ? null : Number(values.equipoGanadorId) || null,
          // El árbol (de qué partidos depende) se manda en ambos modos de eliminatoria.
          partidoGanadorLocalId: Number(values.partidoGanadorLocalId) || null,
          partidoGanadorVisitanteId: Number(values.partidoGanadorVisitanteId) || null,
        }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al guardar");
      }
      setToast({ msg: editing ? "Partido actualizado" : "Partido creado", sev: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p: PartidoAdminDto) => {
    if (!confirm(`¿Eliminar el partido ${p.equipoLocal} vs ${p.equipoVisitante}?`)) return;
    try {
      const res = await fetch(`/quinela/master/partidos/api/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const pl = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(pl.message ?? "Error al eliminar");
      }
      setToast({ msg: "Partido eliminado", sev: "success" });
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    }
  };

  // La fecha viene en UTC del backend; se muestra en hora de Tegucigalpa.
  const fmtFecha = (iso: string) => fmtTegus(iso);
  const fmtResultado = (p: PartidoAdminDto) =>
    p.resultadoLocal != null && p.resultadoVisitante != null
      ? `${p.resultadoLocal} - ${p.resultadoVisitante}`
      : "—";

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Partidos</Typography>
        <Button variant="contained" onClick={openNew} disabled={faltanCatalogos}>Nuevo</Button>
      </Stack>

      {faltanCatalogos && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Para registrar partidos necesitas al menos un torneo, un grupo, dos equipos y un tipo de partido.
        </Alert>
      )}

      <TextField
        size="small"
        fullWidth
        placeholder="Buscar por equipo (local o visitante)…"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: filtro ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="limpiar" onClick={() => setFiltro("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Id</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Fecha</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Grupo</TableCell>
              <TableCell>Local</TableCell>
              <TableCell>Visitante</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Tipo</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Estado</TableCell>
              <TableCell>Resultado</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Activo</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>ID API</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {partidosFiltrados.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5}>
                    <Button size="small" onClick={() => openEdit(p)}>Editar</Button>
                    <Button size="small" color="error" onClick={() => onDelete(p)}>Eliminar</Button>
                  </Stack>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{p.id}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{fmtFecha(p.fechaPartido)}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{p.grupo}</TableCell>
                <TableCell>
                  {p.equipoLocal}
                  {/* En móvil (columnas ocultas) se pliega aquí el detalle del partido. */}
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ display: { xs: "block", md: "none" }, color: "text.secondary" }}
                  >
                    {fmtFecha(p.fechaPartido)} · {p.grupo} · {p.fase} · {p.tipoPartido}
                    <br />
                    {(ESTADOS[p.estado]?.label ?? p.estado)} · {p.active ? "Activo" : "Inactivo"}
                    {p.partidoIdApi ? (
                      <>
                        <br />
                        API: {p.partidoIdApi}
                      </>
                    ) : null}
                  </Typography>
                </TableCell>
                <TableCell>{p.equipoVisitante}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{p.tipoPartido}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <Chip
                    size="small"
                    label={ESTADOS[p.estado]?.label ?? p.estado}
                    color={ESTADOS[p.estado]?.color ?? "default"}
                  />
                </TableCell>
                <TableCell>{fmtResultado(p)}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <Chip size="small" label={p.active ? "Activo" : "Inactivo"} color={p.active ? "success" : "default"} />
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{p.partidoIdApi ?? "—"}</Typography>
                </TableCell>
              </TableRow>
            ))}
            {partidosFiltrados.length === 0 && (
              <TableRow><TableCell colSpan={11} align="center">
                {filtro.trim() ? "Sin partidos para esa búsqueda." : "No hay registros."}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* En celular ocupa toda la pantalla; en computadora es un modal normal.
          El form va en el Paper del Dialog para que DialogContent maneje el
          scroll interno y nunca se desborde la pantalla. */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={fullScreen}
        scroll="paper"
        slotProps={{ paper: { component: "form", onSubmit: handleSubmit(onSubmit) } }}
      >
          <DialogTitle>{editing ? "Editar partido" : "Nuevo partido"}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Fecha y hora (Tegucigalpa)"
                type="datetime-local"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.fechaPartido)}
                helperText={errors.fechaPartido ? "Requerida" : "Hora local de Tegucigalpa; se guarda en UTC."}
                {...register("fechaPartido", { required: true })}
              />
              <Controller
                name="torneoId"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => (
                  <TextField
                    select
                    label="Torneo"
                    fullWidth
                    value={field.value}
                    onChange={(e) => onTorneoChange(Number(e.target.value))}
                  >
                    {torneos.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.descripcion}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              {!porDefinirse && (
                <Controller
                  name="grupoId"
                  control={control}
                  render={({ field }) => (
                    <TextField select label="Grupo (opcional)" fullWidth {...field}>
                      <MenuItem value={0}>— Sin grupo —</MenuItem>
                      {gruposDe.map((g) => (
                        <MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}
              <Controller
                name="faseId"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => (
                  <TextField select label="Fase" fullWidth {...field}>
                    {fasesDe.map((f) => (
                      <MenuItem key={f.id} value={f.id}>{f.descripcion}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              {esEliminatoria && (
                <Controller
                  name="porDefinirse"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />}
                      label="Por definir (se arma del árbol: sin grupo ni equipos)"
                    />
                  )}
                />
              )}
              {!porDefinirse && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Controller
                    name="equipoLocalId"
                    control={control}
                    rules={{ required: true, min: 1 }}
                    render={({ field }) => (
                      <TextField select label="Equipo local" fullWidth {...field}>
                        {equiposDe.map((e) => (
                          <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Controller
                    name="equipoVisitanteId"
                    control={control}
                    rules={{ required: true, min: 1 }}
                    render={({ field }) => (
                      <TextField select label="Equipo visitante" fullWidth {...field}>
                        {equiposDe.map((e) => (
                          <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Stack>
              )}
              <Controller
                name="tipoPartidoId"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => (
                  <TextField select label="Tipo de partido" fullWidth {...field}>
                    {tipos.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.descripcion}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              {!porDefinirse && (
                <Controller
                  name="estado"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField select label="Estado" fullWidth {...field}>
                      {ESTADO_OPCIONES.map((e) => (
                        <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}
              {!porDefinirse && exigeGoles && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Goles local"
                    type="number"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0 } }}
                    {...register("resultadoLocal")}
                  />
                  <TextField
                    label="Goles visitante"
                    type="number"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0 } }}
                    {...register("resultadoVisitante")}
                  />
                </Stack>
              )}
              {esEliminatoria && (
                <Stack spacing={2} sx={{ p: 2, borderRadius: 1, border: 1, borderColor: "divider" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {porDefinirse ? "Árbol de eliminatoria (por definir)" : "Definición de eliminatoria"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {porDefinirse
                      ? "El partido se arma con los ganadores de estos dos partidos; los equipos se resuelven solos."
                      : "Todos los campos son opcionales; déjalos sin definir si aún no aplica."}
                  </Typography>

                  <Controller
                    name="aplicaDefinicionPenales"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />}
                        label="¿Aplica definición por penales?"
                      />
                    )}
                  />

                  {/* El árbol (de qué partidos depende) aplica en ambos modos. */}
                  <Controller
                    name="partidoGanadorLocalId"
                    control={control}
                    render={({ field }) => (
                      <TextField select label="Partido que define al local (árbol)" fullWidth {...field}>
                        <MenuItem value={0}>— Sin definir —</MenuItem>
                        {partidosDe.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{`#${p.id} ${p.equipoLocal || "?"} vs ${p.equipoVisitante || "?"}`}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Typography variant="caption" sx={{ mt: -1, color: localResuelto ? "success.main" : "text.secondary" }}>
                    Equipo local: <b>{localResuelto || "— por definir —"}</b>
                  </Typography>
                  <Controller
                    name="partidoGanadorVisitanteId"
                    control={control}
                    render={({ field }) => (
                      <TextField select label="Partido que define al visitante (árbol)" fullWidth {...field}>
                        <MenuItem value={0}>— Sin definir —</MenuItem>
                        {partidosDe.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{`#${p.id} ${p.equipoLocal || "?"} vs ${p.equipoVisitante || "?"}`}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Typography variant="caption" sx={{ mt: -1, color: visitanteResuelto ? "success.main" : "text.secondary" }}>
                    Equipo visitante: <b>{visitanteResuelto || "— por definir —"}</b>
                  </Typography>

                  {/* Penales y equipo ganador: solo cuando el partido ya tiene equipos. */}
                  {!porDefinirse && (
                    <>
                      <Controller
                        name="equipoGanadorId"
                        control={control}
                        render={({ field }) => (
                          <TextField select label="Equipo ganador" fullWidth {...field}>
                            <MenuItem value={0}>— Sin definir —</MenuItem>
                            {equiposDe.map((e) => (
                              <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                      <Controller
                        name="partidoSeDefiniraEnPenales"
                        control={control}
                        render={({ field }) => (
                          <TextField select label="¿Se definirá en penales?" fullWidth {...field}>
                            {DEFINIRA_PENALES_OPCIONES.map((o) => (
                              <MenuItem key={o.label} value={o.value}>{o.label}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                          label="Penales anotados local"
                          type="number"
                          fullWidth
                          slotProps={{ htmlInput: { min: 0 } }}
                          {...register("penalesAnotadosLocal")}
                        />
                        <TextField
                          label="Penales anotados visitante"
                          type="number"
                          fullWidth
                          slotProps={{ htmlInput: { min: 0 } }}
                          {...register("penalesAnotadosVisitante")}
                        />
                      </Stack>
                    </>
                  )}
                </Stack>
              )}
              {!porDefinirse && (
                <TextField
                  label="ID API (partido)"
                  placeholder="679c9c8a5749c4077500e005"
                  fullWidth
                  helperText="_id del game en worldcup26.ir (para sincronizar resultados)"
                  {...register("partidoIdApi", { maxLength: 40 })}
                />
              )}
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />}
                    label="Activo"
                  />
                )}
              />
              <Alert severity="info">
                {porDefinirse
                  ? "El partido se guardará sin equipos; se llenarán solos cuando se conozcan los ganadores del árbol."
                  : "Al guardar con estado “En curso” o “Terminado” se recalculan automáticamente las posiciones y el ranking."}
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving}>Guardar</Button>
          </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.sev} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
