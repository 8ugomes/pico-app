import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Pico — O ponto de encontro da areia.", template: "%s | Pico" },
  description: "Me acha no Pico. Descubra quem joga onde você joga, acompanhe suas arenas e encontre sua próxima dupla.",
  applicationName: "Pico",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Pico" },
};

export const viewport: Viewport = { themeColor: "#07080A", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
        {children}
      </body>
    </html>
  );
}
