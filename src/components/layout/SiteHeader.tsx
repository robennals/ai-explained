import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground">
          <span className="text-lg">Learn AI by Messing About</span>
        </Link>
        <nav className="ml-auto flex items-center gap-6 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">
            Chapters
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
