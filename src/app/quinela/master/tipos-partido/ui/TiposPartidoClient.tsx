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
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { TipoPartidoDto } from "../dtos";

interface FormValues {
  descripcion: string;
  ptsPartidoVictoria: number;
  ptsPartidoEmpate: number;
  ptsQuinelaResultadoExacto: number;
  ptsQuinelaResultadoAcertado: number;
  active: boolean;
}

const DEFAULTS: FormValues = {
  descripcion: "",
  ptsPartidoVictoria: 0,
  ptsPartidoEmpate: 0,
  ptsQuinelaResultadoExacto: 0,
  ptsQuinelaResultadoAcertado: 0,
  active: true,
};

export default function TiposPartidoClient({ initial }: { initial: TipoPartidoDto[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TipoPartidoDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: DEFAULTS,
  });

  const openNew = () => {
    setEditing(null);
    reset(DEFAULTS);
    setOpen(true);
  };

  const openEdit = (t: TipoPartidoDto) => {
    setEditing(t);
    reset({
      descripcion: t.descripcion,
      ptsPartidoVictoria: t.ptsPartidoVictoria,
      ptsPartidoEmpate: t.ptsPartidoEmpate,
      ptsQuinelaResultadoExacto: t.ptsQuinelaResultadoExacto,
      ptsQuinelaResultadoAcertado: t.ptsQuinelaResultadoAcertado,
      active: t.active,
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const url = editing ? `/quinela/master/tipos-partido/api/${editing.id}` : "/quinela/master/tipos-partido/api";
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
      setToast({ msg: editing ? "Tipo de partido actualizado" : "Tipo de partido creado", sev: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (t: TipoPartidoDto) => {
    if (!confirm(`¿Eliminar el tipo de partido "${t.descripcion}"?`)) return;
    try {
      const res = await fetch(`/quinela/master/tipos-partido/api/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al eliminar");
      }
      setToast({ msg: "Tipo de partido eliminado", sev: "success" });
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    }
  };

  const numberField = (name: keyof FormValues, label: string) => (
    <TextField
      type="number"
      label={label}
      fullWidth
      error={Boolean(errors[name])}
      helperText={errors[name] ? "Entero ≥ 0" : " "}
      slotProps={{ htmlInput: { min: 0 } }}
      {...register(name, { required: true, valueAsNumber: true, min: 0 })}
    />
  );

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Tipos de Partido</Typography>
        <Button variant="contained" onClick={openNew}>Nuevo</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Pts Victoria</TableCell>
              <TableCell align="right">Pts Empate</TableCell>
              <TableCell align="right">Pts Resultado Exacto</TableCell>
              <TableCell align="right">Pts Resultado Acertado</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initial.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(t)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => onDelete(t)}>Eliminar</Button>
                </TableCell>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.descripcion}</TableCell>
                <TableCell align="right">{t.ptsPartidoVictoria}</TableCell>
                <TableCell align="right">{t.ptsPartidoEmpate}</TableCell>
                <TableCell align="right">{t.ptsQuinelaResultadoExacto}</TableCell>
                <TableCell align="right">{t.ptsQuinelaResultadoAcertado}</TableCell>
                <TableCell>
                  <Chip size="small" label={t.active ? "Activo" : "Inactivo"} color={t.active ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
            {initial.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No hay registros.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? "Editar tipo de partido" : "Nuevo tipo de partido"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Descripción"
                fullWidth
                error={Boolean(errors.descripcion)}
                helperText={errors.descripcion ? "Requerida (máx. 120)" : " "}
                {...register("descripcion", { required: true, maxLength: 120 })}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {numberField("ptsPartidoVictoria", "Pts partido victoria")}
                {numberField("ptsPartidoEmpate", "Pts partido empate")}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {numberField("ptsQuinelaResultadoExacto", "Pts quiniela resultado exacto")}
                {numberField("ptsQuinelaResultadoAcertado", "Pts quiniela resultado acertado")}
              </Stack>
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
