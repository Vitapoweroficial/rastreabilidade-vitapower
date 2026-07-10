import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Rastreabilidade Vita Power",
  description: "MVP de rastreabilidade de lotes para clientes private label."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
