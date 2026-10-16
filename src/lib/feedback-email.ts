const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Body of a POST to /api/feedback. "feedback" comes from the form at the end
 * of every chapter; "educator" from the sign-up form on /educators.
 */
export type FeedbackPayload = {
  type?: "feedback" | "educator";
  name?: string;
  email?: string;
  message?: string;
  organization?: string;
  course?: string;
  students?: string;
  // Honeypot — kept in sync with HoneypotField. Not named after a browser
  // autofill token, or password managers trip it for real users.
  hp_referrer?: string;
};

export type Email = {
  replyTo: string;
  subject: string;
  text: string;
};

export type ComposeResult = { email: Email } | { error: string };

function trimmed(value: string | undefined, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

/** Validates a submission and turns it into the email Rob receives. */
export function composeEmail(body: FeedbackPayload, referer: string): ComposeResult {
  const email = (body.email ?? "").trim();
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return { error: "Valid email required." };
  }
  const name = trimmed(body.name, 100);
  const message = (body.message ?? "").trim();
  if (message.length > 5000) {
    return { error: "Message too long (max 5000 chars)." };
  }

  if (body.type === "educator") {
    const organization = trimmed(body.organization, 200);
    const course = trimmed(body.course, 200);
    if (!organization || !course) {
      return { error: "School or organization and course are required." };
    }
    const students = trimmed(body.students, 50);
    const text =
      `Name: ${name || "(no name given)"}\n` +
      `Email: ${email}\n` +
      `School/organization: ${organization}\n` +
      `Course: ${course}\n` +
      `Students: ${students || "(not given)"}\n\n` +
      `${message || "(no comment)"}\n`;
    return {
      email: { replyTo: email, subject: `[Educator] ${organization} — ${course}`, text },
    };
  }

  if (!message) {
    return { error: "Message required (max 5000 chars)." };
  }
  const oneLine = message.replace(/\s+/g, " ").trim();
  const subject =
    `Feedback on ${referer}: ` +
    oneLine.slice(0, 60) +
    (oneLine.length > 60 ? "…" : "");
  const text =
    `${message}\n\n` +
    `---\n` +
    `From: ${name || "(no name given)"} <${email}>\n` +
    `Page: ${referer}\n`;
  return { email: { replyTo: email, subject, text } };
}
