# Admin CMS Specification

## Principle
Every guest-facing detail must be configurable in the admin panel. The public site renders a **published snapshot**; edits are drafted and previewed before publication.

## Editor modules and fields
| Module | Editable fields |
|---|---|
| Identity | Baby's display name, short name, pronouns/phrasing, welcome title, subtitle, blessing/closing text |
| Envelope | Front label, wax-seal motif, seal color, envelope color, open-button label, reveal animation enabled, duration, skip option |
| Hero | Main baby photo, crop/focal point, alt text, heading, caption, decorative art visibility |
| Ceremony | Date, start time, timezone, church name, address, map URL, notes |
| Reception | Venue, address, time, map URL, notes |
| Schedule | Optional agenda entries, ordering and visibility |
| Countdown | Target event instant, timezone, visibility, labels, after-event message |
| Gallery | Upload, replace, reorder, captions, alt text, hide/show, lightbox toggle |
| Audio | Track upload/replace/remove, title, loop, default volume, enabled flag, fade-in/out, mute UI |
| Appearance | Powder-blue/ivory palette, accessible text colors, font pairing, card radius, decorations, section spacing |
| Sections | Section visibility, order, custom headings and body copy |
| RSVP | Deadline, button text, search placeholder, instructions, thank-you text, closed message |
| Guests | Add/edit/deactivate guests, family group membership, aliases, CSV import/export, status override |
| Administration | Authorized users, role management, publish history and audit records |

## Draft → preview → publish
1. Admin edits a versioned draft with schema validation and autosave or explicit Save Draft.
2. Live preview renders draft data in the same components as public site.
3. Publish checks required fields, valid timezone/date, safe URLs, referenced published assets and accessibility metadata.
4. Server atomically marks new version published and archives previous version.
5. Public content cache is invalidated/refetched; old published version can be restored by owner.

## Asset management
- Authenticated upload to restricted bucket; validate MIME, size and file content; create optimized image variants where possible.
- Record image alt text and captions; allow crop/focal point, ordering and replacement.
- Audio formats MP3/AAC/OGG as browser support permits; display file size/duration and preview player.
- Uploaded soundtrack must be owned or properly licensed; admin can disable sound globally.
- Unused assets may be deleted only when no published content references them.

## Guest import
CSV columns: `group_key`, `group_type`, `group_name`, `guest_full_name`, optional `aliases`. One row per guest; repeat group key for members of a family. Import wizard previews grouping, invalid rows, duplicate candidates and estimated totals before commit. Never infer household membership solely from surnames.

## Dashboard
Total invited, attending, declined, pending, responded %, family progress, search/filter, per-person checkmarks, manual correction and CSV export. Clearly distinguish confirmed persons from responding groups.
