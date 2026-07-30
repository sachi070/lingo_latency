import type { Metadata } from "next";
import { Playfair_Display, PT_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["500", "700", "900"],
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  variable: "--font-pt-serif",
  weight: ["400", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Lingo-Latency — The Real-Time Translation Wire",
  description: "Real-time multi-lingual chat powered by FastAPI, Redis, and Edge AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${ptSerif.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-parchment text-ink font-serif antialiased selection:bg-peri selection:text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}