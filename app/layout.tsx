import type { Metadata } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import MathJaxSync from "@/components/MathJaxSync";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://jfu26.github.io"),
  title: { default: "J. Fu — Economics", template: "%s — J. Fu" },
  description: "Academic website of J. Fu, an incoming Economics PhD student at the Geneva Graduate Institute.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "J. Fu — Economics",
    description: "Incoming Economics PhD student · Geneva · 2026",
    url: "https://jfu26.github.io",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "J. Fu — Economics · Geneva" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `window.MathJax={tex:{inlineMath:[["$","$"],["\\\\(","\\\\)"]],displayMath:[["$$","$$"],["\\\\[","\\\\]"]],processEscapes:true},chtml:{displayAlign:"left"},options:{enableMenu:false}};` }} />
        <script defer src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js" />
      </head>
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        <Suspense><MathJaxSync /></Suspense>
        {children}
      </body>
    </html>
  );
}
