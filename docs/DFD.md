# Data Flow Diagrams (DFD) — v2.0

## Level 0: context
```mermaid
flowchart LR
 G[Guest] -->|Open, search, RSVP| S[Christening Invitation System]
 S -->|Invitation, countdown, results, confirmation| G
 A[Admin] -->|Login, edit, upload, manage guests| S
 S -->|Preview, reports, status| A
 S <--> D[(Supabase Data + Storage)]
```

## Level 1: public invitation and media
```mermaid
flowchart TD
 G[Guest browser] --> P1[1.0 Load published config]
 P1 --> C[(Published content versions)]
 C --> P1
 P1 --> P2[2.0 Render sealed envelope]
 P2 -->|Tap Open| P3[3.0 Animate reveal]
 P3 --> P4[4.0 Attempt music playback]
 P4 --> M[(Published audio asset)]
 P3 --> P5[5.0 Show story, countdown, gallery]
 P5 --> I[(Published image assets)]
 P5 --> P6[6.0 Navigate to RSVP]
```

## Level 1: name lookup and RSVP
```mermaid
flowchart TD
 G[Guest] --> Q[1.0 Validate and normalize search]
 Q --> L[2.0 Rate-limited name lookup]
 L <--> DB[(Guest + group records)]
 L --> R[3.0 Limited results]
 R --> S[4.0 Select invitation and members]
 S --> F[5.0 Choose per-member statuses]
 F --> V[6.0 Validate group membership and deadline]
 V --> T[7.0 Transactional RSVP update]
 T --> RR[(Current RSVP)]
 T --> H[(RSVP history)]
 T --> K[8.0 Confirmation]
 T --> U[9.0 Admin realtime notification / refetch]
```

## Level 1: admin CMS and guest management
```mermaid
flowchart TD
 A[Admin] --> AUTH[1.0 Authenticate and authorize]
 AUTH --> EDIT[2.0 Edit draft content and design]
 AUTH --> IMP[3.0 Import or edit guest list]
 AUTH --> MED[4.0 Upload images and music]
 EDIT --> DR[(Draft content)]
 MED --> ST[(Storage + asset metadata)]
 DR --> PRE[5.0 Preview draft]
 PRE --> PUB[6.0 Validate and publish]
 ST --> PUB
 PUB --> LIVE[(Published content)]
 IMP --> DB[(Groups + guests)]
 DB --> DASH[7.0 RSVP dashboard and exports]
```

## Trust boundaries
- Guest → Edge Functions: anonymous, untrusted; enforce validation, limits and abuse controls.
- Admin → authenticated APIs: verify JWT and role on every privileged operation.
- Storage → public browser: serve only published assets through approved URLs.
- RSVP transaction → DB: only controlled server-side operations may change anonymous guest statuses.
- Music playback: user gesture and browser permission determine whether sound begins.
