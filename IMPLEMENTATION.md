# A Little Blessing

React + Vite + TypeScript implementation of the supplied powder-blue and ivory reference. Original specification files remain in the parent directory.

## Local development

Run `npm install`, then `npm run dev` from this directory. On PowerShell systems that block scripts, use `npm.cmd`. `npm run build` runs TypeScript validation and creates `dist/`.

Without environment variables the public invitation uses sample content and browser-local demo guest replies. Search for Santos or Juan Dela Cruz. Demo mode is not a shared RSVP service. The admin panel is always private at `/admin`: there is no public admin link and no demo login bypass. With no authentication service configured, the sign-in screen remains locked.

## Connect the real service

1. Create a Supabase project and apply both SQL migrations in `supabase/migrations/` in numeric order using the SQL editor or Supabase CLI.
2. Create the owner's Auth user, then insert its UUID into `admin_users` with role `owner` using the SQL editor. There is no public admin signup.
3. Copy `.env.example` to `.env.local` and fill the Supabase URL and public anon/publishable key. Never put the service-role key in a Vite variable.
4. Deploy `invitation-api` with the Supabase CLI. Set `ALLOWED_ORIGINS` to comma-separated frontend origins, and set a random `RATE_LIMIT_SALT`. The function uses the server-provided Supabase service-role secret.
5. Sign into `/admin`, configure actual event facts and owned/licensed media, save a draft, preview, and publish. Configure the date as an explicit ISO instant, e.g. `2027-03-15T10:00:00+08:00`, with `Asia/Manila`.
6. Upload private media through Supabase Storage. The editor accepts JPEG/PNG/WebP photos and MP3/OGG/M4A music. Connected uploads stay in the private media bucket; published configuration resolves only referenced media to short-lived signed URLs through the Edge Function. Redeploy the updated Edge Function after upgrading this build.
7. Deploy `dist/` to Vercel or Sites. Vercel SPA rewrites are included. Rebuild after changing Vite environment variables.

## Implemented

Responsive envelope with skip/reduced-motion handling; illustrated botanical backdrop; invitation, ceremony/reception, dress code, countdown with missing-date and zero states; gallery and keyboard-accessible modal; optional gesture-initiated music; family/individual name search, per-person RSVP, review/confirmation; mandatory verified admin login; dashboard, content drafts/publish, event and media URL editing, accent color, guest addition, response correction and CSV export. RLS denies anonymous table access; Edge API limits requests; opaque expiring selection references; atomic group RSVP validation, deadline enforcement and response history. The editor remains hidden while authentication is checked; Supabase `getUser` verifies identity, and the server-managed `admin_users` registry must contain an `admin` or `owner` role. Missing configuration, invalid sessions, role-check errors and ordinary signed-in accounts never unlock the editor.

## Remaining production work

Remaining work from the broader v2.0 specification includes administrator account/role management UI, full media lifecycle management and drag-and-drop upload, indexed normalized guest search, and full browser/security/load testing. These are not part of this completion pass. CSV import, section ordering/visibility, typography/spacing controls, publication-history review, and automatic guest-response refresh are now implemented. Guest search currently scans records server-side and is appropriate only for the initial small event; add indexed search before increasing the guest list significantly. Guest responses refresh every 20 seconds while the studio is visible and when returning to the window.

Name-only RSVP intentionally cannot verify identity. All real guest data must use the connected service, not demo browser storage. Confirm the API gateway supplies trusted client-IP headers before relying on IP throttling. Request-limit records should be periodically purged with a scheduled cleanup job.

## Visual assets

`public/florals.png` was created with the built-in ImageGen tool. Prompt: “Sparse delicate powder blue hydrangeas, white blossoms, muted sage eucalyptus along the lower corners and edges; luminous ivory watercolor paper; wide blank center; ethereal blue washes; premium christening stationery; no text, people, frames, or UI.”

The default portrait is a fictional AI-generated sample in public/christening-portrait.png. The gallery now uses a matching fictional sleeping portrait and close-up in public/gallery-sleeping.png and public/gallery-little-hand.png. These samples must be replaced with the family's approved photos before launch. No event date or real family facts are assumed.


## Dimensional reference redesign

The invitation now uses layered CSS perspective for its envelope, textured paper folds, an embossed cross seal, a satin bow, and a staged reveal: seal releases, flap lifts, card rises, envelope lowers, card floats forward, light transition reveals the page. The default sequence is five seconds; admins can set three to eight seconds or disable it. A replay control, Skip control, and reduced-motion path are included. Background light particles, entrance animation, and scroll reveals add restrained motion.

The admin panel now matches the reference's sidebar, tabs, soft blue controls, form layout and adjacent live preview. It includes desktop/mobile preview modes, media replacement, vertical focal-point adjustment, gallery reordering, music upload/preview, volume and animation settings, content drafts and publishing.

Built-in ImageGen created these project assets:
- public/christening-scene.png — dimensional powder blue/ivory clouds, realistic flowers, chapel window, candles, teddy bear and flowing silk, with an empty center for HTML.
- public/satin-bow.png — transparent isolated powder blue satin bow with realistic folded loops and tails.
- public/christening-portrait.png — fictional smiling baby in ivory baptism clothing on a quilted blanket; illustrative only.

Validation: npm run build; node check-startup.mjs against a running development server; node check-render.mjs for server-rendering smoke checks of the envelope, full invitation and tabbed admin editor. Browser screenshot/click verification remains unavailable because this session's browser host and native UI pipe are offline.


## Completion pass

The invitation now renders editable welcome copy, event/gallery/family-message headings, celebration title and dedication, RSVP button and confirmation/closed messages. Sections can be hidden or reordered; hiding RSVP removes its entry points. Fonts and section spacing are configurable. Empty galleries are omitted for guests. An unconfigured date has a deliberate waiting state rather than an empty countdown. Image descriptions and gallery captions are editable.

The studio includes timezone-aware date/time pickers, a readiness checklist, real countdown values in the preview, version-history review and restore-as-draft, safer publication validation, and protection against newer edits being marked saved while an older save is running. Apply 002_completion.sql even if you previously applied 001: it adds atomic CSV import and synchronizes the saved draft with the published snapshot. The RSVP journey includes progress, per-person response buttons, review, a response receipt, and error recovery.

CSV imports parse quoted values, map columns, preview family grouping, flag duplicates for explicit review, and commit through one administrator-only database transaction. No live Supabase calls or database migration execution were verified in this session because the project connection remains for the owner to configure.

Built-in ImageGen produced public/gallery-sleeping.png and public/gallery-little-hand.png. Prompts requested a matching fictional baby in the existing ivory baptism outfit, sleeping on the same quilted blanket, and a close-up of his tiny hand on the outfit, using the original sample portrait as reference. These are coherent demonstration assets, not the family's real photographs.
