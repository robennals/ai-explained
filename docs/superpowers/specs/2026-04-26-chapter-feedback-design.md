# Chapter Feedback Form — Design

**Status:** Draft
**Date:** 2026-04-26
**Author:** Rob Ennals (with Claude)

## Goal

Let readers send the author private feedback from the bottom of every tutorial chapter. Each submission emails Rob, with the sender CC'd so they have a record.

This replaces an earlier exploration of public commenting (Giscus, then Cusdis). Public visibility of comments is not important; what matters is that readers can reach the author easily and the author actually gets the message.

## Why a custom form (not a third-party comment system)

Two attempts at hosted commenting systems hit blockers:

1. **Giscus** — required GitHub OAuth with the `public_repo` scope, which displays as "act on your behalf in your repos" and was a non-starter for non-developer readers.
2. **Cusdis** — comment posting and the dashboard UI worked fine, but email and webhook notifications are silently broken on both free and paid tiers (open issues [djyde/cusdis#303](https://github.com/djyde/cusdis/issues/303), [#305](https://github.com/djyde/cusdis/issues/305) — months unfixed). Without notifications, the system fails the original requirement.

A simple form-to-email is small, fully under our control, and uses Postmark — a service the author already has and trusts.

## Architecture

```
Reader's browser
  ├── Chapter page (Next.js route)
  │     └── (tutorial) layout
  │           └── <Feedback /> client component
  │                 ├── Intro callout
  │                 └── form: name, email, message, hidden honeypot, submit
  │                          │
  │                          └─POST /api/feedback (JSON)─┐
  │                                                       │
  │                          ┌────────────────────────────┘
  │                          ↓
  │                Next.js route handler (server)
  │                          │
  │                          ├── validate input + reject if honeypot filled
  │                          └── POST to Postmark API → email delivered
  │                                       │
  │                                       ├── To: rob.ennals@gmail.com
  │                                       ├── Cc: <sender's email>
  │                                       └── Reply-To: <sender's email>
  └─UI updates with success/error response─┘
```

No public comment storage. Each feedback message exists only as the email Rob receives.

## Environment

Two server-only environment variables (already populated in `.env.local`, gitignored):

- `POSTMARK_TOKEN` — Postmark Server API token
- `POSTMARK_FROM` — verified sender email in Postmark

For production, the same two variables must be set in Vercel project settings (Production + Preview).

## Components

### `src/components/feedback/Feedback.tsx` (client)

A form with three visible fields, one hidden honeypot, and a submit button. Manages four UI states: idle, submitting, success, error.

```tsx
"use client";

import { useState } from "react";
import { Callout } from "@/components/mdx/Callout";

type Status = "idle" | "submitting" | "success" | "error";

export function Feedback() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""), // honeypot
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section className="mt-12 border-t border-foreground/10 pt-8">
      <Callout type="info" title="I&apos;d love to hear from you.">
        I want every chapter to be easy for everyone to understand. Please send
        a message if anything was unclear, if you&apos;d like something
        explained in more depth, or if there&apos;s something about this part
        of AI you wanted to understand that the chapter didn&apos;t cover.
        I&apos;ll get an email and reply when I can.
      </Callout>
      {status === "success" ? (
        <p className="mt-4 rounded-md bg-success/10 p-4 text-sm">
          Thanks — your message is on its way. I&apos;ll reply when I can.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          {/* Honeypot: real users don't fill this. CSS hides it visually. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
          <label className="grid gap-1 text-sm">
            <span>Your name (optional)</span>
            <input
              type="text"
              name="name"
              maxLength={100}
              className="rounded-md border border-foreground/20 bg-background px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>
              Your email <span className="text-foreground/60">(required, so I can reply)</span>
            </span>
            <input
              type="email"
              name="email"
              required
              maxLength={200}
              className="rounded-md border border-foreground/20 bg-background px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Message</span>
            <textarea
              name="message"
              required
              minLength={1}
              maxLength={5000}
              rows={5}
              className="rounded-md border border-foreground/20 bg-background px-3 py-2"
            />
          </label>
          {status === "error" && error && (
            <p className="text-sm text-warning" role="alert">
              {error}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
            >
              {status === "submitting" ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
```

Notes:
- The honeypot field name is `website` (a plausible-sounding name bots will fill). The form is hidden from sight via positioning + `aria-hidden`. Real users with screen readers won't focus it because of `tabIndex={-1}`.
- Tailwind class names match site conventions (`accent`, `foreground`, `background`, `success`, `warning` design tokens).
- After success, the form is replaced with a thank-you message — submitting twice on the same chapter requires a page reload, which is fine for a low-volume action.

### `src/app/api/feedback/route.ts` (server)

A Next.js Route Handler that accepts POST JSON, validates, and forwards to Postmark.

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const POSTMARK_ENDPOINT = "https://api.postmarkapp.com/email";
const RECIPIENT = "rob.ennals@gmail.com";

type Payload = {
  name?: string;
  email?: string;
  message?: string;
  website?: string; // honeypot
};

export async function POST(request: Request) {
  const token = process.env.POSTMARK_TOKEN;
  const from = process.env.POSTMARK_FROM;
  if (!token || !from) {
    return NextResponse.json(
      { error: "Feedback is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — bots usually fill any field they see. Real users see nothing.
  if (body.website && body.website.trim().length > 0) {
    // Pretend success to avoid signaling the trap.
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();
  const name = (body.name ?? "").trim().slice(0, 100);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  if (!message || message.length > 5000) {
    return NextResponse.json({ error: "Message required (max 5000 chars)." }, { status: 400 });
  }

  const referer = (await headers()).get("referer") ?? "(unknown page)";
  const subject =
    `Feedback on ${referer}: ` +
    message.replace(/\s+/g, " ").slice(0, 60).trim() +
    (message.length > 60 ? "…" : "");

  const textBody =
    `${message}\n\n` +
    `---\n` +
    `From: ${name || "(no name given)"} <${email}>\n` +
    `Page: ${referer}\n`;

  const postmarkRes = await fetch(POSTMARK_ENDPOINT, {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      From: from,
      To: RECIPIENT,
      Cc: email,
      ReplyTo: email,
      Subject: subject,
      TextBody: textBody,
      MessageStream: "outbound",
    }),
  });

  if (!postmarkRes.ok) {
    const detail = await postmarkRes.text();
    console.error("Postmark error", postmarkRes.status, detail);
    return NextResponse.json(
      { error: "Couldn't send your message. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
```

Notes:
- `RECIPIENT` is hard-coded. If we later want it configurable, move to env. For now, hard-coding keeps the surface tight.
- `referer` is used for the page context (which chapter the reader was on). It's not security-relevant — a malicious sender could spoof it, but it's just informational. We don't trust it for routing decisions.
- `MessageStream: "outbound"` is the Postmark default transactional stream.
- The honeypot returns a fake-success rather than 400 to avoid teaching bots they were caught.

### Layout integration

`src/app/(tutorial)/layout.tsx` mounts `<Feedback />` after `{children}`, replacing the previous `<Comments />` slot.

## Tests

Playwright E2E (`tests/feedback.spec.ts`):

1. Visiting a chapter, the intro callout and form (name, email, message, send button) are all visible at the bottom.
2. Submitting an empty form shows native HTML5 validation (the email and message inputs are `required`).
3. Submitting a valid form with the dev server's API mocked to return `{ ok: true }` replaces the form with the thank-you message.

The third test mocks `/api/feedback` via Playwright's `page.route()` to avoid hitting real Postmark from CI.

## Out of scope

- Public comment display.
- Multi-recipient feedback (only Rob).
- Per-IP rate limiting (honeypot is the first line; revisit if abuse appears).
- Captcha / hCaptcha.
- Persisting feedback to a DB.
- Forwarding rules / Slack notifications (just an email).

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Bot spam exhausts Postmark credit | Honeypot field. Postmark also has its own abuse heuristics. If volume gets bad, add per-IP rate limiting. |
| Sender spoofs someone else's email → that person gets a CC | Acceptable per discussion — the same email goes to Rob, who will see and act on patterns of abuse. |
| Postmark token leaked | Token is in `.env.local` (gitignored) and Vercel env vars (encrypted). Never sent to client. The API route runs server-side only. |
| Reader's browser blocks JavaScript | Form won't submit. Acceptable; this is an interactive feature. A `<noscript>` fallback could mention emailing rob.ennals@gmail.com directly. (Considered out of scope unless requested.) |

## Acceptance

- A feedback form appears at the bottom of every tutorial chapter page.
- Submitting a valid form shows a thank-you message and triggers an email to rob.ennals@gmail.com (CC sender, Reply-To sender).
- The intro callout reads as drafted.
- Honeypot submissions return ok but do not send email.
- `pnpm build` and `pnpm lint` pass.
