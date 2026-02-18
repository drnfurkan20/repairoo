import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repairoo",
  description: "Premium usta bulma deneyimi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
