import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function QuinelaHome() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Panel Quiniela
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Administra los grupos y equipos del Mundial 2026 desde el menú lateral.
      </Typography>
    </Box>
  );
}
