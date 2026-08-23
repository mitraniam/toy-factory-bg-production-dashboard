import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./popme.css";
import "./popme-v2.css";

export const metadata: Metadata = {
  title: "POPME — Made of you.",
  description: "Превърни снимката си в персонализирана POP, MINI или BRICK 3D колекционерска фигурка.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
