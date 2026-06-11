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
import { QuinielaDto, TorneoOption } from "../dtos";

interface FormValues {
  nombre: string;
  reglas: string;
  torneoId: number;
  active: boolean;
}

export default function QuinielasClient({ initial, torneos }: { initial: QuinielaDto[]; torneos: TorneoOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<QuinielaDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const defaultTorneo = torneos[0]?.id ?? 0;
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { nombre: "", reglas: "", torneoId: defaultTorneo, active: true },
  });

  const openNew = () => {
    setEditing(null);
    reset({ nombre: "", reglas: "", torneoId: defaultTorneo, active: true });
    setOpen(true);
  };

  const openEdit = (q: QuinielaDto) => {
    setEditing(q);
    reset({ nombre: q.nombre, reglas: q.reglas, torneoId: q.torneoId, active: q.active });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const url = editing ? `/quinela/master/quinielas/api/${editing.id}` : "/quinela/master/quinielas/api";
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
      setToast({ msg: editing ? "Quiniela actualizada" : "Quiniela creada", sev: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (q: QuinielaDto) => {
    if (!confirm(`¿Eliminar la quiniela "${q.nombre}"?`)) return;
    try {
      const res = await fetch(`/quinela/master/quinielas/api/${q.id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al eliminar");
      }
      setToast({ msg: "Quiniela eliminada", sev: "success" });
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Quinielas</Typography>
        <Button variant="contained" onClick={openNew} disabled={torneos.length === 0}>Nueva</Button>
      </Stack>

      {torneos.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>Primero crea un torneo para poder registrar quinielas.</Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Torneo</TableCell>
              <TableCell>Activa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initial.map((q) => (
              <TableRow key={q.id} hover>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(q)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => onDelete(q)}>Eliminar</Button>
                </TableCell>
                <TableCell>{q.id}</TableCell>
                <TableCell>{q.nombre}</TableCell>
                <TableCell>{q.torneo}</TableCell>
                <TableCell>
                  <Chip size="small" label={q.active ? "Activa" : "Inactiva"} color={q.active ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
            {initial.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No hay registros.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? "Editar quiniela" : "Nueva quiniela"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nombre"
                fullWidth
                error={Boolean(errors.nombre)}
                helperText={errors.nombre ? "Requerido (máx. 150)" : " "}
                {...register("nombre", { required: true, maxLength: 150 })}
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
              <TextField
                label="Reglas"
                fullWidth
                multiline
                minRows={5}
                error={Boolean(errors.reglas)}
                helperText={errors.reglas ? "Requerido" : " "}
                {...register("reglas", { required: true })}
              />
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />}
                    label="Activa"
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
