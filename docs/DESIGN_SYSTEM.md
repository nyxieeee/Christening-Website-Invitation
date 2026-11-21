# Design System — Powder Blue & Ivory

## Palette
| Token | Hex | Usage |
|---|---|---|
| `--powder-blue` | `#C9DFEF` | Envelope, soft backgrounds |
| `--sky-blue` | `#A8C9E1` | Buttons and accents |
| `--deep-blue` | `#365D79` | Accessible headings and interactive text |
| `--ivory` | `#FFFDF6` | Cards, paper and primary surfaces |
| `--warm-ivory` | `#F8F4EB` | Secondary background |
| `--champagne` | `#C6AD83` | Subtle cross, seal and rules |
| `--ink` | `#243D50` | Body text |
| `--sage` | `#A8BEB2` | Botanical watercolor accents |

Check actual foreground/background contrast; pale blue is not suitable for small text on ivory.

## Typography
- Display: elegant readable serif (e.g., Cormorant Garamond), with optional restrained script accent for a single title.
- Body: modern legible sans (e.g., DM Sans or Inter).
- Maintain mobile font sizes >=16px for body; avoid large script blocks for important information.

## Components
Wax-sealed envelope; ivory invitation card; soft blue buttons; decorative botanical corners; hero photo frame; countdown tiles; event-detail cards; gallery carousel/lightbox; RSVP search/results; admin cards and forms.

## Responsive
- Mobile-first 320px upward; single-column guest experience; touch targets >=44px where feasible.
- Tablet/desktop: centered story with controlled max-width, not a dense dashboard-like landing page.
- Images `object-fit: cover` with admin-set focal point; lazy-load below-fold media.

## Motion
- Envelope reveal: 1.2–2.0s total, layered flap lift + card rise + page transition.
- Text/photo entrance: subtle 200–500ms fade/translate; no persistent distracting motion.
- Honor reduced-motion: replace 3D transitions with instant or short opacity reveal.
- Always allow Skip and avoid blocking RSVP navigation behind animation.

## Accessibility
Semantic headings, focus-visible controls, alt text, keyboard-operated envelope, readable contrast, no flashing, accessible countdown announcement strategy (do not announce every second), mute button with state label, and clear RSVP validation errors.
