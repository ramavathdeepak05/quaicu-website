# QUAICU company introduction video: plan

Status: **draft 2, for review**. Nothing is built until the script and the open questions below are agreed.

## 1. Positioning

Growing businesses that need software have two common routes, and both let them down:

- **Agencies** have the experience, but most of the time they cost more than a growing business can justify.
- **AI app builders** get something on screen fast and cheap, but the person using the tool usually has the tool and nothing else: no engineering background, no SEO knowledge, no plan for running it. The result looks finished, and the trouble starts when it has to be maintained, secured and grown.

**QUAICU sits in between.** We use AI to work faster, which keeps the cost down. Experienced engineers make the decisions that need judgement: architecture, security, how it grows. Our background in AI governance means every change is reviewed and every decision is written down, so the software keeps running and nothing about it depends on one person's memory.

Background, not for the script: the engineer leading the project is also the client's relationship manager; the AI does most of the tasks while the engineer brings experience and the architectural decisions; and if someone leaves, the project's knowledge stays with the system. The script turns this into the customer benefit ("nothing about it lives only in one person's head") without describing the mechanics.

No tool or agency is named. "An AI tool" carries the comparison, does not date, and avoids a comparative claim about a named product.

## 2. Brief

| | |
|---|---|
| What | A 60-second introduction to QUAICU built on the positioning above |
| Where it plays | Website homepage, LinkedIn company page, sales calls and pitch decks, events and investor meetings |
| Voice | Kokoro (af_heart, speed 1.1), the same voice as the Month Twelve videos |
| Look | Zelios-style motion graphics in the QUAICU colours, as in V01 to V04 |
| Music | Composed by `audio/music.py` (144 BPM, C# major), extended to a 60-second arrangement |
| Tone | Plain speech, the way you would explain it to a friend who runs a business. Written for this video, not lifted from the site or the campaign |

## 3. Versions

| Version | Size | Length | For |
|---|---|---|---|
| Master | 16:9, 1920x1080 | about 60s | Website homepage, sales calls, pitch decks, events |
| LinkedIn | 4:5, 1080x1350 | about 60s | Company page featured video |
| Cutdown | 4:5, 1080x1350 | about 16s | LinkedIn posts and ads |

All versions: voiceover and music at -14 LUFS, a caption file (`.srt`) and a cover image. The on-screen text tells the story on its own, so it works muted on the homepage and on an event screen.

## 4. Script (master, about 60s)

| # | Voiceover | On screen |
|---|---|---|
| 1 | "If you need software built, you've usually got two options." | Two glass cards side by side, "Agency" and "AI tool". Line: "Two ways to get software built." |
| 2 | "Hire an agency, and pay agency prices." | The agency card: a quote whose line items keep coming and whose total keeps climbing |
| 3 | "Or try an AI tool, and have something on screen by the afternoon." | The AI tool card: "Build me a booking app" is typed into a prompt box and an app appears in seconds |
| 4 | "It looks great in the demo. Then you have to run it." | The app fills the frame and a switch flips to "Live" |
| 5 | "Something breaks, and nobody knows why. It slows down as you grow. Nobody can find it on Google." | Warnings stack up over the app: "Checkout failed", "Page is slow", "Not on Google" |
| 6 | "A tool can write code. It can't tell you if it's the right code." | Code streams into an editor; a comment pops up beside it: "Is this right?" |
| 7 | "That's where QUAICU comes in." | A line from "Agency" to "AI tool"; the QUAICU mark slides to the middle and braces close around it |
| 8 | "We use AI to work faster, so you pay less." | Tasks tick through quickly in a work queue, with a cost meter that stays low |
| 9 | "And experienced engineers make the calls that matter: how it's built, how it's secured, and how it grows." | Three decision cards, "Architecture", "Security", "Growth", each approved by an engineer |
| 10 | "We started out in AI governance, so every change is reviewed before it ships, and every decision is written down." | A project record fills in row by row: each change "Reviewed", each decision logged with a name and date |
| 11 | "Which means your software keeps running long after launch, and nothing about it lives only in one person's head." | The app from scene 4 again, now steady: every check passing, the record still growing beside it |
| 12 | "QUAICU. Software service that doesn't fade." | End card: logo, "Software service that doesn't fade.", "quaicu.org" |

About 150 words, which Kokoro speaks in about 44 seconds. With the scene changes and the end card it lands close to 60 seconds; the final timing follows the recorded voice, as in V01 to V04.

**Alternative opening** (replaces scenes 1 to 3, same visuals): "AI made building software cheap. Running it is another story."

## 5. Cutdown (4:5, about 16s)

| Voiceover | On screen |
|---|---|
| "Agencies cost a lot. AI tools can't tell you if the code is right." | Scenes 1 and 6, shortened |
| "QUAICU uses AI to work faster, and experienced engineers to make the calls that matter." | Scenes 8 and 9, shortened |
| "QUAICU. Software service that doesn't fade." | End card |

## 6. What has to be built

The Month Twelve engine (`marketing/launch-video`, Zelios style) has text, settings-panel, console and end card scenes, in 4:5 only.

1. **16:9 layouts** for the Zelios scenes.
2. **New scenes:** the two options (agency quote and AI prompt), the app going live and breaking, the code editor, the "in between" line with the braces, the work queue with the cost meter, the decision cards (built on the settings panel), the project record, and the steady app.
3. **A 60-second music arrangement:** a light intro under the two options, tension under the breaking app, the drop on "That's where QUAICU comes in", a lift into the end card.
4. **Captions and covers** for each version.

## 7. Review checkpoints

1. **This plan and script.** You mark up the wording; nothing else changes until it is agreed.
2. **Styleframes.** One still per scene in 16:9 and 4:5, sent as a contact sheet, before any full render.
3. **First full render** of the 16:9 master with voice and music.
4. **The rest:** 4:5 version, cutdown, captions and covers.

## 8. Open questions

1. **Google.** Scene 5 uses "Nobody can find it on Google" as one of the things that goes wrong. Keep it only if SEO is part of what you deliver; otherwise it becomes "It isn't secure."
2. **Your engineer.** Per your note, there is no "one engineer from day one" line. If you want the relationship manager in at all, one short line fits after scene 9: "One of them is always your point of contact."
3. **Programme logos.** Not in this draft. They could go on the end card as text: "Supported by Google for Startups and T-Hub. In NVIDIA Inception and NASSCOM DeepTech 2026."
4. **Opening.** The "two options" opening, or the alternative "AI made building software cheap" line.
