"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
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
import { UsuarioQuinielaDto, UsuarioOption, QuinielaOption } from "../dtos";
import { quinielasAsignables } from "../logic";

interface FormValues {
  userId: number;
  quinielaId: number;
  active: boolean;
}

export default function UsuariosQuinielasClient({
  initial,
  usuarios,
  quinielas,
}: {
  initial: UsuarioQuinielaDto[];
  usuarios: UsuarioOption[];
  quinielas: QuinielaOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioQuinielaDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  const defaultUser = usuarios[0]?.userId ?? 0;
  const defaultQuiniela = quinielas[0]?.id ?? 0;
  const faltanCatalogos = usuarios.length === 0 || quinielas.length === 0;

  const { handleSubmit, reset, control, watch } = useForm<FormValues>({
    defaultValues: { userId: defaultUser, quinielaId: defaultQuiniela, active: true },
  });

  // Quinielas que se le pueden asignar al usuario seleccionado (las que aún no tiene),
  // conservando la que se está editando. Misma regla que la tabla usuarios_quinielas.
  const userIdSel = Number(watch("userId"));
  const quinielasAsign = quinielasAsignables(quinielas, initial, userIdSel, editing?.quinielaId);

  const openNew = () => {
    setEditing(null);
    reset({ userId: defaultUser, quinielaId: defaultQuiniela, active: true });
    setOpen(true);
  };

  const openEdit = (a: UsuarioQuinielaDto) => {
    setEditing(a);
    reset({ userId: a.userId, quinielaId: a.quinielaId, active: a.active });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const url = editing ? `/quinela/master/usuarios-quinielas/api/${editing.id}` : "/quinela/master/usuarios-quinielas/api";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(values.userId), quinielaId: Number(values.quinielaId), active: values.active }),
      });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al guardar");
      }
      setToast({ msg: editing ? "Acceso actualizado" : "Acceso creado", sev: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (a: UsuarioQuinielaDto) => {
    if (!confirm(`¿Quitar el acceso de "${a.userName}" a "${a.quiniela}"?`)) return;
    try {
      const res = await fetch(`/quinela/master/usuarios-quinielas/api/${a.id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(p.message ?? "Error al eliminar");
      }
      setToast({ msg: "Acceso eliminado", sev: "success" });
      router.refresh();
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Error", sev: "error" });
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Usuarios - Quinielas</Typography>
        <Button variant="contained" onClick={openNew} disabled={faltanCatalogos}>Nuevo</Button>
      </Stack>

      {faltanCatalogos && (
        <Alert severity="info" sx={{ mb: 2 }}>Se necesitan usuarios y quinielas para asignar accesos.</Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Acciones</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Quiniela</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initial.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(a)}>Editar</Button>
                  <Button size="small" color="error" onClick={() => onDelete(a)}>Eliminar</Button>
                </TableCell>
                <TableCell>{a.id}</TableCell>
                <TableCell>{a.userName}</TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.quiniela}</TableCell>
                <TableCell>
                  <Chip size="small" label={a.active ? "Activo" : "Inactivo"} color={a.active ? "success" : "default"} />
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
          <DialogTitle>{editing ? "Editar acceso" : "Nuevo acceso"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Controller
                name="userId"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => {
                  const selected = usuarios.find((u) => u.userId === field.value) ?? null;
                  return (
                    <Autocomplete
                      options={usuarios}
                      value={selected}
                      getOptionLabel={(u) => (u.email ? `${u.userName} — ${u.email}` : u.userName)}
                      isOptionEqualToValue={(o, v) => o.userId === v.userId}
                      onChange={(_, val) => field.onChange(val ? val.userId : 0)}
                      renderInput={(params) => (
                        <TextField {...params} label="Usuario" placeholder="Escribe para buscar…" />
                      )}
                    />
                  );
                }}
              />
              <Controller
                name="quinielaId"
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => (
                  <TextField select label="Quiniela" fullWidth {...field}>
                    {quinielasAsign.map((q) => (
                      <MenuItem key={q.id} value={q.id}>{q.nombre}</MenuItem>
                    ))}
                    {quinielasAsign.length === 0 && (
                      <MenuItem value={0} disabled>El usuario ya tiene todas las quinielas</MenuItem>
                    )}
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
