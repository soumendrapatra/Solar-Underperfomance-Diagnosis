import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PV PLANT DIAGNOSTIC ENGINE // NODE 01",
  description: "High-density Industrial SCADA Operations Dashboard for Solar PV Plant Diagnostics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} bg-background text-text-primary antialiased`}>
      <body className="h-screen w-screen overflow-hidden bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
