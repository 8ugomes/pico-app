import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { connection } from 'next/server';
import "./globals.css";
import { SessionGuard } from '@/components/pico/SessionGuard';


const syne = localFont({ src: './fonts/syne.woff2', variable: '--font-syne', weight: '400 800', display: 'swap', fallback: ['Arial', 'sans-serif'], adjustFontFallback: 'Arial' });
const manrope = localFont({ src: './fonts/manrope.woff2', variable: '--font-manrope', weight: '200 800', display: 'swap', fallback: ['system-ui', 'sans-serif'], adjustFontFallback: false });

export const metadata: Metadata = {
  title: { default: "Pico — O ponto de encontro da areia.", template: "%s | Pico" },
  description: "Me acha no Pico. Descubra quem joga onde você joga, acompanhe suas arenas e encontre sua próxima dupla.",
  robots: { index: false, follow: false },
  applicationName: "Pico",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pico" },
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F8F3E7" }, { media: "(prefers-color-scheme: dark)", color: "#282121" }], colorScheme: "light dark", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonces must be generated for each document, never reused from a static page.
  await connection();
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${syne.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SessionGuard />
        <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
        {children}
      </body>
    </html>
  );
}
