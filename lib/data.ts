// Static content + configuration for the P Whytes landing page.
// Ported 1:1 from the original bundled page's component logic.

export type Product = {
  id: string;
  line: string;
  name: string;
  mg: number;
  size: string;
  price: number;
  casePrice: number;
  tag: string;
  accent: string;
  img: string;
};

export type Review = {
  quote: string;
  name: string;
  initial: string;
  meta: string;
};

export type Faq = {
  q: string;
  a: string;
};

/**
 * Page-level configuration. In the original these were authoring "props" with
 * defaults; here they are plain config you can edit in one place.
 */
export const config = {
  accent: "#9c7a2e", // options offered in the source: #9c7a2e, #2f6fd0, #e1213f, #37a24a
  discountPercent: 20, // 0–50
  freeShipThreshold: 50, // USD
  showAgeGate: true,
};

export const FONT_DISPLAY =
  "var(--font-bricolage), 'Bricolage Grotesque', sans-serif";
export const FONT_BODY =
  "var(--font-instrument), 'Instrument Sans', system-ui, sans-serif";

// Hero collage image shown in the hero section.
export const HERO_IMAGE = "/products/collection.png";

export const catalog: Product[] = [
  {
    id: "blueberry",
    line: "K-PLEX",
    name: "Blueberry Lemonade",
    mg: 450,
    size: "2 fl oz · 60 mL",
    price: 27,
    casePrice: 324,
    tag: "Fan favorite",
    accent: "#2f6fd0",
    img: "/products/blueberry.png",
  },
  {
    id: "tropical",
    line: "K-PLEX+",
    name: "Tropical Punch",
    mg: 630,
    size: "2 fl oz · 60 mL",
    price: 12,
    casePrice: 144,
    tag: "Top strength",
    accent: "#e8556a",
    img: "/products/tropical.png",
  },
  {
    id: "strawberry",
    line: "Ultimate Gold",
    name: "Strawberry",
    mg: 90,
    size: "2 fl oz · 60 mL",
    price: 9,
    casePrice: 108,
    tag: "Smooth & light",
    accent: "#e0384a",
    img: "/products/strawberry.png",
  },
  {
    id: "bluerazz",
    line: "Ultimate Gold",
    name: "Blue Razz",
    mg: 90,
    size: "2 fl oz · 60 mL",
    price: 9,
    casePrice: 108,
    tag: "Crowd pleaser",
    accent: "#1e58a8",
    img: "/products/bluerazz.png",
  },
  {
    id: "rogue",
    line: "K-PLEX",
    name: "Rogue Punch",
    mg: 300,
    size: "0.5 fl oz · 15 mL",
    price: 20,
    casePrice: 240,
    tag: "Bold & compact",
    accent: "#e1213f",
    img: "/products/rogue.png",
  },
  {
    id: "citrus",
    line: "K-PLEX",
    name: "Citrus Blast",
    mg: 150,
    size: "0.5 fl oz · 15 mL",
    price: 12,
    casePrice: 144,
    tag: "Everyday go-to",
    accent: "#37a24a",
    img: "/products/citrus.png",
  },
];

export const reviews: Review[] = [
  {
    quote:
      "The Blueberry Lemonade is genuinely delicious — smooth, not harsh, and my new afternoon ritual.",
    name: "Marcus D.",
    initial: "M",
    meta: "Verified buyer",
  },
  {
    quote:
      "Ordered on a Monday, at my door Wednesday. Clean labels and the lab results are right there. Trust earned.",
    name: "Renee T.",
    initial: "R",
    meta: "Verified buyer",
  },
  {
    quote:
      "Ultimate Gold Strawberry tastes premium and the support team is fantastic. Easy 5 stars from me.",
    name: "Javier P.",
    initial: "J",
    meta: "Verified buyer",
  },
];

export function buildFaqs(discountPercent: number): Faq[] {
  return [
    {
      q: "What is in these products?",
      a: "Every product in this collection is a functional drink crafted from plant-based ingredients. We list every ingredient on the label and publish a third-party Certificate of Analysis for every batch.",
    },
    {
      q: "Who are these products for?",
      a: "These products are intended exclusively for adult use. They are not intended for individuals who are pregnant, nursing, taking medication, or who have a medical condition.",
    },
    {
      q: "How does the 30-day satisfaction guarantee work?",
      a: "If you are not satisfied with your purchase, contact our customer support team within 30 days and we'll make it right — no hassle, no stress.",
    },
    {
      q: `How do I redeem my ${discountPercent}% discount?`,
      a: "Add items to your bag from this page, then complete the short verification at checkout. Your code is applied automatically and cannot be combined with other offers.",
    },
  ];
}

// Convert "#rrggbb" + alpha to an rgba() string (ported from the source).
export function hexToRgba(h: string, a: number): string {
  const c = h.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Format a number as a USD price ($27 or $27.00 → $27; 27.5 → $27.50).
export function fmt(n: number): string {
  return "$" + (Number.isInteger(n) ? n.toString() : n.toFixed(2));
}
