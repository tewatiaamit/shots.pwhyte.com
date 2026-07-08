# P Whytes — Next.js

The **P Whytes** botanical wellness-shots landing page, converted from a single
bundled HTML file into a Next.js (App Router + TypeScript) application.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build for production:

```bash
npm run build
npm start
```

## What's in here

| Path | Purpose |
| --- | --- |
| `app/layout.tsx` | Root layout, metadata, self-hosted fonts (Bricolage Grotesque + Instrument Sans) via `next/font/local`. |
| `app/page.tsx` | Renders the `Landing` component. |
| `app/globals.css` | Base reset, keyframes, and the `.pw-cta` hover style. |
| `components/Landing.tsx` | The full interactive page (client component): header, hero, shop, cart drawer, age gate, checkout DOB verification, FAQ, footer. |
| `lib/data.ts` | Product catalog, reviews, FAQs, config, and helpers. |
| `public/products/` | Product images + hero collage (extracted from the original bundle). |

## Configuration

Edit `config` in [`lib/data.ts`](lib/data.ts):

```ts
export const config = {
  accent: "#9c7a2e",       // theme accent (options: #9c7a2e, #2f6fd0, #e1213f, #37a24a)
  discountPercent: 20,      // first-order discount, 0–50
  freeShipThreshold: 50,    // free-shipping threshold in USD
  showAgeGate: true,        // 21+ age gate on first visit
};
```

## Notes on the conversion

- The original was a client-rendered React component embedded in a bundled
  HTML file. All state (cart, packs, FAQ accordion, age gate, checkout DOB
  verification) is preserved and reimplemented with React hooks.
- The 21+ age gate persists acceptance to `localStorage` (`pw_age_ok`), read
  after mount to avoid SSR hydration mismatches.
- Images and fonts were extracted from the bundle and are served locally from
  `public/` and `app/fonts/` — no external network requests.
- Inline styles from the source were preserved as JSX style objects to keep the
  design pixel-faithful.
