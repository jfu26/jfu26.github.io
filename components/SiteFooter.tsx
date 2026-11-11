import { profile } from "@/lib/content";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} {profile.name} · {profile.location}</span>
      <span>{profile.role} · IHEID</span>
    </footer>
  );
}
