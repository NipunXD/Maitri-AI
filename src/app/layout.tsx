import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maitri AI",
  description: "Offline AI companion for astronauts",
  manifest: "/manifest.json",
  themeColor: "#0a84ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
