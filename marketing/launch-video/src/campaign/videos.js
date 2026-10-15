// Month Twelve: the 24 LinkedIn campaign videos, as data.
//
// Source of truth for the words is marketing/linkedin-campaign/video-briefs.md;
// keep the two in step. Each scene is [template, beats, opts] at 120 BPM
// (1 beat = 0.5s). Every video totals 60 beats (30s) except V24 (90 beats).
// The first scene of each video is rendered already complete, so the hook is
// readable on frame 0. House style: plain words, no hype, no em dashes.
//
// say (on any scene) is its narration: a string, or one phrase per beat of
// the scene (carousel card, chart line, text line...). Scenes with say are
// timed voice-first (src/campaign/timing.js): each lasts as long as its
// phrases, so narration runs without gaps, and the scene gets opts.voAt so
// its animation lands with the words. min sets a minimum length (s).
//
// style: "z" marks the Zelios-style videos (src/campaign/z/): glass UI,
// luminous light, blur-in type, overlapping transitions (opts.enter).
//
// fill: true marks a video that still contains [FILL] placeholders; the
// renderer refuses it unless --allow-fill is passed.

const END = ["endcard", 8, {}];
// End card with the spoken sign-off (voice-first videos).
const END_SAY = ["endcard", 8, { say: "QUAICU. Software service that doesn\u2019t fade." }];

export const VIDEOS = {
  // V01-V04: Zelios style, voice-first, 15-20s each. Beat counts are
  // ignored for scenes with say (they last as long as their narration).
  V01: {
    title: "Agencies are best in month one",
    style: "z",
    scenes: [
      ["zt", 6, { lines: ["Most agencies are at", "their best in *month one.*"], size: "l", seed: 1, say: "Most agencies are at their best in month one." }],
      ["zchart", 20, {
        bg: "photo:pexels-harshit-mehta-2161164138-37260298.webp", blur: 6, grid: true,
        callouts: [{ m: 4, text: "New faces" }, { m: 7, text: "Demos stop" }, { m: 10, text: "Dates slip" }],
        caption: "With QUAICU, the line *stays flat.*",
        say: ["Then new faces arrive, demos stop, and dates start to slip.", "With QUAICU, the line stays flat, month after month."],
        min: 5.8,
      }],
      ["zcon", 10, {
        bg: "light", enter: "zoom",
        captions: ["Your engineer *stays.*", "Your AI agent *never forgets.*"],
        say: ["Your engineer stays with you,", "and our AI agent never forgets a step."],
        min: 4,
      }],
      ["zt", 8, { bg: "photo:pexels-imvitordiniz-20336862.webp", tone: "light", lines: ["Judge a vendor on", "*month twelve.*"], size: "xl", say: "Judge a vendor on month twelve." }],
      ["endcard", 8, { enter: "mask", enterDur: 0.8, say: "QUAICU. Software service that doesn\u2019t fade." }],
    ],
  },

  V02: {
    title: "The team that pitched you",
    style: "z",
    scenes: [
      ["zmyth", 16, {
        bg: "photo:pexels-minimoy-35757487.webp", tone: "light", blur: 4,
        myth: "The team that pitched you is the team that stays.",
        reality: "Senior people win the deal, then *move on.*",
        say: ["Myth: the team that pitched you is the team that stays.", "Reality: senior people win the deal, then move on."],
      }],
      ["zvs", 12, {
        seed: 2, enter: "push",
        a: { when: "Month 1", what: "The senior team" }, b: { when: "Month 6", what: "Whoever is free" },
        say: ["Month one, you get the senior team.", "By month six, whoever is free."],
      }],
      ["zteam", 12, {
        bg: "photo:pexels-jakobjin-14452236.webp", blur: 5, enter: "zoom",
        role: "Forward deployed engineer", name: "One engineer, week one to month twelve",
        say: ["With QUAICU, one forward deployed engineer stays with you,", "from week one to month twelve."],
        min: 4.5,
      }],
      END_SAY,
    ],
  },

  V03: {
    title: "6 signs your vendor is slipping",
    style: "z",
    scenes: [
      ["zt", 6, { lines: ["6 signs your vendor", "is *starting to slip*"], size: "l", seed: 4, say: "Six signs your vendor is starting to slip." }],
      ["zcar", 30, {
        seed: 2, enter: "zoom", label: "Is your vendor slipping?",
        items: [
          { icon: "video", text: "Status calls, no demos" },
          { icon: "swap", text: "A new name every month" },
          { icon: "clock", text: "\u201CNext week\u201D for everything" },
          { icon: "chat", text: "Replies take a day, not an hour" },
          { icon: "bug", text: "Old bugs come back" },
          { icon: "receipt", text: "Invoices you can\u2019t match to work" },
        ],
        say: ["Status calls, but no demos.", "A new name every month.", "Next week, for everything.", "Replies take a day, not an hour.", "Old bugs come back.", "Invoices you can\u2019t match to work."],
      }],
      ["zt", 8, { bg: "light", grid: true, enter: "mask", lines: ["One is a bad week.", "*Three is a pattern.*"], size: "l", say: ["One is a bad week.", "Three is a pattern."] }],
      END_SAY,
    ],
  },

  V04: {
    title: "Code held hostage",
    style: "z",
    scenes: [
      ["zquote", 10, {
        bg: "photo:pexels-rrodriguesim-16960661.webp", blur: 5,
        quote: "Trying to hold my software and code hostage.", name: "A software buyer", source: "From a buyer review",
        say: "From a buyer review: trying to hold my software and code hostage.",
        min: 3.4,
      }],
      ["zt", 6, { seed: 3, lines: ["It happens when", "the vendor [[key|Admin]]", "*owns the accounts.*"], size: "l", say: "It happens when the vendor owns the accounts." }],
      ["zstack", 18, {
        bg: "photo:pexels-imvitordiniz-20336862.webp", tone: "light", enter: "push",
        eyebrow: "Ownership", title: "In your name from day one",
        items: [{ icon: "code", text: "Code repository" }, { icon: "globe", text: "Domain" }, { icon: "cloud", text: "Hosting and cloud" }, { icon: "grid", text: "App store accounts" }],
        before: "In the vendor\u2019s name", after: "In your name",
        say: ["Keep your code,", "your domain,", "your hosting,", "and your app store accounts in your name."],
        min: 5,
      }],
      ["zt", 8, { seed: 5, enter: "zoom", lines: ["Your vendor gets access.", "*You keep ownership.*"], size: "l", say: ["Your vendor gets access.", "You keep ownership."] }],
      END_SAY,
    ],
  },

  V05: {
    title: "10 to 15% of pilots reach production",
    scenes: [
      ["statdrop", 14, { value: "10–15%", label: "of GenAI proofs of concept in India reach full production", source: "Source: NASSCOM" }],
      ["checklist", 28, { title: "Why pilots stall", items: ["No owner after the demo", "Sample data, not real data", "No one approves the output", "No agreed measure of success"] }],
      ["kinetic", 10, { lines: ["Not a model problem.", { text: "A delivery problem.", dim: true }] }],
      END,
    ],
  },

  V06: {
    title: "Your forward deployed engineer",
    scenes: [
      ["kinetic", 8, { lines: ["Every client gets a", { text: "forward deployed engineer.", dim: true }], size: "m" }],
      ["orbit", 12, { center: "Your<br>engineer", ring: "AI AGENT", captions: ["Knows your business", "Works in your tools", "On site when needed"] }],
      ["stages", 24, {
        stages: [
          { name: "Raised", sub: "You tell your engineer" },
          { name: "Engine", sub: "Our AI agent does the repeatable work" },
          { name: "Review", sub: "Your engineer signs it off" },
          { name: "Delivered", sub: "You get the change and the record" },
        ],
      }],
      ["kinetic", 8, { lines: ["Same engineer. Same four steps.", { text: "Ticket 1 or ticket 500.", dim: true }], size: "m" }],
      END,
    ],
  },

  V07: {
    title: "Judge a vendor on month twelve",
    scenes: [
      ["kinetic", 20, { lines: ["Month one shows the sales team.", { text: "Month twelve shows the delivery.", dim: true }], size: "m" }],
      ["kinetic", 16, { lines: ["In a reference call, don’t ask", { text: "“Were you happy?”", dim: true }], size: "m" }],
      ["kinetic", 10, { lines: ["Ask what changed", "by month twelve."], size: "l" }],
      ["kinetic", 6, { badge: { k1: "MONTH TWELVE", k2: "A new series" } }],
      END,
    ],
  },

  V08: {
    title: "2:14 AM: production breaks",
    scenes: [
      ["alert", 8, {
        eyebrow: "02:14 AM · Production",
        lines: ["Production is down.", { text: "What happens next?", dim: true }],
        term: ["status checkout-api", "!503 · Service unavailable", "#alert raised · 02:14:07"],
      }],
      ["checklist", 14, {
        ladder: { head: "Minor bug", steps: ["AI agent prepares the fix", { text: "A person approves it", sub: "Your engineer, or on-call when they’re away" }] },
        caption: "Your engineer decides what counts as minor or major.",
      }],
      ["checklist", 20, {
        ladder: { head: "Major issue", tone: "alert", steps: ["AI alerts your engineer", "Unavailable? Next available engineer", "Or our internal team", "Taken over"] },
      }],
      ["kinetic", 10, { lines: ["Nobody waits until Monday", { text: "because one person was offline.", dim: true }], size: "m" }],
      END,
    ],
  },

  V09: {
    title: "Pilot to production, part 1",
    scenes: [
      ["kinetic", 8, { eyebrow: "Part 1 of 2", lines: ["Pilot to production"], size: "xl" }],
      ["checklist", 38, { numbered: true, items: ["One owner who stays after the demo", "Real data, with the real mess", "Decide who approves the output", "Agree success before you build"] }],
      ["kinetic", 6, { lines: ["Steps 5–8 on Thursday"], size: "m" }],
      END,
    ],
  },

  V10: {
    title: "Pilot to production, part 2",
    scenes: [
      ["kinetic", 8, { eyebrow: "Part 2 of 2", lines: ["Pilot to production"], size: "xl" }],
      ["checklist", 36, { numbered: true, start: 5, items: ["Track running cost from day one", "One team first, then everyone", "Review output weekly", "Hand over so you can run it"] }],
      ["kinetic", 8, { lines: ["This is where most pilots", { text: "quietly die.", dim: true }] }],
      END,
    ],
  },

  V11: {
    title: "Consistency, not just speed",
    scenes: [
      ["kinetic", 8, { lines: ["AI makes teams faster.", { text: "That’s not the point.", dim: true }] }],
      ["slide", 36, { variant: "speed", greenAt: 10.5, caption: "AI agent: same checks on day 300. Your engineer: free for judgement." }],
      ["kinetic", 8, { lines: ["Fast in month one is easy.", { text: "Same in month twelve is the job.", dim: true }], size: "m" }],
      END,
    ],
  },

  V12: {
    title: "4 data questions for offshore vendors",
    scenes: [
      ["kinetic", 8, { lines: ["4 data questions for", { text: "any offshore vendor", dim: true }] }],
      ["checklist", 32, { numbered: true, items: ["Where is our data stored?", "Who can access it from abroad?", "Does your AI train on our content?", "Can it run on our cloud?"] }],
      ["kinetic", 12, {
        lines: ["In Saudi Arabia, remote access from abroad", { text: "counts as a data transfer.", dim: true }],
        size: "m",
        source: "Source: Saudi PDPL · not legal advice",
      }],
      END,
    ],
  },

  V13: {
    title: "Per-ticket means rushed?",
    scenes: [
      ["myth", 14, { myth: "Per-ticket pricing means rushed tickets." }],
      ["checklist", 26, { title: "Reality, if it’s done right", items: ["Ticket size agreed first", "Your engineer signs off every delivery", "Every action recorded"] }],
      ["kinetic", 12, { lines: ["You pay for the work.", { text: "The review proves it’s done.", dim: true }] }],
      END,
    ],
  },

  V14: {
    title: "Banning ChatGPT doesn't work",
    scenes: [
      ["kinetic", 10, { lines: ["Banning ChatGPT doesn’t stop", "people using it."] }],
      ["kinetic", 8, { lines: [{ text: "It moves to personal phones.", dim: true }] }],
      ["checklist", 26, { title: "Write one page instead", items: ["Approved tools", "Data that never goes in", "Company accounts only", "Who to ask"] }],
      ["kinetic", 8, { lines: ["One page people read", { text: "beats a ban nobody follows.", dim: true }], size: "m" }],
      END,
    ],
  },

  V15: {
    title: "When a chatbot needs a human",
    scenes: [
      ["quotecard", 14, { quote: "Responsible for all the information on its website.", attribution: "Tribunal ruling · Air Canada chatbot case" }],
      ["kinetic", 8, { lines: ["Your chatbot speaks", { text: "for your company.", dim: true }] }],
      ["checklist", 22, { title: "Where a person must decide", items: ["Prices and discounts", "Refunds and complaints", "Anything that sounds like a promise"] }],
      ["kinetic", 8, { lines: ["Let it answer.", { text: "Let a person commit.", dim: true }], size: "xl" }],
      END,
    ],
  },

  V16: {
    title: "13 people judge your AI project",
    scenes: [
      ["statdrop", 14, { value: "13 + 9", label: "people judge a typical business purchase", source: "Source: Forrester, State of Business Buying 2026" }],
      ["kinetic", 8, { lines: ["With GenAI,", { text: "the group doubles.", dim: true }], size: "xl" }],
      ["checklist", 22, { items: ["CTO: does it work?", "Compliance: what can it access?", "Finance: what does it cost monthly?", "Procurement: is it in the contract?"] }],
      ["kinetic", 8, { lines: ["Write your AI proposal", { text: "for all four.", dim: true }] }],
      END,
    ],
  },

  V17: {
    title: "What your engineer checks",
    scenes: [
      ["kinetic", 6, { lines: ["What your engineer checks", { text: "before anything ships", dim: true }], size: "m" }],
      ["checklist", 38, { numbered: true, items: ["Does what the ticket asked", "Checks ran and passed", "Touches data, payments or access?", "Recorded: AI or person", "Would I put my name on it?"] }],
      ["kinetic", 8, { lines: ["Number 5 is the one", { text: "that matters.", dim: true }] }],
      END,
    ],
  },

  V18: {
    title: "40% of agentic AI projects cancelled",
    scenes: [
      ["statdrop", 14, { value: "40%+", label: "of agentic AI projects cancelled by end-2027", source: "Source: Gartner prediction, June 2025" }],
      ["kinetic", 12, { lines: ["Rising costs.", "Unclear value.", { text: "Inadequate risk controls.", dim: true }], size: "m" }],
      ["checklist", 18, { title: "Decide before you build", items: ["What the agent may do", "What it must ask a person", "How you’ll see what it did"] }],
      ["kinetic", 8, { lines: ["Two of three reasons are decided", { text: "before any code.", dim: true }], size: "m" }],
      END,
    ],
  },

  V19: {
    title: "What month twelve should feel like",
    scenes: [
      ["kinetic", 8, { lines: ["What month twelve", { text: "should feel like", dim: true }] }],
      ["slide", 36, { variant: "reprise", checks: ["Same people", "Same reply speed", "Complete record", "Fixed bugs stay fixed", "You’d hire them again"] }],
      ["kinetic", 8, { lines: ["Worth a conversation", { text: "in the new year.", dim: true }] }],
      END,
    ],
  },

  V20: {
    title: "5 contract terms so service can't slip",
    scenes: [
      ["kinetic", 8, { lines: ["5 contract terms so", { text: "service can’t slip", dim: true }] }],
      ["checklist", 38, { numbered: true, items: ["One named engineer, notice before changes", "Response times for month twelve", "A named sign-off per delivery", "Code and accounts in your name", "A change record you can read"] }],
      ["kinetic", 6, { lines: ["Save this for", { text: "January renewals.", dim: true }] }],
      END,
    ],
  },

  V21: {
    title: "Our numbers",
    fill: true,
    scenes: [
      ["kinetic", 8, { lines: ["We say our service doesn’t fade.", { text: "Our numbers:", dim: true }], size: "m" }],
      ["statdrop", 9, { value: "[FILL]", label: "deliveries on time", source: "QUAICU delivery data, [FILL: period]" }],
      ["statdrop", 9, { value: "[FILL]", label: "median first response", source: "QUAICU delivery data, [FILL: period]" }],
      ["statdrop", 9, { value: "[FILL]", label: "clients still with their original engineer", source: "QUAICU delivery data, [FILL: period]" }],
      ["statdrop", 9, { value: "[FILL]", label: "the same, for clients in month 12+", source: "QUAICU delivery data, [FILL: period]" }],
      ["kinetic", 8, { lines: ["Published every quarter."], size: "m" }],
      END,
    ],
  },

  // Use instead of V21 if the delivery data is not ready.
  V21F: {
    title: "What we'll measure (fallback)",
    badge: "21",
    scenes: [
      ["kinetic", 8, { lines: ["We say our service", { text: "doesn’t fade.", dim: true }] }],
      ["checklist", 36, { title: "What we’ll measure and publish", numbered: true, items: ["Deliveries on time", "Time to first response", "Clients still with their original engineer", "All three, for clients in month 12+"] }],
      ["kinetic", 8, { lines: ["First numbers", { text: "next quarter.", dim: true }] }],
      END,
    ],
  },

  V22: {
    title: "Every action on record",
    scenes: [
      ["kinetic", 8, { lines: ["Every action on record.", { text: "Person or AI.", dim: true }] }],
      ["log", 32, {
        rows: [
          { time: "10:02", who: "AI agent", what: "Drafted fix", kind: "ai" },
          { time: "10:05", who: "AI agent", what: "Ran checks", kind: "ai" },
          { time: "10:40", who: "Your engineer", what: "Signed off", kind: "person" },
          { time: "10:41", who: "Shipped", what: "Live", kind: "ship" },
        ],
        foot: "Illustrative entries",
      }],
      ["kinetic", 12, { lines: ["If something goes wrong,", { text: "you shouldn’t have to take anyone’s word.", dim: true }], size: "m" }],
      END,
    ],
  },

  V23: {
    title: "Month Twelve in 30 seconds",
    scenes: [
      ["kinetic", 6, { lines: ["12 weeks of", { text: "Month Twelve", dim: true }], size: "xl" }],
      ["kinetic", 8, { eyebrow: "01", lines: ["Judge a vendor on month twelve."], size: "m" }],
      ["kinetic", 8, { eyebrow: "02", lines: ["A status call is not progress."], size: "m" }],
      ["kinetic", 8, { eyebrow: "03", lines: ["Your code belongs in your name."], size: "m" }],
      ["kinetic", 8, { eyebrow: "04", lines: ["Pilots fail in the handover."], size: "m" }],
      ["kinetic", 8, { eyebrow: "05", lines: ["One engineer who stays.", { text: "An AI agent that doesn’t forget.", dim: true }], size: "m" }],
      ["kinetic", 6, { lines: ["Which one would you add?"], size: "m" }],
      END,
    ],
  },

  V24: {
    title: "Software service that doesn't fade",
    scenes: [
      ["kinetic", 10, { lines: ["Most agencies are at their best", { text: "in month one.", dim: true }] }],
      ["slide", 20, { greenAt: 5.2 }],
      ["orbit", 12, { center: "Your<br>engineer", ring: "AI AGENT", captions: ["A forward deployed engineer for every client."] }],
      ["checklist", 12, { items: ["Our AI agent does the repeatable work.", "Minor bugs fixed. Major issues escalated.", "A person approves every fix."] }],
      ["log", 12, {
        title: "Every action on record.",
        rows: [
          { time: "10:02", who: "AI agent", what: "Drafted fix", kind: "ai" },
          { time: "10:40", who: "Your engineer", what: "Signed off", kind: "person" },
        ],
      }],
      ["kinetic", 12, { lines: ["Month one or month twelve,", { text: "the same.", dim: true }], size: "xl" }],
      ["endcard", 12, { extra: "Built in Hyderabad" }],
    ],
  },
};

export const VIDEO_IDS = Object.keys(VIDEOS);
