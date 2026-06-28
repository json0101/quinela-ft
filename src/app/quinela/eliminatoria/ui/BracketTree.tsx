import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { BracketPreviewDto, BracketPartidoDto } from "../dtos";

const ESTADO: Record<string, { label: string; color: "default" | "warning" | "success" }> = {
  P: { label: "Previa", color: "default" },
  E: { label: "En curso", color: "warning" },
  T: { label: "Terminado", color: "success" },
};

// Nombre de cada ronda (para la vista de lista en móvil/tablet).
const ETIQUETA: Record<string, string> = {
  R32: "Dieciseisavos",
  R16: "Octavos",
  QF: "Cuartos",
  SF: "Semifinales",
  TERCER_PUESTO: "Tercer puesto",
  FINAL: "Final",
};

interface Mitad {
  r32: BracketPartidoDto[];
  r16: BracketPartidoDto[];
  qf: BracketPartidoDto[];
  sf: BracketPartidoDto[];
}

function feedersDe(m: BracketPartidoDto, todos: Map<number, BracketPartidoDto>): BracketPartidoDto[] {
  const out: BracketPartidoDto[] = [];
  if (m.fuenteLocalId != null && todos.has(m.fuenteLocalId)) out.push(todos.get(m.fuenteLocalId)!);
  if (m.fuenteVisitanteId != null && todos.has(m.fuenteVisitanteId)) out.push(todos.get(m.fuenteVisitanteId)!);
  return out;
}

// Subárbol de una semifinal: cada ronda son los feeders de la anterior.
function construirMitad(raiz: BracketPartidoDto, todos: Map<number, BracketPartidoDto>): Mitad {
  const sf = [raiz];
  const qf = sf.flatMap((m) => feedersDe(m, todos));
  const r16 = qf.flatMap((m) => feedersDe(m, todos));
  const r32 = r16.flatMap((m) => feedersDe(m, todos));
  return { r32, r16, qf, sf };
}

function Bandera({ archivo }: { archivo?: string | null }) {
  if (!archivo) return <Box sx={{ width: 20, height: 14, flexShrink: 0 }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/img/flags/${archivo}`}
      alt=""
      width={20}
      height={14}
      style={{ objectFit: "cover", border: "1px solid #eee", flexShrink: 0, borderRadius: 1 }}
    />
  );
}

function FilaEquipo({
  nombre, bandera, goles, penales, ganador, mirror,
}: { nombre: string; bandera?: string | null; goles?: number | null; penales?: number | null; ganador: boolean; mirror: boolean }) {
  return (
    <Stack
      direction={mirror ? "row-reverse" : "row"}
      sx={{ alignItems: "center", gap: 0.75, fontWeight: ganador ? 700 : 400, color: ganador ? "success.main" : "text.primary" }}
    >
      <Bandera archivo={bandera} />
      <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: "inherit", color: "inherit", textAlign: mirror ? "right" : "left" }}>
        {nombre}
      </Typography>
      <Typography variant="body2" sx={{ flexShrink: 0, fontWeight: "inherit", color: "inherit" }}>
        {goles ?? "–"}{penales != null ? ` (${penales})` : ""}
      </Typography>
    </Stack>
  );
}

function TarjetaPartido({ p, mirror = false }: { p: BracketPartidoDto; mirror?: boolean }) {
  const ganaLocal = !!p.ganador && p.ganador === p.local;
  const ganaVisitante = !!p.ganador && p.ganador === p.visitante;
  const est = ESTADO[p.estado] ?? ESTADO.P;
  return (
    <Paper variant="outlined" sx={{ p: 1, width: { xs: "100%", lg: 210 }, borderStyle: p.porDefinirse ? "dashed" : "solid" }}>
      <Stack direction={mirror ? "row-reverse" : "row"} sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>#{p.id}</Typography>
        <Chip
          size="small"
          label={p.porDefinirse ? "Por definir" : est.label}
          color={p.porDefinirse ? "default" : est.color}
          variant={p.porDefinirse ? "outlined" : "filled"}
          sx={{ height: 18, "& .MuiChip-label": { px: 0.75, fontSize: 11 } }}
        />
      </Stack>
      <FilaEquipo nombre={p.local} bandera={p.localBandera} goles={p.golesLocal} penales={p.penalesLocal} ganador={ganaLocal} mirror={mirror} />
      <FilaEquipo nombre={p.visitante} bandera={p.visitanteBandera} goles={p.golesVisitante} penales={p.penalesVisitante} ganador={ganaVisitante} mirror={mirror} />
    </Paper>
  );
}

function Columna({ titulo, partidos, mirror }: { titulo: string; partidos: BracketPartidoDto[]; mirror: boolean }) {
  if (partidos.length === 0) return null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <Typography variant="overline" sx={{ textAlign: "center", color: "text.secondary", mb: 1 }}>{titulo}</Typography>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 1.5 }}>
        {partidos.map((p) => <TarjetaPartido key={p.id} p={p} mirror={mirror} />)}
      </Box>
    </Box>
  );
}

export default function BracketTree({ data }: { data: BracketPreviewDto }) {
  const todos = new Map<number, BracketPartidoDto>();
  data.rondas.forEach((r) => r.partidos.forEach((p) => todos.set(p.id, p)));

  const final = data.rondas.find((r) => r.ronda === "FINAL")?.partidos[0];
  const tercer = data.rondas.find((r) => r.ronda === "TERCER_PUESTO")?.partidos ?? [];

  if (!final) {
    return <Typography color="text.secondary">No hay partidos de eliminatoria para mostrar.</Typography>;
  }

  // Mitad izquierda = subárbol de una semifinal; mitad derecha = el de la otra (espejada).
  const sfIzq = final.fuenteLocalId != null ? todos.get(final.fuenteLocalId) : undefined;
  const sfDer = final.fuenteVisitanteId != null ? todos.get(final.fuenteVisitanteId) : undefined;
  const izq = sfIzq ? construirMitad(sfIzq, todos) : { r32: [], r16: [], qf: [], sf: [] };
  const der = sfDer ? construirMitad(sfDer, todos) : { r32: [], r16: [], qf: [], sf: [] };

  return (
    <>
      {/* PC: árbol completo en espejo (con la final al centro). Oculto en móvil/tablet. */}
      <Box sx={{ display: { xs: "none", lg: "flex" }, gap: 2.5, overflowX: "auto", alignItems: "stretch", pb: 2 }}>
        {/* Mitad izquierda: de afuera (R32) hacia el centro (SF). */}
        <Columna titulo="Dieciseisavos" partidos={izq.r32} mirror={false} />
        <Columna titulo="Octavos" partidos={izq.r16} mirror={false} />
        <Columna titulo="Cuartos" partidos={izq.qf} mirror={false} />
        <Columna titulo="Semifinal" partidos={izq.sf} mirror={false} />

        {/* Centro: la final (y el 3er puesto debajo). */}
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, px: 1 }}>
          <Typography variant="overline" sx={{ color: "text.secondary", mb: 1 }}>Final</Typography>
          <TarjetaPartido p={final} />
          {tercer.length > 0 && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>3er puesto</Typography>
              <Box sx={{ mt: 1 }}>
                {tercer.map((p) => <TarjetaPartido key={p.id} p={p} />)}
              </Box>
            </Box>
          )}
        </Box>

        {/* Mitad derecha: del centro (SF) hacia afuera (R32), espejada con la bandera a la derecha. */}
        <Columna titulo="Semifinal" partidos={der.sf} mirror />
        <Columna titulo="Cuartos" partidos={der.qf} mirror />
        <Columna titulo="Octavos" partidos={der.r16} mirror />
        <Columna titulo="Dieciseisavos" partidos={der.r32} mirror />
      </Box>

      {/* Móvil/tablet: solo cada fase y sus partidos con el resultado (penales entre paréntesis). */}
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        {data.rondas.map((ronda) =>
          ronda.partidos.length > 0 ? (
            <Box key={ronda.ronda} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {ETIQUETA[ronda.ronda] ?? ronda.ronda}
              </Typography>
              <Stack spacing={1}>
                {ronda.partidos.map((p) => <TarjetaPartido key={p.id} p={p} />)}
              </Stack>
            </Box>
          ) : null
        )}
      </Box>
    </>
  );
}
