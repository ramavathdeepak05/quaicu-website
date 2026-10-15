# Month Twelve: video production briefs

24 motion-graphics videos for the LinkedIn campaign in `campaign.md`. Each brief is written to be built with Claude Code on the existing engine in `marketing/launch-video/` (code-driven scenes, `window.seek(t)`, headless Chromium render, ffmpeg encode, composed score). Read that folder's `README.md` first.

---

## 1. Specs for every video

| Spec | Value |
|---|---|
| Format | **4:5, 1080x1350** for the LinkedIn feed (takes the most space on mobile without being cropped on desktop). Needs a new `4x5` format in the engine; add `.f-4x5` overrides beside the existing `.f-9x16` ones. Optional 9:16 export for Shorts or Reels later. |
| Length | 30s = 60 beats at 120 BPM, unless a brief says otherwise |
| Frame rate, codec, audio | Same as the launch video: H.264 High, 30fps, AAC, -14 LUFS, composed score from `audio/compose.py` |
| Sound | Every video must work muted. No voiceover. All meaning is in on-screen text. |
| First frame | The hook text must be fully readable at frame 0. Also export it as a still and upload it as the LinkedIn thumbnail. |
| Text size | Minimum 44px at 1080 wide. No more than 12 words on screen at once. |
| Look | The launch video's tokens: colours from `assets/site.css`, Space Grotesk headlines, Inter body, JetBrains Mono for labels and data. |
| Series badge | Top left on every video: `MONTH TWELVE · NN` in mono (NN = video number, 01 to 24) |
| End card | The last 8 beats (52–60) unless noted: QUAICU logo, "Software service that doesn't fade.", "quaicu.org" |
| Sources | Any statistic or quote carries a small source line on screen while it is visible, e.g. `Source: NASSCOM`. Anonymised reviews say `From a buyer review`. |
| Illustrative | The Slide chart always shows an `Illustrative` tag, the same way the site does. |
| House style | Plain words, no hype, no em dashes, never name an agency or client |

---

## 2. Build once: new scene templates

Six new data-driven templates, added as `src/scenes/<name>.js` with their copy in a per-video data file. Building these first (Week 0) makes each video a copy-only job.

| Template | What it does |
|---|---|
| `slide` | The signature chart. X axis Month 1 to Month 12. A grey "Typical vendor" line starts high and sags with small dips; a QUAICU line draws in and stays flat. Labels appear at the line ends. Options: `variant: "speed"` (adds a third "Speed" line that peaks early, for V11), `reprise: true` (QUAICU line only, with check marks at month 12, for V19). |
| `checklist` | A title, then items arriving one at a time with a tick, about 4 beats apart. Option `numbered`. Option `ladder` (used in V08): steps drawn as a descending ladder joined by arrows, supporting two branches side by side. Items stay on screen so the final frame is screenshot-able. |
| `statdrop` | A large number counts up (or a range snaps in), a one-line label below, a source line at the bottom. |
| `quotecard` | A quote types in, character by character, in large type with quote marks. Attribution line below. Then the quote dims and a response line slides in. |
| `myth` | "Myth" label and the myth line; a strike-through draws across it; "Reality" label and the reality line replace it. |
| `kinetic` | One to three lines of large type, revealed word by word on the beat. Options: `white`/`grey` line split, like the launch video's `tension` scene. |

**Reused from the launch video:** `offerings` (the four-stage support ticket track), `pipeline` (Delivery Activity window), `ledger` ("every action on record"), `endcard` (new copy). `hook` can be used as an alternative opening.

**Suggested structure:** add a `campaign/` folder inside `marketing/launch-video/src/` with one `VNN.js` data file per video (scenes, beats, copy), and teach `render.mjs` a `--video V01` flag. Output to `out/campaign/VNN-4x5.mp4` and `out/campaign/VNN-cover.jpg`.

---

## 3. The briefs

Beats are half-seconds (60 beats = 30s). "On screen" is the exact copy.

### V01 · The slide · Tue 20 Oct
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "Most agencies are at their best in month one." |
| 8–30 | slide | Axis "Month 1 … Month 12". Grey line labelled "Typical vendor" sags. Callouts appear along the dip: "New faces" · "Demos stop" · "Dates slip". Tag: `Illustrative` |
| 30–44 | slide (cont.) | QUAICU line draws flat across. Label: "QUAICU". Caption: "Same engineer. Same steps. Every month." |
| 44–52 | kinetic | "Judge a vendor on month twelve." |
| 52–60 | endcard | Standard |

### V02 · Myth / reality · Thu 22 Oct
| Beats | Scene | On screen |
|---|---|---|
| 0–14 | myth | Myth: "The team that pitched you is the team that stays." |
| 14–30 | myth (reality) | Reality: "Senior people win the deal. Then they move to the next one." |
| 30–44 | kinetic | White: "Ask who works on it" / Grey: "in month six." |
| 44–52 | kinetic | White: "With us: one forward deployed engineer," / Grey: "from week one to month twelve." |
| 52–60 | endcard | Standard |

### V03 · Checklist · Tue 27 Oct
| Beats | Scene | On screen |
|---|---|---|
| 0–6 | kinetic | "6 signs your vendor is starting to slip" |
| 6–48 | checklist (numbered) | 1 "Status calls, no demos" · 2 "A new name every month" · 3 "'Next week' for everything" · 4 "Replies take a day, not an hour" · 5 "Old bugs come back" · 6 "Invoices you can't match to work" |
| 48–52 | kinetic | "One is a bad week. Three is a pattern." |
| 52–60 | endcard | Standard |

### V04 · Quote card · Thu 29 Oct
| Beats | Scene | On screen |
|---|---|---|
| 0–16 | quotecard | "Trying to hold my software and code hostage." Attribution: `From a buyer review` |
| 16–24 | kinetic | "It happens when the vendor owns the accounts." |
| 24–46 | checklist | Title "In your name from day one": "Code repository" · "Domain" · "Hosting and cloud" · "App store accounts" |
| 46–52 | kinetic | "Your vendor gets access. You keep ownership." |
| 52–60 | endcard | Standard |

### V05 · Stat drop · Tue 3 Nov
| Beats | Scene | On screen |
|---|---|---|
| 0–14 | statdrop | "10–15%" · "of GenAI proofs of concept in India reach full production" · `Source: NASSCOM` |
| 14–42 | checklist | Title "Why pilots stall": "No owner after the demo" · "Sample data, not real data" · "No one approves the output" · "No agreed measure of success" |
| 42–52 | kinetic | White: "Not a model problem." / Grey: "A delivery problem." |
| 52–60 | endcard | Standard |

### V06 · Your forward deployed engineer · Thu 5 Nov
Reuses `hub` (the launch video's ring, with the centre relabelled) and `offerings` (support track only).
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "Every client gets a forward deployed engineer." |
| 8–20 | hub | Centre: "Your engineer". Ring: "AI AGENT". Captions: "Knows your business" · "Works in your tools" · "On site when needed" |
| 20–46 | offerings (support) | Stages: "Raised" → "Engine" → "Review" → "Delivered". Sub-captions: "You tell your engineer" · "Our AI agent does the repeatable work" · "Your engineer signs it off" · "You get the change and the record" |
| 46–52 | kinetic | White: "Same engineer. Same four steps." / Grey: "Ticket 1 or ticket 500." |
| 52–60 | endcard | Standard |

### V07 · Kinetic · Tue 10 Nov (series launch)
| Beats | Scene | On screen |
|---|---|---|
| 0–10 | kinetic | White: "Month one shows the sales team." |
| 10–20 | kinetic | Grey: "Month twelve shows the delivery." |
| 20–36 | kinetic | "In a reference call, don't ask 'were you happy?'" |
| 36–46 | kinetic | Large: "Ask what changed by month twelve." |
| 46–52 | kinetic | Badge reveal: "MONTH TWELVE · a new series" |
| 52–60 | endcard | Standard |

### V08 · Escalation · Thu 12 Nov
Reuses the launch video's `hook` scene (02:14 AM terminal) and the `checklist` template with the `ladder` option (steps drawn as a descending ladder joined by arrows, each lighting up in turn).
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | hook | Eyebrow "02:14 AM · Production". Lines: "Production is down." / "What happens next?" |
| 8–22 | checklist (`ladder`), branch 1 | "Minor bug" → "AI agent prepares the fix" → "A person approves it" (sub: "Your engineer, or on-call when they're away") |
| 22–42 | checklist (`ladder`), branch 2 | "Major issue" → "AI alerts your engineer" → "Unavailable? Next available engineer" → "Or our internal team" → "Taken over" |
| 42–52 | kinetic | White: "Nobody waits until Monday" / Grey: "because one person was offline." |
| 52–60 | endcard | Standard |

Caption at the bottom during beats 8–42: "Your engineer decides what counts as minor or major."

### V09 · Checklist · Tue 17 Nov
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "Pilot to production · Part 1 of 2" |
| 8–46 | checklist (numbered) | 1 "One owner who stays after the demo" · 2 "Real data, with the real mess" · 3 "Decide who approves the output" · 4 "Agree success before you build" |
| 46–52 | kinetic | "Steps 5–8 on Thursday" |
| 52–60 | endcard | Standard |

### V10 · Checklist · Thu 19 Nov
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "Pilot to production · Part 2 of 2" |
| 8–46 | checklist (numbered, starts at 5) | 5 "Track running cost from day one" · 6 "One team first, then everyone" · 7 "Review output weekly" · 8 "Hand over so you can run it" |
| 46–52 | kinetic | "This is where most pilots quietly die." |
| 52–60 | endcard | Standard |

### V11 · The slide (speed variant) · Tue 24 Nov
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "AI makes teams faster. That's not the point." |
| 8–30 | slide (`variant: "speed"`) | A "Speed" line peaks early and drops. Tag `Illustrative` |
| 30–44 | slide (cont.) | A flat "Consistency" line draws across. Caption: "AI agent: same checks on day 300. Your engineer: free for judgement." |
| 44–52 | kinetic | White: "Fast in month one is easy." / Grey: "Same in month twelve is the job." |
| 52–60 | endcard | Standard |

### V12 · Checklist · Thu 26 Nov (UAE)
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "4 data questions for any offshore vendor" |
| 8–40 | checklist (numbered) | 1 "Where is our data stored?" · 2 "Who can access it from abroad?" · 3 "Does your AI train on our content?" · 4 "Can it run on our cloud?" |
| 40–52 | kinetic | "In Saudi Arabia, remote access from abroad counts as a data transfer." · `Source: Saudi PDPL · not legal advice` |
| 52–60 | endcard | Standard |

### V13 · Myth / reality · Tue 1 Dec
| Beats | Scene | On screen |
|---|---|---|
| 0–14 | myth | Myth: "Per-ticket pricing means rushed tickets." |
| 14–40 | checklist | Title "Reality, if it's done right": "Ticket size agreed first" · "Your engineer signs off every delivery" · "Every action recorded" |
| 40–52 | kinetic | White: "You pay for the work." / Grey: "The review proves it's done." |
| 52–60 | endcard | Standard |

### V14 · Kinetic · Thu 3 Dec
| Beats | Scene | On screen |
|---|---|---|
| 0–10 | kinetic | "Banning ChatGPT doesn't stop people using it." |
| 10–18 | kinetic | Grey: "It moves to personal phones." |
| 18–46 | checklist | Title "Write one page instead": "Approved tools" · "Data that never goes in" · "Company accounts only" · "Who to ask" |
| 46–52 | kinetic | "One page people read beats a ban nobody follows." |
| 52–60 | endcard | Standard |

### V15 · Quote card · Tue 8 Dec (UAE)
| Beats | Scene | On screen |
|---|---|---|
| 0–14 | quotecard | "Responsible for all the information on its website." Attribution: `Tribunal ruling, Air Canada chatbot case` |
| 14–22 | kinetic | "Your chatbot speaks for your company." |
| 22–44 | checklist | Title "Where a person must decide": "Prices and discounts" · "Refunds and complaints" · "Anything that sounds like a promise" |
| 44–52 | kinetic | "Let it answer. Let a person commit." |
| 52–60 | endcard | Standard |

### V16 · Stat drop · Thu 10 Dec
| Beats | Scene | On screen |
|---|---|---|
| 0–14 | statdrop | "13 + 9" · "people judge a typical business purchase" · `Source: Forrester, State of Business Buying 2026` |
| 14–22 | kinetic | "With GenAI, the group doubles." |
| 22–44 | checklist | "CTO: does it work?" · "Compliance: what can it access?" · "Finance: what does it cost monthly?" · "Procurement: is it in the contract?" |
| 44–52 | kinetic | "Write your AI proposal for all four." |
| 52–60 | endcard | Standard |

### V17 · Ticket journey (sign-off) · Tue 15 Dec
| Beats | Scene | On screen |
|---|---|---|
| 0–6 | kinetic | "What your engineer checks before anything ships" |
| 6–44 | checklist (numbered), over a dimmed `pipeline` window | 1 "Does what the ticket asked" · 2 "Checks ran and passed" · 3 "Touches data, payments or access?" · 4 "Recorded: AI or person" · 5 "Would I put my name on it?" |
| 44–52 | kinetic | "Number 5 is the one that matters." |
| 52–60 | endcard | Standard |

### V18 · Stat drop · Thu 17 Dec
| Beats | Scene | On screen |
|---|---|---|
| 0–14 | statdrop | "40%+" · "of agentic AI projects cancelled by end-2027" · `Source: Gartner prediction, June 2025` |
| 14–26 | kinetic | "Rising costs. Unclear value. Inadequate risk controls." |
| 26–46 | checklist | Title "Decide before you build": "What the agent may do" · "What it must ask a person" · "How you'll see what it did" |
| 46–52 | kinetic | "Two of three reasons are decided before any code." |
| 52–60 | endcard | Standard |

### V19 · The slide (reprise) · Tue 22 Dec
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "What month twelve should feel like" |
| 8–44 | slide (`reprise: true`) | Flat line reaches Month 12; ticks appear: "Same people" · "Same reply speed" · "Complete record" · "Fixed bugs stay fixed" · "You'd hire them again". Tag `Illustrative` |
| 44–52 | kinetic | "Worth a conversation in the new year." |
| 52–60 | endcard | Standard |

### V20 · Checklist · Tue 29 Dec
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "5 contract terms so service can't slip" |
| 8–48 | checklist (numbered) | 1 "One named engineer, notice before changes" · 2 "Response times for month twelve" · 3 "A named sign-off per delivery" · 4 "Code and accounts in your name" · 5 "A change record you can read" |
| 48–52 | kinetic | "Save this for January renewals." |
| 52–60 | endcard | Standard |

### V21 · Delivery record · Tue 5 Jan
**Only render with real data.** If the numbers aren't ready, render the fallback version.
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "We say our service doesn't fade. Our numbers:" |
| 8–44 | statdrop ×4 (quick succession, 9 beats each) | `[FILL]` on-time · `[FILL]` median first response · `[FILL]` clients still with their original engineer · `[FILL]` same figures, clients in month 12+ · Source line: `QUAICU delivery data, [period]` |
| 44–52 | kinetic | "Published every quarter." |
| 52–60 | endcard | Standard |

*Fallback:* same structure, replacing the stat drops with a `checklist` titled "What we'll measure and publish" (the four metric names, no numbers), and a closing line "First numbers next quarter."

### V22 · Ledger · Thu 7 Jan
| Beats | Scene | On screen |
|---|---|---|
| 0–8 | kinetic | "Every action on record. Person or AI." |
| 8–40 | ledger | Rows build: "10:02 · AI agent · drafted fix" · "10:05 · AI agent · ran checks" · "10:40 · Your engineer · signed off" · "10:41 · Shipped". Columns: What · Who · When |
| 40–52 | kinetic | White: "If something goes wrong," / Grey: "you shouldn't have to take anyone's word." |
| 52–60 | endcard | Standard |

### V23 · Recap · Tue 12 Jan
| Beats | Scene | On screen |
|---|---|---|
| 0–6 | kinetic | "12 weeks of Month Twelve" |
| 6–48 | kinetic, quick cuts of 8 beats each, each with a small frame from the original video | "Judge a vendor on month twelve." · "A status call is not progress." · "Your code belongs in your name." · "Pilots fail in the handover." · "One engineer who stays. An AI agent that doesn't forget." |
| 48–52 | kinetic | "Which one would you add?" |
| 52–60 | endcard | Standard |

### V24 · Anthem · Thu 14 Jan (pin)
45s (90 beats). Also render a 9:16 for the website and other platforms.
| Beats | Scene | On screen |
|---|---|---|
| 0–10 | kinetic | "Most agencies are at their best in month one." |
| 10–30 | slide | Grey line sags, QUAICU line holds. Tag `Illustrative` |
| 30–42 | hub | Centre: "Your engineer". Ring: "AI AGENT". Phrase: "A forward deployed engineer for every client." |
| 42–54 | pipeline | Delivery Activity window. Phrases: "Our AI agent does the repeatable work." · "Minor bugs fixed. Major issues escalated." · "A person approves every fix." |
| 54–66 | ledger | "Every action on record." |
| 66–78 | kinetic | White: "Month one or month twelve," / Grey: "the same." |
| 78–90 | endcard | Long version: logo, "Software service that doesn't fade.", "Built in Hyderabad · quaicu.org" |

---

## 4. Production schedule

| When | Render |
|---|---|
| 15–19 Oct (Week 0) | Build the `4x5` format and the six templates; render V01–V04 |
| Each Friday | Render the videos for the week after next (two weeks of buffer) |
| By 13 Nov | Everything up to V12 |
| By 11 Dec | Everything except V21 and V24 |
| 2 Jan | V21 (real data or fallback), V24 |

**Review each render before posting:**
- Hook readable at frame 0
- Every figure has its source line
- Nothing in the bottom 10% of the frame (LinkedIn's player controls)
- Plays fine muted
- `Illustrative` tag present on every Slide chart
