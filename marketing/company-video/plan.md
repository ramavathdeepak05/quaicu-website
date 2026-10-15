# QUAICU company introduction video: plan

Status: **rendered**: 16:9 master (59.8s), 4:5 (59.8s) and the cutdown (13.3s), in `marketing/launch-video/out/company/` with captions (`.srt`) and covers. Styleframes in `styleframes/`.

Build: `node render.mjs --video INTRO --vo` (16:9), `--video INTRO45` (4:5), `--video INTROCUT` (cutdown) from `marketing/launch-video`; data in `src/campaign/company.js`, scenes in `src/campaign/z/company.js`. Output goes to `marketing/launch-video/out/company/`.

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
| Cutdown | 4:5, 1080x1350 | about 13s | LinkedIn posts and ads |

All versions: voiceover and music at -14 LUFS, a caption file (`.srt`) and a cover image. The on-screen text tells the story on its own, so it works muted on the homepage and on an event screen.

## 4. Script (master, about 60s)

| # | Voiceover | On screen |
|---|---|---|
| 1 | "AI made building software cheap. Running it is another story." | The line itself, readable from the first frame: "AI made building software cheap." / "Running it is another story." |
| 2 | "Type what you want, and you'll have an app by the afternoon." | "Build me a booking app" is typed into a prompt box and an app appears in seconds |
| 3 | "It looks great in the demo. Then you have to run it." | The app fills the frame and a switch flips to "Live" |
| 4 | "Something breaks, and nobody knows why. It slows down as you grow. And nobody's sure it's secure." | Warnings stack up over the app: "Checkout failed", "Page is slow", "Security warning" |
| 5 | "The tool can write code. It can't tell you if it's the right code." | Code streams into an editor; a comment pops up beside it: "Is this right?" |
| 6 | "An agency can, at agency prices." | An agency quote: line items keep coming and the total keeps climbing (tag `Illustrative`) |
| 7 | "That's where QUAICU comes in." | A line from "AI tool" to "Agency"; the QUAICU mark slides to the middle and braces close around it |
| 8 | "We use AI to work faster, so you pay less." | Tasks tick through quickly in a work queue, with a cost meter that stays low |
| 9 | "And experienced engineers make the calls that matter: how it's built, how it's secured, and how it grows." | Three decision cards, "Architecture", "Security", "Growth", each approved by an engineer |
| 10 | "We started out building AI governance technology. That work earned us a place in NASSCOM's DeepTech cohort. We're also part of NVIDIA Inception, and supported by Google for Startups and T-Hub." | A governance core forms; four programme cards (NASSCOM DeepTech 2026, NVIDIA Inception, Google for Startups, T-Hub) connect to it, each lighting up as it is named |
| 10b | "It's also why every change we make is reviewed before it ships, and every decision is written down." | A project record fills in row by row: each change "Reviewed", each decision logged with a name and date |
| 11 | "Which means your software keeps running long after launch, and nothing about it lives only in one person's head." | The app from scene 3 again, now steady: every check passing, the record still growing beside it |
| 12 | "QUAICU. Software service that doesn't fade." | End card: logo, "Software service that doesn't fade.", "quaicu.org", and "Supported by Google for Startups and T-Hub. In NVIDIA Inception and NASSCOM DeepTech 2026." |

About 175 words, which Kokoro speaks in about 51 seconds. With the scene changes and the end card it lands at about 60 seconds; the final timing follows the recorded voice, as in V01 to V04.

## 5. Cutdown (4:5, about 13s)

| Voiceover | On screen |
|---|---|
| "AI made building software cheap. Running it is another story." | Scene 1, then the warnings from scene 4 |
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

## 8. Decisions

1. **No SEO.** Scene 4 says "And nobody's sure it's secure." instead of the Google line.
2. **No dedicated-engineer line.** The engineers appear in scene 9 only.
3. **Programmes in the story, not just on the end card.** Scene 10 ties them to where they come from. Confirmed by the founders: QUAICU got into NASSCOM's DeepTech cohort because of its governance capability, so that line is causal; NVIDIA Inception, Google for Startups and T-Hub follow it without a claimed reason. The end card repeats them as text: "Supported by Google for Startups and T-Hub. In NVIDIA Inception and NASSCOM DeepTech 2026."
4. **Opening:** "AI made building software cheap. Running it is another story." The agency comparison moves to scene 6, right after the code line.
