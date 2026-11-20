# A Little Blessing

React + Vite + TypeScript implementation of the supplied powder-blue and ivory reference. Original specification files remain in the parent directory.

## Local development

Run `npm install`, then `npm run dev` from this directory. On PowerShell systems that block scripts, use `npm.cmd`. `npm run build` runs TypeScript validation and creates `dist/`.

Without environment variables the application runs in clearly labeled demo mode. The studio is available at `/admin`. Demo edits, published content, and guest replies persist in this browser's local storage only. Search for Santos or Juan Dela Cruz. Demo mode is not a shared RSVP service.

## Connect the real service

1. Create a Supabase project and apply `supabase/migrations/001_invitation.sql` using the SQL editor or Supabase CLI.
2. Create the owner's Auth user, then insert its UUID into `admin_users` with role `owner` using the SQL editor. There is no public admin signup.
3. Copy `.env.example` to `.env.local` and fill the Supabase URL and public anon/publishable key. Never put the service-role key in a Vite variable.
4. Deploy `invitation-api` with the Supabase CLI. Set `ALLOWED_ORIGINS` to comma-separated frontend origins, and set a random `RATE_LIMIT_SALT`. The function uses the server-provided Supabase service-role secret.
5. Sign into `/admin`, configure actual event facts and owned/licensed media, save a draft, preview, and publish. Configure the date as an explicit ISO instant, e.g. `2027-03-15T10:00:00+08:00`, with `Asia/Manila`.
6. Upload private media through Supabase Storage. For this initial studio, the image/audio editor accepts permanent HTTPS media URLs; avoid expiring signed URLs in published content. Publish approved assets through a suitable CDN or a separately configured public media bucket.
7. Deploy `dist/` to Vercel or Sites. Vercel SPA rewrites are included. Rebuild after changing Vite environment variables.

## Implemented

Responsive envelope with skip/reduced-motion handling; illustrated botanical backdrop; invitation, ceremony/reception, dress code, countdown with missing-date and zero states; gallery and keyboard-accessible modal; optional gesture-initiated music; family/individual name search, per-person RSVP, review/confirmation; admin login when connected; dashboard, content drafts/publish, event and media URL editing, accent color, guest addition, response correction and CSV export. RLS denies anonymous table access; Edge API limits requests; opaque expiring selection references; atomic group RSVP validation, deadline enforcement and response history.

## Remaining production work

The broader v2.0 specification includes a CSV import wizard, drag-and-drop media uploads with metadata and focal points, section reordering/visibility, granular appearance/envelope controls, role management UI, publish audit/rollback UI, realtime dashboard updates, indexed normalized guest search, and full browser/security/load testing. Those are not implemented in this initial build. Guest search currently scans records server-side and is appropriate only for the initial small event; add indexed search before increasing the guest list significantly. Reopen the studio to refresh externally changed guest responses.

Name-only RSVP intentionally cannot verify identity. All real guest data must use the connected service, not demo browser storage. Confirm the API gateway supplies trusted client-IP headers before relying on IP throttling. Request-limit records should be periodically purged with a scheduled cleanup job.

## Visual assets

`public/florals.png` was created with the built-in ImageGen tool. Prompt: “Sparse delicate powder blue hydrangeas, white blossoms, muted sage eucalyptus along the lower corners and edges; luminous ivory watercolor paper; wide blank center; ethereal blue washes; premium christening stationery; no text, people, frames, or UI.”

The default portrait and gallery are illustrative Unsplash photos bundled in public/photo-0.jpg through public/photo-2.jpg and must be replaced with the family's approved photos before launch. No event date or real family facts are assumed.
