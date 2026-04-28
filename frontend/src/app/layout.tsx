import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Word Chain",
  description: "A word chain game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}