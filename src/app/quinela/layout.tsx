import Box from "@mui/material/Box";
import Sidebar, { MenuItem } from "./ui/Sidebar";
import { backendFetch } from "@/app/global-configuration/backend";

export const dynamic = "force-dynamic";

export default async function QuinelaLayout({ children }: { children: React.ReactNode }) {
  // Menú según los permisos del usuario (screens asignadas a sus roles en UserApp).
  const res = await backendFetch("/Menu");
  const menu: MenuItem[] = res.ok ? ((await res.json()) as MenuItem[]) : [];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar menu={menu} />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        {children}
      </Box>
    </Box>
  );
}
