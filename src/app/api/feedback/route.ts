import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { composeEmail, type Email, type FeedbackPayload } from "@/lib/feedback-email";

const POSTMARK_ENDPOINT = "https://api.postmarkapp.com/email";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RECIPIENT = "rob.ennals@gmail.com";

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

  let body: FeedbackPayload;
  try {
    body = (await request.json()) as FeedbackPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.hp_referrer && body.hp_referrer.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const referer = (await headers()).get("referer") ?? "(unknown page)";
  const composed = composeEmail(body, referer);
  if ("error" in composed) {
    return NextResponse.json({ error: composed.error }, { status: 400 });
  }

  const outgoing = composed.email;
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
