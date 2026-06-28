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
import { FaseDto, TorneoOption } from "../dtos";

interface FormValues {
  descripcion: string;
  torneoId: number;
  active: boolean;
}

export default function FasesClient({ initial, torneos }: { initial: FaseDto[]; torneos: TorneoOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaseDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const defaultTorneo = torneos[0]?.id ?? 0;
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { descripcion: "", torneoId: defaultTorneo, active: true },
  });

  const openNew = () => {
    setEditing(null);
    reset({ descripcion: "", torneoId: defaultTorneo, active: true });
    setOpen(true);
  };

  const openEdit = (f: FaseDto) => {
    setEditing(f);
    reset({ descripcion: f.descripcion, torneoId: f.torneoId, active: f.active });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const url = editing ? `/quinela/master/fases/api/${editing.id}` : "/quinela/master/fases/api";
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
      setToast({ msg: editing ? "Fase actualizada" : "Fase creada", sev: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (f: FaseDto) => {
    if (!confirm(`¿Eliminar la fase "${f.descripcion}"?`)) return;
    try {
      const res = await fetch(`/quinela/master/fases/api/${f.id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al eliminar");
      }
      setToast({ msg: "Fase eliminada", sev: "success" });
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Fases</Typography>
        <Button variant="contained" onClick={openNew} disabled={torneos.length === 0}>Nuevo</Button>
      </Stack>

      {torneos.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>Primero crea un torneo para poder registrar fases.</Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Torneo</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initial.map((f) => (
              <TableRow key={f.id} hover>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(f)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => onDelete(f)}>Eliminar</Button>
                </TableCell>
                <TableCell>{f.id}</TableCell>
                <TableCell>{f.descripcion}</TableCell>
                <TableCell>{f.torneo}</TableCell>
                <TableCell>
                  <Chip size="small" label={f.active ? "Activo" : "Inactivo"} color={f.active ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
            {initial.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No hay registros.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? "Editar fase" : "Nueva fase"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Descripción"
                fullWidth
                error={Boolean(errors.descripcion)}
                helperText={errors.descripcion ? "Requerida (máx. 120)" : " "}
                {...register("descripcion", { required: true, maxLength: 120 })}
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
