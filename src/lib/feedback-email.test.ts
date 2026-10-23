import { describe, expect, it } from "vitest";
import { composeEmail } from "./feedback-email";

const PAGE = "https://learnai.robennals.org/attention";

describe("composeEmail — chapter feedback", () => {
  it("puts the page and the start of the message in the subject", () => {
    const result = composeEmail(
      { name: "Ada", email: "ada@example.com", message: "Loved   the\nwidgets" },
      PAGE,
    );
    expect(result).toEqual({
      email: {
        replyTo: "ada@example.com",
        subject: `Feedback on ${PAGE}: Loved the widgets`,
        text: `Loved   the\nwidgets\n\n---\nFrom: Ada <ada@example.com>\nPage: ${PAGE}\n`,
      },
    });
  });

  it("requires a message", () => {
    expect(composeEmail({ email: "ada@example.com" }, PAGE)).toEqual({
      error: "Message required (max 5000 chars).",
    });
  });

  it("rejects a message over 5000 characters", () => {
    expect(composeEmail({ email: "ada@example.com", message: "x".repeat(5001) }, PAGE)).toEqual({
      error: "Message too long (max 5000 chars).",
    });
  });

  it("requires a valid email", () => {
    expect(composeEmail({ email: "nope", message: "hi" }, PAGE)).toEqual({
      error: "Valid email required.",
    });
  });
});

describe("composeEmail — educator sign-up", () => {
  const educator = {
    type: "educator" as const,
    name: "Grace",
    email: "grace@school.edu",
    organization: "Hopper High",
    course: "AI and Society",
    students: "30",
  };

  it("uses a filterable subject and includes every field", () => {
    const result = composeEmail({ ...educator, message: "Starting in March." }, PAGE);
    expect(result).toEqual({
      email: {
        replyTo: "grace@school.edu",
        subject: "[Educator] Hopper High — AI and Society",
        text:
          "Name: Grace\n" +
          "Email: grace@school.edu\n" +
          "School/organization: Hopper High\n" +
          "Course: AI and Society\n" +
          "Students: 30\n\n" +
          "Starting in March.\n",
      },
    });
  });

  it("doesn't require a comment", () => {
    const result = composeEmail(educator, PAGE);
    expect("email" in result && result.email.text).toContain("(no comment)");
  });

  it("requires the organization and course", () => {
    expect(composeEmail({ ...educator, organization: " " }, PAGE)).toEqual({
      error: "School or organization and course are required.",
    });
    expect(composeEmail({ ...educator, course: "" }, PAGE)).toEqual({
      error: "School or organization and course are required.",
    });
  });
});
