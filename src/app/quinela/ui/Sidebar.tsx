"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

const DRAWER_WIDTH = 240;

// Sección "Mundial 2026" con los masters (coincide con las screens precargadas en UserApp).
const NAV = [
  {
    titulo: "Mundial 2026",
    items: [
      { label: "Grupos", href: "/quinela/grupos" },
      { label: "Calendario", href: "/quinela/calendario" },
      { label: "Ranking", href: "/quinela/ranking" }
    ],
  },
  {
    titulo: "Administración",
    items: [
      { label: "Grupos", href: "/quinela/master/grupos" },
      { label: "Equipos", href: "/quinela/master/equipos" },
      { label: "Tipos de Partido", href: "/quinela/master/tipos-partido" },
    ],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Quiniela
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: "auto", flexGrow: 1 }}>
        {NAV.map((sec) => (
          <List
            key={sec.titulo}
            subheader={<ListSubheader component="div">{sec.titulo}</ListSubheader>}
          >
            {sec.items.map((item) => (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={pathname === item.href}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        ))}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" color="inherit" onClick={logout} disabled={loggingOut}>
          {loggingOut ? "Saliendo…" : "Cerrar sesión"}
        </Button>
      </Box>
    </Drawer>
  );
}
