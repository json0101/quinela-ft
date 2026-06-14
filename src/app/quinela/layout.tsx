import Sidebar, { MenuItem } from "./ui/Sidebar";
import { backendFetch } from "@/app/global-configuration/backend";

export const dynamic = "force-dynamic";

export default async function QuinelaLayout({ children }: { children: React.ReactNode }) {
  // Menú según los permisos del usuario (screens asignadas a sus roles en UserApp).
  const res = await backendFetch("/Menu");
  const menu: MenuItem[] = res.ok ? ((await res.json()) as MenuItem[]) : [];

  // El Sidebar es el shell responsivo: drawer permanente en escritorio y
  // drawer temporal con AppBar/hamburguesa en móvil.
  return <Sidebar menu={menu}>{children}</Sidebar>;
}
