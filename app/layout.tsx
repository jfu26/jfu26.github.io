import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: {
      default: "J. Fu — Economics",
      template: "%s — J. Fu",
    },
    description:
      "Academic website of J. Fu, incoming Economics PhD researcher at the Geneva Graduate Institute.",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "J. Fu — Economics",
      description: "Incoming Economics PhD · Geneva · 2026",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "J. Fu — Economics · Geneva" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "J. Fu — Economics",
      description: "Incoming Economics PhD · Geneva · 2026",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
