import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ecomatrix ERV Tool",
  description:
    "Model energy, cost, and CO2 savings from Energy Recovery Ventilation across climates, schedules, and building configurations.",
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/brand/favicon.png"],
    apple: [{ url: "/brand/favicon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-medium">{children}</body>
    </html>
  );
}
