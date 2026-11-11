import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarkdownArticle from "@/components/MarkdownArticle";
import NotebookArticle from "@/components/NotebookArticle";
import { getPost, getPosts } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() { return getPosts().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { title: post.title, description: post.summary } : {};
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return <>{post.kind === "notebook" ? <NotebookArticle post={post} /> : <MarkdownArticle post={post} />}</>;
}
