import nodemailer, { type Transporter } from "nodemailer";

const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER ?? "";
const pass = process.env.SMTP_PASS ?? "";
const from = process.env.SMTP_FROM || user;

// Cache the transport across dev hot-reloads (same reasoning as the Mongo client).
const globalForMail = globalThis as unknown as {
  _mailTransport?: Transporter;
};

/** Whether SMTP credentials are present, so email can actually be sent. */
export function isMailConfigured(): boolean {
  return Boolean(user && pass);
}

function getTransport(): Transporter | null {
  if (!user || !pass) return null; // SMTP not configured — caller logs/skips
  if (!globalForMail._mailTransport) {
    globalForMail._mailTransport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user, pass },
    });
  }
  return globalForMail._mailTransport;
}

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email. Never throws — returns true on success, false otherwise — so
 * it is safe to call from `after()` without breaking the originating request.
 */
export async function sendMail({ to, subject, text, html }: MailInput): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.warn(`[mailer] SMTP not configured; skipping email to ${to} (${subject})`);
    return false;
  }
  try {
    await transport.sendMail({ from, to, subject, text, html });
    return true;
  } catch (err) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}

const wrap = (title: string, bodyHtml: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#171717">
    <h2 style="margin:0 0 16px">${title}</h2>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:12px;color:#888">Stocks Manager</p>
  </div>`;

/** Password-reset email with the tokenized link. */
export function passwordResetEmail(link: string): { subject: string; text: string; html: string } {
  return {
    subject: "Reset your Stocks Manager password",
    text: `We received a request to reset your password.\n\nReset it here (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    html: wrap(
      "Reset your password",
      `<p>We received a request to reset your password. This link is valid for <strong>1 hour</strong>.</p>
       <p><a href="${link}" style="display:inline-block;background:#171717;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset password</a></p>
       <p style="font-size:12px;color:#888">Or paste this URL into your browser:<br/>${link}</p>
       <p style="font-size:12px;color:#888">If you didn't request this, you can safely ignore this email.</p>`,
    ),
  };
}

/** Confirmation email sent after a transaction is recorded. */
export function stockAddedEmail(detail: {
  type: string;
  quantity: number;
  name: string;
  unitPrice: number;
  totalPrice: number;
}): { subject: string; text: string; html: string } {
  const { type, quantity, name, unitPrice, totalPrice } = detail;
  const rs = (n: number) =>
    `Rs ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return {
    subject: `Transaction recorded: ${type} ${name}`,
    text: `A new transaction was added to your portfolio:\n\n${type} ${quantity} ${name} @ ${rs(unitPrice)}\nTotal: ${rs(totalPrice)}`,
    html: wrap(
      "Transaction recorded",
      `<p>A new transaction was added to your portfolio:</p>
       <table style="font-size:14px;border-collapse:collapse">
         <tr><td style="padding:2px 12px 2px 0;color:#888">Type</td><td><strong>${type}</strong></td></tr>
         <tr><td style="padding:2px 12px 2px 0;color:#888">Name</td><td><strong>${name}</strong></td></tr>
         <tr><td style="padding:2px 12px 2px 0;color:#888">Quantity</td><td>${quantity}</td></tr>
         <tr><td style="padding:2px 12px 2px 0;color:#888">Unit price</td><td>${rs(unitPrice)}</td></tr>
         <tr><td style="padding:2px 12px 2px 0;color:#888">Total</td><td>${rs(totalPrice)}</td></tr>
       </table>`,
    ),
  };
}
