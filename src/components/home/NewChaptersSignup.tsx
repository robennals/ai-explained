// Where readers sign up to hear about new chapters. Currently Rob's blog;
// change it here if updates move somewhere else.
const SIGNUP_URL = "https://messyprogress.substack.com";

export function NewChaptersSignup() {
  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-accent/5 px-6 py-6 text-center ring-1 ring-inset ring-accent/20 sm:flex-row sm:text-left">
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">
          Want to know when these are written?
        </h3>
        <p className="mt-1 text-sm text-muted">
          I announce each new chapter on my blog, Messy Progress. Subscribe and
          you&apos;ll get an email when the next one is out.
        </p>
      </div>
      <a
        href={SIGNUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
      >
        Subscribe to Messy Progress
      </a>
    </div>
  );
}
