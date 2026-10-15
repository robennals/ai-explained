"use client";

import { useState } from "react";
import type { FeedbackPayload } from "@/lib/feedback-email";

type Status = "idle" | "submitting" | "success" | "error";

/** Reads one text field of the submitted form, as "" if it's missing. */
type FieldReader = (name: string) => string;

/** Sends a form's fields to /api/feedback and tracks how that went. */
export function useMessageForm(toPayload: (field: FieldReader) => FeedbackPayload) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = new FormData(event.currentTarget);
    const field: FieldReader = (name) => String(form.get(name) ?? "");
    const payload: FeedbackPayload = {
      ...toPayload(field),
      hp_referrer: field("hp_referrer"),
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

  return { status, error, handleSubmit };
}

/**
 * Spam honeypot: hidden from humans, but bots fill every field.
 * The name must NOT match a browser autofill token (website, url,
 * email, name, tel, …) or password managers fill it and silently
 * flag real users as bots. "hp_referrer" matches no autofill
 * heuristic.
 */
export function HoneypotField() {
  return (
    <input
      type="text"
      name="hp_referrer"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  );
}
