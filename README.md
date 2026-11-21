# Christening RSVP — Documentation v2.0

An interactive, mobile-first christening invitation website with a powder-blue and ivory aesthetic, animated digital envelope, optional music, live countdown, configurable media and content, and a name-only RSVP system for individuals and families.

**Stack:** React + Vite + TypeScript; Tailwind CSS + shadcn/ui; Motion for React; Howler.js; React Router; TanStack Query; Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime); Vercel.

## Documentation index

- [Implementation and Supabase setup](docs/IMPLEMENTATION.md)
- [PRD](docs/PRD.md) — scope, UX, requirements and acceptance tests
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md) — deployment, security, content and media delivery
- [ERD](docs/ERD.md) — entities, relationships, constraints and SQL design guidance
- [DFD](docs/DFD.md) — guest, admin, media and RSVP data flows
- [Project Structure](docs/PROJECT_STRUCTURE.md) — feature-oriented file structure, routes and implementation phases
- [Design System](docs/DESIGN_SYSTEM.md) — tokens, typography, responsive and motion design
- [Admin CMS](docs/ADMIN_CMS.md) — complete editable fields, publishing and media workflows
- [Animation & Audio](docs/ANIMATION_AUDIO.md) — envelope state machine, audio and accessibility
- [Testing & Deployment](docs/TESTING_DEPLOYMENT.md) — test matrix, security and release checklist

## Fixed product decisions
1. A single public website URL; guests search by name only, with no invitation token, login, or OTP.
2. Both individuals and grouped family invitations; each guest has an individual attendance status.
3. Names are search keys only; immutable UUIDs identify records.
4. The administrator can configure every guest-facing detail, image, countdown date/time, soundtrack and relevant animation setting.
5. Admin login is mandatory. Public name-only RSVP cannot verify identity; mitigations reduce risk, but cannot eliminate impersonation.
6. Sample names, dates, venues, and images are placeholders only; no real event information is assumed.

## Build sequence
Database + secure Edge Functions → admin CMS + guest import → invitation landing/envelope → RSVP flow → music/countdown/gallery → testing and deployment.
