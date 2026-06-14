"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import type { SvgIconComponent } from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import TableChartIcon from "@mui/icons-material/TableChart";
import GroupsIcon from "@mui/icons-material/Groups";
import FlagIcon from "@mui/icons-material/Flag";
import AssignmentIcon from "@mui/icons-material/Assignment";
import StadiumIcon from "@mui/icons-material/Stadium";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CategoryIcon from "@mui/icons-material/Category";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import InstallAppButton from "./InstallAppButton";

const DRAWER_WIDTH = 240;

// Forma de cada nodo del menú que devuelve el backend (GET /Menu), segun los
// permisos del usuario en UserApp. La respuesta llega como lista plana; la
// jerarquía se arma con screenFatherId.
export type MenuItem = {
  screenId: number;
  name: string;
  route: string;
  isFather: boolean;
  screenFatherId: number | null;
  order: number;
  children?: MenuItem[];
};

// Convierte la lista plana en árbol (padre -> hijos), ordenando por `order`.
function buildTree(items: MenuItem[]): MenuItem[] {
  const byId = new Map<number, MenuItem>();
  items.forEach((i) => byId.set(i.screenId, { ...i, children: [] }));

  const roots: MenuItem[] = [];
  byId.forEach((node) => {
    const parent =
      node.screenFatherId != null ? byId.get(node.screenFatherId) : undefined;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  });

  const sortRec = (arr: MenuItem[]) => {
    arr.sort((a, b) => a.order - b.order);
    arr.forEach((n) => n.children && sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

// Una ruta es navegable si no es el placeholder "#".
const isNavigable = (route: string) => !!route && route !== "#";

// Icono por ruta del menú. El menú es dinámico (viene del backend), así que
// mapeamos por la ruta y caemos a un icono genérico si no hay coincidencia.
const ICONO_POR_RUTA: Record<string, SvgIconComponent> = {
  "/quinela/calendario": CalendarMonthIcon,
  "/quinela/ranking": EmojiEventsIcon,
  "/quinela/live": LiveTvIcon,
  "/quinela/grupos": TableChartIcon,
  "/quinela/master/grupos": GroupsIcon,
  "/quinela/master/equipos": FlagIcon,
  "/quinela/master/quinielas": AssignmentIcon,
  "/quinela/master/torneos": StadiumIcon,
  "/quinela/master/partidos": SportsSoccerIcon,
  "/quinela/master/tipos-partido": CategoryIcon,
  "/quinela/master/usuarios-quinielas": ManageAccountsIcon,
};

function IconoDeRuta({ route }: { route: string }) {
  const Icon = ICONO_POR_RUTA[route] ?? CircleOutlinedIcon;
  return <Icon fontSize="small" />;
}

// Ícono hamburguesa inline (no usamos @mui/icons-material para no sumar dependencias).
function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Sidebar({
  menu,
  children,
}: {
  menu: MenuItem[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tree = buildTree(menu ?? []);

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const closeMobile = () => setMobileOpen(false);

  const renderLink = (item: MenuItem) => (
    <ListItemButton
      key={item.screenId}
      component={Link}
      href={item.route}
      selected={pathname === item.route}
      onClick={closeMobile}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <IconoDeRuta route={item.route} />
      </ListItemIcon>
      <ListItemText primary={item.name} />
    </ListItemButton>
  );

  // Contenido del drawer, reutilizado por la variante permanente (escritorio)
  // y la temporal (móvil).
  const drawerContent = (
    <>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Quiniela
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: "auto", flexGrow: 1 }}>
        {tree.length === 0 && (
          <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>
            Sin opciones disponibles.
          </Typography>
        )}
        {tree.map((node) => {
          const childItems = node.children ?? [];
          // Nodo con hijos (o marcado como padre): cabecera + hijos navegables.
          if (childItems.length > 0 || node.isFather) {
            return (
              <List
                key={node.screenId}
                subheader={
                  <ListSubheader component="div">{node.name}</ListSubheader>
                }
              >
                {childItems.filter((c) => isNavigable(c.route)).map(renderLink)}
              </List>
            );
          }
          // Nodo hoja navegable a nivel raíz.
          return isNavigable(node.route) ? (
            <List key={node.screenId}>{renderLink(node)}</List>
          ) : null;
        })}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <InstallAppButton />
        <Button fullWidth variant="outlined" color="inherit" onClick={logout} disabled={loggingOut}>
          {loggingOut ? "Saliendo…" : "Cerrar sesión"}
        </Button>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* AppBar con botón hamburguesa, solo en pantallas pequeñas. */}
      <AppBar
        position="fixed"
        color="primary"
        sx={{
          display: { xs: "flex", md: "none" },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Quiniela
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Contenedor de drawers: temporal en móvil, permanente en escritorio. */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="Navegación principal"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Contenido principal. */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {/* Espaciador que compensa el AppBar fijo en móvil. */}
        <Toolbar sx={{ display: { xs: "block", md: "none" } }} />
        {children}
      </Box>
    </Box>
  );
}
