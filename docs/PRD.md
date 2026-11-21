# Product Requirements Document (PRD) — v2.0

## Product vision
A digital christening invitation that feels like opening a real letter: powder-blue envelope, ivory card, subtle watercolor decorations, gentle optional background music, an elegant scrollable invitation story, event details, photos, live countdown and name-only RSVP. All public content is administered without editing code.

## Audience and roles
- **Public visitor:** open envelope, view event, browse photos, control music, search invitation, RSVP.
- **Family representative:** select one family record and respond for listed members.
- **Admin:** manage guests, groups, RSVP, content, gallery, music, venue, countdown, appearance and publishing.
- **Owner:** all admin permissions plus staff roles and sensitive settings.

## Guest journey
1. Load lightweight invitation cover with sealed envelope and optional decorative animation.
2. Tap **Open Invitation**. Envelope flap lifts, card rises, and main invitation reveals. Soundtrack starts only as a result of the gesture if audio is enabled and playback is allowed.
3. Scroll through baby's name/photo, welcome copy, countdown, ceremony, reception, directions, dress code, gallery and closing message.
4. Tap RSVP, search name with case/spacing/diacritic-insensitive matching and optional limited typo suggestions.
5. Select matching individual/family entry, review listed members, choose attending/declined for each selected member; leave unselected members pending unless explicitly declined.
6. Review summary and submit. Display confirmation and allow a later revision before RSVP closes.
7. Admin sees updated status and checkmarks per individual; family status shows x/y responded and x/y attending.

## Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Responsive powder-blue/ivory invitation landing page | Must |
| FR-02 | Tap-to-open 3D-style envelope and skip/reduced-motion path | Must |
| FR-03 | User-initiated soundtrack with mute, volume, looping and graceful playback failure | Must |
| FR-04 | Admin-configured event countdown using explicit timezone | Must |
| FR-05 | Configurable name, copy, ceremony, reception, dress code, directions and schedule | Must |
| FR-06 | Hero image and ordered photo gallery uploaded by admin | Must |
| FR-07 | Name-only guest lookup, normalization and limited result disclosure | Must |
| FR-08 | Individual/family RSVP with per-person statuses and confirmation | Must |
| FR-09 | Protected admin dashboard and role enforcement | Must |
| FR-10 | CSV guest import with preview, mapping, validation and duplicate review | Must |
| FR-11 | Guest/group CRUD, RSVP correction, filters and CSV export | Must |
| FR-12 | CMS draft/preview/publish, safe defaults and change audit | Must |
| FR-13 | Admin-managed audio, envelope text, colors and animation controls | Must |
| FR-14 | Abuse controls on public lookup and RSVP endpoints | Must |
| FR-15 | Live dashboard updates or reliable refetch fallback | Must |
| FR-16 | Image alt text, captions, ordering, replacement and deletion | Should |
| FR-17 | Search typo suggestions without automatic identity selection | Should |
| FR-18 | QR code for shared public URL, not individualized | Should |
| FR-19 | RSVP deadline and custom closed message | Should |
| FR-20 | Check-in and reminder campaigns | Later |

## RSVP rules
- `pending`, `attending`, `declined` are per-person statuses; one current row per guest.
- A family is a group of invited people; membership must be validated server-side.
- Updates are transactional and idempotent where possible; last successful submission wins for conflicting anonymous edits, with audit history.
- Family members not explicitly answered remain unchanged/pending, not automatically declined.
- Two people with the same name remain distinct UUIDs. Show minimal disambiguation labels; never expose phone/email in public search.
- Name-only lookup is **not authentication**. Any person who can identify an invitation may modify it. The owner accepts this tradeoff; provide admin corrections, audit trail, throttling and optional later migration to verification.

## Countdown rules
- Source of truth: `event_starts_at` stored as UTC instant, alongside `event_timezone` (e.g., `Asia/Manila`).
- Countdown displays days, hours, minutes, seconds, updates every second, and stops at zero. After start, show admin-editable celebration message.
- Hide or replace countdown when disabled or event date is missing; don't display invented dates.

## CMS behavior
- Draft editing does not affect live guests until Publish.
- Public website fetches published configuration; admin previews draft configuration.
- All visible text, baby photo, gallery, venue links, date/time, countdown, music, envelope copy, decorations, section visibility and order are editable through typed controls.
- Prevent publish with invalid dates, missing mandatory content or unsafe URLs.

## Nonfunctional requirements
Mobile-first; target WCAG 2.2 AA; honor `prefers-reduced-motion`; optimized assets and lazy-loaded gallery; loading/error/empty states; secure RLS; restricted Edge Functions; resilient audio; indexed searches for 500+ guests. Target typical search response <1s under representative load, subject to measured testing.

## Acceptance tests
- Open/skip envelope on iOS Safari, Android Chrome and desktop; no trapping or excessive motion.
- Audio does not play before user gesture; mute/pause persist within visit; blocked playback does not break UI.
- Changing published event date in admin changes public countdown without code changes.
- Admin uploads/reorders/replaces photos and audio; public site displays published assets.
- 500+ imported guests with individual and family groupings; duplicate-name selection remains distinct.
- RSVP updates only selected group members, creates no duplicate response rows, and reflects correctly on dashboard.
- Unauthenticated users cannot read guest tables or admin drafts; public search is throttled and limited.
