import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SlideDeck from "@/components/SlideDeck";
import { getSlide, getSlides } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() { return getSlides().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slide = getSlide((await params).slug);
  return slide ? { title: slide.title, description: slide.summary } : {};
}

export default async function SlidesPage({ params }: { params: Promise<{ slug: string }> }) {
  const slide = getSlide((await params).slug);
  if (!slide) notFound();
  return <main className="slides-page"><header><Link href="/posts">← Posts</Link><span>{slide.title}</span></header><SlideDeck markdown={slide.markdown} /></main>;
}
