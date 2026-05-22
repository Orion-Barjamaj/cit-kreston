import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kreston Albania",
  description: "Kreston Albania workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
