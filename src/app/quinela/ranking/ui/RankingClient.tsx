"use client";

import { useState } from "react";
import { DateTime } from "luxon";
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
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import { RankingDto, QuinielaOption, PrediccionUsuarioDto } from "../dtos";

// El servidor guarda en UTC; aquí se muestra en hora de Tegucigalpa.
const TEGUS_TZ = "America/Tegucigalpa";
function fmtTegus(iso: string): string {
  const dt = DateTime.fromISO(iso, { zone: "utc" }).setZone(TEGUS_TZ);
  return dt.isValid ? dt.toFormat("dd/MM/yyyy HH:mm") : "—";
}

function Bandera({ url, nombre }: { url?: string; nombre: string }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/img/flags/${url}`}
      alt={nombre}
      width={20}
      height={14}
      style={{ objectFit: "cover", border: "1px solid #eee", flexShrink: 0 }}
    />
  );
}

const CAT: Record<"exacto" | "acertado" | "ninguno", { label: string; color: "success" | "info" | "default" }> = {
  exacto: { label: "Exacto", color: "success" },
  acertado: { label: "Acertado", color: "info" },
  ninguno: { label: "Sin acertar", color: "default" },
};

export default function RankingClient({
  initial,
  quinielas,
  quinielaIdInicial,
}: {
  initial: RankingDto[];
  quinielas: QuinielaOption[];
  quinielaIdInicial: number;
}) {
  const [ranking, setRanking] = useState<RankingDto[]>(initial);
  const [quinielaId, setQuinielaId] = useState<number>(quinielaIdInicial);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modal de predicciones del usuario (solo partidos terminados).
  const [openUser, setOpenUser] = useState(false);
  const [usuarioSel, setUsuarioSel] = useState<string>("");
  const [preds, setPreds] = useState<PrediccionUsuarioDto[]>([]);
  const [loadingPreds, setLoadingPreds] = useState(false);

  const cambiarQuiniela = async (qid: number) => {
    setQuinielaId(qid);
    setLoading(true);
    try {
      const res = await fetch(`/quinela/ranking/api?quinielaId=${qid}`);
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(e.message ?? "Error al cargar el ranking");
      }
      setRanking((await res.json()) as RankingDto[]);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const abrirUsuario = async (username: string) => {
    setUsuarioSel(username);
    setPreds([]);
    setOpenUser(true);
    setLoadingPreds(true);
    try {
      const res = await fetch(`/quinela/ranking/api/usuario?quinielaId=${quinielaId}&username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(e.message ?? "Error al cargar las predicciones");
      }
      setPreds((await res.json()) as PrediccionUsuarioDto[]);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Error");
    } finally {
      setLoadingPreds(false);
    }
  };

  const totalPuntos = preds.reduce((s, p) => s + p.puntos, 0);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Ranking · Mundial 2026
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Cómo va cada usuario por quiniela. Haz clic en un usuario para ver sus predicciones.
      </Typography>

      <Stack direction="row" sx={{ mb: 2 }}>
        <TextField
          select
          label="Quiniela"
          size="small"
          value={quinielas.length ? quinielaId : ""}
          onChange={(e) => cambiarQuiniela(Number(e.target.value))}
          disabled={loading}
          sx={{ minWidth: 220 }}
        >
          {quinielas.map((q) => (
            <MenuItem key={q.id} value={q.id}>{q.nombre}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 56 }}>#</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell align="right">Puntos</TableCell>
              <TableCell align="right">Exactos</TableCell>
              <TableCell align="right">Atinados</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((r, i) => (
              <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => abrirUsuario(r.usuario)}>
                <TableCell>
                  {i < 3 ? (
                    <Chip label={i + 1} size="small" color={i === 0 ? "primary" : i === 1 ? "secondary" : "default"} />
                  ) : (
                    i + 1
                  )}
                </TableCell>
                <TableCell sx={{ color: "primary.main", fontWeight: 600 }}>{r.usuario}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{r.pts}</TableCell>
                <TableCell align="right">{r.resultadoExacto}</TableCell>
                <TableCell align="right">{r.resultadoAtinado}</TableCell>
              </TableRow>
            ))}
            {ranking.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Aún no hay ranking para mostrar.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openUser} onClose={() => setOpenUser(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Predicciones de {usuarioSel}
          <Typography variant="body2" color="text.secondary">
            Solo partidos terminados · {preds.length} {preds.length === 1 ? "partido" : "partidos"} · {totalPuntos} pts
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingPreds ? (
            <Stack sx={{ alignItems: "center", py: 4 }}><CircularProgress /></Stack>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Partido</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="center">Predicción</TableCell>
                    <TableCell align="center">Resultado</TableCell>
                    <TableCell align="center">Puntos</TableCell>
                    <TableCell>Guardada (Tegucigalpa)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preds.map((p) => (
                    <TableRow key={p.partidoId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                          <Bandera url={p.local.urlBandera} nombre={p.local.nombre} />
                          <span>{p.local.nombre}</span>
                          <span style={{ opacity: 0.6 }}>vs</span>
                          <Bandera url={p.visitante.urlBandera} nombre={p.visitante.nombre} />
                          <span>{p.visitante.nombre}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>{p.tipoPartido}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {(p.team1Resultado ?? "—") + " - " + (p.team2Resultado ?? "—")}
                      </TableCell>
                      <TableCell align="center">
                        {(p.resultadoLocal ?? "—") + " - " + (p.resultadoVisitante ?? "—")}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                          <strong>{p.puntos}</strong>
                          {p.categoria ? <Chip size="small" label={CAT[p.categoria].label} color={CAT[p.categoria].color} /> : null}
                        </Stack>
                      </TableCell>
                      <TableCell>{fmtTegus(p.guardadaEn)}</TableCell>
                    </TableRow>
                  ))}
                  {preds.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center">Este usuario no tiene predicciones en partidos terminados.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? <Alert severity="error" onClose={() => setToast(null)}>{toast}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
