import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Vita Power Workspace",
  description: "ERP industrial e workspace central da Vita Power Nutrition."
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
