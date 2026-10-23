# Chapter Feedback Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a feedback form at the bottom of every tutorial chapter. Submissions email the author via Postmark, with the sender CC'd.

**Architecture:** A new client component `<Feedback />` is mounted in the `(tutorial)` route layout, after `{children}`. It posts JSON to a new Next.js API Route Handler at `/api/feedback`, which validates input (including a hidden honeypot for spam) and forwards to Postmark's REST API.

**Tech Stack:** Next.js 16 App Router, React 19, Postmark REST API (no SDK; plain `fetch`), Tailwind, Playwright for E2E.

**Spec:** `docs/superpowers/specs/2026-04-26-chapter-feedback-design.md`

**Environment:** `POSTMARK_TOKEN` and `POSTMARK_FROM` are already set in `.env.local` (gitignored) and in Vercel (Production + Preview). No additional env work needed during implementation.

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `src/components/feedback/Feedback.tsx` | Create | Client form component (intro callout + name/email/message fields + honeypot + submit) |
| `src/app/api/feedback/route.ts` | Create | Server Route Handler: validates payload, sends via Postmark |
| `src/app/(tutorial)/layout.tsx` | Modify | Render `<Feedback />` after `{children}` inside `<main>` |
| `tests/feedback.spec.ts` | Create | Playwright E2E with mocked `/api/feedback` |

---

## Task 1: Create the API route

**Files:**
- Create: `src/app/api/feedback/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/feedback/route.ts` with this exact content:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const POSTMARK_ENDPOINT = "https://api.postmarkapp.com/email";
const RECIPIENT = "rob.ennals@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  name?: string;
  email?: string;
  message?: string;
  website?: string;
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

  if (body.website && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();
  const name = (body.name ?? "").trim().slice(0, 100);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Valid email required." },
      { status: 400 },
    );
  }
  if (!message || message.length > 5000) {
    return NextResponse.json(
      { error: "Message required (max 5000 chars)." },
      { status: 400 },
    );
  }

  const referer = (await headers()).get("referer") ?? "(unknown page)";
  const oneLine = message.replace(/\s+/g, " ").trim();
  const subject =
    `Feedback on ${referer}: ` +
    oneLine.slice(0, 60) +
    (oneLine.length > 60 ? "…" : "");

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
- `RECIPIENT` is hard-coded — author's email from the project's CLAUDE.md.
- The honeypot field is named `website`. If filled, return fake-success (don't send) so bots don't learn they were caught.
- We don't sanitize the message for HTML because Postmark sends as `TextBody` (plain text). No injection vector for HTML email.
- The Postmark `MessageStream: "outbound"` is the default transactional stream every Postmark server has.

- [ ] **Step 2: Quick smoke check via curl with valid input**

Start dev server in another shell (`pnpm dev`). Then:

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"name":"Curl Test","email":"rob.ennals+curltest@gmail.com","message":"automated curl smoke test, please ignore"}'
```

Expected: `HTTP/1.1 200 OK`, body `{"ok":true}`. The author should receive an actual email (CC'd to rob.ennals+curltest@gmail.com — gmail aliases get delivered to the same inbox so you can see both deliveries in your inbox/CC). Delete the test email afterward.

If 503: env vars not loaded — restart dev server after confirming `.env.local` has `POSTMARK_TOKEN=...` and `POSTMARK_FROM=...`.

If 502 with Postmark error in server logs: most commonly the `From` address isn't verified in your Postmark account. Verify it at https://account.postmarkapp.com → Sender Signatures.

- [ ] **Step 3: Smoke check honeypot**

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"name":"Bot","email":"bot@example.com","message":"hello","website":"http://spam.example.com"}'
```

Expected: `HTTP/1.1 200 OK`, body `{"ok":true}`, but **no email arrives** in your inbox. Verify by waiting 30s and checking.

- [ ] **Step 4: Smoke check validation**

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"email":"not-an-email","message":"x"}'
```

Expected: `HTTP/1.1 400`, body includes `"error":"Valid email required."`.

```bash
curl -i -X POST http://localhost:3000/api/feedback \
  -H "content-type: application/json" \
  -d '{"email":"a@b.co","message":""}'
```

Expected: `HTTP/1.1 400`, body includes `"error":"Message required (max 5000 chars)."`.

---

## Task 2: Failing E2E test for the form

**Files:**
- Create: `tests/feedback.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/feedback.spec.ts` with this exact content:

```ts
import { test, expect } from "@playwright/test";

test.describe("Chapter Feedback Form", () => {
  test("renders intro callout and form fields at bottom of chapter 1", async ({
    page,
  }) => {
    await page.goto("/computation");

    const intro = page.getByText("I'd love to hear from you.");
    await intro.scrollIntoViewIfNeeded();
    await expect(intro).toBeVisible();

    await expect(page.getByLabel(/your email/i)).toBeVisible();
    await expect(page.getByLabel("Message")).toBeVisible();
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });

  test("renders form on a different chapter (transformers)", async ({
    page,
  }) => {
    await page.goto("/transformers");
    await expect(
      page.getByRole("button", { name: /send/i })
    ).toBeVisible();
  });

  test("submitting a valid form shows the thank-you message", async ({
    page,
  }) => {
    // Mock /api/feedback so this test does not call Postmark.
    await page.route("**/api/feedback", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      })
    );

    await page.goto("/computation");
    await page
      .getByRole("button", { name: /send/i })
      .scrollIntoViewIfNeeded();
    await page.getByLabel(/your name/i).fill("Playwright");
    await page.getByLabel(/your email/i).fill("test@example.com");
    await page.getByLabel("Message").fill("automated test, please ignore");
    await page.getByRole("button", { name: /send/i }).click();

    await expect(
      page.getByText(/your message is on its way/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("server error keeps the form visible and shows the error", async ({
    page,
  }) => {
    await page.route("**/api/feedback", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Postmark exploded" }),
      })
    );

    await page.goto("/computation");
    await page
      .getByRole("button", { name: /send/i })
      .scrollIntoViewIfNeeded();
    await page.getByLabel(/your email/i).fill("test@example.com");
    await page.getByLabel("Message").fill("trigger error");
    await page.getByRole("button", { name: /send/i }).click();

    await expect(page.getByRole("alert")).toContainText("Postmark exploded");
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to confirm all four fail**

```bash
npx playwright test tests/feedback.spec.ts
```

Expected: 4 failures (no form, no intro callout, no thank-you message, etc.).

---

## Task 3: Create the Feedback component

**Files:**
- Create: `src/components/feedback/Feedback.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/feedback/Feedback.tsx` with this exact content:

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
      website: String(data.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}));
        throw new Error(
          (responseBody as { error?: string }).error ??
            `Request failed (${res.status})`,
        );
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
        I want every chapter to be easy for everyone to understand. Please
        send a message if anything was unclear, if you&apos;d like something
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
              Your email{" "}
              <span className="text-foreground/60">
                (required, so I can reply)
              </span>
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

Key points:
- Honeypot field is named `website`. Hidden via positioning + `aria-hidden` + `tabIndex={-1}`.
- Tailwind tokens `accent`, `foreground`, `background`, `success`, `warning` should already be defined in `globals.css`. If lint or visual review shows otherwise, fall back to literal Tailwind classes (`bg-blue-600`, `text-red-600`, etc.) — don't invent new tokens.
- `useState` is fine here (no hydration concerns; no `window`/`document` reads on first render).

---

## Task 4: Wire `<Feedback />` into the tutorial layout

**Files:**
- Modify: `src/app/(tutorial)/layout.tsx`

- [ ] **Step 1: Update the layout**

Replace the entire contents of `src/app/(tutorial)/layout.tsx` with:

```tsx
import { SideNav } from "@/components/layout/SideNav";
import { Feedback } from "@/components/feedback/Feedback";

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl">
      <SideNav />
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
        {children}
        <Feedback />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run the failing tests to confirm they now pass**

```bash
npx playwright test tests/feedback.spec.ts
```

Expected: 4 passed.

---

## Task 5: Verify build, lint, and full test suite

**Files:** none modified

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 2: Run production build**

```bash
pnpm build
```

Expected: build succeeds. The `(tutorial)` layout becomes a server component that imports a client component (`<Feedback />`); the API route is a server-only handler.

- [ ] **Step 3: Run the full Playwright suite**

```bash
npx playwright test
```

Expected: the new feedback tests pass. Pre-existing test failures in `chapter01.spec.ts` and `homepage.spec.ts` (chapter 1 title rename) are out of scope and remain failing on this branch and on main.

If any test that was passing on main is now failing, do NOT modify the test — investigate the regression in your changes.

- [ ] **Step 4: Commit**

```bash
git add src/components/feedback/Feedback.tsx 'src/app/api/feedback/route.ts' 'src/app/(tutorial)/layout.tsx' tests/feedback.spec.ts
git commit -m "Add chapter feedback form that emails the author via Postmark

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

`git status` should be clean afterward (apart from untracked `playwright-report/` and `test-results/` artifacts).

---

## Task 6: Manual verification (live behaviour)

**Files:** none modified.

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Submit real feedback**

Visit `http://localhost:3000/computation`. Scroll to the bottom. Fill the form (your real email, a brief test message), click Send. Verify the form is replaced with the thank-you message.

- [ ] **Step 3: Confirm email delivery**

Within ~1 minute you should receive an email at the configured `POSTMARK_FROM` recipient inbox (likely both gmail addresses since the address you used is also CC'd). Check:
- Subject begins with "Feedback on http://localhost:3000/computation: ..."
- Body contains your message
- Email footer shows "From: ..." and "Page: ..."
- Reply-To is set to the email you submitted

If no email arrives, check Postmark's Activity log (https://account.postmarkapp.com → Servers → your server → Activity) for the message status.

- [ ] **Step 4: Test on a different chapter**

Visit `http://localhost:3000/transformers`. Submit another short message. Verify a new email arrives with subject referencing `/transformers`.

- [ ] **Step 5: Optional — verify production after merge**

After this branch is merged and deployed, repeat steps 2–4 against the production URL. If the production submit fails with 503, the env vars in Vercel weren't loaded (verify via `vercel env ls`).

---

## Acceptance criteria recap

- A feedback form appears at the bottom of every tutorial chapter page. *(Task 4 + Task 6 step 2)*
- The intro callout reads as drafted. *(Task 3)*
- Submitting a valid form sends an email to the author with the sender CC'd; reply-to is the sender. *(Task 6 step 3)*
- A second chapter's submission references that chapter's URL in the subject. *(Task 6 step 4)*
- Honeypot submissions return ok but do not send email. *(Task 1 step 3)*
- Invalid input (bad email, empty message) returns 400 with a clear message. *(Task 1 step 4)*
- `pnpm build` and `pnpm lint` pass. *(Task 5 steps 1–2)*
