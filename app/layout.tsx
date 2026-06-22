import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal do Colaborador - GR Autopeças",
  description: "Consulta de Espelho de Ponto e Mural de Avisos",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="pt-BR">
      <body className="antialiased bg-[#f5f5f7] text-[#1d1d1f]">
      {children}
      </body>
      </html>
  );
}