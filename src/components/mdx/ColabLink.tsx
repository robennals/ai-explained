"use client";

import { usePathname } from "next/navigation";
import { chapterFromPathname, track } from "@/lib/analytics";

/** The "Open in Google Colab" button, reporting `colab_open` when clicked. */
export function ColabLink({ href }: { href: string }) {
  const chapter = chapterFromPathname(usePathname());

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => chapter && track("colab_open", { chapter })}
      className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
    >
      Open in Google Colab →
    </a>
  );
}
