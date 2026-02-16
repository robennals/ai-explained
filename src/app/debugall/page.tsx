import Link from "next/link";
import { chapters } from "@/lib/curriculum";

export default function DebugAllPage() {
  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>All Chapters (debug)</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {chapters.map((ch) => (
          <li key={ch.slug} style={{ marginBottom: "0.5rem" }}>
            <Link href={`/${ch.slug}`}>{ch.title}</Link>{" "}
            <span
              style={{
                fontSize: "0.8em",
                color: ch.ready ? "green" : "gray",
              }}
            >
              {ch.ready ? "ready" : "coming soon"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
