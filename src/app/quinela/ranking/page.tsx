import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { backendFetch } from "@/app/global-configuration/backend";
import { RankingDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const res = await backendFetch("/Ranking");
  const ranking = res.ok ? ((await res.json()) as RankingDto[]) : [];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Ranking · Mundial 2026
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Cómo va cada usuario. Se actualiza automáticamente cuando los partidos cambian de estado.
      </Typography>

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
              <TableRow key={r.id} hover>
                <TableCell>
                  {i < 3 ? (
                    <Chip
                      label={i + 1}
                      size="small"
                      color={i === 0 ? "primary" : i === 1 ? "secondary" : "default"}
                    />
                  ) : (
                    i + 1
                  )}
                </TableCell>
                <TableCell>{r.usuario}</TableCell>
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
    </Box>
  );
}
