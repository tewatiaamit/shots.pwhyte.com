"use client";

import { useEffect, useMemo, useState } from "react";
import {
  catalog,
  reviews,
  buildFaqs,
  config,
  fmt,
  shopifyCartUrl,
  hexToRgba,
  FONT_DISPLAY,
  FONT_BODY,
  HERO_IMAGE,
  type Product,
} from "@/lib/data";

type Pack = "single" | "case";

// URL shown while an age-verification popup is open.
const AGE_PATH = "/age-verification";

export default function Landing() {
  const { accent, discountPercent, freeShipThreshold, showAgeGate } = config;

  // --- state (ported from the original component) ---
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [ageOk, setAgeOk] = useState(false);
  const [denied, setDenied] = useState(false);
  const [pack, setPack] = useState<Record<string, Pack>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [dobM, setDobM] = useState("");
  const [dobD, setDobD] = useState("");
  const [dobY, setDobY] = useState("");
  const [dobError, setDobError] = useState(false);
  const [dobErrorMsg, setDobErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  // localStorage is only available on the client — read it after mount to
  // avoid a hydration mismatch. Returning 21+ visitors skip the gate.
  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem("pw_age_ok") === "1") setAgeOk(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Reflect the age-verification popups in the address bar. When either the
  // entry age gate or the checkout verification modal is open, the URL shows
  // /age-verification; closing it (or navigating Back) restores the home path.
  useEffect(() => {
    if (!mounted) return;
    const gateOpen = showAgeGate && !ageOk && !denied;
    const ageModalOpen = gateOpen || checkoutOpen;
    const onAgePath = window.location.pathname === AGE_PATH;
    if (ageModalOpen && !onAgePath) {
      window.history.pushState({ pwAgeModal: true }, "", AGE_PATH);
    } else if (!ageModalOpen && onAgePath) {
      window.history.replaceState({}, "", "/");
    }
  }, [mounted, showAgeGate, ageOk, denied, checkoutOpen]);

  // Browser Back while the checkout modal is open should just close it; the
  // blocking entry gate stays put and re-pushes its URL on the next sync.
  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname !== AGE_PATH) setCheckoutOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // --- handlers ---
  const pickPack = (id: string, p: Pack) =>
    setPack((s) => ({ ...s, [id]: p }));

  const add = (id: string) => {
    const p = pack[id] || "single";
    const key = id + "|" + p;
    setCart((s) => ({ ...s, [key]: (s[key] || 0) + 1 }));
    setCartOpen(true);
  };

  const inc = (key: string) =>
    setCart((s) => ({ ...s, [key]: (s[key] || 0) + 1 }));

  const dec = (key: string) =>
    setCart((s) => {
      const q = (s[key] || 0) - 1;
      const next = { ...s };
      if (q <= 0) delete next[key];
      else next[key] = q;
      return next;
    });

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);
  const toggleFaq = (i: number) => setOpenFaq((cur) => (cur === i ? -1 : i));

  const confirmAge = () => {
    try {
      localStorage.setItem("pw_age_ok", "1");
    } catch {
      /* ignore */
    }
    setAgeOk(true);
  };
  const denyAge = () => setDenied(true);

  const openCheckout = () => {
    setCheckoutOpen(true);
    setCartOpen(false);
    setDobError(false);
    setDobErrorMsg("");
  };
  const closeCheckout = () => setCheckoutOpen(false);
  const closeVerified = () => setVerified(false);

  const submitAge = () => {
    const m = parseInt(dobM, 10);
    const d = parseInt(dobD, 10);
    const y = parseInt(dobY, 10);
    if (!m || !d || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2026) {
      setDobError(true);
      setDobErrorMsg("Please enter a valid date of birth.");
      return;
    }
    const now = new Date();
    let age = now.getFullYear() - y;
    const md = now.getMonth() + 1 - m;
    if (md < 0 || (md === 0 && now.getDate() < d)) age--;
    if (age < 21) {
      setDobError(true);
      setDobErrorMsg("You must be at least 21 years old to complete this purchase.");
      return;
    }
    setDobError(false);
    setDobErrorMsg("");

    // Verified — hand the bag off to the Shopify store's checkout.
    const checkoutUrl = shopifyCartUrl(
      config.shopDomain,
      cartItems.map((c) => ({
        variantId: c.packLabel === "12-case" ? c.variantCase : c.variantSingle,
        qty: c.qty,
      })),
      config.discountCode,
    );
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    // Fallback while the Shopify domain / variant IDs aren't configured yet.
    setCheckoutOpen(false);
    setVerified(true);
  };

  // --- derived values (ported from renderVals) ---
  const tabBase: React.CSSProperties = {
    border: "none",
    borderRadius: "999px",
    padding: "6px 15px",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };
  const tabOn: React.CSSProperties = { ...tabBase, background: "#16181D", color: "#F5F1E8" };
  const tabOff: React.CSSProperties = { ...tabBase, background: "transparent", color: "#6a6d74" };

  type ProductView = Product & {
    alt: string;
    priceLabel: string;
    unitNote: string;
    hasCase: boolean;
    singleTabStyle: React.CSSProperties;
    caseTabStyle: React.CSSProperties;
    mgLabel: string;
    imgWrapStyle: React.CSSProperties;
    mgStyle: React.CSSProperties;
  };

  const products: ProductView[] = catalog.map((p) => {
    const isCase = (pack[p.id] || "single") === "case";
    return {
      ...p,
      alt: p.line + " " + p.name + " botanical shot",
      priceLabel: fmt(isCase ? p.casePrice : p.price),
      unitNote: isCase ? "12-case · " + fmt(p.casePrice / 12) + " each" : "per shot",
      hasCase: Boolean(p.variantCase),
      singleTabStyle: isCase ? tabOff : tabOn,
      caseTabStyle: isCase ? tabOn : tabOff,
      mgLabel: p.mg + " MG",
      imgWrapStyle: {
        position: "relative",
        height: "290px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 20px 20px",
        background:
          "radial-gradient(120% 90% at 50% 20%, " +
          hexToRgba(p.accent, 0.14) +
          ", rgba(255,255,255,0) 70%), #FBF9F3",
        borderBottom: "1px solid rgba(22,24,29,0.06)",
      },
      mgStyle: {
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        padding: "3px 9px",
        borderRadius: "999px",
        color: p.accent,
        background: hexToRgba(p.accent, 0.12),
      },
    };
  });

  type CartItemView = Product & {
    qty: number;
    mgLabel: string;
    packLabel: string;
    lineTotal: string;
    thumbStyle: React.CSSProperties;
    key: string;
  };

  const cartItems: CartItemView[] = Object.keys(cart).map((key) => {
    const [id, pk] = key.split("|");
    const p = catalog.find((x) => x.id === id)!;
    const qty = cart[key];
    const isCase = pk === "case";
    const unit = isCase ? p.casePrice : p.price;
    return {
      ...p,
      key,
      qty,
      mgLabel: p.mg + " MG",
      packLabel: isCase ? "12-case" : "Single",
      lineTotal: fmt(unit * qty),
      thumbStyle: {
        width: "64px",
        height: "64px",
        borderRadius: "12px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle, " +
          hexToRgba(p.accent, 0.16) +
          ", rgba(255,255,255,0) 72%), #F4F0E7",
      },
    };
  });

  const cartCount = cartItems.reduce((n, c) => n + c.qty, 0);
  const subtotalNum = cartItems.reduce(
    (n, c) => n + (c.packLabel === "12-case" ? c.casePrice : c.price) * c.qty,
    0,
  );
  const discountNum = (subtotalNum * discountPercent) / 100;
  const hasItems = cartItems.length > 0;

  const faqs = useMemo(() => buildFaqs(discountPercent), [discountPercent]).map(
    (f, i) => ({ ...f, open: openFaq === i }),
  );

  const announcement =
    "Free shipping over $" +
    freeShipThreshold +
    "  ·  " +
    discountPercent +
    "% off your first order at checkout";

  const drawerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100%",
    width: "min(420px, 92vw)",
    background: "#F5F1E8",
    zIndex: 90,
    display: "flex",
    flexDirection: "column",
    boxShadow: "-20px 0 60px rgba(0,0,0,0.18)",
    transition: "transform 0.34s cubic-bezier(0.4,0,0.2,1)",
    transform: cartOpen ? "translateX(0)" : "translateX(105%)",
  };
  const scrimStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 85,
    background: "rgba(18,20,24,0.4)",
    backdropFilter: "blur(2px)",
    transition: "opacity 0.3s ease",
    opacity: cartOpen ? 1 : 0,
    pointerEvents: cartOpen ? "auto" : "none",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid rgba(22,24,29,0.20)",
    borderRadius: "12px",
    padding: "13px 14px",
    fontFamily: "inherit",
    fontSize: "16px",
    color: "#16181D",
    background: "#FFFFFF",
    outline: "none",
    textAlign: "center",
  };

  const showGate = mounted && showAgeGate && !ageOk && !denied;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const rootStyle = {
    "--acc": accent,
    fontFamily: FONT_BODY,
    background: "#F5F1E8",
    color: "#16181D",
    minHeight: "100vh",
    overflowX: "hidden",
  } as React.CSSProperties;

  const eyebrow: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--acc,#9c7a2e)",
    marginBottom: "12px",
  };

  return (
    <div style={rootStyle}>
      {/* Announcement bar */}
      <div
        style={{
          background: "#16181D",
          color: "#F5F1E8",
          textAlign: "center",
          fontSize: "13px",
          letterSpacing: "0.04em",
          padding: "9px 16px",
          fontWeight: 500,
        }}
      >
        {announcement}
      </div>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(245,241,232,0.82)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(22,24,29,0.10)",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          <a
            href="#top"
            style={{
              textDecoration: "none",
              color: "#16181D",
              display: "flex",
              alignItems: "baseline",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "25px",
                letterSpacing: "-0.02em",
              }}
            >
              P Whytes
            </span>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--acc, #9c7a2e)",
                display: "inline-block",
                marginLeft: "2px",
                transform: "translateY(-2px)",
              }}
            />
          </a>
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "34px",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            <a href="#shop" style={{ textDecoration: "none", color: "#2c2f36" }}>
              Shop
            </a>
            <a href="#about" style={{ textDecoration: "none", color: "#2c2f36" }}>
              About Us
            </a>
            <a href="#reviews" style={{ textDecoration: "none", color: "#2c2f36" }}>
              Reviews
            </a>
            <a href="#faq" style={{ textDecoration: "none", color: "#2c2f36" }}>
              FAQs
            </a>
          </nav>
          <button
            onClick={openCart}
            style={{
              border: "1px solid rgba(22,24,29,0.16)",
              background: "#16181D",
              color: "#F5F1E8",
              borderRadius: "999px",
              padding: "10px 18px 10px 16px",
              fontFamily: "inherit",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Bag</span>
            <span
              style={{
                background: "var(--acc, #9c7a2e)",
                color: "#16181D",
                borderRadius: "999px",
                minWidth: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                padding: "0 6px",
              }}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </header>

      <a id="top" />

      {/* Hero */}
      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "74px 28px 40px",
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: "40px",
          alignItems: "center",
        }}
      >
        <div style={{ animation: "pwFade 0.7s ease both" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(22,24,29,0.05)",
              border: "1px solid rgba(22,24,29,0.10)",
              borderRadius: "999px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: "#3a3d44",
              marginBottom: "26px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--acc, #9c7a2e)",
              }}
            />
            Lab-tested · Third-party verified
          </div>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: "clamp(44px, 5.4vw, 72px)",
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              margin: "0 0 22px",
            }}
          >
            Functional shots,
            <br />
            crafted&nbsp;clean.
          </h1>
          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.6,
              color: "#45484f",
              maxWidth: "470px",
              margin: "0 0 34px",
            }}
          >
            Premium botanical wellness shots made from plant-based ingredients —
            clean labels, every batch third-party tested, shipped from our
            Plantation, Florida facility.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="#shop"
              style={{
                textDecoration: "none",
                background: "#16181D",
                color: "#F5F1E8",
                borderRadius: "999px",
                padding: "16px 32px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Shop the collection
            </a>
            <a
              href="#about"
              style={{
                textDecoration: "none",
                color: "#16181D",
                borderRadius: "999px",
                padding: "16px 26px",
                fontSize: "16px",
                fontWeight: 600,
                border: "1px solid rgba(22,24,29,0.22)",
              }}
            >
              Our story →
            </a>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "24px" }}>
                4.7★
              </div>
              <div style={{ fontSize: "13px", color: "#6a6d74" }}>21k+ reviews</div>
            </div>
            <div style={{ width: "1px", height: "34px", background: "rgba(22,24,29,0.14)" }} />
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "24px" }}>
                100%
              </div>
              <div style={{ fontSize: "13px", color: "#6a6d74" }}>Batch lab-tested</div>
            </div>
            <div style={{ width: "1px", height: "34px", background: "rgba(22,24,29,0.14)" }} />
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "24px" }}>
                30-day
              </div>
              <div style={{ fontSize: "13px", color: "#6a6d74" }}>Guarantee</div>
            </div>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            height: "520px",
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pwScale 0.8s ease both",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "430px",
              height: "430px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(156,122,46,0.20), rgba(156,122,46,0) 68%)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt="P Whytes botanical shots collection"
            style={{
              position: "relative",
              width: "100%",
              maxHeight: "520px",
              objectFit: "contain",
              filter: "drop-shadow(0 26px 34px rgba(0,0,0,0.22))",
              zIndex: 1,
            }}
          />
        </div>
      </section>

      {/* Trust strip */}
      <div
        style={{
          borderTop: "1px solid rgba(22,24,29,0.10)",
          borderBottom: "1px solid rgba(22,24,29,0.10)",
          background: "rgba(22,24,29,0.02)",
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            fontSize: "14px",
            fontWeight: 600,
            color: "#3a3d44",
          }}
        >
          {[
            "Certificate of Analysis on every batch",
            "Independent U.S. lab verified",
            `Free shipping over $${freeShipThreshold}`,
            "Clean, plant-based ingredients",
          ].map((t) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <span style={{ color: "var(--acc,#9c7a2e)" }}>◆</span> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Shop */}
      <section id="shop" style={{ maxWidth: "1240px", margin: "0 auto", padding: "84px 28px 30px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "40px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={eyebrow}>The Collection</div>
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "clamp(34px, 4vw, 52px)",
                letterSpacing: "-0.025em",
                margin: 0,
                lineHeight: 1.02,
              }}
            >
              Find your flavor.
            </h2>
          </div>
          <p style={{ fontSize: "16px", color: "#55585f", maxWidth: "340px", margin: 0 }}>
            Six premium botanical shots. Choose the strength and flavor that fits your day.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(22,24,29,0.09)",
                borderRadius: "22px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={p.imgWrapStyle}>
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "16px",
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(22,24,29,0.08)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "999px",
                    padding: "5px 11px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#45484f",
                  }}
                >
                  {p.tag}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.img}
                  alt={p.alt}
                  style={{
                    height: "246px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 16px 22px rgba(0,0,0,0.18))",
                  }}
                />
              </div>
              <div
                style={{
                  padding: "22px 22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#86898f",
                    }}
                  >
                    {p.line}
                  </span>
                  <span style={p.mgStyle}>{p.mgLabel}</span>
                </div>
                <h3
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 700,
                    fontSize: "22px",
                    letterSpacing: "-0.01em",
                    margin: "0 0 4px",
                  }}
                >
                  {p.name}
                </h3>
                <div style={{ fontSize: "13px", color: "#7a7d83", marginBottom: "16px" }}>
                  {p.size}
                </div>
                {p.hasCase && (
                  <div
                    style={{
                      display: "inline-flex",
                      padding: "3px",
                      background: "rgba(22,24,29,0.05)",
                      borderRadius: "999px",
                      marginBottom: "18px",
                      alignSelf: "flex-start",
                    }}
                  >
                    <button onClick={() => pickPack(p.id, "single")} style={p.singleTabStyle}>
                      Single
                    </button>
                    <button onClick={() => pickPack(p.id, "case")} style={p.caseTabStyle}>
                      12-case
                    </button>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginTop: "auto",
                  }}
                >
                  <div>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "21px" }}>
                      {p.priceLabel}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#86898f",
                        display: "block",
                        marginTop: "1px",
                      }}
                    >
                      {p.unitNote}
                    </span>
                  </div>
                  <button
                    onClick={() => add(p.id)}
                    className="pw-cta"
                    style={{
                      border: "none",
                      borderRadius: "999px",
                      padding: "12px 22px",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add to bag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee band */}
      <section style={{ maxWidth: "1240px", margin: "56px auto 0", padding: "0 28px" }}>
        <div
          style={{
            background: "#16181D",
            color: "#F5F1E8",
            borderRadius: "26px",
            padding: "46px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: "560px" }}>
            <div style={{ ...eyebrow, color: "var(--acc,#9c7a2e)" }}>Risk-free</div>
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "clamp(28px,3.2vw,40px)",
                letterSpacing: "-0.02em",
                margin: "0 0 12px",
                lineHeight: 1.05,
              }}
            >
              30-day satisfaction guarantee.
            </h2>
            <p
              style={{
                fontSize: "17px",
                lineHeight: 1.6,
                color: "rgba(245,241,232,0.72)",
                margin: 0,
              }}
            >
              Not satisfied? Contact our support team within 30 days and we'll make it right — no
              hassle, no stress.
            </p>
          </div>
          <div
            style={{
              textAlign: "center",
              background: "rgba(245,241,232,0.06)",
              border: "1px solid rgba(245,241,232,0.14)",
              borderRadius: "20px",
              padding: "26px 34px",
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "46px",
                color: "var(--acc,#9c7a2e)",
                lineHeight: 1,
              }}
            >
              {discountPercent}%
            </div>
            <div
              style={{
                fontSize: "14px",
                marginTop: "8px",
                color: "rgba(245,241,232,0.82)",
                maxWidth: "170px",
              }}
            >
              off your first order at checkout
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "96px 28px 30px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "56px",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ ...eyebrow, marginBottom: "14px" }}>What we stand for</div>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: "clamp(32px,3.8vw,50px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.03,
              margin: "0 0 22px",
            }}
          >
            Functional drinks, crafted with care.
          </h2>
          <p style={{ fontSize: "17px", lineHeight: 1.65, color: "#45484f", margin: "0 0 18px" }}>
            We started P Whytes because we couldn't find products that felt right — clean labels,
            real customer support. So we built it ourselves.
          </p>
          <p style={{ fontSize: "17px", lineHeight: 1.65, color: "#45484f", margin: 0 }}>
            Every shipment passes an independent U.S. lab before it reaches our Plantation, Florida
            facility. Every batch carries a Certificate of Analysis. Every product is for adult use
            only.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          <div
            style={{
              gridColumn: "1 / -1",
              background: "#FFFFFF",
              border: "1px solid rgba(22,24,29,0.09)",
              borderRadius: "20px",
              padding: "28px 30px",
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "44px",
                color: "var(--acc,#9c7a2e)",
                lineHeight: 1,
              }}
            >
              100%
            </div>
            <div style={{ fontSize: "15px", color: "#55585f", marginTop: "8px" }}>
              Lab-tested batches, every single run
            </div>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(22,24,29,0.09)",
              borderRadius: "20px",
              padding: "26px 28px",
            }}
          >
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "38px", lineHeight: 1 }}>
              21k+
            </div>
            <div style={{ fontSize: "14px", color: "#55585f", marginTop: "8px" }}>
              Verified customer reviews
            </div>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(22,24,29,0.09)",
              borderRadius: "20px",
              padding: "26px 28px",
            }}
          >
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "38px", lineHeight: 1 }}>
              4.7★
            </div>
            <div style={{ fontSize: "14px", color: "#55585f", marginTop: "8px" }}>
              Average customer rating
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" style={{ maxWidth: "1240px", margin: "0 auto", padding: "84px 28px 30px" }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <div style={eyebrow}>Reviews</div>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: "clamp(32px,3.8vw,50px)",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Loved by 21,000+ customers.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {reviews.map((r, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(22,24,29,0.09)",
                borderRadius: "20px",
                padding: "30px 30px 26px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  color: "var(--acc,#9c7a2e)",
                  fontSize: "17px",
                  letterSpacing: "2px",
                  marginBottom: "16px",
                }}
              >
                ★★★★★
              </div>
              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.6,
                  color: "#2c2f36",
                  margin: "0 0 22px",
                  fontWeight: 500,
                }}
              >
                {r.quote}
              </p>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--acc,#9c7a2e)",
                    color: "#16181D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  {r.initial}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>{r.name}</div>
                  <div style={{ fontSize: "13px", color: "#86898f" }}>{r.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: "860px", margin: "0 auto", padding: "90px 28px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <div style={eyebrow}>FAQs</div>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: "clamp(32px,3.8vw,50px)",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Good to know.
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {faqs.map((f, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(22,24,29,0.09)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggleFaq(i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "none",
                  padding: "22px 24px",
                  fontFamily: FONT_DISPLAY,
                  fontSize: "19px",
                  fontWeight: 600,
                  color: "#16181D",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <span>{f.q}</span>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 400,
                    color: accent,
                    lineHeight: 1,
                    transition: "transform 0.2s ease",
                    transform: f.open ? "rotate(45deg)" : "rotate(0deg)",
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </button>
              {f.open && (
                <div
                  style={{
                    padding: "0 24px 24px",
                    fontSize: "16px",
                    lineHeight: 1.65,
                    color: "#45484f",
                  }}
                >
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#16181D", color: "#F5F1E8", marginTop: "80px" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "60px 28px 30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "40px",
              flexWrap: "wrap",
              paddingBottom: "44px",
              borderBottom: "1px solid rgba(245,241,232,0.14)",
            }}
          >
            <div style={{ maxWidth: "320px" }}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 800,
                  fontSize: "26px",
                  marginBottom: "14px",
                }}
              >
                P Whytes
              </div>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "rgba(245,241,232,0.62)",
                  margin: 0,
                }}
              >
                Premium botanical wellness shots, crafted clean and lab-tested. Made in Plantation,
                Florida.
              </p>
            </div>
            <div style={{ display: "flex", gap: "64px", flexWrap: "wrap" }}>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(245,241,232,0.5)",
                    marginBottom: "16px",
                  }}
                >
                  Explore
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "15px" }}>
                  <a href="#shop" style={{ color: "rgba(245,241,232,0.85)", textDecoration: "none" }}>
                    Shop
                  </a>
                  <a href="#about" style={{ color: "rgba(245,241,232,0.85)", textDecoration: "none" }}>
                    About Us
                  </a>
                  <a href="#reviews" style={{ color: "rgba(245,241,232,0.85)", textDecoration: "none" }}>
                    Reviews
                  </a>
                  <a href="#faq" style={{ color: "rgba(245,241,232,0.85)", textDecoration: "none" }}>
                    FAQs
                  </a>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(245,241,232,0.5)",
                    marginBottom: "16px",
                  }}
                >
                  Support
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "15px" }}>
                  <span style={{ color: "rgba(245,241,232,0.85)" }}>Contact us</span>
                  <span style={{ color: "rgba(245,241,232,0.85)" }}>Shipping &amp; returns</span>
                  <span style={{ color: "rgba(245,241,232,0.85)" }}>Certificate of Analysis</span>
                  <span style={{ color: "rgba(245,241,232,0.85)" }}>Lab results</span>
                </div>
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.6,
              color: "rgba(245,241,232,0.5)",
              margin: "28px 0 0",
              maxWidth: "900px",
            }}
          >
            For use by adults 21 and older only. Not for use by those who are pregnant, nursing,
            taking medication, or who have a medical condition. These statements have not been
            evaluated by the Food and Drug Administration. This product is not intended to diagnose,
            treat, cure, or prevent any disease. Keep out of reach of children and pets.
          </p>
          <div style={{ fontSize: "13px", color: "rgba(245,241,232,0.5)", marginTop: "20px" }}>
            © 2026 P Whytes. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Cart drawer */}
      <div style={scrimStyle} onClick={closeCart} />
      <aside style={drawerStyle}>
        <div
          style={{
            padding: "24px 26px",
            borderBottom: "1px solid rgba(22,24,29,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "20px", margin: 0 }}>
            Your bag ({cartCount})
          </h3>
          <button
            onClick={closeCart}
            style={{
              border: "none",
              background: "rgba(22,24,29,0.06)",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "18px",
              color: "#16181D",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 26px" }}>
          {hasItems &&
            cartItems.map((c) => (
              <div
                key={c.key}
                style={{
                  display: "flex",
                  gap: "14px",
                  padding: "18px 0",
                  borderBottom: "1px solid rgba(22,24,29,0.08)",
                }}
              >
                <div style={c.thumbStyle}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.name} style={{ height: "64px", objectFit: "contain" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>{c.name}</div>
                  <div style={{ fontSize: "13px", color: "#86898f", marginBottom: "10px" }}>
                    {c.line} · {c.mgLabel} · {c.packLabel}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0,
                        border: "1px solid rgba(22,24,29,0.16)",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => dec(c.key)}
                        style={{
                          border: "none",
                          background: "none",
                          width: "30px",
                          height: "30px",
                          cursor: "pointer",
                          fontSize: "16px",
                          color: "#16181D",
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: "22px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
                        {c.qty}
                      </span>
                      <button
                        onClick={() => inc(c.key)}
                        style={{
                          border: "none",
                          background: "none",
                          width: "30px",
                          height: "30px",
                          cursor: "pointer",
                          fontSize: "16px",
                          color: "#16181D",
                        }}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "15px", fontFamily: FONT_DISPLAY }}>
                      {c.lineTotal}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {!hasItems && (
            <div style={{ textAlign: "center", padding: "64px 20px", color: "#86898f" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛍️</div>
              <div style={{ fontWeight: 600, color: "#16181D", marginBottom: "6px" }}>
                Your bag is empty
              </div>
              <div style={{ fontSize: "14px" }}>Add a shot from the collection to get started.</div>
            </div>
          )}
        </div>

        {hasItems && (
          <div
            style={{
              padding: "20px 26px 26px",
              borderTop: "1px solid rgba(22,24,29,0.10)",
              background: "#FBF9F3",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "15px",
                marginBottom: "8px",
                color: "#45484f",
              }}
            >
              <span>Subtotal</span>
              <span>{fmt(subtotalNum)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "15px",
                marginBottom: "12px",
                color: "var(--acc,#9c7a2e)",
                fontWeight: 600,
              }}
            >
              <span>First-order discount ({discountPercent}%)</span>
              <span>−{fmt(discountNum)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                fontWeight: 700,
                fontFamily: FONT_DISPLAY,
                paddingTop: "12px",
                borderTop: "1px solid rgba(22,24,29,0.12)",
              }}
            >
              <span>Total</span>
              <span>{fmt(subtotalNum - discountNum)}</span>
            </div>
            <button
              onClick={openCheckout}
              className="pw-cta"
              style={{
                width: "100%",
                marginTop: "18px",
                border: "none",
                borderRadius: "999px",
                padding: "16px",
                fontFamily: "inherit",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Verify age &amp; checkout
            </button>
            <div style={{ textAlign: "center", fontSize: "12px", color: "#86898f", marginTop: "12px" }}>
              Discount applied automatically at checkout.
            </div>
          </div>
        )}
      </aside>

      {/* Age gate */}
      {showGate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(18,20,24,0.72)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "#F5F1E8",
              borderRadius: "26px",
              maxWidth: "440px",
              width: "100%",
              padding: "44px 40px",
              textAlign: "center",
              animation: "pwScale 0.4s ease both",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: "4px", marginBottom: "26px" }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "28px" }}>P Whytes</span>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--acc,#9c7a2e)",
                  display: "inline-block",
                }}
              />
            </div>
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "30px",
                letterSpacing: "-0.02em",
                margin: "0 0 12px",
              }}
            >
              Are you 21 or older?
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#55585f", margin: "0 0 30px" }}>
              Our products are intended exclusively for adult use. You must be at least 21 years old
              to enter this site.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={confirmAge}
                style={{
                  flex: 1,
                  border: "none",
                  background: "#16181D",
                  color: "#F5F1E8",
                  borderRadius: "999px",
                  padding: "15px",
                  fontFamily: "inherit",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes, I'm 21+
              </button>
              <button
                onClick={denyAge}
                style={{
                  flex: 1,
                  border: "1px solid rgba(22,24,29,0.22)",
                  background: "none",
                  color: "#16181D",
                  borderRadius: "999px",
                  padding: "15px",
                  fontFamily: "inherit",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                No
              </button>
            </div>
            <div style={{ fontSize: "12px", color: "#9a9da3", marginTop: "22px", lineHeight: 1.5 }}>
              By entering you agree these statements have not been evaluated by the FDA and the
              products are not intended to diagnose, treat, cure, or prevent any disease.
            </div>
          </div>
        </div>
      )}

      {/* Age denied */}
      {denied && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 101,
            background: "#16181D",
            color: "#F5F1E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "380px" }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "28px", margin: "0 0 14px" }}>
              Come back at 21.
            </h2>
            <p style={{ fontSize: "16px", lineHeight: 1.6, color: "rgba(245,241,232,0.7)", margin: 0 }}>
              You must be at least 21 years old to view this site. Thanks for stopping by.
            </p>
          </div>
        </div>
      )}

      {/* Checkout age verification */}
      {checkoutOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(18,20,24,0.72)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={closeCheckout}
        >
          <div
            onClick={stop}
            style={{
              background: "#F5F1E8",
              borderRadius: "26px",
              maxWidth: "460px",
              width: "100%",
              padding: "40px 40px 36px",
              animation: "pwScale 0.4s ease both",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--acc,#9c7a2e)",
                }}
              >
                Age verification
              </div>
              <button
                onClick={closeCheckout}
                style={{
                  border: "none",
                  background: "rgba(22,24,29,0.06)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "17px",
                  color: "#16181D",
                }}
              >
                ×
              </button>
            </div>
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "28px",
                letterSpacing: "-0.02em",
                margin: "0 0 10px",
                lineHeight: 1.05,
              }}
            >
              Confirm you're 21 or older
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#55585f", margin: "0 0 26px" }}>
              Enter your date of birth to complete checkout. Our products are intended exclusively
              for adults.
            </p>

            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#45484f", marginBottom: "8px" }}>
              Date of birth
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "10px" }}>
              <input
                type="number"
                placeholder="MM"
                min="1"
                max="12"
                value={dobM}
                onChange={(e) => setDobM(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="DD"
                min="1"
                max="31"
                value={dobD}
                onChange={(e) => setDobD(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="YYYY"
                min="1900"
                max="2026"
                value={dobY}
                onChange={(e) => setDobY(e.target.value)}
                style={inputStyle}
              />
            </div>

            {dobError && (
              <div
                style={{
                  marginTop: "14px",
                  background: "rgba(224,56,74,0.10)",
                  border: "1px solid rgba(224,56,74,0.25)",
                  color: "#b31f34",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {dobErrorMsg}
              </div>
            )}

            <button
              onClick={submitAge}
              className="pw-cta"
              style={{
                width: "100%",
                marginTop: "22px",
                border: "none",
                borderRadius: "999px",
                padding: "16px",
                fontFamily: "inherit",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Verify &amp; continue
            </button>
            <div style={{ textAlign: "center", fontSize: "12px", color: "#9a9da3", marginTop: "16px", lineHeight: 1.5 }}>
              We use your date of birth only to verify eligibility. These statements have not been
              evaluated by the FDA.
            </div>
          </div>
        </div>
      )}

      {/* Checkout verified success */}
      {verified && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 111,
            background: "rgba(18,20,24,0.72)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={closeVerified}
        >
          <div
            onClick={stop}
            style={{
              background: "#F5F1E8",
              borderRadius: "26px",
              maxWidth: "420px",
              width: "100%",
              padding: "44px 40px",
              textAlign: "center",
              animation: "pwScale 0.4s ease both",
            }}
          >
            <div
              style={{
                width: "62px",
                height: "62px",
                borderRadius: "50%",
                background: "var(--acc,#9c7a2e)",
                color: "#16181D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 22px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: "26px",
                letterSpacing: "-0.02em",
                margin: "0 0 10px",
              }}
            >
              You're verified!
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#55585f", margin: "0 0 28px" }}>
              Your {discountPercent}% first-order discount is applied. You're all set to complete
              your order.
            </p>
            <button
              onClick={closeVerified}
              style={{
                width: "100%",
                border: "none",
                background: "#16181D",
                color: "#F5F1E8",
                borderRadius: "999px",
                padding: "15px",
                fontFamily: "inherit",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Continue to payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
