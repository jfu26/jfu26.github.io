import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "temml/dist/Temml-Local.css";
import { profile } from "@/lib/content";
import "./globals.css";

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
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
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
        {children}
      </body>
    </html>
  );
}
