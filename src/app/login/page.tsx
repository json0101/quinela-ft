import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión · Quiniela",
};

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Stack spacing={0.5} sx={{ alignItems: "center", textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/trofeo-mundial.svg"
              alt="Trofeo del Mundial"
              width={84}
              height={126}
              style={{ display: "block", marginBottom: 8 }}
            />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Quiniela
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Ingresa tus credenciales para continuar
            </Typography>
          </Stack>

          <Card sx={{ width: "100%" }} elevation={3}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <LoginForm />
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
