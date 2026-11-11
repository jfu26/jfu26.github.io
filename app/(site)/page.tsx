import Link from "next/link";
import CvList, { education } from "@/components/CvList";
import { getPosts, profile } from "@/lib/content";
import { getCourses } from "@/lib/notes";

export default function Home() {
  const posts = getPosts().slice(0, 3);
  const courses = getCourses();
  return (
    <>
      <section className="about">
        <h1>{profile.name}</h1>
        <p className="position">{profile.role}<br />{profile.affiliation}, {profile.location}</p>
        <p>{profile.bio}</p>
        <p><strong>Research interests:</strong> {profile.interests.map((x, i) => (i ? x.toLowerCase() : x)).join(", ")}.</p>
        <p className="contact-links">
          <Link href="/cv/">CV</Link>
          {profile.links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </p>
      </section>

      <section className="page-section">
        <h2>Education</h2>
        <CvList entries={education(profile.education)} />
      </section>

      <section className="page-section">
        <h2>Notes</h2>
        <ul className="entry-list">
          {courses.map((course) => (
            <li key={course.slug}>
              <Link href={`/notes/${course.slug}/`}>{course.title}</Link>
              <span className="entry-meta">{course.course} · {course.institution} · <a href={course.pdf}>PDF</a></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-section">
        <h2>Recent writing</h2>
        <ul className="entry-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}/`}>{post.title}</Link>
              <span className="entry-meta">{post.date}</span>
              <p>{post.summary}</p>
            </li>
          ))}
        </ul>
        <p><Link href="/posts/">All writing →</Link></p>
      </section>
    </>
  );
}
