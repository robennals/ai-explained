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
