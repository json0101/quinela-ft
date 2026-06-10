import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Providers from "./providers";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Quiniela",
  description: "Plataforma Quiniela",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quiniela",
  },
};

export const viewport: Viewport = {
  themeColor: "#E4002B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={roboto.variable}>
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
