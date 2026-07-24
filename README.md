# Vijaya Ravi Mahal A/C — Booking Website

Bilingual (English/Tamil) venue website with a live, database-backed booking flow:
guest picks a date → fills details → reviews → pays via QR → gets a downloadable PDF receipt.
Admin dashboard shows every booking and can manually block/cancel dates.

## How it works

- **Calendar** — green = available, red = booked. Pulled live from Turso via `/api/bookings` (GET).
- **Guest booking** — click a green date → 4-step wizard (Details → Review → Pay → Receipt).
  On "I Have Paid", the browser calls `/api/bookings` (POST), which inserts the row in Turso.
  The `event_date` column has a `UNIQUE` constraint, so **the database itself guarantees only one
  booking per day**, even if two people click "book" at the same instant.
- **Payment** — self-confirmed. There's no live payment gateway; the guest scans the QR, pays via
  any UPI app, then taps "I Have Paid" to confirm. This matches what you asked for.
- **Receipt** — generated client-side as a PDF (html2canvas + jsPDF, loaded from CDN) and downloaded
  immediately — no server storage of the PDF itself.
- **Admin dashboard** — click the 🔐 button (bottom-right) and enter the admin password. This calls
  `/api/admin-bookings` (GET), which is protected server-side by the `ADMIN_PASSWORD` env var.
  From there you can see full guest details, manually block a date (e.g. for maintenance), or
  cancel/free any booking.

## 1. Add your real payment QR code

Add your UPI QR code image to the project root as:

```
payment-qr.png
```

Until you add it, the site falls back to an auto-generated placeholder QR so nothing breaks —
but **replace it before going live**, since the placeholder does not point to your UPI ID.

## 2. Create the Turso database

```bash
turso db create vijaya-ravi-mahal
turso db shell vijaya-ravi-mahal < db/schema.sql
turso db show vijaya-ravi-mahal          # copy the URL
turso db tokens create vijaya-ravi-mahal # copy the token
```

## 3. Set environment variables

Copy `.env.example` → note the three values, then add them in
**Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `TURSO_DATABASE_URL` | from `turso db show` |
| `TURSO_AUTH_TOKEN` | from `turso db tokens create` |
| `ADMIN_PASSWORD` | any password you choose for the admin dashboard |

## 4. Deploy

```bash
git init
git add .
git commit -m "Vijaya Ravi Mahal booking site"
git remote add origin <your-github-repo-url>
git push -u origin main
```

Then import the repo in Vercel (vercel.com → Add New → Project). Vercel auto-detects the
`api/*.js` files as serverless functions — no extra config needed. Add the environment
variables from step 3 before or right after the first deploy, then redeploy.

## Files

```
index.html              → the full website + booking wizard + admin dashboard
api/bookings.js         → GET availability / POST a new booking (public)
api/admin-bookings.js   → GET all bookings / POST admin block / DELETE — password-protected
api/_db.js              → shared Turso client + validation helpers
db/schema.sql           → run once to create the bookings table
payment-qr.png           → ⚠️ add your real UPI QR code image here (see step 1)
```

## Notes

- The purpose dropdown is exactly: Marriage, Reception, Puberty (Half Saree), Ear Boring, Others.
- The public `/api/bookings` GET endpoint only ever returns dates — never guest names, emails,
  or phone numbers — so the calendar stays privacy-safe for anyone browsing the site.
- Guest details are only visible through the password-protected admin dashboard.
