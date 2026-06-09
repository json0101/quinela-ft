"use client";

import { createTheme } from "@mui/material/styles";

// Tema base de la aplicación. Al estar marcado con "use client" puede
// importarse de forma segura desde los componentes cliente que lo consumen.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#E4002B",
    },
    secondary: {
      main: "#0A3D91",
    },
    background: {
      default: "#F5F6FA",
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
