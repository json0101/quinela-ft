import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { backendFetch } from "@/app/global-configuration/backend";
import BracketTree from "./ui/BracketTree";
import { BracketPreviewDto } from "./dtos";

export const dynamic = "force-dynamic";

export default async function EliminatoriaPage() {
  const res = await backendFetch("/master/eliminatoria/preview?torneoId=1");
  const data = res.ok
    ? ((await res.json()) as BracketPreviewDto)
    : ({ torneoId: 1, rondas: [] } as BracketPreviewDto);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Eliminatoria · Mundial 2026
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Árbol de la fase eliminatoria. Los dieciseisavos se arman con las posiciones de grupo; los
        ganadores avanzan automáticamente al terminar cada partido.
      </Typography>

      <BracketTree data={data} />
    </Box>
  );
}
