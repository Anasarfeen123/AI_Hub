const nodemailer = require("nodemailer");

// Email is optional. With no SMTP settings the hub works exactly the same;
// features that send mail report that email isn't configured.
//
//   SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USER, SMTP_PASS, MAIL_FROM
//
// For Gmail: host smtp.gmail.com, port 465, and an App Password (Google
// Account → Security → App passwords), not the account password.
let transport = null;

function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (!mailConfigured()) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// A plain, friendly email: a heading, a few paragraphs and one button.
function layout({ heading, paragraphs, buttonText, buttonUrl, footer }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#14171c">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e3e5ea">
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#ab450b">MIC · AI/ML Resource Hub</p>
<h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(heading)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3b4250">${escapeHtml(p)}</p>`).join("")}
${buttonUrl ? `<p style="margin:22px 0 4px"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#f2711c;color:#0b0d10;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px">${escapeHtml(buttonText)}</a></p>` : ""}
</div>
<p style="margin:16px 4px 0;font-size:12px;line-height:1.5;color:#6b7280">${escapeHtml(footer || "You're getting this because you're on the MIC AI/ML member list.")}</p>
</div></body></html>`;
  const text = [heading, "", ...paragraphs, "", buttonUrl ? `${buttonText}: ${buttonUrl}` : "", "", footer || ""].join("\n");
  return { html, text };
}

async function sendMail({ to, subject, ...content }) {
  const t = getTransport();
  if (!t) return { sent: false, reason: "not-configured" };
  const { html, text } = layout(content);
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html, text });
  return { sent: true };
}

module.exports = { sendMail, mailConfigured };
