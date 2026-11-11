import type { Metadata } from "next";
import Link from "next/link";
import { getNotes, noteSections, type Note } from "@/lib/notes";

export const metadata: Metadata = { title: "Notes", description: "Lecture and study notes in economics and econometrics." };

function NoteList({ notes }: { notes: Note[] }) {
  if (!notes.length) return <p className="muted">No notes yet.</p>;
  return (
    <ul className="note-list">
      {notes.map((note) => (
        <li key={note.slug}>
          <Link href={`/notes/${note.slug}/`}>{note.title}</Link>
          {note.kind === "course" ? (
            <span className="entry-meta">
              {note.course}, {note.date.slice(0, 4)} · <a href={note.pdf}>PDF</a> · <a href={note.source}>TeX</a>
            </span>
          ) : <span className="entry-meta">{note.date.slice(0, 4)}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function NotesIndex() {
  const notes = getNotes();
  const inSection = (id: string) => notes.filter((note) => note.section === id);
  return (
    <>
      <h1 className="page-heading">Notes</h1>
      {noteSections.map((section) => (
        <section className="page-section" key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.groups ? section.groups.map((group) => (
            <div className="note-group" key={group.id}>
              <h3>{group.title}</h3>
              <NoteList notes={inSection(`${section.id}/${group.id}`)} />
            </div>
          )) : <NoteList notes={inSection(section.id)} />}
        </section>
      ))}
    </>
  );
}
