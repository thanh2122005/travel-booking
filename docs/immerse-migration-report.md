# Immerse Vietnam Migration Report

## 1) Template analysis (`immerse-vietnam-master`)

### Shared layout blocks
- `navbar` with mobile open/close logic.
- hero header (`header` or `header-sm`) with image/video background.
- footer with brand, social links, popular places, newsletter form.

### Reusable sections identified
- Homepage:
  - hero + search form
  - featured places
  - services
  - testimonials
  - video showcase
- Secondary pages:
  - about story + facts
  - contact form + contact info
  - gallery grid + popular places
  - blog cards / city article detail

### Asset migration
- Source moved to `public/immerse-vietnam/`:
  - images: `public/immerse-vietnam/images/**`
  - videos: `public/immerse-vietnam/videos/**`
  - fonts: `public/immerse-vietnam/fonts/fonts.css`
- Non-useful files filtered: `desktop.ini`.

### CSS/JS assessment
- Legacy CSS files:
  - keep idea/tokens from `style.css`, `responsive.css`, `utility.css`.
  - avoid direct global import to prevent collisions (`.container`, `header`, `.btn`, etc.).
  - migrated as scoped modern theme in `src/styles/immerse-theme.css`.
- Legacy JS (`js/script.js`) refactor:
  - navbar scroll style: converted to React state/effect in `site-header`.
  - mobile menu toggle: converted to React state.
  - video play button: converted to `home-video-showcase` with hooks.
  - no direct `document.querySelector` in new sections.

## 2) New structure (App Router + reusable components)

### Routing
- New public routes:
  - `/` home
  - `/about`
  - `/contact`
  - `/gallery`
  - `/inspiration` (`/blog` alias)
  - `/destinations`
  - `/destinations/[slug]`
  - `/booking`
  - `/favorites` (`/favorite` alias)
  - `/reviews` (`/review` alias)
- Backward compatibility redirects:
  - `/gioi-thieu` -> `/about`
  - `/lien-he` -> `/contact`
  - `/dia-diem` -> `/destinations`
  - `/dia-diem/[slug]` -> `/destinations/[slug]`

### Layout + component system
- `src/components/layout/public-shell.tsx`
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/home/*`
  - `home-hero`
  - `home-featured-destinations`
  - `home-featured-tours`
  - `home-services`
  - `home-itinerary-preview`
  - `home-testimonials`
  - `home-video-showcase`
  - `home-inspiration`
  - `home-cta`
  - `immersive-homepage`
- shared page hero:
  - `src/components/common/page-hero-banner.tsx`

## 3) Asset/CSS/JS migration plan executed

### Asset usage
- Hero/video blocks now read from:
  - `/immerse-vietnam/videos/VN.mp4`
  - `/immerse-vietnam/videos/blogcover.mp4`
  - `/immerse-vietnam/videos/chonoi.mp4`
- Gallery/about/story images switched to local public assets where suitable.
- Existing DB image URLs (Unsplash) remain for dynamic location/tour records.

### CSS import location
- `src/app/globals.css` imports:
  - `@import "../styles/immerse-theme.css";`

### JS conversion summary
- Old behavior retained with React implementation:
  - sticky/scroll navbar state
  - mobile navigation toggle
  - video play/pause interactions

## 4) Dynamic data mapping (Prisma)

### Home data query upgraded
- `getHomePublicData()` now returns:
  - featured locations
  - featured tours + rating aggregates
  - latest reviews
  - itinerary preview tours
  - platform stats (tours/locations/bookings/reviews)

### New data query
- `getPublicReviews(limit)`:
  - returns review list with user/tour/location
  - returns aggregated rating summary

### UI mapped to models
- `Tour` -> home featured tours, tour list/detail, booking/favorites pages.
- `Location` -> destinations list/detail, gallery highlights.
- `Review` -> testimonials + `/reviews`.
- `Favorite` -> `/favorites`.
- `Booking` -> `/booking`.
- `Itinerary` -> home itinerary preview + tour detail.

## 5) Keep / refactor / add-new decisions

### Keep from template
- cinematic hero style
- image-first storytelling
- section rhythm (featured/services/testimonials/video)
- destination-centric narrative

### Refactor
- static HTML pages -> typed App Router routes
- repeated markup -> reusable React components
- DOM scripts -> hooks/state
- static text blocks -> partial dynamic data

### Added for product realism
- destination dynamic route system
- booking hub page
- favorites page
- reviews page
- inspiration/blog route pivot
- route aliases and legacy redirects

## 6) Current limitations
- `next build` fails in this sandbox with `spawn EPERM` after successful compile/type stage (environment limitation).
- Push to GitHub fails in this environment (no outbound access to `github.com:443`).
