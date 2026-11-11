import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getCourses } from "@/lib/notes";

// Serves content/notes/<course>/notes.tex as a static file at build time.
export const dynamic = "force-static";
export function generateStaticParams() { return getCourses().map(({ slug }) => ({ course: slug })); }

export async function GET(_: Request, { params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  if (!getCourses().some((entry) => entry.slug === course)) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(join(process.cwd(), "content/notes", course, "notes.tex"), "utf8"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
