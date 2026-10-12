// Every word that appears on screen, and the voiceover script, in one place.
// Audience: small and medium businesses that need custom software,
// integrations (SAP, Salesforce and the rest) or AI workflows. House style:
// plain, no hype words, no em dashes.

export const COPY = {
  hook: {
    // 60s: three lines that land with the voiceover
    lines: ["Orders in Salesforce.", "Invoices in SAP.", "Your team, in between."],
    // 30s and 15s: one question
    question: ["Still copying data", "between SAP and Salesforce?"],
    left: { app: "Salesforce", view: "Opportunities" },
    right: { app: "SAP", view: "Billing documents" },
    rows: [
      ["Order #4821", "Mehta Retail", "₹4,82,000"],
      ["Order #4822", "Northwind Clinics", "₹1,16,500"],
      ["Order #4823", "Skyline Homes", "₹9,40,000"],
      ["Order #4824", "Apex Supplies", "₹62,300"],
      ["Order #4825", "Blue Lotus Foods", "₹2,08,900"],
    ],
    counter: "Copied by hand today",
  },

  tension: {
    white: ["Everyone wants", "AI now."],
    grey: ["Who checks", "what it does?"],
    agent: "AI agent · autopilot",
    actions: [
      "Updated 214 price records",
      "Emailed 1,180 customers",
      "Changed discount rules",
      "Deleted 36 duplicate accounts",
    ],
    approver: "approved by:",
    none: "none",
  },

  reveal: {
    eyebrow: "Introducing",
    word: "QUAICU",
    lines: {
      "16x9": ["Custom software, integrations", "and AI workflows."],
      "9x16": ["Custom software,", "integrations and", "AI workflows."],
    },
    sub: "For small and medium businesses.",
  },

  dash: {
    num: "01",
    eyebrow: "Custom software",
    title: ["Dashboards built around your business."],
    title9: ["Dashboards built", "around your business."],
    short: "Dashboards.",
  },

  live: {
    lines: ["Every number, live.", "Every change, approved."],
    stamp: "Approved",
  },

  connect: {
    num: "02",
    eyebrow: "Integrations",
    title: ["Your systems,", "finally in sync."],
    short: "Integrations.",
    systems: ["SAP", "Salesforce", "Zoho", "Tally", "HubSpot", "QuickBooks", "WhatsApp Business"],
    any: "Any official API",
    log: [
      ["Salesforce", "Deal won · #4821"],
      ["SAP", "Sales order 1100482 created"],
      ["QuickBooks", "Invoice INV-2207 sent"],
      ["WhatsApp", "Customer notified"],
    ],
    approval: "Field mapping change · approved by Lead",
  },

  automate: {
    num: "03",
    eyebrow: "AI workflows",
    title: ["AI that clears", "the busywork."],
    short: "AI workflows.",
    steps: [
      { k: "Email", v: "invoice_4821.pdf" },
      { k: "AI reads", fields: [["Vendor", "Apex Supplies"], ["Amount", "₹4,82,000"], ["PO", "PO-1189"]] },
      { k: "Rule", v: "Over ₹2,00,000 needs approval" },
      { k: "Finance lead", v: "Approve" },
      { k: "SAP", v: "Posted" },
    ],
    examples: [
      "Lead follow-up in Salesforce",
      "Support ticket triage",
      "Weekly sales reports",
      "Real estate: site-visit follow-ups",
      "Clinics: patient intake summaries",
    ],
  },

  pipeline: {
    phrases: ["AI proposes.", "Rules enforce.", "Humans approve."],
    after: ["Every change signed off.", "Every action on record."],
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

  engage: {
    lines: ["Start with one ticket,", "or a full build."],
    support: {
      eyebrow: "Support",
      white: "Priced per ticket.",
      grey: "Pay for the work.",
      stages: ["Raised", "Engine", "Review", "Delivered"],
      ticket: "TCK-2041",
      done: "Delivered. Billed as one ticket.",
    },
    builds: {
      eyebrow: "New builds",
      white: "Scoped and delivered",
      grey: "with you.",
      stages: ["Design", "Build", "Launch"],
      stamp: "Reviewed",
    },
    rm: "One relationship manager",
  },

  endcard: {
    eyebrow: "Built in Hyderabad · NASSCOM DeepTech 2026",
    lines: ["Software you can", "answer for."],
    sub: "Custom software · Integrations · AI workflows",
    cta: "Talk to us",
    url: "quaicu.org",
  },

  thumb: {
    eyebrow: "Introducing QUAICU",
    lines: ["Custom software.", "Integrations.", "AI workflows."],
    tag: "Approved by people",
  },

  chrome: {
    meta: "Human-approved · Fully recorded",
    place: "Hyderabad · India · NASSCOM DeepTech 2026",
    url: "quaicu.org",
    marquee: ["Custom software", "Integrations", "AI workflows", "Human-approved"],
  },
};

// Voiceover script, line by line, as generated (MiniMax Speech 2.8 HD,
// voice Determined_Man). "QUAICU" is spoken "Kwai-koo". Captions use these.
export const VO = {
  60: [
    "Orders in Salesforce. Invoices in SAP. Your team, copying data in between.",
    "Everyone wants AI now. But who checks what it does?",
    "Introducing QUAICU.",
    "Custom software, built around how your business works. Portals, dashboards, internal tools.",
    "Integrations with SAP, Salesforce, Zoho, Tally, HubSpot, QuickBooks, WhatsApp, or anything with an official API.",
    "AI workflows that clear the busywork. Invoices, leads, support, reports. For real estate, clinics, and more.",
    "AI proposes. Rules enforce. Humans approve. A person signs off every change, and every action is on record.",
    "Start with one ticket, or a full build. One relationship manager. You pay for the work.",
    "QUAICU. Software you can answer for. Talk to us at quaicu.org.",
  ],
  30: [
    "Still copying data between SAP and Salesforce?",
    "Introducing QUAICU.",
    "Custom software, built around your business.",
    "Integrations with SAP, Salesforce, Zoho, Tally, or any official API.",
    "AI workflows for invoices, leads, and support.",
    "AI proposes, rules enforce, and a person approves every change.",
    "QUAICU. Software you can answer for. Talk to us at quaicu.org.",
  ],
};
