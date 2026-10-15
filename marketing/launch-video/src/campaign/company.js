// The QUAICU company introduction, as data. Script and scenes from
// marketing/company-video/plan.md; keep the two in step.
//
//   INTRO     16:9 master (website, sales, events)
//   INTRO45   the same video in 4:5 (LinkedIn company page)
//   INTROCUT  4:5 cutdown, about 16s (LinkedIn posts and ads)
//
// Same conventions as videos.js: [template, beats, opts], timed voice-first.
// The scenes are in src/campaign/z/company.js and lay themselves out for
// each format; only the text line breaks differ here. section names the
// music under each scene (audio/music.py): intro, build, tension, drive, break.

const PROGRAMMES = "Supported by Google for Startups and T-Hub. In NVIDIA Inception and NASSCOM DeepTech 2026.";
const END = (extra = {}) => ["endcard", 8, { enter: "mask", enterDur: 0.8, programmes: PROGRAMMES, say: "QUAICU. Software service that doesn’t fade.", ...extra }];

function scenes(fmt) {
  const wide = fmt === "16x9";
  return [
    ["zt", 8, {
      lines: wide ? ["AI made building software *cheap.*", "Running it is *another story.*"] : ["AI made building", "software *cheap.*", "Running it is", "*another story.*"],
      size: "l", seed: 1, section: "intro",
      say: "AI made building software cheap. Running it is another story.",
    }],
    ["zprompt", 8, { bg: "light", section: "build", say: "Type what you want, and you’ll have an app by the afternoon." }],
    ["zapp", 8, { bg: "light", state: "live", enter: "zoom", section: "build", say: ["It looks great in the demo.", "Then you have to run it."] }],
    ["zapp", 10, { bg: "light", state: "break", section: "tension", say: ["Something breaks, and nobody knows why.", "It slows down as you grow.", "And nobody’s sure it’s secure."] }],
    ["zcode", 8, { enter: "push", section: "tension", say: ["The tool can write code.", "It can’t tell you if it’s the right code."] }],
    ["zinvoice", 6, { bg: "light", section: "tension", say: "An agency can, at agency prices." }],
    ["zbetween", 6, { enter: "zoom", seed: 2, section: "drive", say: "That’s where QUAICU comes in.", min: 2.1 }],
    ["zqueue", 8, { bg: "light", enter: "push", section: "drive", say: "We use AI to work faster, so you pay less." }],
    ["zdecide", 10, { bg: "light", min: 6, section: "drive", say: ["And experienced engineers make the calls that matter:", "how it’s built, how it’s secured, and how it grows."] }],
    ["zcore", 12, {
      // T-Hub is the last word: hold a moment so all four programmes are seen together.
      enter: "zoom", seed: 4, min: 11.5, section: "break",
      say: ["We started out building AI governance technology.", "That work earned us a place in NASSCOM’s DeepTech cohort.", "We’re also part of NVIDIA Inception, and supported by Google for Startups and T-Hub."],
    }],
    ["zrecord", 8, { bg: "light", enter: "push", section: "drive", say: "It’s also why every change we make is reviewed before it ships, and every decision is written down." }],
    ["zapp", 10, { bg: "light", state: "steady", section: "drive", say: "Which means your software keeps running long after launch, and nothing about it lives only in one person’s head." }],
    END(),
  ];
}

const base = { style: "z", label: null, out: "company" };

export const COMPANY_VIDEOS = {
  INTRO: { ...base, title: "QUAICU company introduction (16:9)", format: "16x9", scenes: scenes("16x9") },
  INTRO45: { ...base, title: "QUAICU company introduction (4:5)", format: "4x5", scenes: scenes("4x5") },
  INTROCUT: {
    ...base, title: "QUAICU company introduction, cutdown (4:5)", format: "4x5",
    scenes: [
      ["zt", 6, { lines: ["AI made building", "software *cheap.*"], size: "xl", seed: 1, section: "intro", say: "AI made building software cheap." }],
      ["zapp", 6, { bg: "light", state: "break", section: "tension", caption: "Running it is *another story.*", say: "Running it is another story.", min: 2.6 }],
      ["zqueue", 8, { bg: "light", enter: "push", section: "drive", say: "QUAICU uses AI to work faster," }],
      ["zdecide", 8, { bg: "light", section: "drive", say: ["and experienced engineers to make the calls that matter."] }],
      END(),
    ],
  },
};
