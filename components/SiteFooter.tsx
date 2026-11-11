import { profile } from "@/lib/content";

export default function SiteFooter() {
  return <footer className="site-footer">© {new Date().getFullYear()} {profile.name} · {profile.affiliation}, {profile.location}</footer>;
}
