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
import { EquipoDto } from "../dtos";

interface FormValues {
  nombre: string;
  confederacion: string;
  anfitrion: boolean;
  active: boolean;
}

const CONFEDERACIONES = ["CONMEBOL", "CONCACAF", "UEFA", "CAF", "AFC", "OFC"];

export default function EquiposClient({ initial }: { initial: EquipoDto[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipoDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { nombre: "", confederacion: "CONMEBOL", anfitrion: false, active: true },
  });

  const openNew = () => {
    setEditing(null);
    reset({ nombre: "", confederacion: "CONMEBOL", anfitrion: false, active: true });
    setOpen(true);
  };

  const openEdit = (e: EquipoDto) => {
    setEditing(e);
    reset({ nombre: e.nombre, confederacion: e.confederacion, anfitrion: e.anfitrion, active: e.active });
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
        body: JSON.stringify(values),
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
        <Button variant="contained" onClick={openNew}>Nuevo</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Confederación</TableCell>
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
                <TableCell>{e.nombre}</TableCell>
                <TableCell>{e.confederacion}</TableCell>
                <TableCell>{e.anfitrion ? "Sí" : "No"}</TableCell>
                <TableCell>
                  <Chip size="small" label={e.active ? "Activo" : "Inactivo"} color={e.active ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
            {initial.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No hay registros.</TableCell></TableRow>
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
