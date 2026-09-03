import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Sofia_Sans_Extra_Condensed } from "next/font/google";
import "./globals.css";
import "./popme.css";
import "./popme-v2.css";
import "./popme-v3.css";
import "./popme-clean.css";
import "./popme-mobile-gruns.css";
import "./popme-storefront-v2.css";
import "./popme-legal.css";

const displayFont = Sofia_Sans_Extra_Condensed({
  subsets: ["cyrillic", "latin"],
  variable: "--font-popme-display",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-popme-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POPME — Made of you.",
  description: "Превърни снимката си в персонализирана POP, MINI или BRICK 3D колекционерска фигурка.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="bg" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
