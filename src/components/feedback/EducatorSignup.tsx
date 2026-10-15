"use client";

import { HoneypotField, useMessageForm } from "./useMessageForm";

const INPUT = "rounded-md border border-foreground/20 bg-background px-3 py-2";

/** The "tell me you're using it" form on /educators. */
export function EducatorSignup() {
  const { status, error, handleSubmit } = useMessageForm((field) => ({
    type: "educator",
    name: field("name"),
    email: field("email"),
    organization: field("organization"),
    course: field("course"),
    students: field("students"),
    message: field("message"),
  }));

  if (status === "success") {
    return (
      <p className="rounded-md bg-success/10 p-4 text-sm">
        Thanks — it means a lot to know this is being used in a class.
        I&apos;ll reply if you asked anything.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <HoneypotField />
      <label className="grid gap-1 text-sm">
        <span>Your name (optional)</span>
        <input type="text" name="name" maxLength={100} className={INPUT} />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Your email</span>
        <input type="email" name="email" required maxLength={200} className={INPUT} />
      </label>
      <label className="grid gap-1 text-sm">
        <span>School or organization</span>
        <input type="text" name="organization" required maxLength={200} className={INPUT} />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Course</span>
        <input type="text" name="course" required maxLength={200} className={INPUT} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        <span>Roughly how many students? (optional)</span>
        <input type="text" name="students" maxLength={50} className={`${INPUT} sm:max-w-48`} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        <span>Anything else? (optional)</span>
        <textarea name="message" maxLength={5000} rows={3} className={INPUT} />
      </label>
      {status === "error" && error && (
        <p className="text-sm text-warning sm:col-span-2" role="alert">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
