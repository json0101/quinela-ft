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

export default function Sidebar({ menu }: { menu: MenuItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const tree = buildTree(menu ?? []);

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const renderLink = (item: MenuItem) => (
    <ListItemButton
      key={item.screenId}
      component={Link}
      href={item.route}
      selected={pathname === item.route}
    >
      <ListItemText primary={item.name} />
    </ListItemButton>
  );

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
        {tree.length === 0 && (
          <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>
            Sin opciones disponibles.
          </Typography>
        )}
        {tree.map((node) => {
          const children = node.children ?? [];
          // Nodo con hijos (o marcado como padre): cabecera + hijos navegables.
          if (children.length > 0 || node.isFather) {
            return (
              <List
                key={node.screenId}
                subheader={
                  <ListSubheader component="div">{node.name}</ListSubheader>
                }
              >
                {children.filter((c) => isNavigable(c.route)).map(renderLink)}
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
        <Button fullWidth variant="outlined" color="inherit" onClick={logout} disabled={loggingOut}>
          {loggingOut ? "Saliendo…" : "Cerrar sesión"}
        </Button>
      </Box>
    </Drawer>
  );
}
