import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "temml/dist/Temml-Local.css";
import { profile } from "@/lib/content";
import "./globals.css";

// TeX Gyre Pagella (Palatino), matching the mathpazo typesetting of the PDF notes,
// with its OpenType math companion for MathML. See app/fonts/README.md.
const serif = localFont({
  variable: "--font-serif",
  src: [
    { path: "./fonts/pagella-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/pagella-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/pagella-bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/pagella-bolditalic.woff2", weight: "700", style: "italic" },
  ],
  fallback: ["Palatino Linotype", "Palatino", "Book Antiqua", "Georgia", "serif"],
});

const math = localFont({
  variable: "--font-math",
  src: "./fonts/pagella-math.woff2",
  preload: false,
  fallback: ["STIX Two Math", "Cambria Math", "math"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jfu26.github.io"),
  title: { default: "J. Fu — Macroeconomics", template: "%s — J. Fu" },
  description: "Academic website of J. Fu, PhD student in International Economics at the Geneva Graduate Institute (IHEID). Macroeconomic theory, monetary policy, expectations, and geoeconomics.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "J. Fu — Macroeconomics",
    description: "PhD student in International Economics · Geneva Graduate Institute (IHEID)",
    url: "https://jfu26.github.io",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "J. Fu — Economics · Geneva" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: "https://jfu26.github.io",
    jobTitle: profile.role,
    affiliation: { "@type": "CollegeOrUniversity", name: profile.affiliation },
    knowsAbout: profile.interests,
    sameAs: profile.links.map((link) => link.href),
  };
  return (
    <html lang="en-GB">
      <body className={`${serif.variable} ${math.variable} ${sans.variable} ${mono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
        {children}
      </body>
    </html>
  );
}
