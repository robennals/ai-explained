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
