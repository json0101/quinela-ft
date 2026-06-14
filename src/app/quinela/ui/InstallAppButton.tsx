"use client";

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import IosShareIcon from "@mui/icons-material/IosShare";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";

// El evento beforeinstallprompt no está tipado en lib.dom; lo declaramos.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ¿La app ya corre como PWA instalada (standalone)?
function yaInstalada(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari expone navigator.standalone.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || iosStandalone;
}

// ¿Estamos en iOS/iPadOS? Safari de iOS no dispara beforeinstallprompt, así que
// la instalación es manual (Compartir → Agregar a inicio).
function esIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iPhoneIpod = /iphone|ipod|ipad/i.test(ua);
  // iPadOS reciente se hace pasar por Mac; lo detectamos por la pantalla táctil.
  const iPadOS = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
  return iPhoneIpod || iPadOS;
}

// Botón "Instalar App":
// - En navegadores que soportan la instalación (Chrome/Edge/Android) dispara el
//   prompt nativo.
// - En iOS muestra instrucciones para agregarla a la pantalla de inicio.
// - Si la app ya está instalada, no se muestra nada.
export default function InstallAppButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalando, setInstalando] = useState(false);
  const [ios, setIos] = useState(false);
  const [ayudaIOS, setAyudaIOS] = useState(false);

  useEffect(() => {
    if (yaInstalada()) return;

    if (esIOS()) {
      setIos(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      // Evita el mini-infobar del navegador y guardamos el evento para usarlo
      // cuando el usuario toque el botón.
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const instalar = async () => {
    if (!prompt) return;
    setInstalando(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      // El prompt solo puede usarse una vez; lo descartamos pase lo que pase.
      setPrompt(null);
      setInstalando(false);
    }
  };

  // iOS: botón que abre las instrucciones de instalación manual.
  if (ios) {
    return (
      <>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<InstallMobileIcon />}
          onClick={() => setAyudaIOS(true)}
          sx={{ mb: 1 }}
        >
          Instalar App
        </Button>
        <Dialog open={ayudaIOS} onClose={() => setAyudaIOS(false)} fullWidth maxWidth="xs">
          <DialogTitle>Instalar en iPhone/iPad</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              En Safari puedes agregar esta app a tu pantalla de inicio:
            </Typography>
            <Box component="ol" sx={{ pl: 2.5, m: 0, "& li": { mb: 1.5 } }}>
              <li>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                  Toca el botón <strong>Compartir</strong>
                  <IosShareIcon fontSize="small" sx={{ verticalAlign: "middle" }} />
                  en la barra de Safari.
                </Box>
              </li>
              <li>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                  Elige <strong>Agregar a inicio</strong>
                  <AddBoxOutlinedIcon fontSize="small" sx={{ verticalAlign: "middle" }} />.
                </Box>
              </li>
              <li>
                Confirma con <strong>Agregar</strong> y la app aparecerá en tu pantalla de inicio.
              </li>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
              Debe abrirse en Safari (no funciona desde otros navegadores en iOS).
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAyudaIOS(false)}>Entendido</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  if (!prompt) return null;

  return (
    <Button
      fullWidth
      variant="contained"
      color="primary"
      startIcon={<InstallMobileIcon />}
      onClick={instalar}
      disabled={instalando}
      sx={{ mb: 1 }}
    >
      {instalando ? "Instalando…" : "Instalar App"}
    </Button>
  );
}
