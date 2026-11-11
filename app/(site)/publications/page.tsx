import { redirect } from "next/navigation";

// Papers are listed on the Research page; this index only forwards old links.
export default function PublicationsIndex() { redirect("/research/"); }
