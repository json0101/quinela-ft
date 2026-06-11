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
import { EquipoDto, TorneoOption } from "../dtos";

interface FormValues {
  nombre: string;
  confederacion: string;
  anfitrion: boolean;
  urlBandera: string;
  torneoId: number;
  active: boolean;
}

const CONFEDERACIONES = ["CONMEBOL", "CONCACAF", "UEFA", "CAF", "AFC", "OFC"];

export default function EquiposClient({ initial, torneos }: { initial: EquipoDto[]; torneos: TorneoOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipoDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const defaultTorneo = torneos[0]?.id ?? 0;
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { nombre: "", confederacion: "CONMEBOL", anfitrion: false, urlBandera: "", torneoId: defaultTorneo, active: true },
  });

  // Valor actual del campo bandera para la vista previa en vivo dentro del diálogo.
  const urlBanderaActual = watch("urlBandera");

  const openNew = () => {
    setEditing(null);
    reset({ nombre: "", confederacion: "CONMEBOL", anfitrion: false, urlBandera: "", torneoId: defaultTorneo, active: true });
    setOpen(true);
  };

  const openEdit = (e: EquipoDto) => {
    setEditing(e);
    reset({ nombre: e.nombre, confederacion: e.confederacion, anfitrion: e.anfitrion, urlBandera: e.urlBandera ?? "", torneoId: e.torneoId, active: e.active });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const url = editing ? `/quinela/master/equipos/api/${editing.id}` : "/quinela/master/equipos/api";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, torneoId: Number(values.torneoId) }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al guardar");
      }
      setToast({ msg: editing ? "Equipo actualizado" : "Equipo creado", sev: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (e: EquipoDto) => {
    if (!confirm(`¿Eliminar el equipo "${e.nombre}"?`)) return;
    try {
      const res = await fetch(`/quinela/master/equipos/api/${e.id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al eliminar");
      }
      setToast({ msg: "Equipo eliminado", sev: "success" });
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Equipos</Typography>
        <Button variant="contained" onClick={openNew} disabled={torneos.length === 0}>Nuevo</Button>
      </Stack>

      {torneos.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>Primero crea un torneo para poder registrar equipos.</Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Bandera</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Confederación</TableCell>
              <TableCell>Torneo</TableCell>
              <TableCell>Anfitrión</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initial.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(e)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => onDelete(e)}>Eliminar</Button>
                </TableCell>
                <TableCell>{e.id}</TableCell>
                <TableCell>
                  {e.urlBandera ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/img/flags/${e.urlBandera}`}
                      alt={e.nombre}
                      width={28}
                      height={20}
                      style={{ objectFit: "cover", border: "1px solid #ddd" }}
                    />
                  ) : null}
                </TableCell>
                <TableCell>{e.nombre}</TableCell>
                <TableCell>{e.confederacion}</TableCell>
                <TableCell>{e.torneo}</TableCell>
                <TableCell>{e.anfitrion ? "Sí" : "No"}</TableCell>
                <TableCell>
                  <Chip size="small" label={e.active ? "Activo" : "Inactivo"} color={e.active ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
            {initial.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No hay registros.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? "Editar equipo" : "Nuevo equipo"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nombre"
                fullWidth
                error={Boolean(errors.nombre)}
                helperText={errors.nombre ? "Requerido (máx. 120)" : " "}
                {...register("nombre", { required: true, maxLength: 120 })}
              />
              <Controller
                name="torneoId"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => (
                  <TextField select label="Torneo" fullWidth {...field}>
                    {torneos.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.descripcion}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="confederacion"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField select label="Confederación" fullWidth {...field}>
                    {CONFEDERACIONES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <TextField
                  label="Bandera (archivo)"
                  placeholder="mx.svg"
                  fullWidth
                  helperText="Nombre del archivo en /public/img/flags (ej. mx.svg)"
                  {...register("urlBandera", { maxLength: 60 })}
                />
                {urlBanderaActual ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/img/flags/${urlBanderaActual}`}
                    alt="bandera"
                    width={48}
                    height={34}
                    style={{ objectFit: "cover", border: "1px solid #ddd", borderRadius: 2, flexShrink: 0 }}
                  />
                ) : null}
              </Stack>
              <Controller
                name="anfitrion"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />}
                    label="Anfitrión"
                  />
                )}
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving}>Guardar</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity={toast.sev} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
