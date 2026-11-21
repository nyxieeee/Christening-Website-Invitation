# Testing & Deployment Checklist

## Unit tests
- Name normalization (case, spaces, punctuation, accents), empty and malformed input.
- Countdown timezone conversion, zero clamp, date changes and invalid dates.
- Envelope state transitions, reduced-motion and Skip behavior.
- Audio play/pause/mute, permission rejection, missing track and loop.
- RSVP family selection, untouched members, duplicate-name UUID isolation.
- CMS schema validation, section order and required alt text.

## Integration tests
- Public functions return only limited guest data and enforce rate limits.
- `submit-rsvp` validates group membership, deadline, statuses, and atomic writes.
- Concurrent edits produce one current response per guest with recorded history.
- Admin authentication and RLS reject unauthorized access and cross-role actions.
- Draft/preview/publish shows correct public snapshot; media references remain valid.
- CSV import of 500+ guests with family grouping, duplicates and invalid rows.

## E2E tests
- Mobile envelope open → music toggle → countdown → gallery → name search → RSVP → thank-you.
- Family member partial RSVP; admin checkmarks and statistics update.
- Duplicate names remain distinguishable; typo suggestions do not auto-submit.
- Admin uploads new hero/gallery/music, changes event date and publishes; public site updates.
- Closed RSVP deadline, absent event date, empty gallery, blocked music, offline/slow network.
- Safari iOS, Chrome Android, desktop Chrome/Firefox/Safari where available; keyboard and screen-reader checks.

## Security/privacy
- Never expose service-role key or unrestricted guest table in frontend.
- Rate-limit and monitor anonymous name searches and submissions; cap response data.
- Name-only RSVP is susceptible to impersonation; record this as an accepted product risk and provide admin correction tools.
- Use validated storage uploads, safe URLs, RLS, audit logs, backups, HTTPS and security headers.
- Confirm permission to publish a child's photos and handle guest names responsibly; provide post-event retention/deletion plan.

## Deployment
1. Create Supabase project; apply migrations and RLS; configure Auth, Storage and Edge Functions.
2. Set server secrets in Supabase; frontend uses only public Supabase URL/publishable key.
3. Deploy Vite to Vercel; configure SPA fallback rewrite to `index.html`.
4. Set approved origins/CORS, production domain, CSP, HTTPS and error monitoring.
5. Upload owned/licensed assets and configure real event details in admin.
6. Test production on mobile, run guest import, publish, and verify countdown and RSVP dashboard.
7. Schedule backups and define archival/deletion after the christening.

## Release gate
No release until admin access is enforced, public data exposure is reviewed, countdown is accurate, music is optional, envelope is skippable, and all guest-facing content can be edited through admin.
