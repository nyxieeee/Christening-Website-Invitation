# Project Structure — v2.0

```text
christening-rsvp/
├── docs/  # Project documentation (README.md stays at the root)
├── public/
│   ├── favicon.svg
│   └── decorative-fallbacks/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── layouts/{PublicLayout,AdminLayout}.tsx
│   ├── features/
│   │   ├── envelope/
│   │   │   ├── components/{EnvelopeScene,WaxSeal,InvitationCard}.tsx
│   │   │   ├── hooks/useEnvelopeSequence.ts
│   │   │   └── envelope.types.ts
│   │   ├── invitation/
│   │   │   ├── pages/InvitationPage.tsx
│   │   │   └── components/{Hero,EventDetails,Reception,DressCode,Closing}.tsx
│   │   ├── countdown/
│   │   │   ├── components/Countdown.tsx
│   │   │   └── hooks/useCountdown.ts
│   │   ├── audio/
│   │   │   ├── components/MusicControl.tsx
│   │   │   └── hooks/useBackgroundAudio.ts
│   │   ├── gallery/
│   │   │   └── components/{PhotoGallery,Lightbox}.tsx
│   │   ├── guest-lookup/
│   │   │   ├── pages/GuestLookupPage.tsx
│   │   │   └── components/{NameSearch,SearchResults}.tsx
│   │   ├── rsvp/
│   │   │   ├── pages/{RSVPPage,ThankYouPage}.tsx
│   │   │   └── components/{FamilyMemberSelection,RSVPReview}.tsx
│   │   ├── admin/
│   │   │   ├── pages/{LoginPage,DashboardPage}.tsx
│   │   │   └── components/{ProtectedRoute,AdminSidebar}.tsx
│   │   ├── cms/
│   │   │   ├── pages/{ContentEditor,AppearanceEditor,EnvelopeEditor,AudioEditor}.tsx
│   │   │   ├── components/{LivePreview,PublishBar,SectionReorder}.tsx
│   │   │   └── schemas/invitationConfig.schema.ts
│   │   ├── event-settings/
│   │   │   └── pages/{EventDetailsEditor,CountdownEditor}.tsx
│   │   ├── media-library/
│   │   │   └── components/{ImageUploader,AudioUploader,GalleryManager}.tsx
│   │   ├── guest-management/
│   │   │   └── pages/{GuestsPage,GroupsPage,ImportPage}.tsx
│   │   └── analytics/
│   │       └── components/{RSVPKPIs,ResponseChart}.tsx
│   ├── components/ui/
│   ├── hooks/
│   ├── lib/{supabase.ts,queryClient.ts,api.ts,utils.ts}
│   ├── types/{database.ts,invitation.ts,rsvp.ts}
│   ├── styles/{globals.css,tokens.css,motion.css}
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   ├── public-config/
│   │   ├── guest-search/
│   │   ├── guest-invitation/
│   │   ├── submit-rsvp/
│   │   ├── admin-content/
│   │   ├── publish-content/
│   │   ├── admin-guests/
│   │   ├── import-guests/
│   │   └── admin-media/
│   └── seed.sql
├── tests/{unit,integration,e2e}/
├── docs/
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Routes
| Route | Purpose | Access |
|---|---|---|
| `/` | Envelope and invitation story | Public |
| `/rsvp` | Name search and selection | Public |
| `/rsvp/confirm` | Review selected members; state or opaque short-lived reference | Public |
| `/thank-you` | Submission result | Public |
| `/admin/login` | Login | Public |
| `/admin` | RSVP metrics | Admin |
| `/admin/guests` | Individual guest management | Admin |
| `/admin/groups` | Family/group management | Admin |
| `/admin/import` | CSV import | Admin |
| `/admin/content` | Text, sections, preview and publish | Admin |
| `/admin/event` | Ceremony/reception and countdown | Admin |
| `/admin/envelope` | Envelope and animation settings | Admin |
| `/admin/music` | Background music settings | Admin |
| `/admin/media` | Hero and gallery assets | Admin |
| `/admin/appearance` | Theme and typography | Admin |
| `/admin/settings` | Roles and configuration | Owner/Admin as authorized |

## Implementation phases
1. Scaffold Vite/React/TypeScript, routing, design tokens, Supabase client and tests.
2. Migrations, RLS, Auth, public search/RSVP functions, imports and auditing.
3. Admin CMS: event details, content drafts, media uploads, preview and publish.
4. Envelope animation, invitation story, audio controller, countdown and gallery.
5. Name-only RSVP, family member selection, confirmation and admin dashboard.
6. Accessibility, abuse controls, load tests, cross-browser QA, deploy and monitor.

## Important boundaries
The UI is not the security boundary: Edge Functions and RLS are. Store service-role secrets only server-side. Use feature-owned modules, shared typed API schemas, and database-generated TypeScript types. No placeholder event facts should be shipped as real content.
