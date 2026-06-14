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
} from "../dtos";
import { fmtTegus, utcIsoToTegusInput, tegusInputToUtcIso } from "@/app/global-configuration/fechas";

interface FormValues {
  fechaPartido: string;
  torneoId: number;
  grupoId: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  tipoPartidoId: number;
  estado: string;
  resultadoLocal: number | "";
  resultadoVisitante: number | "";
  partidoIdApi: string;
  active: boolean;
}

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
}: {
  initial: PartidoAdminDto[];
  torneos: TorneoOption[];
  grupos: GrupoOption[];
  equipos: EquipoOption[];
  tipos: TipoPartidoOption[];
}) {
  const router = useRouter();
  const theme = useTheme();
  // En móvil el formulario va a pantalla completa para capturar cómodamente.
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartidoAdminDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const defaultTorneo = torneos[0]?.id ?? 0;
  const faltanCatalogos = torneos.length === 0 || grupos.length === 0 || equipos.length < 2 || tipos.length === 0;

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        fechaPartido: "",
        torneoId: defaultTorneo,
        grupoId: 0,
        equipoLocalId: 0,
        equipoVisitanteId: 0,
        tipoPartidoId: tipos[0]?.id ?? 0,
        estado: "P",
        resultadoLocal: "",
        resultadoVisitante: "",
        partidoIdApi: "",
        active: true,
      },
    });

  const torneoSel = Number(watch("torneoId"));
  const estadoSel = String(watch("estado"));
  const exigeGoles = estadoSel === "E" || estadoSel === "T";
  const gruposDe = grupos.filter((g) => g.torneoId === torneoSel);
  const equiposDe = equipos.filter((e) => e.torneoId === torneoSel);

  // Al cambiar de torneo, reubica las selecciones dependientes a opciones válidas.
  const onTorneoChange = (id: number) => {
    setValue("torneoId", id);
    const gs = grupos.filter((g) => g.torneoId === id);
    const es = equipos.filter((e) => e.torneoId === id);
    setValue("grupoId", gs[0]?.id ?? 0);
    setValue("equipoLocalId", es[0]?.id ?? 0);
    setValue("equipoVisitanteId", es[1]?.id ?? 0);
  };

  const openNew = () => {
    setEditing(null);
    const gs = grupos.filter((g) => g.torneoId === defaultTorneo);
    const es = equipos.filter((e) => e.torneoId === defaultTorneo);
    reset({
      fechaPartido: "",
      torneoId: defaultTorneo,
      grupoId: gs[0]?.id ?? 0,
      equipoLocalId: es[0]?.id ?? 0,
      equipoVisitanteId: es[1]?.id ?? 0,
      tipoPartidoId: tipos[0]?.id ?? 0,
      estado: "P",
      resultadoLocal: "",
      resultadoVisitante: "",
      partidoIdApi: "",
      active: true,
    });
    setOpen(true);
  };

  const openEdit = (p: PartidoAdminDto) => {
    setEditing(p);
    reset({
      fechaPartido: utcIsoToTegusInput(p.fechaPartido),
      torneoId: p.torneoId,
      grupoId: p.grupoId,
      equipoLocalId: p.equipoLocalId,
      equipoVisitanteId: p.equipoVisitanteId,
      tipoPartidoId: p.tipoPartidoId,
      estado: p.estado,
      resultadoLocal: p.resultadoLocal ?? "",
      resultadoVisitante: p.resultadoVisitante ?? "",
      partidoIdApi: p.partidoIdApi ?? "",
      active: p.active,
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (Number(values.equipoLocalId) === Number(values.equipoVisitanteId)) {
      setToast({ msg: "El equipo local y el visitante no pueden ser el mismo.", sev: "error" });
      return;
    }
    const jugado = values.estado === "E" || values.estado === "T";
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
          grupoId: Number(values.grupoId),
          equipoLocalId: Number(values.equipoLocalId),
          equipoVisitanteId: Number(values.equipoVisitanteId),
          tipoPartidoId: Number(values.tipoPartidoId),
          estado: values.estado,
          resultadoLocal: jugado ? Number(values.resultadoLocal) : null,
          resultadoVisitante: jugado ? Number(values.resultadoVisitante) : null,
          partidoIdApi: values.partidoIdApi.trim() || null,
          active: values.active,
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
            {initial.map((p) => (
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
                    {fmtFecha(p.fechaPartido)} · {p.grupo} · {p.tipoPartido}
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
            {initial.length === 0 && (
              <TableRow><TableCell colSpan={11} align="center">No hay registros.</TableCell></TableRow>
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
              <Controller
                name="grupoId"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => (
                  <TextField select label="Grupo" fullWidth {...field}>
                    {gruposDe.map((g) => (
                      <MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
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
              {exigeGoles && (
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
              <TextField
                label="ID API (partido)"
                placeholder="679c9c8a5749c4077500e005"
                fullWidth
                helperText="_id del game en worldcup26.ir (para sincronizar resultados)"
                {...register("partidoIdApi", { maxLength: 40 })}
              />
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
                Al guardar con estado &quot;En curso&quot; o &quot;Terminado&quot; se recalculan automáticamente las posiciones y el ranking.
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
