import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { backendFetch } from "@/app/global-configuration/backend";
import { GrupoTablaDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function GruposVistaPage() {
  const res = await backendFetch("/grupos");
  const grupos = res.ok ? ((await res.json()) as GrupoTablaDto[]) : [];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Grupos · Mundial 2026
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Tabla de posiciones por grupo.
      </Typography>

      {/* Cuadrícula: 2 columnas en escritorio, 1 en celular. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        {grupos.map((g) => (
          <Card key={g.id} variant="outlined">
            <CardContent>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1.5 }}>
                <Chip label={g.nombre} color="primary" size="small" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Grupo {g.nombre}
                </Typography>
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 28 }}>#</TableCell>
                    <TableCell>Equipo</TableCell>
                    <TableCell align="right">Pts</TableCell>
                    <TableCell align="right">GF</TableCell>
                    <TableCell align="right">GC</TableCell>
                    <TableCell align="right">Dif</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {g.equipos.map((e) => (
                    <TableRow key={e.equipoId}>
                      <TableCell>{e.posicion}</TableCell>
                      <TableCell>
                        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                          {e.urlBandera ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/img/flags/${e.urlBandera}`}
                              alt={e.equipo}
                              width={22}
                              height={16}
                              style={{ objectFit: "cover", border: "1px solid #eee", flexShrink: 0 }}
                            />
                          ) : null}
                          <span>{e.equipo}</span>
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{e.pts}</TableCell>
                      <TableCell align="right">{e.gf}</TableCell>
                      <TableCell align="right">{e.gc}</TableCell>
                      <TableCell align="right">{e.diff}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {grupos.length === 0 && (
          <Typography color="text.secondary">No hay grupos para mostrar.</Typography>
        )}
      </Box>
    </Box>
  );
}
