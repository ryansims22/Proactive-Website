/**
 * Cloudflare Pages Function — handles POSTs from the contact form.
 *
 * Route: POST /api/contact
 *
 * Environment variables (set in the Cloudflare Pages dashboard):
 *   CONTACT_TO_EMAIL      — where submissions are delivered (e.g. ryan@proactive-at.com)
 *   CONTACT_FROM_EMAIL    — verified sender on your domain (e.g. noreply@proactive-at.com)
 *   TURNSTILE_SECRET_KEY  — (optional) Cloudflare Turnstile secret; if set, tokens are verified
 *
 * Email delivery uses MailChannels, which is free for requests originating
 * from Cloudflare Workers/Pages. For MailChannels to accept mail from your
 * domain, add the Domain Lockdown TXT record:
 *   _mailchannels.proactive-at.com  TXT  "v=mc1 cfid=<your-pages-subdomain>.pages.dev"
 */

const REQUIRED_FIELDS = ["name", "email", "message"];

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  // Honeypot — real users never fill this hidden field.
  if (data.company_website) {
    return json({ ok: true }); // pretend success to bots
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field] || String(data[field]).trim() === "") {
      return json({ ok: false, error: `Missing required field: ${field}` }, 400);
    }
  }

  const email = String(data.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  // Optional Turnstile verification
  if (env.TURNSTILE_SECRET_KEY) {
    const token = data["cf-turnstile-response"];
    if (!token) {
      return json({ ok: false, error: "Please complete the verification." }, 400);
    }
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("cf-connecting-ip") || "",
      }),
    });
    const outcome = await verify.json();
    if (!outcome.success) {
      return json({ ok: false, error: "Verification failed. Please try again." }, 400);
    }
  }

  const name = String(data.name).trim().slice(0, 200);
  const phone = String(data.phone || "").trim().slice(0, 50);
  const message = String(data.message).trim().slice(0, 5000);

  const bodyText = [
    `New contact form submission from proactive-at.com`,
    ``,
    `Name:    ${name}`,
    `Email:   ${email}`,
    phone ? `Phone:   ${phone}` : null,
    ``,
    `Message:`,
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const mail = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: env.CONTACT_TO_EMAIL }] }],
      from: {
        email: env.CONTACT_FROM_EMAIL,
        name: "Proactive Accounting & Tax — Website",
      },
      reply_to: { email, name },
      subject: `Website inquiry from ${name}`,
      content: [{ type: "text/plain", value: bodyText }],
    }),
  });

  if (!mail.ok && mail.status !== 202) {
    return json(
      { ok: false, error: "Something went wrong sending your message. Please call us at (760) 205-0625." },
      502
    );
  }

  return json({ ok: true });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}
