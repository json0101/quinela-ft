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
import { GrupoDto } from "../dtos";

interface FormValues {
  nombre: string;
  active: boolean;
}

export default function GruposClient({ initial }: { initial: GrupoDto[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GrupoDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { nombre: "", active: true },
  });

  const openNew = () => {
    setEditing(null);
    reset({ nombre: "", active: true });
    setOpen(true);
  };

  const openEdit = (g: GrupoDto) => {
    setEditing(g);
    reset({ nombre: g.nombre, active: g.active });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const url = editing ? `/quinela/master/grupos/api/${editing.id}` : "/quinela/master/grupos/api";
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
      setToast({ msg: editing ? "Grupo actualizado" : "Grupo creado", sev: "success" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : "Error", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (g: GrupoDto) => {
    if (!confirm(`¿Eliminar el grupo "${g.nombre}"?`)) return;
    try {
      const res = await fetch(`/quinela/master/grupos/api/${g.id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al eliminar");
      }
      setToast({ msg: "Grupo eliminado", sev: "success" });
      router.refresh();
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : "Error", sev: "error" });
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Grupos</Typography>
        <Button variant="contained" onClick={openNew}>Nuevo</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initial.map((g) => (
              <TableRow key={g.id} hover>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(g)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => onDelete(g)}>Eliminar</Button>
                </TableCell>
                <TableCell>{g.id}</TableCell>
                <TableCell>{g.nombre}</TableCell>
                <TableCell>
                  <Chip size="small" label={g.active ? "Activo" : "Inactivo"} color={g.active ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
            {initial.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">No hay registros.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{editing ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nombre"
                fullWidth
                error={Boolean(errors.nombre)}
                helperText={errors.nombre ? "Requerido (máx. 5)" : " "}
                {...register("nombre", { required: true, maxLength: 5 })}
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
