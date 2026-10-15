// Zelios-style scenes for the QUAICU company introduction
// (marketing/company-video/plan.md). Same contract as scenes.js:
// build({ fmt, dur, opts }) -> { el, update(t), cues() }. Each scene lays
// itself out for 16:9 or 4:5 from fmt (CSS: .wide / .tall), takes its
// timing from the voice plan (opts.voAt / voDur), and uses wordAt() to land
// a beat on a given word. The booking app is the same app throughout: built
// by an AI tool (zprompt), taken live and broken (zapp), and running steadily
// at the end.

import { h, clamp, LOGO_SRC } from "../../lib.js";
import { E, tw, shiftOf, blurIn, richLine, scheduleLine, revealItem, cursor, ICON } from "./common.js";
import { sceneRoot, vo, textBlock } from "./scenes.js";

const says = (opts) => (opts.say == null ? [] : Array.isArray(opts.say) ? opts.say : [opts.say]);
const letters = (s) => s.replace(/[^a-z0-9]/gi, "").length;

// When a word of phrase k is spoken: its share of the phrase's letters is a
// good proxy for speech time. Returns fallback when there is no such phrase.
export function wordAt(opts, k, word, fallback) {
  const text = says(opts)[k];
  if (!text || !opts.voAt || opts.voAt.length <= k) return fallback;
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return fallback;
  const d = opts.voDur && opts.voDur[k] != null ? opts.voDur[k] : letters(text) / 14;
  return opts.voAt[k] + d * (letters(text.slice(0, i)) / Math.max(1, letters(text)));
}
const phraseDur = (opts, k, fallback) => (opts.voDur && opts.voDur[k] != null ? opts.voDur[k] : fallback);
const pulse = (t, at, d = 0.4) => (t > at && t < at + d ? Math.sin(((t - at) / d) * Math.PI) : 0);
const root = (fmt, opts, cls, bg) => {
  const r = sceneRoot({ bg, ...opts }, `${cls} ${fmt === "16x9" ? "wide" : "tall"}`);
  return { ...r, wide: fmt === "16x9" };
};
// A node's box inside an ancestor, in layout pixels (ignores transforms, so
// cursor paths stay right while the camera zooms or a card blurs in).
function posIn(node, anc) {
  let x = 0, y = 0, n = node;
  while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y, w: node.offsetWidth, h: node.offsetHeight };
}
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

// ---------------------------------------------------------------- the booking app
function bookingApp(parent, cls = "") {
  const el = h("div", `bapp zglass white ${cls}`);
  el.innerHTML = `
    <div class="bar"><i></i><i></i><i></i><span class="nm">Booking app</span><span class="pill"><b></b><span>Demo</span><i class="burst"></i></span></div>
    <div class="load"><b></b></div>
    <div class="body">
      <div class="ttl">Book a slot</div>
      <div class="days">${["Mon 13", "Tue 14", "Wed 15", "Thu 16", "Fri 17"].map((d, i) => `<span class="${i === 2 ? "on" : ""}">${d}</span>`).join("")}</div>
      <div class="times">${["10:00", "11:30", "14:00", "16:30"].map((d, i) => `<span class="${i === 1 ? "on" : ""}">${d}</span>`).join("")}</div>
      <div class="cta"><span>Confirm booking</span></div>
    </div>
    <div class="skel"><i></i><i></i><i></i><i></i><i></i></div>`;
  parent.append(el);
  const q = (s) => el.querySelector(s);
  return { el, pill: q(".pill"), burst: q(".pill .burst"), pillText: q(".pill span"), body: q(".body"), skel: q(".skel"), cta: q(".cta"), ctaText: q(".cta span"), load: q(".load"), loadBar: q(".load b"), times: q(".times") };
}

function setLive(app, on) {
  app.pill.classList.toggle("live", on);
  app.pillText.textContent = on ? "Live" : "Demo";
}

// A notification card: { icon, title, sub, tone: "bad" | "warn" | "good" }.
function toast(parent, { icon, title, sub, tone }) {
  const el = h("div", `ztoast zglass white ${tone}`, `<div class="k">${ICON[icon]}</div><div class="tx">${title}${sub ? `<small>${sub}</small>` : ""}</div>`);
  parent.append(el);
  return el;
}

// ---------------------------------------------------------------- 2. type it, get an app
const zprompt = {
  build({ fmt, dur, opts }) {
    const { el, bg } = root(fmt, opts, "zprompt", "light");
    const box = h("div", "prompt zglass white", `<div class="k">${ICON.sparkle}</div><div class="in"><span class="ph">${opts.placeholder || "Describe the app you want"}</span><span class="tx"></span></div><b class="go">${ICON.arrow}</b>`);
    el.append(box);
    const tx = box.querySelector(".tx"), ph = box.querySelector(".ph"), go = box.querySelector(".go");
    const app = bookingApp(el, "gen");
    const sparks = [0, 1, 2, 3].map((i) => {
      const s = h("div", `zspark s${i}`, ICON.sparkle);
      el.append(s);
      return s;
    });
    const text = opts.prompt || "Build me a booking app";
    const d0 = phraseDur(opts, 0, 3);
    const T = { type: vo(opts, 0, 0.1) + 0.15 };
    T.typeEnd = T.type + clamp(d0 * 0.3, 0.6, 1.1);
    T.send = T.typeEnd + 0.15;
    T.gen = T.send + 0.08;
    T.done = T.gen + 0.75;
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(box, te, 0, { dy: 30, s0: 0.96 });
        const n = Math.ceil(clamp((t - T.type) / (T.typeEnd - T.type)) * text.length);
        tx.textContent = text.slice(0, n);
        ph.style.display = n > 0 ? "none" : "";
        box.classList.toggle("typing", t >= T.type && t < T.send);
        go.style.transform = `scale(${(1 + 0.25 * pulse(t, T.send, 0.35)).toFixed(3)})`;
        // The app forms: a shimmering skeleton, then the real screen resolves.
        blurIn(app.el, t, T.gen, { dy: 40, s0: 0.9, d: 0.6 });
        const pr = tw(t, T.done - 0.2, 0.45);
        app.skel.style.opacity = (1 - pr).toFixed(3);
        app.body.style.opacity = pr.toFixed(3);
        app.skel.style.setProperty("--sheen", `${(((t - T.gen) * 140) % 260 - 80).toFixed(1)}%`);
        sparks.forEach((s, i) => {
          const at = T.gen + 0.15 + i * 0.13;
          const p = tw(t, at, 0.45), q = tw(t, at + 0.55, 0.45);
          s.style.opacity = (clamp(p * 2) * (1 - q)).toFixed(3);
          s.style.transform = `scale(${(0.3 + 0.9 * p).toFixed(3)}) rotate(${(p * 90).toFixed(1)}deg)`;
        });
      },
      cues: () => [{ t: T.type, type: "typing", n: text.length, cps: text.length / (T.typeEnd - T.type) }, { t: T.send, type: "pass" }, { t: T.done, type: "chime" }],
    };
  },
};

// ---------------------------------------------------------------- 3, 4, 11. the app: live, breaking, steady
const zapp = {
  build({ fmt, dur, opts }) {
    const state = opts.state || "live";
    const { el, bg, wide } = root(fmt, opts, `zappsc ${state}`, "light");
    // Full size, except in 4:5 where the breaking and steady app sit compact
    // so their notifications fit beneath them.
    const app = bookingApp(el, wide || state === "live" ? "big" : "");
    app.skel.style.display = "none";
    const shift = shiftOf(opts);
    const cap = opts.caption ? h("div", "cap") : null;
    let capBlock = null;
    if (cap) { el.append(cap); el.classList.add("has-cap"); capBlock = textBlock(cap, [opts.caption], opts, 0.1); }
    const stack = h("div", "stack");
    el.append(stack);
    const cues = [];
    let update = () => {};

    if (state === "live") {
      // "It looks great in the demo. Then you have to run it." The switch flips to Live on "Then",
      // so the bookings counter has time to climb before the cut.
      const stat = h("div", "stat zglass white", `<small>Bookings today</small><b>0</b><div class="spark"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`);
      stack.append(stat);
      const num = stat.querySelector("b"), bars = [...stat.querySelectorAll(".spark i")];
      const cur = cursor(el);
      const T = { live: Math.max(0.8, vo(opts, 1, dur * 0.45) + 0.25) };
      let path = null;
      cues.push({ t: T.live, type: "approve" });
      update = (t) => {
        if (!path) {
          setLive(app, false);
          const r = posIn(app.pill, el);
          const x = r.x + r.w * 0.5, y = r.y + r.h * 0.6;
          path = [{ t: T.live - 0.75, x: x + (wide ? 260 : 160), y: y + (wide ? 420 : 360) }, { t: T.live, x, y, click: true }, { t: T.live + 1.2, x: x + 40, y: y + 90 }];
        }
        setLive(app, t >= T.live);
        app.pill.style.transform = `scale(${(1 + 0.15 * pulse(t, T.live, 0.4)).toFixed(3)})`;
        const kb = clamp((t - T.live) / 0.7);
        app.burst.style.opacity = t >= T.live ? (1 - kb).toFixed(3) : 0;
        app.burst.style.transform = `scale(${(1 + 0.9 * E.quint(kb)).toFixed(3)})`;
        blurIn(stat, t, T.live + 0.15, { dy: 30, s0: 0.95 });
        const n = Math.floor(24 * E.quint(clamp((t - T.live - 0.2) / Math.max(0.8, dur - T.live - 0.6))));
        num.textContent = String(n);
        bars.forEach((b, i) => (b.style.transform = `scaleY(${(0.15 + 0.85 * tw(t, T.live + 0.25 + i * 0.07, 0.5) * [0.3, 0.45, 0.4, 0.6, 0.55, 0.8, 1][i]).toFixed(3)})`));
        cur.update(t, path);
      };
    }

    if (state === "break") {
      // One problem per phrase: it breaks, it slows down, nobody's sure it's secure.
      setLive(app, true);
      const items = [
        { icon: "alert", title: "Checkout failed", sub: "Bookings are not going through", tone: "bad" },
        { icon: "gauge", title: "Page is slow", sub: "Getting slower as traffic grows", tone: "warn" },
        { icon: "lock", title: "Security warning", sub: "Admin page is open to anyone", tone: "bad" },
      ];
      const spacing = Math.max(0.55, (dur - 0.9) / 3);
      const at = items.map((_, k) => vo(opts, k, 0.2 + k * spacing) + 0.15);
      const toasts = items.map((it) => toast(stack, it));
      at.forEach((a) => cues.push({ t: a, type: "alert" }));
      update = (t) => {
        toasts.forEach((e, k) => blurIn(e, t, at[k], { dx: wide ? 80 : 0, dy: wide ? 0 : 40, s0: 0.92, d: 0.55 }));
        // 1: the button fails. 2: the page stalls loading. 3: the light goes red.
        const broke = t >= at[0];
        app.cta.classList.toggle("err", broke);
        app.ctaText.textContent = broke ? "Something went wrong" : "Confirm booking";
        app.cta.style.transform = `translateX(${(10 * Math.sin(t * 60) * pulse(t, at[0], 0.35)).toFixed(1)}px)`;
        const slow = tw(t, at[1], 0.9, E.quint) * 0.72;
        app.load.style.opacity = t >= at[1] ? 1 : 0;
        app.loadBar.style.transform = `scaleX(${slow.toFixed(3)})`;
        app.times.style.opacity = t >= at[1] ? (0.45 + 0.15 * Math.sin(t * 8)).toFixed(3) : 1;
        app.pill.classList.toggle("bad", t >= at[2]);
        el.style.setProperty("--alarm", (0.6 * tw(t, at[0], 1.2) + 0.4 * tw(t, at[2], 0.8)).toFixed(3));
      };
    }

    if (state === "steady") {
      // Every check passing, and the project record still growing beside it.
      setLive(app, true);
      const ok = toast(stack, { icon: "check", title: "All checks passing", sub: "Bookings · Payments · Security", tone: "good" });
      const rec = h("div", "rec zglass white", `<div class="hd">${ICON.doc}<span>Project record</span></div><div class="rows"></div>`);
      stack.append(rec);
      const rows = [
        ["Reviewed", "Fix checkout timeout"],
        ["Logged", "Use a hosted checkout"],
        ["Reviewed", "Add booking reminders"],
        ["Logged", "Cache the slot list"],
        ["Reviewed", "Update the pricing page"],
      ].map(([k, txt]) => {
        const r = h("div", "row", `<b class="${k === "Reviewed" ? "rv" : "lg"}">${k}</b><span>${txt}</span>`);
        rec.querySelector(".rows").append(r);
        return r;
      });
      const T = { ok: vo(opts, 0, 0.2) + 0.2, rec: wordAt(opts, 0, "nothing", dur * 0.5) - 0.6 };
      const step = Math.max(0.3, (dur - T.rec - 0.6) / rows.length);
      cues.push({ t: T.ok, type: "chime" });
      update = (t) => {
        blurIn(ok, t, T.ok, { dx: wide ? 80 : 0, dy: wide ? 0 : 40, s0: 0.92 });
        blurIn(rec, t, T.rec, { dy: 40, s0: 0.95 });
        rows.forEach((r, i) => blurIn(r, t, T.rec + 0.3 + i * step, { dy: 16, d: 0.5 }));
      };
    }

    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(app.el, te, 0, { dy: 40, s0: 0.96 });
        if (capBlock) capBlock.update(te);
        update(t);
      },
      cues: () => cues,
    };
  },
};

// ---------------------------------------------------------------- 5. the code, and the question
const CODE = [
  "export async function createBooking(slot, user) {",
  "  const booking = await db.bookings.insert({",
  "    slot: slot.id,",
  "    user: user.id,",
  '    status: "confirmed",',
  "  });",
  '  await sendEmail(user.email, "Booking confirmed");',
  "  return booking;",
  "}",
];
const hl = (line) =>
  line
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/("[^"]*"?)/g, '<i class="s">$1</i>')
    .replace(/\b(export|async|function|const|await|return)\b/g, '<i class="k">$1</i>')
    .replace(/\b([a-zA-Z]+)(?=\()/g, '<i class="f">$1</i>');

const zcode = {
  build({ fmt, dur, opts }) {
    const { el, bg } = root(fmt, opts, "zcode", opts.bg || "aurora");
    const ed = h("div", "ed zglass", `<div class="tabs"><span class="on">booking.ts</span><span>${ICON.sparkle} AI tool</span></div><div class="code"></div>`);
    el.append(ed);
    const code = ed.querySelector(".code");
    const lines = CODE.map((_, i) => {
      const l = h("div", "zln" + (i === 1 ? " flag" : ""), `<em>${i + 1}</em><span></span>`);
      code.append(l);
      return l.querySelector("span");
    });
    const flag = code.children[1];
    const bub = h("div", "bub zglass white", `<div class="q">${ICON.help}<span>Is this right?</span></div><small>What if two people book the same slot?</small>`);
    el.append(bub);
    const total = CODE.join("").length;
    const T = { s: vo(opts, 0, 0.1), q: vo(opts, 1, dur * 0.5) + 0.15 };
    T.e = Math.min(T.q - 0.2, T.s + Math.max(1.2, phraseDur(opts, 0, 1.6) + 0.3));
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(ed, te, 0, { dy: 40, s0: 0.96 });
        // The tool writes fast: characters stream in, line by line.
        let n = Math.floor(clamp((t - T.s) / (T.e - T.s)) * total);
        CODE.forEach((src, i) => {
          const k = clamp(n, 0, src.length);
          n -= src.length;
          const done = k >= src.length;
          lines[i].innerHTML = hl(src.slice(0, k)) + (k > 0 && !done ? '<b class="caret"></b>' : "");
        });
        flag.classList.toggle("on", t >= T.q);
        blurIn(bub, t, T.q, { dy: 30, s0: 0.9 });
      },
      cues: () => [{ t: T.s, type: "typing", n: 40, cps: 40 / (T.e - T.s) }, { t: T.q, type: "block" }],
    };
  },
};

// ---------------------------------------------------------------- 6. the agency quote
const QUOTE = [
  ["Discovery workshop", 120000],
  ["Project management", 240000],
  ["Senior architect", 360000],
  ["Design and build", 850000],
  ["Change request #1", 110000],
  ["Change request #2", 95000],
];
const zinvoice = {
  build({ fmt, dur, opts }) {
    const { el, bg } = root(fmt, opts, "zinv", "light");
    const doc = h("div", "doc zglass white", `<div class="hd"><div><small>Agency quote</small>Booking app</div><span class="pill">Illustrative</span></div><div class="rows"></div><div class="tot"><span>Total</span><b>₹0</b></div>`);
    el.append(doc);
    const rows = QUOTE.map(([k, v]) => {
      const r = h("div", "row", `<span>${k}</span><b>${inr(v)}</b>`);
      doc.querySelector(".rows").append(r);
      return r;
    });
    const totEl = doc.querySelector(".tot b"), tot = doc.querySelector(".tot");
    const s = vo(opts, 0, 0.1);
    const step = Math.max(0.12, Math.min(0.24, (dur - s - 0.9) / QUOTE.length));
    const at = QUOTE.map((_, i) => s + 0.1 + i * step);
    const T = { pop: Math.max(at[at.length - 1] + 0.2, wordAt(opts, 0, "prices", dur * 0.7) - 0.05) };
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(doc, te, 0, { dy: 40, s0: 0.96 });
        let sum = 0;
        rows.forEach((r, i) => {
          blurIn(r, t, at[i], { dy: 14, d: 0.35 });
          sum += QUOTE[i][1] * tw(t, at[i] + 0.05, 0.35, E.quint);
        });
        totEl.textContent = inr(sum);
        tot.style.transform = `scale(${(1 + 0.08 * pulse(t, T.pop, 0.5)).toFixed(3)})`;
        tot.classList.toggle("hot", t >= T.pop);
      },
      cues: () => [...at.map((a) => ({ t: a, type: "tick" })), { t: T.pop, type: "stamp" }],
    };
  },
};

// ---------------------------------------------------------------- 7. QUAICU, in between
const zbetween = {
  build({ fmt, dur, opts }) {
    const { el, bg } = root(fmt, opts, "zbetween", opts.bg || "aurora");
    el.insertAdjacentHTML("beforeend", `
      <div class="track"><b></b><i class="tglow"></i></div>
      <div class="end l"><span class="dot"></span><div class="nm">AI tool</div><small>No engineering</small></div>
      <div class="end r"><span class="dot"></span><div class="nm">Agency</div><small>Agency prices</small></div>
      <div class="mid"><div class="pillq zglass"><img src="${LOGO_SRC}" alt=""><span>QUAICU</span></div></div>`);
    const q = (s) => el.querySelector(s);
    const BR = (flip) => `<svg viewBox="0 0 60 300" width="60" height="300" style="transform:scaleX(${flip ? -1 : 1})"><path d="M56 4C30 4 26 18 26 42V122C26 138 18 146 4 150C18 154 26 162 26 178V258C26 282 30 296 56 296" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`;
    const bl = h("div", "brace l", BR(false)), br = h("div", "brace r", BR(true));
    q(".mid").append(bl, br);
    const track = q(".track b"), glow = q(".track .tglow"), ends = [q(".end.l"), q(".end.r")], pill = q(".pillq");
    const T = { land: Math.max(0.5, wordAt(opts, 0, "QUAICU", 0.6) - 0.15) };
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        track.style.transform = `scaleX(${tw(te, 0, 0.8, E.io).toFixed(4)})`;
        ends.forEach((e, i) => blurIn(e, te, 0.1 + i * 0.12, { dy: 20 }));
        blurIn(pill, t, T.land, { dy: 120, s0: 0.7, d: 0.7 });
        const pb = tw(t, T.land + 0.35, 0.6, E.expo);
        const gap = 70 * (1 - pb);
        bl.style.transform = `translateX(${(-gap).toFixed(1)}px)`;
        br.style.transform = `translateX(${gap.toFixed(1)}px)`;
        bl.style.opacity = br.style.opacity = clamp(pb * 1.5).toFixed(3);
        glow.style.opacity = tw(t, T.land + 0.2, 0.6).toFixed(3);
        ends.forEach((e) => (e.style.opacity = (Number(e.style.opacity || 1) * (1 - 0.35 * tw(t, T.land + 0.3, 0.6))).toFixed(3)));
      },
      cues: () => [{ t: T.land, type: "swell" }, { t: T.land + 0.35, type: "impact" }],
    };
  },
};

// ---------------------------------------------------------------- 8. AI does the work, the cost stays low
const TASKS = ["Set up the booking database", "Build the booking flow", "Add payments", "Write the tests", "Prepare the release"];
const zqueue = {
  build({ fmt, dur, opts }) {
    const { el, bg } = root(fmt, opts, "zqueue", "light");
    const panel = h("div", "panel zglass white", `<div class="hd">${ICON.sparkle}<span>Work queue</span><em>AI at work</em></div><div class="rows"></div>`);
    el.append(panel);
    const rows = TASKS.map((txt) => {
      const r = h("div", "row", `<div class="st"><i class="spin"></i>${ICON.check}</div><span>${txt}</span>`);
      panel.querySelector(".rows").append(r);
      return r;
    });
    const cost = h("div", "cost zglass white", `<div class="hd"><span>Cost</span><span class="pill">Illustrative</span></div>
      <div class="bar a"><small>Agency</small><div class="tr"><b></b></div></div>
      <div class="bar q"><small>QUAICU</small><div class="tr"><b></b></div></div>`);
    el.append(cost);
    const ba = cost.querySelector(".bar.a b"), bq = cost.querySelector(".bar.q b");
    const s = vo(opts, 0, 0.1);
    const step = Math.max(0.22, Math.min(0.45, (dur - s - 0.8) / TASKS.length));
    const done = TASKS.map((_, i) => s + 0.35 + i * step);
    const T = { bars: Math.max(s + 0.4, wordAt(opts, 0, "pay", dur * 0.55) - 0.35) };
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(panel, te, 0, { dy: 40, s0: 0.96 });
        rows.forEach((r, i) => {
          blurIn(r, te, 0.1 + i * 0.05, { dy: 14 });
          const active = t >= (i ? done[i - 1] : s) && t < done[i];
          r.classList.toggle("act", active);
          r.classList.toggle("ok", t >= done[i]);
          r.querySelector(".spin").style.transform = `rotate(${(t * 540).toFixed(0)}deg)`;
        });
        blurIn(cost, te, 0.25, { dy: 40, s0: 0.96 });
        ba.style.transform = `scaleX(${tw(t, T.bars, 0.7, E.io).toFixed(4)})`;
        bq.style.transform = `scaleX(${(0.42 * tw(t, T.bars + 0.35, 0.7, E.io)).toFixed(4)})`;
      },
      cues: () => [...done.map((d) => ({ t: d, type: "tick" })), { t: T.bars + 0.35, type: "approve" }],
    };
  },
};

// ---------------------------------------------------------------- 9. engineers make the calls
const CALLS = [
  { icon: "layers", title: "How it's built", word: "built" },
  { icon: "shield", title: "How it's secured", word: "secured" },
  { icon: "trend", title: "How it grows", word: "grows" },
];
const zdecide = {
  build({ fmt, dur, opts }) {
    const { el, bg, wide } = root(fmt, opts, "zdecide", opts.bg || "light");
    const eb = h("div", "eb", opts.eyebrow || "Decided by experienced engineers");
    el.append(eb);
    const row = h("div", "cards");
    el.append(row);
    const cards = CALLS.map((c) => {
      const e = h("div", "card zglass white", `<div class="ic">${ICON[c.icon]}</div><div class="tt">${c.title}</div><div class="ap"><span class="b">Approve</span><span class="d">${ICON.check} Approved</span><span class="who">${ICON.user} Engineer</span></div>`);
      row.append(e);
      return { e, ap: e.querySelector(".ap"), btn: e.querySelector(".ap .b") };
    });
    const cur = cursor(el);
    const s = vo(opts, 0, 0.1);
    const fb = (i) => s + 0.9 + i * Math.max(0.5, (dur - s - 1.4) / 3);
    const click = CALLS.map((c, i) => Math.max(s + 0.6 + i * 0.4, wordAt(opts, 1, c.word, fb(i)) - 0.12));
    const shift = shiftOf(opts);
    let path = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(eb, te, 0, { dy: 14 });
        // Measure the buttons once, while they are showing (a render can
        // start mid-scene, after some cards have already switched).
        if (!path) {
          cards.forEach((c) => { c.ap.classList.remove("done"); c.e.classList.remove("done"); });
          path = [];
          cards.forEach((c, i) => {
            const r = posIn(c.btn, el);
            const x = r.x + r.w * 0.5, y = r.y + r.h * 0.55;
            if (i === 0) path.push({ t: click[0] - 0.7, x: x + (wide ? 160 : 260), y: y + (wide ? 220 : 120) });
            else path.push({ t: click[i] - 0.45, x, y: y + (wide ? 0 : -20) });
            path.push({ t: click[i], x, y, click: true });
          });
        }
        cards.forEach((c, i) => {
          blurIn(c.e, te, 0.1 + i * 0.1, { dy: 50, s0: 0.94 });
          c.ap.classList.toggle("done", t >= click[i]);
          c.e.classList.toggle("done", t >= click[i]);
          c.btn.style.transform = `scale(${(1 - 0.08 * pulse(t, click[i] - 0.05, 0.2)).toFixed(3)})`;
        });
        cur.update(t, path);
      },
      cues: () => click.map((c) => ({ t: c, type: "approve" })),
    };
  },
};

// ---------------------------------------------------------------- 10. governance at the core, and the programmes
const PROGS = [
  { name: "NASSCOM DeepTech", sub: "2026 cohort", word: "NASSCOM" },
  { name: "NVIDIA Inception", sub: "Member", word: "NVIDIA" },
  { name: "Google for Startups", sub: "Supported by", word: "Google" },
  { name: "T-Hub", sub: "Supported by", word: "T-Hub" },
];
const zcore = {
  build({ fmt, dur, opts }) {
    const { el, bg, wide } = root(fmt, opts, "zcore", opts.bg || "aurora");
    const [W, H] = wide ? [1920, 1080] : [1080, 1350];
    const C = wide ? { x: 960, y: 470 } : { x: 540, y: 690 };
    // Card boxes: two on each side (16:9), or two above and two below (4:5,
    // with the caption at the top so no link crosses it).
    const box = wide
      ? [{ x: 130, y: 250 }, { x: 1340, y: 250 }, { x: 130, y: 590 }, { x: 1340, y: 590 }].map((b) => ({ ...b, w: 450, h: 150 }))
      : [{ x: 70, y: 280 }, { x: 570, y: 280 }, { x: 70, y: 1000 }, { x: 570, y: 1000 }].map((b) => ({ ...b, w: 440, h: 150 }));
    const R = wide ? 150 : 140;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "links");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    el.append(svg);
    const anchor = (b) => (wide ? { x: b.x < C.x ? b.x + b.w : b.x, y: b.y + b.h / 2 } : { x: b.x + b.w / 2, y: b.y < C.y ? b.y + b.h : b.y });
    const links = box.map((b) => {
      const a = anchor(b);
      const ang = Math.atan2(a.y - C.y, a.x - C.x);
      const s0 = { x: C.x + Math.cos(ang) * (R + 26), y: C.y + Math.sin(ang) * (R + 26) };
      const mx = wide ? (s0.x + a.x) / 2 : s0.x, my = wide ? s0.y : (s0.y + a.y) / 2;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", `M${s0.x.toFixed(1)},${s0.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${a.x.toFixed(1)},${a.y.toFixed(1)}`);
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "7");
      svg.append(p, dot);
      return { p, dot };
    });
    const core = h("div", "core", `
      <svg viewBox="-200 -200 400 400"><circle class="r3" r="${R + 26}"/><circle class="r2" r="${R}"/><circle class="r1" r="${R - 34}"/></svg>
      <div class="disc"><img src="${LOGO_SRC}" alt=""></div>`);
    core.style.left = `${C.x}px`;
    core.style.top = `${C.y}px`;
    el.append(core);
    const rings = [...core.querySelectorAll("circle")];
    const capEl = h("div", "cap");
    capEl.style.top = wide ? `${C.y + R + 70}px` : "150px";
    el.append(capEl);
    const cap = textBlock(capEl, [opts.caption || "Built on *AI governance*"], {}, 0);
    const cards = PROGS.map((p, i) => {
      const e = h("div", "prog zglass", `<small>${p.sub}</small><b>${p.name}</b>`);
      Object.assign(e.style, { left: `${box[i].x}px`, top: `${box[i].y}px`, width: `${box[i].w}px`, height: `${box[i].h}px` });
      el.append(e);
      return e;
    });
    const s = vo(opts, 0, 0.1);
    const fb = (i) => s + 1.6 + i * 0.7;
    const at = PROGS.map((p, i) => Math.max(s + 0.9 + i * 0.25, wordAt(opts, 1, p.word, fb(i)) - 0.35));
    const shift = shiftOf(opts);
    let lens = null;
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        if (!lens) lens = links.map((l) => l.p.getTotalLength());
        // The core assembles: rings draw in around the mark.
        rings.forEach((r, i) => {
          const L = 2 * Math.PI * Number(r.getAttribute("r"));
          r.style.strokeDasharray = i === 0 ? "4 14" : `${L}`;
          r.style.strokeDashoffset = i === 0 ? `${(-t * 30).toFixed(1)}` : `${(L * (1 - tw(te, s + 0.1 * i, 1.1, E.io))).toFixed(1)}`;
          r.style.opacity = tw(te, s + 0.1 * i, 0.6).toFixed(3);
        });
        blurIn(core.querySelector(".disc"), te, s, { dy: 0, s0: 0.6, d: 0.8 });
        cap.update(te - s - 0.35);
        links.forEach((l, i) => {
          const p = tw(t, at[i] - 0.25, 0.5, E.io);
          l.p.style.strokeDasharray = `${lens[i]}`;
          l.p.style.strokeDashoffset = `${(lens[i] * (1 - p)).toFixed(1)}`;
          // A light pulse runs out to each card, then keeps travelling.
          const k = ((t - at[i]) / 1.6) % 1;
          const pt = l.p.getPointAtLength(lens[i] * (t >= at[i] ? k : p));
          l.dot.setAttribute("cx", pt.x.toFixed(1));
          l.dot.setAttribute("cy", pt.y.toFixed(1));
          l.dot.style.opacity = p > 0 && p < 1 ? 1 : t >= at[i] ? (0.9 * Math.sin(k * Math.PI)).toFixed(3) : 0;
          blurIn(cards[i], t, at[i], { dy: 0, dx: box[i].x < C.x ? -30 : 30, s0: 0.92, d: 0.6 });
          cards[i].classList.toggle("lit", t >= at[i] + 0.2);
        });
        core.style.setProperty("--lit", (at.filter((a) => t >= a).length / at.length).toFixed(2));
      },
      cues: () => [{ t: s, type: "swell" }, ...at.map((a) => ({ t: a, type: "pass" }))],
    };
  },
};

// ---------------------------------------------------------------- 10b. the project record
const RECORD = [
  { k: "Change", txt: "Fix checkout timeout", who: "Engineer · 10:40" },
  { k: "Change", txt: "Add booking reminders", who: "Engineer · 11:15" },
  { k: "Decision", txt: "Use a hosted checkout for payments", who: "Engineer · 11:30" },
  { k: "Change", txt: "Speed up the slot list", who: "Engineer · 14:05" },
  { k: "Decision", txt: "Keep admin pages behind sign-in", who: "Engineer · 14:20" },
];
const zrecord = {
  build({ fmt, dur, opts }) {
    const { el, bg } = root(fmt, opts, "zrecord", "light");
    const panel = h("div", "panel zglass white", `<div class="hd">${ICON.doc}<span>Project record</span><em>${ICON.lock} Can't be edited</em></div><div class="rows"></div>`);
    el.append(panel);
    const rows = RECORD.map((r) => {
      const e = h("div", "row", `<span class="k ${r.k === "Change" ? "chg" : "dec"}">${r.k}</span><span class="tx">${r.txt}<small>${r.who}</small></span><span class="st"><i class="pend">Pending</i><i class="ok">${ICON.check} ${r.k === "Change" ? "Reviewed" : "Logged"}</i></span>`);
      panel.querySelector(".rows").append(e);
      return e;
    });
    const s = vo(opts, 0, 0.1);
    const step = Math.max(0.25, Math.min(0.5, (dur - s - 1) / RECORD.length));
    const show = RECORD.map((_, i) => s + 0.2 + i * step);
    const rv = wordAt(opts, 0, "reviewed", dur * 0.35), wr = wordAt(opts, 0, "written", dur * 0.7);
    const stamp = RECORD.map((r, i) => Math.max(show[i] + 0.35, (r.k === "Change" ? rv : wr) + i * 0.06));
    const shift = shiftOf(opts);
    return {
      el,
      update(t) {
        const te = t + shift;
        bg.update(t);
        blurIn(panel, te, 0, { dy: 40, s0: 0.96 });
        rows.forEach((e, i) => {
          blurIn(e, t, show[i], { dy: 18, d: 0.5 });
          e.classList.toggle("done", t >= stamp[i]);
          e.querySelector(".ok").style.transform = `scale(${(1 + 0.12 * pulse(t, stamp[i], 0.35)).toFixed(3)})`;
        });
      },
      cues: () => stamp.map((a) => ({ t: a, type: "stamp" })),
    };
  },
};

export const COMPANY_SCENES = { zprompt, zapp, zcode, zinvoice, zbetween, zqueue, zdecide, zcore, zrecord };
