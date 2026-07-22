# Proactive Accounting & Tax — proactive-at.com

Static rebuild of the original WordPress site as clean, semantic HTML/CSS.
No build step, no frameworks — deployable directly to **Cloudflare Pages**.

## Structure

```
proactive-website/
├── index.html                      # Home
├── our-approach/index.html
├── tax-accounting-services/index.html
├── contact/index.html              # Contact form (Cloudflare-powered)
├── discovery-call/index.html
├── meet-ryan-sims/index.html
├── privacy-policy/index.html
├── robots.txt                      # Allows all crawlers incl. AI bots; points to sitemap
├── sitemap.xml                     # All indexable pages (privacy policy is noindex, excluded)
├── llms.txt                        # GEO: structured business summary for LLM crawlers
├── assets/
│   ├── css/style.css               # Single shared stylesheet
│   ├── js/main.js                  # Sticky header, mobile nav, form submit
│   └── img/                        # All images from the original site
└── functions/
    └── api/contact.js              # Cloudflare Pages Function (POST /api/contact)
```

Every page shares identical header/footer markup and the one stylesheet.
URLs match the original site (`/our-approach/`, `/contact/`, etc.).

## Deploying to Cloudflare Pages

1. Push this folder to a Git repo (or use `wrangler pages deploy .`).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages**, connect the repo.
   - Build command: *(none)*
   - Build output directory: `/` (repo root, i.e. this folder)
3. The `functions/` directory is picked up automatically — `functions/api/contact.js`
   becomes the `POST /api/contact` endpoint.

## Contact form configuration

The form on `/contact/` posts to `/api/contact`, which emails the submission via
MailChannels (free from Cloudflare Workers/Pages). Set these environment variables
in **Pages → Settings → Environment variables**:

| Variable | Required | Example |
|---|---|---|
| `CONTACT_TO_EMAIL` | yes | `ryan@proactive-at.com` |
| `CONTACT_FROM_EMAIL` | yes | `noreply@proactive-at.com` |
| `TURNSTILE_SECRET_KEY` | no | enables Cloudflare Turnstile bot protection |

For MailChannels to accept mail from the domain, add this DNS TXT record
(Domain Lockdown):

```
_mailchannels.proactive-at.com  TXT  "v=mc1 cfid=<your-project>.pages.dev"
```

For best deliverability also add an SPF record that includes MailChannels:

```
proactive-at.com  TXT  "v=spf1 a mx include:relay.mailchannels.net ~all"
```

### Optional: Turnstile (bot protection)

1. Create a Turnstile widget in the Cloudflare dashboard for `proactive-at.com`.
2. Set `TURNSTILE_SECRET_KEY` in the Pages env vars.
3. Add to the form in `contact/index.html`, just above the submit button:
   ```html
   <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
   ```

Without Turnstile the form still has a honeypot field that silently drops bot
submissions.

## Notes vs. the original site

- **Fonts:** Trirong + Source Sans 3 from Google Fonts (same as original).
  Root font-size is 14px to preserve the original em-based sizing.
- **Icons:** the original loaded all of FontAwesome; this rebuild uses small
  inline SVGs (phone, map pin, checkmarks, service icons) — no icon font.
- **Dropped:** LeadConnector/GoHighLevel booking widget and form embeds; the
  discovery-call page now routes to the contact form and phone number.
- **Content fixes** (deliberate, from the source): "financial managment" →
  "management"; "trusted a partner" → "a trusted partner"; "lead by your CPA" →
  "led by your CPA"; the Business Advisory section's duplicated kicker got
  advisory-specific copy; the privacy policy was rewritten for a static site
  (the original was unmodified WordPress boilerplate) — **have Ryan review it**.
- Original visual quirks preserved: transparent header that darkens on scroll,
  95vh home hero, 240px parallax-style banner, sage eyebrows, gold hover
  accents, 18px image radii, pattern strips, green hairline dividers.

## Local preview

Any static server works, e.g.:

```
npx wrangler pages dev .        # includes the /api/contact function
# or
python -m http.server 8080      # static pages only
```
