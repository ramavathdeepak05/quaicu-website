// Every word that appears on screen, in one place.
// Wording follows the live site (index.html, support.html, builds.html,
// trust.html). House style: plain, no hype words, no em dashes.

export const COPY = {
  hook: {
    eyebrow: "02:14 AM · Production",
    lines: ["Who approved", "that change?"],
    cmd: "deploy_to_production --env=prod",
    result: "shipped · approver:",
    none: "none",
  },

  tension: {
    white: ["AI can write", "the code."],
    grey: ["Someone still has", "to answer for it."],
    file: "engine · checkout_fix.ts",
    status: "Generating",
    flag: "No reviewer",
  },

  reveal: {
    word: "QUAICU",
    lines: ["Software you can", "answer for."],
    sub: "A person approves every change. Every action is on record.",
  },

  pipeline: {
    phrases: ["AI proposes.", "Rules enforce.", "Humans approve."],
    title: "Delivery Activity",
    badge: "Demo",
    newEvent: "New event",
    tabs: ["Stream", "Policies", "Approvals", "Ledger"],
    kpi: ["Proposed · 30d", "Blocked · policy", "Approved · ledgered"],
    cols: [
      { label: "AI Proposes", status: "LIVE" },
      { label: "Rules Enforce", status: "RING_0" },
      { label: "Humans Approve", status: "HITL" },
    ],
    health: "All systems operational",
    chain: "Hash-chained · Replay-safe",
  },

  ledger: {
    lines: ["Every action", "is on record."],
    flash: ["Every action", "on record."],
    kicker: "Hash-chained · Replay-safe",
  },

  offerings: {
    lines: ["Two ways to work", "with QUAICU."],
    support: {
      eyebrow: "01 · Engineering support",
      white: "Priced per ticket.",
      grey: "Pay for the work.",
      stages: ["Raised", "Engine", "Review", "Delivered"],
      ticket: "TCK-2041",
      done: "Delivered. Billed as one ticket.",
    },
    builds: {
      eyebrow: "02 · New platform builds",
      white: "Designed and delivered",
      grey: "with you.",
      stages: ["Design", "Build", "Launch"],
      stamp: "Reviewed",
    },
  },

  hub: {
    white: ["The engine does", "the lifting."],
    grey: ["People stay", "accountable."],
    kicker: "Nothing ships unchecked.",
    ring: "AI ENGINE",
    center: ["Relationship", "manager"],
  },

  proof: {
    eyebrow: "17.3850° N · 78.4867° E",
    lines: ["Built in Hyderabad,", "India."],
    label: "Part of",
    programs: ["NASSCOM DeepTech 2026", "T-Hub", "NVIDIA Inception", "Google for Startups"],
  },

  endcard: {
    eyebrow: "Governed software · Human-approved · Built in India",
    lines: ["Software you can", "answer for."],
    cta: "Talk to us",
    url: "quaicu.org",
  },

  chrome: {
    meta: "Human-approved · Fully recorded",
    place: "Hyderabad · India · NASSCOM DeepTech 2026",
    url: "quaicu.org",
  },
};
