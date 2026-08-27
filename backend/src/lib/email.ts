import { logger } from "./logger.js";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

// No provider configured is a valid state (local dev, or before the account
// exists): log the message instead of failing so the calling flow still
// completes end-to-end.
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.info(
      { to: message.to, subject: message.subject, text: message.text },
      "RESEND_API_KEY not configured — logging email instead of sending it"
    );
    return;
  }

  const from = process.env.EMAIL_FROM ?? "GuildWork <no-reply@guildwork.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.text })
  });

  if (!res.ok) {
    throw new Error(`Failed to send email: ${res.status} ${await res.text()}`);
  }
}
