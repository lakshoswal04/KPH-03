PRD.md — Kamlesh Paints & Hardware Website

Project Overview
This document is the complete specification for building the Kamlesh Paints & Hardware website. It combines product requirements, content, design direction, and build instructions into one file. Read it entirely before writing a single line of code. Do not improvise. Do not add sections not listed here. Do not use placeholder copy where real copy is specified.
Before writing any frontend code, invoke the frontend-design skill.

Project Context
Kamlesh Paints & Hardware is an authorised Birla Opus dealer in Shivajinagar, Pune. They exclusively stock Birla Opus products — no other brand. The business serves homeowners renovating their homes, professional painters buying in bulk, and contractors running building projects across Pune. The website must generate leads through calls, WhatsApp messages, and site survey bookings, and enable online ordering with Razorpay payment. Delivery is within Pune only.

Tech Stack
This is the complete technology stack for the Kamlesh Paints & Hardware website. Every tool listed here is mandatory. Do not substitute any of these with alternatives.
Frontend:
Next.js 14 using the App Router. This handles all pages, routing, server-side rendering for SEO, and incremental static regeneration for product pages. Every product page must be server-rendered so Google can index it.
TypeScript throughout. Every component, every function, every prop must be typed. No any types allowed.
Tailwind CSS for all styling. Configure the full design token system — all colours, fonts, and spacing — in tailwind.config.ts before writing a single component. Never hardcode hex values inside components.
Framer Motion for all animations. This includes the hero word-split entrance, scroll reveal animations, the wall colour wipe, card hover states, the magnetic button effect, tab transitions in the product showcase, and the survey CTA headline slide-in. Do not use raw CSS keyframes where Framer Motion can handle it.
TanStack Query for all server state. Product listings, category data, colour catalogue, and any API responses must go through TanStack Query for caching and background refetching. No raw fetch calls inside components.
Zustand for client state. Cart items, wishlist, UI state (mobile menu open, active tab, selected colour swatch). Keep all Zustand stores in src/store/.
React Hook Form with Zod for all forms. The enquiry form, site survey booking form, and contact form all use React Hook Form. Every form field is validated with a Zod schema before the API is called.
Lucide React for all icons throughout the interface.
Backend:
FastAPI as the API server. Runs on port 8000. All endpoints live under /api/v1/. FastAPI auto-generates OpenAPI documentation at /docs — this must work correctly and reflect all endpoints.
PostgreSQL as the database. Hosted on Railway in production. All schema changes go through Alembic migrations — never alter the database directly.
SQLAlchemy as the ORM. All database queries go through SQLAlchemy models. No raw SQL except where SQLAlchemy cannot express the query.
Pydantic v2 for all request and response validation. Every API endpoint has a Pydantic request schema and a Pydantic response schema. These schemas are the contract between frontend and backend.
Alembic for database migrations. Every schema change is a versioned migration file. The command alembic upgrade head must always bring the database to the correct state from scratch.
python-jose for JWT authentication. The admin panel is protected by JWT tokens. No public registration — admin accounts are created directly in the database by running a setup script.
passlib with bcrypt for password hashing. Never store plain-text passwords.
Gemini API via the google-generativeai Python package for the AI colour recommender and project planner features.
Cloudinary for all image storage and delivery. Product images and shade cards are uploaded to Cloudinary and served via Cloudinary's CDN with automatic WebP conversion and responsive sizing via URL transformation parameters.
Payments:
Razorpay for all payment processing. The Razorpay order is created on the FastAPI backend, the Razorpay checkout is initialised on the frontend using the Razorpay JavaScript SDK, and the payment verification happens on the FastAPI backend using the Razorpay webhook signature. Never trust payment status from the frontend alone — always verify on the server.
Infrastructure:
Vercel for the Next.js frontend. Auto-deploys on every push to the main branch of the GitHub repository. Environment variables for the API base URL, Razorpay public key, and Cloudinary public config are set in the Vercel dashboard.
Railway for the FastAPI backend and PostgreSQL database. The FastAPI app and the PostgreSQL instance run as separate Railway services within the same Railway project. Environment variables for the database URL, JWT secret, Razorpay secret key, Cloudinary secret, and Gemini API key are set in the Railway dashboard.
Cloudinary free tier for image storage. The Cloudinary cloud name, API key, and API secret are environment variables — never committed to the repository.
Repository structure:
kamlesh-paints-platform/
├── frontend/          ← Next.js 14 app
├── backend/           ← FastAPI app
├── docs/              ← PRD, API specs, DB schema
├── assets/            ← Logos, brand images
├── .gitignore
└── README.md
Frontend folder structure:
frontend/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── products/
    │   │   ├── page.tsx
    │   │   └── [slug]/page.tsx
    │   ├── colours/page.tsx
    │   ├── ai-studio/page.tsx
    │   ├── contact/page.tsx
    │   ├── survey/page.tsx
    │   ├── cart/page.tsx
    │   ├── checkout/page.tsx
    │   └── admin/page.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   └── Footer.tsx
    │   ├── home/
    │   │   ├── HeroSection.tsx
    │   │   ├── BrandTicker.tsx
    │   │   ├── CategoryGrid.tsx
    │   │   ├── ColourExplorer.tsx
    │   │   ├── ProductShowcase.tsx
    │   │   ├── PaintCalculator.tsx
    │   │   ├── SurveyCTA.tsx
    │   │   └── Testimonials.tsx
    │   ├── products/
    │   │   ├── ProductCard.tsx
    │   │   ├── ProductGrid.tsx
    │   │   └── ProductFilters.tsx
    │   ├── colours/
    │   │   ├── ColourSwatch.tsx
    │   │   └── WallPreview.tsx
    │   ├── ai/
    │   │   ├── PaintCalculator.tsx
    │   │   └── ColourRecommender.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Badge.tsx
    │       ├── Input.tsx
    │       └── CustomCursor.tsx
    ├── lib/
    │   ├── api.ts
    │   └── utils.ts
    ├── hooks/
    │   └── useCart.ts
    ├── store/
    │   └── cartStore.ts
    └── types/
        └── index.ts
Backend folder structure:
backend/
├── main.py
├── requirements.txt
├── .env
└── app/
    ├── api/
    │   └── v1/
    │       ├── products.py
    │       ├── categories.py
    │       ├── colours.py
    │       ├── enquiries.py
    │       ├── surveys.py
    │       ├── orders.py
    │       ├── auth.py
    │       ├── admin.py
    │       └── ai.py
    ├── models/
    │   ├── product.py
    │   ├── category.py
    │   ├── colour.py
    │   ├── enquiry.py
    │   ├── order.py
    │   └── user.py
    ├── schemas/
    │   ├── product.py
    │   ├── colour.py
    │   ├── enquiry.py
    │   ├── order.py
    │   └── auth.py
    ├── services/
    │   ├── ai_service.py
    │   ├── calc_service.py
    │   ├── payment_service.py
    │   └── email_service.py
    ├── core/
    │   ├── config.py
    │   ├── security.py
    │   └── database.py
    └── migrations/
        └── versions/
Environment variables — never commit these to git:
Frontend .env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
Backend .env:
DATABASE_URL=postgresql://user:password@localhost:5432/kamlesh_paints
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_ALGORITHM=HS256
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
Installation commands — run these in order when setting up a fresh environment:
bash# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic \
    pydantic python-jose passlib python-multipart \
    google-generativeai cloudinary razorpay
alembic upgrade head
uvicorn main:app --reload --port 8000

Step 1 — Aesthetic Direction
Commit to this design direction before writing any code. Do not deviate from it.
Tone: Luxury Indian paint brand. The feeling of Birla Opus's own website crossed with the editorial confidence of Apple's product pages. Dark canvas with explosive colour. Not a hardware shop aesthetic. Not a template. Not purple gradients on white.
The one signature moment: A full-screen hero with a CSS 3D paint can that slowly rocks and gently floats, and a wall behind it that changes colour in real time when a shade swatch is clicked — the paint repaints itself with a brush-stroke wipe animation sweeping from left to right.
Background system — four distinct zones used across the page:

Default canvas: #0B0B0B near-black
Counter-section 1 (ticker): #E8590C orange
Counter-section 2 (calculator): #FAF7F0 warm ivory
Counter-section 3 (survey CTA): #1F3D2C deep forest green
Product showcase: #111118

CSS custom properties — define all of these in :root before any other styles:
css:root {
  --orange:   #E8590C;
  --ivory:    #FAF7F0;
  --ink:      #1A1A0A;
  --gold:     #C9A876;
  --forest:   #1F3D2C;
  --teal:     #0ABFBC;
  --coral:    #FF4D6D;
  --violet:   #7B2FBE;
  --yellow:   #F5C518;
  --muted:    rgba(245, 240, 232, 0.5);
  --card-bg:  #1A1A1A;
  --card-bg2: #111118;
}
Typography — load via Google Fonts in the <head>:
html<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

Display headlines: Fraunces — all H1 and H2 text only
Everything else: DM Sans — body, labels, buttons, nav, prices, captions
Hero H1: clamp(64px, 10vw, 130px), line-height 0.92, letter-spacing -0.03em
Section H2: clamp(38px, 5.5vw, 72px), line-height 0.9
Body text: 16px, line-height 1.75
Labels: 11px, weight 700, letter-spacing 3px, uppercase

Animation rules — follow these exactly:

Only animate transform and opacity. Never transition-all.
Scroll reveals: opacity 0 → 1, translateY(32px) → translateY(0), duration 0.6s, easing cubic-bezier(0.16, 1, 0.3, 1)
Card stagger: 0.08s delay per card
3D can: CSS transform-style: preserve-3d and perspective, continuous @keyframes
Wall colour wipe: clip-path: inset(0 100% 0 0) → inset(0 0% 0 0) over 0.9s cubic-bezier(0.4, 0, 0.2, 1)
All scroll reveals triggered by IntersectionObserver with threshold: 0.12
Magnetic buttons: max 8px displacement toward cursor on hover, spring back on leave
Respect prefers-reduced-motion: if true, skip all animations

Custom cursor:
css#cursor {
  position: fixed;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--orange);
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: transform 0.08s ease, width 0.2s ease,
              height 0.2s ease, background 0.2s ease,
              border 0.2s ease;
}
#cursor.hovering {
  width: 30px;
  height: 30px;
  background: transparent;
  border: 2px solid var(--orange);
}
javascriptconst cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});
document.querySelectorAll('a, button, .swatch, [data-tilt]')
  .forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });

Step 2 — Build Instructions
Output: A single index.html file in the project root. All CSS in a <style> block. All JavaScript in a <script> block at the bottom of <body>. No external JS frameworks. No React. No bundlers. Vanilla HTML, CSS, and JavaScript only.
Do not use Tailwind. Write all CSS by hand. The design requires precise custom CSS.
Images: All product images use https://placehold.co/ with the relevant accent colour as background. Format: https://placehold.co/400x300/E8590C/FFFFFF.
3D objects: Built entirely with CSS using transform-style: preserve-3d, perspective, and @keyframes. No Three.js. No WebGL. No canvas element.
Local server: Start with node serve.mjs, screenshot with node screenshot.mjs http://localhost:3000.
Screenshot workflow: Screenshot after every section is built. Compare against this spec. Fix mismatches. Re-screenshot. Minimum two rounds per section before moving on.

Step 3 — Page Structure
Ten sections in this exact order:

Navbar
Hero
Brand Ticker
Category Grid
Colour Explorer
Product Showcase
Paint Calculator
Site Survey CTA
Testimonials
Footer

Plus two persistent elements present on every scroll position: floating WhatsApp button and custom cursor div.

Section 1 — Navbar
Position: position: fixed, full width, top: 0, z-index: 100, height: 72px
Scroll behaviour: JavaScript adds class .scrolled to <nav> when window.scrollY > 80.
cssnav {
  background: transparent;
  transition: background 0.4s ease, border-color 0.4s ease,
              backdrop-filter 0.4s ease;
}
nav.scrolled {
  background: rgba(250, 247, 240, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(201, 168, 76, 0.2);
}
Default state: all text var(--ivory). Scrolled state: all text var(--ink).
Left side — logo:
A paint fan SVG icon — six thin rectangles arranged radially from a centre pivot, each one coloured: #E8590C, #F5C518, #0ABFBC, #FF4D6D, #7B2FBE, #A8C8A0. Next to it, two lines of text stacked: "Kamlesh Paints" in Fraunces 700 18px on line one, "& Hardware · Birla Opus Dealer" in DM Sans 500 10px letter-spacing 3px uppercase var(--orange) on line two.
Centre — nav links:
Home, Colours, Products, AI Studio, Site Survey, About, Contact. Each: DM Sans 500 13px. Hover effect: ::after pseudo-element, height: 1.5px, background: var(--orange), transform: scaleX(0) at rest, scaleX(1) on hover, transform-origin: left, transition: transform 0.25s ease.
Right side:
Search icon SVG, heart icon SVG, cart icon SVG with a <span> badge "0" in an 18px orange filled circle. Then a button: "Get Estimate →" — border: 1.5px solid currentColor, transparent background, DM Sans 600 12px letter-spacing 1.5px uppercase, padding: 9px 20px, border-radius: 2px. On hover: background: var(--orange), text white, transition: 0.2s ease.
Mobile (below 768px):
Centre links hidden. Hamburger icon on right. Clicking opens a position: fixed, inset: 0, z-index: 200, background: #1A1A0A full-screen overlay. Inside: nav links in Fraunces 700 36px white, stacked vertically centred, each fading in with 0.05s stagger. X button closes overlay and restores body scroll.

Section 2 — Hero
Container: min-height: 100vh, overflow: hidden, position: relative, background: #0B0B0B, padding-top: 72px
Background blobs — three absolutely positioned divs, pointer-events: none, z-index: 0:

Blob 1: 700px × 700px, border-radius: 50%, background: rgba(232, 89, 12, 0.1), filter: blur(140px), top: -150px, left: -100px
Blob 2: 600px × 600px, background: rgba(10, 191, 188, 0.07), filter: blur(120px), bottom: -100px, right: -100px
Blob 3: 500px × 500px, background: rgba(123, 47, 190, 0.06), filter: blur(100px), top: 30%, right: 20%

Layout: CSS grid, grid-template-columns: 55% 45%, single column on mobile.
Left column — padding: 80px 0 80px 80px, position: relative, z-index: 1:
Eyebrow row: a 32px × 1.5px div in var(--orange) displayed inline, followed by "Authorised Dealer · Shivajinagar, Pune" DM Sans 500 11px letter-spacing 3px uppercase var(--muted). Animates from translateX(-30px), opacity: 0 to translateX(0), opacity: 1 over 0.6s at 0.1s delay on page load.
Main headline:

Line 1: "Colour is" — Fraunces 300 italic clamp(64px, 10vw, 130px) var(--ivory) line-height 0.92
Line 2: "Everything" — Fraunces 900 upright same size
After "Everything": <span style="color: var(--orange)">.</span>

Word-split animation: each word in both lines wrapped in <span style="display: inline-block">. Each word starts opacity: 0, translateY(50px), animates to opacity: 1, translateY(0). Line 1 word delays: 0.2s, 0.27s. Line 2 word delays: 0.5s, 0.57s, 0.64s. Duration 0.7s, easing cubic-bezier(0.16, 1, 0.3, 1).
Body copy: "Premium Birla Opus paints, waterproofing solutions, and painting tools — stocked and delivered across all of Pune." DM Sans 400 16px line-height 1.75 var(--muted) max-width: 380px. Fades in at 0.85s delay.
Two buttons, display: flex, gap: 16px, margin-top: 40px, both animate in at 1s delay:

"Explore Colours →" — background: var(--orange), white text DM Sans 700 13px letter-spacing 1.5px uppercase, padding: 15px 34px, border-radius: 2px, data-magnetic. Hover: background: #CC4E0A, translateY(-2px), box-shadow: 0 10px 32px rgba(232, 89, 12, 0.45)
"Book Free Site Survey" — transparent, border: 1.5px solid rgba(245, 240, 232, 0.3), same text style ivory. Hover: border-color: rgba(245, 240, 232, 0.8)

Three stat counters, display: flex, gap: 48px, margin-top: 56px:

Number "2,300+" label "Birla Opus Shades"
Number "145+" label "Products in Stock"
Number "25 Yrs" label "Serving Pune"

Number style: Fraunces 700 52px var(--ivory). Label style: DM Sans 500 11px letter-spacing 2.5px uppercase var(--muted). Count up from 0 using requestAnimationFrame with easing 1 - Math.pow(2, -10 * progress) over 1.8s, triggered by IntersectionObserver.
Right column — CSS 3D paint can, position: relative, display: flex, flex-direction: column, align-items: center, justify-content: center, z-index: 1:
Can scene container: perspective: 800px, width: 260px, height: 360px, position: relative
Can group inside: transform-style: preserve-3d, position: relative, width: 100%, height: 100%
Two simultaneous CSS keyframe animations on the can group:
css@keyframes canRock {
  0%, 100% { transform: rotateY(-18deg) rotateX(6deg); }
  50%       { transform: rotateY(18deg)  rotateX(6deg); }
}
@keyframes canFloat {
  0%, 100% { top: 40px; }
  50%       { top: 20px; }
}
.can-group {
  position: absolute;
  animation: canRock 6s ease-in-out infinite,
             canFloat 4s ease-in-out infinite;
}
Can body: width: 160px, height: 220px, border-radius: 8px 8px 20px 20px, position: absolute, left: 50%, transform: translateX(-50%), bottom: 40px. Background — two gradients combined:
cssbackground:
  linear-gradient(90deg,
    rgba(0,0,0,0.35) 0%, transparent 25%,
    transparent 75%, rgba(0,0,0,0.35) 100%),
  linear-gradient(180deg, var(--can-color, #E8590C) 0%,
    color-mix(in srgb, var(--can-color, #E8590C) 75%, black) 100%);
Box shadow: inset -20px 0 40px rgba(0,0,0,0.4), inset 20px 0 20px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.7)
Can lid: width: 170px, height: 20px, centred above can body, background: linear-gradient(180deg, #AAAAAA 0%, #777777 100%), border-radius: 85px / 10px
Handle: width: 72px, height: 36px, border: 5px solid #888888, border-radius: 72px 72px 0 0, border-bottom: none, centred above lid
Label area: width: 130px, height: 90px, background: var(--ivory), border-radius: 4px, position: absolute, centred on can body. Inside: "Birla Opus" DM Sans 700 9px uppercase var(--ink) centred. "ONE PURE" Fraunces 700 13px var(--ink) centred. "ELEGANCE" Fraunces 700 13px var(--ink) centred. Row of five 8px colour dots: #E8590C, #0ABFBC, #F5C518, #FF4D6D, #7B2FBE.
Can shadow: width: 140px, height: 20px, background: rgba(0,0,0,0.4), border-radius: 50%, filter: blur(12px), centred below can.
Can wipe overlay: <div class="can-wipe"> absolutely covering the can body, initially clip-path: inset(0 100% 0 0). On swatch click: set background to new colour, animate clip-path to inset(0 0% 0 0) over 0.9s cubic-bezier(0.4,0,0.2,1). On animation end: update --can-color on can body, reset wipe to clip-path: inset(0 100% 0 0).
Swatch row below can: display: flex, gap: 12px, justify-content: center, margin-top: 24px. Five circles 44px × 44px, border-radius: 50%, cursor: pointer, border: 3px solid transparent. Active: border-color: var(--ivory). Colours and names:

#A8C8A0 Sage Green
#90B8D8 Ocean Blue
#F5C518 Sunflower
#E8C4A0 Warm Sand
#D4537E Dusty Rose

Category panel strip — position: absolute, bottom: 0, left: 0, right: 0, height: 180px, display: grid, grid-template-columns: repeat(4, 1fr), overflow: visible:
Four panels:

Interior Paints — background: #F5C518
Exterior Paints — background: #0ABFBC
Waterproofing — background: #FF4D6D
Hardware — background: #7B2FBE

Each panel: position: relative, overflow: visible, display: flex, flex-direction: column, align-items: center, justify-content: center, padding-top: 20px, cursor: pointer.
Mini can icon: position: absolute, top: -36px, left: 50%, transform: translateX(-50%). Built from two divs — body 28px × 40px with border-radius: 4px 4px 8px 8px in a darker shade of the panel colour, lid 32px × 8px on top. On panel hover: mini can translateY(-8px) over 0.3s, panel filter: brightness(0.88).
Category name: Fraunces 700 17px white. "View Range →": DM Sans 600 11px letter-spacing 2px uppercase white opacity: 0.8.

Section 3 — Brand Ticker
width: 100%, height: 68px, background: var(--orange), overflow: hidden, display: flex, align-items: center
Text string repeated exactly twice inside .ticker-track:
"Birla Opus Dealer · One Series · Calista Range · Style Collection · Alldry Waterproofing · Allwood Finishes · Interior Paints · Exterior Paints · Enamels · Wood Finishes · Wallpapers · Painting Tools · Free Delivery in Pune · Free Site Survey · "
css@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.ticker-track {
  display: flex;
  white-space: nowrap;
  animation: ticker 35s linear infinite;
}
.ticker-track:hover { animation-play-state: paused; }
Text style: DM Sans 700 12px letter-spacing 3px uppercase #0B0B0B. Separators · at 50% opacity.

Section 4 — Category Grid
background: var(--ivory), padding: 100px 80px
Header row — display: flex, justify-content: space-between, align-items: flex-end:

Left: eyebrow "Explore the Range" var(--orange) DM Sans 700 11px letter-spacing 3px uppercase, then headline "Everything your" line 1, "project needs" line 2 with <span style="color: var(--orange)">.</span> — Fraunces 700 clamp(38px, 5.5vw, 72px) var(--ink) line-height 0.9
Right: "View All Products →" DM Sans 600 14px var(--orange) animated underline on hover

Grid: display: grid, grid-template-columns: repeat(4, 1fr) desktop, repeat(2, 1fr) tablet 768px, 1fr mobile 480px, gap: 20px, margin-top: 56px
Eight cards:
NameBackgroundAccentEmojiDescriptionCountInterior Paints#FFF8EF#E8590C🏠Emulsions, distempers, and primers for every interior wall and ceiling.47 productsExterior Paints#F0FFFE#0ABFBC🏗️Weather-resistant emulsions engineered for Pune's climate.23 productsWaterproofing#FFF0F3#FF4D6D💧Alldry solutions for damp walls, leaking roofs, and monsoon damage.18 productsEnamels#F8F5FF#7B2FBE🔩High-gloss enamels for metal doors, grills, and furniture.12 productsWood Finishes#FFFBF0#F5C518🪵Allwood PU, melamine, and stain finishes for all wooden surfaces.14 productsWallpapers#F0FFF8#2DD4A0🖼️Designer wallpapers in textured, printed, and geometric patterns.32 designsTools#FFF5F0#E8590C🖌️Foam rollers, cloud rollers, brushes, and trays from Birla Opus.8 productsAerosols#F5F0FF#9B5FE8💨One Aero premium spray cans for touch-ups and decorative work.6 products
Card structure:
border-radius: 16px, border: 1px solid rgba(26,26,10,0.06), padding: 28px, cursor: pointer, transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease, data-tilt
Icon circle: 52px × 52px, border-radius: 50%, background: [accent at 15% opacity], emoji at 28px
Category name: Fraunces 700 22px var(--ink) margin-top: 20px
Description: DM Sans 400 14px line-height 1.6 #7A756E margin-top: 8px
Footer row: product count DM Sans 600 12px letter-spacing 1px uppercase in accent colour, arrow → right-aligned
Hover state: background: [accent at 8% opacity], border-color: [accent at 30% opacity], translateY(-6px), box-shadow: 0 20px 48px rgba(26,26,10,0.1), icon circle scale(1.1)
3D tilt on each card: mousemove calculates cursor offset from card centre, maps to max 8deg rotateX and rotateY, applied via inline style.transform with transform-style: preserve-3d and perspective: 1000px on the card. mouseleave resets with transition: transform 0.5s cubic-bezier(0.16,1,0.3,1).
Scroll reveal: All eight cards start opacity: 0, transform: translateY(32px). IntersectionObserver adds .revealed class. Stagger delays: 0s, 0.08s, 0.16s, 0.24s, 0.32s, 0.40s, 0.48s, 0.56s.

Section 5 — Colour Explorer
background: #0B0B0B, padding: 100px 80px, min-height: 90vh
Layout: display: grid, grid-template-columns: 45% 55%, gap: 80px, single column on mobile
Left column — position: sticky, top: 100px, height: fit-content:
Eyebrow: "Colour is Everything" var(--orange) DM Sans 700 11px letter-spacing 3px uppercase
Headline: "2,300 shades" Fraunces 700 clamp(38px, 5vw, 64px) var(--ivory) line-height 0.9. Full stop <span style="color: var(--orange)">.</span>
Body: "Every shade in the Birla Opus catalogue is available at Kamlesh. Browse by family or tell us the room and we'll recommend the right one." DM Sans 400 16px var(--muted) max-width: 320px line-height 1.7
Link: "View Full Catalogue →" DM Sans 600 14px var(--orange) margin-top: 24px, underline animates on hover
Colour family chips — eleven 32px circles, cursor: pointer, border: 2px solid transparent. Hover: border-color: var(--ivory). Tooltip on hover in a small dark pill. Colours:
#F5F0E8 Whites · #F5C518 Yellows · #E8590C Oranges · #E83232 Reds · #9B2FBE Purples · #2F5DBE Blues · #0ABFBC Blue-Greens · #2DBE6C Greens · #A0BE2D Yellow-Greens · #8B7B6B Neutrals · #CC4040 India Iconic
Right column:
Wall preview panel: width: 100%, height: 360px, border-radius: 20px, overflow: hidden, position: relative, background: #A8C8A0 (default Sage Garden). transition: background-color 1.2s cubic-bezier(0.4, 0, 0.2, 1).
Inside the panel (all position: absolute):

Floor: bottom: 0, left: 0, right: 0, height: 35%, background: rgba(160, 130, 90, 0.6)
Window: top: 15%, left: 14%, width: 80px, height: 110px, background: rgba(200,230,255,0.4), border: 3px solid rgba(255,255,255,0.5), border-radius: 4px. Horizontal crossbar via ::before, vertical via ::after.
Sofa: bottom: 35%, left: 50%, transform: translateX(-50%), width: 220px, height: 70px, background: #3A2A1E, border-radius: 12px 12px 0 0. Sofa back height: 30px on top.
Plants: two small stacked ellipse groups on either side

Dark wall class: when Slate #4A4A5A or Midnight #1A1A2E selected, add .dark-wall to panel which sets sofa opacity: 0.35
Wall wipe: <div class="wall-wipe"> absolutely covering panel, z-index: 5. On shade click: set background to new colour, animate clip-path: inset(0 100% 0 0) → inset(0 0% 0 0) over 0.9s cubic-bezier(0.4,0,0.2,1). On end: update panel background, reset wipe.
Swatch row: display: flex, gap: 10px, margin-top: 20px, overflow-x: auto, padding-bottom: 8px, scrollbar-width: none. Fourteen swatches, 52px × 52px circles, cursor: pointer, border: 3px solid transparent. Active: border-color: var(--ivory). Hover: scale(1.15) over 0.2s. Tooltip on hover.
Shades in order:
#F5F0E8 Off White · #E8C4A0 Warm Sand · #D4956A Terracotta · #C4513A Rust Red · #E8590C Kamlesh Orange · #F5C518 Sunflower · #A8C8A0 Sage Garden · #0ABFBC Ocean Teal · #5B8DB8 Steel Blue · #7B2FBE Deep Violet · #D4537E Dusty Rose · #8B6555 Warm Walnut · #4A4A5A Slate · #1A1A2E Midnight

Section 6 — Product Showcase
background: #111118, padding: 100px 80px
Header: Eyebrow "Our Products" var(--gold) DM Sans 700 11px letter-spacing 3px uppercase. Headline "What we" line 1, "carry" line 2, full stop orange. Fraunces 900 var(--ivory).
Tab row: Four buttons — Interior Paints, Exterior Paints, Waterproofing, Wood Finishes. Each: DM Sans 600 13px var(--muted), padding: 10px 0, no background, no border, border-bottom: 2px solid transparent. Active: color: var(--ivory), border-bottom-color: var(--orange). Tab click: remove .active from all, add to clicked. Active panel fades in from opacity: 0 over 0.4s.
Product grid: display: grid, grid-template-columns: repeat(2, 1fr), gap: 20px. Four cards per tab.
Card structure:
background: var(--card-bg), border: 1px solid rgba(245,240,232,0.06), border-radius: 12px, padding: 24px, cursor: pointer, transition: border-color 0.3s, background 0.3s, transform 0.3s
Mini CSS can: width: 80px, height: 100px can body, coloured to sub-brand accent. Sub-brand accents: One #C9A876, Calista #0ABFBC, Style #A8C8A0, Alldry #FF4D6D, Allwood #7B2FBE
Sub-brand: DM Sans 700 10px letter-spacing 2px uppercase in accent colour
Product name: Fraunces 700 20px var(--ivory) line-height 1.1
Description: DM Sans 400 13px line-height 1.6 var(--muted)
Feature pills: display: flex, flex-wrap: wrap, gap: 6px. Each: border: 1px solid rgba(245,240,232,0.12), border-radius: 100px, padding: 3px 10px, DM Sans 400 11px var(--muted)
Price: DM Sans 600 18px var(--gold) margin-top: 16px
Bottom row: "Add to Cart" small solid orange button, "Enquire →" orange text link
Hover: border-color: rgba(232,89,12,0.4), background: #1F1F1F, card translateY(-6px), mini can translateY(-8px) scale(1.06)
Tab 1 — Interior Paints:
Card 1 · ONE · One Pure Elegance · Luxury interior emulsion with scuff-proof technology and anti-bacterial germ protection. · Scuff-Proof · Anti-bacterial · Soft Sheen · Low VOC · ₹320 – ₹480 / L
Card 2 · CALISTA · Calista Ever Clear · Premium emulsion with a clean, vibrant look and excellent washability across 8,000 scrub cycles. · Washable · High Opacity · Anti-fungal · Low Odour · ₹220 – ₹320 / L
Card 3 · CALISTA · Calista Ever Stay · Smooth, beautiful walls with excellent peel protection and long-lasting premium finish. · Peel-Resistant · Smooth Finish · Stain-Resistant · Durable · ₹200 – ₹300 / L
Card 4 · STYLE · Style Color Smart · Economy interior paint with superior coverage — 15% extra coverage per coat versus standard paints. · Extra Coverage · Long Lasting · Value for Money · Bright Finish · ₹120 – ₹180 / L
Tab 2 — Exterior Paints:
Card 1 · ONE · One True Look · 16-year warranty exterior emulsion with superior dust and algae resistance for low-maintenance facades. · 16-Year Warranty · Algae-Resistant · Crack-Proof · UV-Stable · ₹360 – ₹520 / L
Card 2 · CALISTA · Calista Neo Star · Premium exterior emulsion that preserves the newly painted look with superior dust resistance. · Dust-Resistant · Weather Shield · Colour Retention · Long Lasting · ₹240 – ₹360 / L
Card 3 · CALISTA · Calista Neo Star Shine · Premium finish with superior dust resistance and extra gloss shine for a standout exterior. · High Gloss · Dust-Resistant · Monsoon-Ready · UV-Stable · ₹260 – ₹380 / L
Card 4 · STYLE · Style Power Fit · Economy exterior emulsion with strong weather resistance for cost-effective facade painting. · Weather Resistant · Value for Money · Bright Finish · Durable · ₹140 – ₹200 / L
Tab 3 — Waterproofing:
Card 1 · ALLDRY · Alldry Wall Fix 4 · Crack-proof waterproofing primer that upgrades your walls before topcoat application. · Crack-Proof · Pre-Coat Primer · Strong Adhesion · Dampness-Proof · ₹180 – ₹260 / L
Card 2 · ALLDRY · Alldry Wall n Roof 12 · 12-year guaranteed waterproofing for walls and roofs — all-round protection from Pune's heavy monsoon. · 12-Year Guarantee · Roof & Wall · Monsoon-Ready · Crack-Resistant · ₹320 – ₹440 / L
Card 3 · ALLDRY · Alldry Salt Seal · Specialist primer for walls with salt and efflorescence damage — stops white powder deposits permanently. · Anti-Efflorescence · Penetrating · Salt Barrier · Long Lasting · ₹200 – ₹280 / L
Card 4 · ALLDRY · Alldry Crack Master Paste · Waterproof crack-filling paste for damaged walls — creates a smooth, crack-free surface before painting. · Crack Filler · Waterproof · Flexible · Easy Application · ₹90 – ₹140 / kg
Tab 4 — Wood Finishes:
Card 1 · ALLWOOD · Allwood PU Interior · High-performance polyurethane finish for interior wood with long-lasting protection and a premium appearance. · PU Finish · Scratch-Resistant · Non-Yellowing · Rich Gloss · ₹420 – ₹580 / L
Card 2 · ALLWOOD · Allwood Italian PU · Ultra-premium Italian PU for a luxury wood finish — the finest wood coating in the Birla Opus range. · Italian PU · Ultra-Rich Finish · Non-Yellowing · Premium · ₹680 – ₹900 / L
Card 3 · ALLWOOD · Allwood Melamine · Interior wood melamine polish for a premium finish on furniture and cabinetry. · Melamine Finish · Smooth · Hard-Wearing · Furniture-Grade · ₹340 – ₹460 / L
Card 4 · ALLWOOD · Allwood Wood Stain · Translucent stain that enhances natural wood grain while adding a rich tinted colour. · Translucent · Grain-Enhancing · Multiple Shades · Indoor & Outdoor · ₹280 – ₹380 / L

Section 7 — Paint Calculator
background: var(--ivory), padding: 100px 80px
Layout: display: grid, grid-template-columns: 45% 55%, gap: 80px, single column on mobile
Left column:
Eyebrow: "Smart Planning" var(--orange) standard label style
Headline: "Know your" line 1, "budget" line 2 with orange full stop — Fraunces 900 var(--ink) clamp(38px, 5.5vw, 72px)
Body: "Enter your room details and get an instant estimate of exactly how much Birla Opus paint you need and what it will cost. No guesswork." DM Sans 16px #7A756E max-width: 340px line-height 1.75
Three trust items, each with orange ✓ and label DM Sans 600 14px var(--ink):

Accurate to the litre
Birla Opus pricing
Send results to WhatsApp

Right column — calculator card: background: #1A1A0A, border-radius: 20px, padding: 40px
All field labels: DM Sans 700 11px letter-spacing 2px uppercase rgba(245,240,232,0.5), margin-bottom: 8px, display: block
All inputs and selects: background: rgba(245,240,232,0.07), border: 1px solid rgba(245,240,232,0.12), border-radius: 8px, padding: 12px 16px, color: var(--ivory), width: 100%, font-family: DM Sans, font-size: 14px. Focus: border-color: var(--orange), outline: none.
Field 1 — Room Type <select>: Select room type, Bedroom, Living Room, Kitchen, Bathroom, Dining Room, Full Home (2BHK), Full Home (3BHK)
Field 2 — Floor Area <input type="number">: placeholder "e.g. 120", units label "sq ft" right-aligned inside field
Field 3 — Number of Coats: three radio pill buttons "1 coat", "2 coats" (default), "3 coats". Active: background: var(--orange), white text. Inactive: border: 1px solid rgba(245,240,232,0.15), muted text.
Field 4 — Paint Grade <select>: Style — Economy, Calista — Premium, One — Luxury
Calculate button: width: 100%, background: var(--orange), white text DM Sans 700 14px letter-spacing 2px uppercase, padding: 16px, border-radius: 4px, margin-top: 8px, data-magnetic
Result area <div id="calc-result">: height: 0, overflow: hidden, transition: height 0.5s ease
Result content when shown:

"You need [X] litres" — Fraunces 700 44px var(--ivory)
"Estimated cost: ₹[X,XXX] – ₹[X,XXX]" — DM Sans 600 20px var(--gold)
"Labour (approx): ₹[X,XXX] – ₹[X,XXX]" — DM Sans 400 14px var(--muted)
"Send this estimate to WhatsApp →" link

Calculation function:
javascriptfunction calculatePaint(area, coats, grade) {
  const wallArea = area * 3.2 * 0.8;
  const litres = Math.ceil((wallArea / 10) * coats);
  const rates = {
    style:   { low: 150, high: 200 },
    calista: { low: 220, high: 360 },
    one:     { low: 320, high: 520 }
  };
  const r = rates[grade];
  return {
    litres,
    costLow:    Math.round(litres * r.low).toLocaleString('en-IN'),
    costHigh:   Math.round(litres * r.high).toLocaleString('en-IN'),
    labourLow:  Math.round(wallArea * 10).toLocaleString('en-IN'),
    labourHigh: Math.round(wallArea * 16).toLocaleString('en-IN')
  };
}
Result area open: measure content height with temporary render, set height to that value in px, transition. On close: set height to 0.

Section 8 — Site Survey CTA
background: var(--forest), padding: 120px 80px, position: relative, overflow: hidden
Three radial gradient background circles position: absolute, pointer-events: none:

radial-gradient(circle at 15% 20%, rgba(255,255,255,0.04), transparent 50%) — 400px × 400px top-left
radial-gradient(circle at 85% 80%, rgba(255,255,255,0.03), transparent 50%) — 300px × 300px bottom-right
radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02), transparent 60%) — 500px × 500px centre

Content: max-width: 700px, margin: 0 auto, text-align: center
Eyebrow: "Free Service" DM Sans 700 11px letter-spacing 3px uppercase rgba(245,240,232,0.45)
Headline line 1: "Unsure where" — Fraunces 900 clamp(48px, 8vw, 96px) var(--ivory) line-height 0.88
Headline line 2: "to start?" — same style
Scroll animation: line 1 enters from translateX(-50px), opacity: 0, line 2 from translateX(50px), opacity: 0. Both to translateX(0), opacity: 1 over 0.8s cubic-bezier(0.16, 1, 0.3, 1) simultaneously when section enters viewport.
Body: "Book a FREE expert site survey. We'll visit your Pune property, inspect every wall and surface, recommend the right Birla Opus products for each area, and give you a no-obligation written quote." DM Sans 16px rgba(245,240,232,0.6) max-width: 480px margin: 24px auto
CTA button: "Book Your Free Site Survey →" — background: var(--orange), white text DM Sans 700 13px letter-spacing 2px uppercase, padding: 18px 48px, border-radius: 2px, data-magnetic. Hover: background: #CC4E0A, translateY(-2px), box-shadow: 0 12px 40px rgba(232,89,12,0.5)
Below button: "Available across all of Pune · Usually confirmed within 2 hours" DM Sans 400 13px rgba(245,240,232,0.45) margin-top: 16px

Section 9 — Testimonials
background: #0B0B0B, padding: 100px 80px
Header row: display: flex, justify-content: space-between, align-items: flex-end
Left: eyebrow "What Customers Say" var(--gold) standard label style. Headline "Real words from" line 1, "Pune homes" line 2, full stop orange. Fraunces 700 var(--ivory).
Right: two arrow buttons ← →, each 44px × 44px, border: 1px solid rgba(245,240,232,0.15), border-radius: 50%, DM Sans 700 16px var(--ivory). Hover: background: var(--orange), border-color: var(--orange). Left arrow: scrollContainer.scrollBy({ left: -384, behavior: 'smooth' }). Right arrow: scrollContainer.scrollBy({ left: 384, behavior: 'smooth' }).
Scrollable track id="testimonial-track": display: flex, gap: 24px, overflow-x: auto, scroll-snap-type: x mandatory, padding-bottom: 24px, margin-top: 48px, scrollbar-width: none
Five cards — each min-width: 360px, scroll-snap-align: start, background: #141414, border: 1px solid rgba(245,240,232,0.07), border-radius: 12px, padding: 32px. Hover: border-color: rgba(232,89,12,0.25), translateY(-4px) over 0.25s.
Stars animation on scroll — each ★ starts opacity: 0, transform: scale(0). IntersectionObserver triggers CSS animation starPop with 0.08s stagger per star:
css@keyframes starPop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
Stars: color: var(--orange), font-size: 16px, letter-spacing: 3px
Quote: Fraunces 300 italic 20px var(--ivory) line-height 1.5
Divider: 1px solid rgba(245,240,232,0.08)
Name: DM Sans 600 14px var(--ivory)
Role: DM Sans 400 12px var(--muted)
Card 1: "I was worried about dampness in my living room walls for years. The team recommended Alldry Wall Fix 4 and it has been completely dry through two monsoons. Brilliant product and excellent guidance from Kamlesh." — Rajesh Patil, Homeowner, Kothrud, Pune
Card 2: "As a contractor I need reliable stock and honest pricing. Kamlesh is my go-to for all Birla Opus materials. Quick billing, consistent availability, and they always have the full range in stock." — Suresh Mane, Painting Contractor, Hadapsar
Card 3: "We used One Pure Elegance for our entire 3BHK renovation. The finish is absolutely stunning — smooth as silk and still looking fresh two years later. Worth every rupee." — Priya Deshpande, Homeowner, Baner, Pune
Card 4: "The free site survey was genuinely helpful. The expert came within a day, measured everything properly, and gave us a detailed quote with product names and quantities. No other shop offers this." — Amit Joshi, Builder, Wakad
Card 5: "Got the Allwood Italian PU for my modular kitchen shutters. The finish looks like it came straight from a furniture showroom. Couldn't believe the quality — highly recommend." — Sneha Kulkarni, Interior Designer, Aundh, Pune

Section 10 — Footer
background: #1A1A0A, padding: 60px 80px 32px
Top grid: display: grid, grid-template-columns: 2fr 1fr 1fr 1fr, gap: 60px, margin-bottom: 48px. Single column on mobile.
Column 1 — Brand:
Paint fan SVG icon 48px × 48px
"Kamlesh Paints & Hardware" — Fraunces 700 22px var(--ivory) margin-top: 16px
"Authorised Birla Opus Dealer" — DM Sans 500 12px letter-spacing 2px uppercase var(--orange) margin-top: 4px
"Shivajinagar, Pune" — DM Sans 400 14px var(--muted) margin-top: 4px
Social icons row margin-top: 24px, display: flex, gap: 12px. Each: 40px × 40px, border-radius: 50%, background: rgba(245,240,232,0.08), border: 1px solid rgba(245,240,232,0.1), cursor: pointer. Hover: background: var(--orange), border-color: var(--orange). Icons: Instagram, Facebook, YouTube, WhatsApp (SVG or Unicode).
Column 2 — Products:
Heading: "Products" — DM Sans 700 11px letter-spacing 2px uppercase rgba(245,240,232,0.35) margin-bottom: 20px
Links: Interior Paints · Exterior Paints · Waterproofing · Enamels · Wood Finishes · Wallpapers · Tools · Aerosols
Each link: DM Sans 400 14px var(--muted), display: block, margin-bottom: 10px, text-decoration: none. Hover: color: var(--orange)
Column 3 — Services:
Heading: "Services"
Links: Free Site Survey · Colour Consultation · Paint Calculator · Home Delivery Pune · Bulk Orders · Contractor Pricing
Column 4 — Contact:
Heading: "Contact"
Items:

📞 [YOUR PHONE NUMBER]
💬 WhatsApp Us
✉ [YOUR EMAIL ADDRESS]
📍 [YOUR FULL ADDRESS], Shivajinagar, Pune
🕐 [YOUR WEEKDAY HOURS]
🕐 [YOUR WEEKEND HOURS]

Bottom bar: border-top: 1px solid rgba(245,240,232,0.08), padding-top: 28px, display: flex, justify-content: space-between, align-items: center
Left: "© 2025 Kamlesh Paints & Hardware. All rights reserved." DM Sans 400 12px rgba(245,240,232,0.25)
Right: Privacy Policy · Terms & Conditions · Sitemap — each DM Sans 400 12px rgba(245,240,232,0.25), hover rgba(245,240,232,0.6)

Persistent Elements
Floating WhatsApp button:
position: fixed, bottom: 32px, right: 32px, z-index: 90, width: 58px, height: 58px, border-radius: 50%, background: #25D366, display: flex, align-items: center, justify-content: center, cursor: pointer, box-shadow: 0 8px 28px rgba(37,211,102,0.4), text-decoration: none, data-magnetic
White WhatsApp SVG icon, 28px
css@keyframes waPulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.07); }
}
.wa-btn { animation: waPulse 3s ease-in-out 2s infinite; }
.wa-btn:hover { animation-play-state: paused; }
Tooltip on hover: background: #1A1A0A, color: var(--ivory), DM Sans 600 13px, padding: 8px 14px, border-radius: 100px, position: absolute, right: 68px, white-space: nowrap. Hidden by default, opacity: 0 → opacity: 1 over 0.2s. Text: "Chat on WhatsApp"
href: https://wa.me/91[YOUR WHATSAPP NUMBER]?text=Hi%20Kamlesh%20Paints%2C%20I%20found%20you%20on%20your%20website.%20I%27d%20like%20to%20know%20more.
Custom cursor <div id="cursor">:
css#cursor {
  position: fixed;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--orange);
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: transform 0.08s ease, width 0.2s ease,
              height 0.2s ease, background 0.2s ease,
              border 0.2s ease;
}
#cursor.hovering {
  width: 30px;
  height: 30px;
  background: transparent;
  border: 2px solid var(--orange);
}
javascriptconst cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});
document.querySelectorAll('a, button, .swatch, [data-tilt]')
  .forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });

JavaScript — Complete Module List
Write all JavaScript in one <script> block at the bottom of <body>. Organise with comments.
Module 1 — Prefers reduced motion:
javascriptconst prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
if (prefersReducedMotion) {
  document.documentElement.classList.add('reduced-motion');
}
CSS: .reduced-motion * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
Module 2 — Navbar scroll: window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 80); }) throttled with requestAnimationFrame
Module 3 — Mobile menu: Toggle .open on overlay, lock/unlock body scroll, close on outside click
Module 4 — Custom cursor: As shown above
Module 5 — Magnetic buttons: On all [data-magnetic] elements, track mousemove, apply max 8px displacement proportional to cursor offset from element centre. Reset on mouseleave with spring transition.
Module 6 — Hero word-split: On DOMContentLoaded, wrap each word in the H1 in <span style="display: inline-block">, set individual animation-delay values, add CSS class to trigger @keyframes wordUp
Module 7 — Scroll reveals: IntersectionObserver at threshold 0.12 adds .revealed to all .reveal elements. Stagger delays set on .reveal-stagger children via JavaScript on load.
Module 8 — Counter animation: data-count attribute on stat numbers. Observer triggers requestAnimationFrame count-up with easeOutExpo.
Module 9 — Can colour change: Swatch click → set wipe div background → animate clip-path → on end update --can-color → reset wipe
Module 10 — Wall colour change: Swatch click in colour explorer → same wipe technique on wall panel → update panel background-color on end
Module 11 — Category card 3D tilt: mousemove on all [data-tilt], calculate and apply rotateX/rotateY, reset on mouseleave
Module 12 — Tab switching: Click on .tab-btn → deactivate all → activate clicked tab and matching .tab-panel
Module 13 — Paint calculator: Button click → read values → calculatePaint() → inject result HTML → animate result area open
Module 14 — Testimonial arrows: Left/right click → scrollBy on #testimonial-track
Module 15 — Star pop animation: IntersectionObserver on each testimonial card → add animation-delay to each ★ span → trigger starPop keyframe

Screenshot Checklist — Run After Each Section
Navbar: Transparent over hero. Ivory blur on scroll. Orange underline animates left-to-right on link hover. Get Estimate border visible in both states.
Hero: Background is #0B0B0B not grey. Three blobs visible as subtle coloured glows. Can visibly rocks and floats. Can changes colour on swatch click with left-to-right wipe. Category panels at exact bottom edge with mini cans floating above.
Ticker: Exactly #E8590C background. Text scrolls smoothly with no jump at loop point.
Category grid: Warm ivory background not white. 3D tilt works on hover. Cards stagger in on scroll in sequence.
Colour explorer: Left column sticky. Wall changes colour with brush-stroke wipe. All fourteen swatches visible and scrollable.
Products: Tabs switch with fade. Sub-brand colours match spec. Feature pills readable against dark card.
Calculator: Result area animates open smoothly. Number 44px, cost 20px gold.
Survey CTA: Background exactly #1F3D2C not blue-green. Headline lines slide from opposite sides on scroll.
Testimonials: Arrow buttons scroll the track. Stars pop in on scroll with stagger.
Footer: Four columns aligned. Bottom bar separated by faint divider. All contact placeholders visible for easy replacement.
Final full-page check: Scroll top to bottom. Colour zone sequence is dark → orange → ivory → dark → ivory → forest green → dark → dark. No section bleeds into another. Custom cursor visible throughout. WhatsApp button pulses and shows tooltip on hover. No TypeScript errors (N/A — vanilla JS). No console errors.

Placeholders to Replace Before Launch
Search the file for these strings and replace with real values before going live:

[YOUR PHONE NUMBER] — store phone number
[YOUR WHATSAPP NUMBER] — WhatsApp number (digits only, no spaces or dashes, with country code 91)
[YOUR EMAIL ADDRESS] — store email
[YOUR FULL ADDRESS] — complete street address
[YOUR WEEKDAY HOURS] — e.g. Mon–Sat: 9am – 8pm
[YOUR WEEKEND HOURS] — e.g. Sunday: 10am – 6pm