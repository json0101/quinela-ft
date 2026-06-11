"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
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
import { QuinielaOption, PartidoLive, PrediccionLive } from "../dtos";
import { categoriaPrediccion, estadoLabel, marcador, CategoriaLive } from "../logic";

// Refresco automático "en vivo" (ms).
const POLL_MS = 15000;

function Bandera({ url, nombre, size = 22 }: { url?: string; nombre: string; size?: number }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/img/flags/${url}`}
      alt={nombre}
      width={size}
      height={size * 0.72}
      style={{ objectFit: "cover", border: "1px solid #ddd", borderRadius: 2, flexShrink: 0 }}
    />
  );
}

const CHIP: Record<Exclude<CategoriaLive, null>, { label: string; color: "success" | "info" | "default" }> = {
  exacto: { label: "Exacto", color: "success" },
  acertado: { label: "Acertado", color: "info" },
  ninguno: { label: "Sin acertar", color: "default" },
};

export default function LiveClient({
  quinielas,
  quinielaId,
  partidos,
  partidoId,
  predicciones,
  fecha,
}: {
  quinielas: QuinielaOption[];
  quinielaId: number;
  partidos: PartidoLive[];
  partidoId: number;
  predicciones: PrediccionLive[];
  fecha: string;
}) {
  const router = useRouter();

  // Polling: re-ejecuta el server component (refetch de predicciones) cada POLL_MS.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [router]);

  const irA = (q: number, p?: number) => {
    const qs = new URLSearchParams({ quinielaId: String(q) });
    if (p) qs.set("partidoId", String(p));
    router.push(`/quinela/live?${qs.toString()}`);
  };

  const partido = partidos.find((p) => p.id === partidoId) ?? null;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Live</Typography>
        <span className="live-dot" aria-hidden />
        <Chip size="small" color="error" label="EN VIVO" sx={{ fontWeight: 700 }} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Predicciones de todos los usuarios · solo partidos en juego · {fecha}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Quiniela"
          value={quinielaId || ""}
          onChange={(e) => irA(Number(e.target.value))}
          sx={{ minWidth: 220 }}
          disabled={quinielas.length === 0}
        >
          {quinielas.map((q) => (
            <MenuItem key={q.id} value={q.id}>{q.nombre}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Partido en juego"
          value={partido ? partidoId : ""}
          onChange={(e) => irA(quinielaId, Number(e.target.value))}
          sx={{ minWidth: 320 }}
          disabled={partidos.length === 0}
          slotProps={{
            select: {
              renderValue: (value) => {
                const p = partidos.find((x) => x.id === Number(value));
                if (!p) return "";
                return (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Bandera url={p.local.urlBandera} nombre={p.local.nombre} />
                    <span>{p.local.nombre}</span>
                    <span style={{ opacity: 0.6 }}>vs</span>
                    <Bandera url={p.visitante.urlBandera} nombre={p.visitante.nombre} />
                    <span>{p.visitante.nombre}</span>
                  </Stack>
                );
              },
            },
          }}
        >
          {partidos.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Bandera url={p.local.urlBandera} nombre={p.local.nombre} />
                <span>{p.local.nombre}</span>
                <span style={{ opacity: 0.6 }}>vs</span>
                <Bandera url={p.visitante.urlBandera} nombre={p.visitante.nombre} />
                <span>{p.visitante.nombre}</span>
                <Chip size="small" sx={{ ml: 1 }} label={estadoLabel(p.estado)} />
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {partidos.length === 0 && (
        <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
          No hay partidos en juego en esta quiniela en este momento.
        </Paper>
      )}

      {partido && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Bandera url={partido.local.urlBandera} nombre={partido.local.nombre} size={30} />
                <Typography sx={{ fontWeight: 600 }}>{partido.local.nombre}</Typography>
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 800, minWidth: 80, textAlign: "center" }}>
                {marcador(partido)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontWeight: 600 }}>{partido.visitante.nombre}</Typography>
                <Bandera url={partido.visitante.urlBandera} nombre={partido.visitante.nombre} size={30} />
              </Stack>
              <Chip
                size="small"
                label={estadoLabel(partido.estado)}
                color={partido.estado === "E" ? "warning" : partido.estado === "T" ? "success" : "default"}
              />
            </Stack>
          </Paper>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell align="center">Predicción</TableCell>
                  <TableCell align="center">Resultado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {predicciones.map((pr) => {
                  const cat = categoriaPrediccion(pr, partido.resultadoLocal, partido.resultadoVisitante);
                  return (
                    <TableRow key={pr.username} hover>
                      <TableCell>{pr.username}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {(pr.team1Resultado ?? "—") + " - " + (pr.team2Resultado ?? "—")}
                      </TableCell>
                      <TableCell align="center">
                        {cat ? <Chip size="small" label={CHIP[cat].label} color={CHIP[cat].color} /> : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {predicciones.length === 0 && (
                  <TableRow><TableCell colSpan={3} align="center">Aún no hay predicciones para este partido.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
