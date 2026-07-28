import { NextResponse } from "next/server";
import { headers } from "next/headers";

const POSTMARK_ENDPOINT = "https://api.postmarkapp.com/email";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RECIPIENT = "rob.ennals@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  name?: string;
  email?: string;
  message?: string;
  // Honeypot — kept in sync with the hidden field in Feedback.tsx. Not named
  // after a browser autofill token, or password managers trip it for real users.
  hp_referrer?: string;
};

type Email = {
  replyTo: string;
  subject: string;
  text: string;
};

// EMAIL_PROVIDER chooses "resend" (default) or "postmark".
// Each sender returns null when its env vars aren't configured.
async function sendWithResend(email: Email): Promise<Response | null> {
  const token = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!token || !from) return null;

  return fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [RECIPIENT],
      cc: [email.replyTo],
      reply_to: [email.replyTo],
      subject: email.subject,
      text: email.text,
    }),
  });
}

async function sendWithPostmark(email: Email): Promise<Response | null> {
  const token = process.env.POSTMARK_TOKEN;
  const from = process.env.POSTMARK_FROM;
  if (!token || !from) return null;

  return fetch(POSTMARK_ENDPOINT, {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      From: from,
      To: RECIPIENT,
      Cc: email.replyTo,
      ReplyTo: email.replyTo,
      Subject: email.subject,
      TextBody: email.text,
      MessageStream: "outbound",
    }),
  });
}

export async function POST(request: Request) {
  const provider =
    process.env.EMAIL_PROVIDER === "postmark" ? "postmark" : "resend";

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.hp_referrer && body.hp_referrer.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();
  const name = (body.name ?? "").trim().slice(0, 100);

  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
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

  const text =
    `${message}\n\n` +
    `---\n` +
    `From: ${name || "(no name given)"} <${email}>\n` +
    `Page: ${referer}\n`;

  const outgoing: Email = { replyTo: email, subject, text };
  const sendRes =
    provider === "postmark"
      ? await sendWithPostmark(outgoing)
      : await sendWithResend(outgoing);

  if (!sendRes) {
    return NextResponse.json(
      { error: "Feedback is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  if (!sendRes.ok) {
    const detail = await sendRes.text();
    console.error(`${provider} error`, sendRes.status, detail);
    return NextResponse.json(
      { error: "Couldn't send your message. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
