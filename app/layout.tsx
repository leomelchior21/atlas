import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATLAS — Conhecimento é um território",
  description:
    "Um atlas explorável de Matemática, Física e Química. Navegue por ilhas de conhecimento, entenda conceitos manipulando-os e treine indefinidamente.",
  applicationName: "ATLAS",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div id="atlas-root">{children}</div>
      </body>
    </html>
  );
}
