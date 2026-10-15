# QUAICU company introduction video: plan

Status: **draft for review**. Nothing is built until the script and the open questions below are agreed.

## 1. Brief

| | |
|---|---|
| What | A 60-second introduction to QUAICU: who we are, what we do, how the service works, and why it holds up over time |
| Story | Service that doesn't fade, with a little governance: one engineer who stays, an AI agent doing the repeatable work, a person signing off every delivery, everything on record |
| Where it plays | Website homepage, LinkedIn company page, sales calls and pitch decks, events and investor meetings |
| Voice | Kokoro (af_heart, speed 1.1), the same voice as the Month Twelve videos |
| Look | Zelios-style motion graphics in the QUAICU colours, as in V01 to V04: luminous green light, glass UI, blur-in type, overlapping transitions |
| Music | Composed by `audio/music.py` (144 BPM, C# major), extended to a 60-second arrangement |
| Tone | Plain speech, like explaining the company to someone over coffee. No hype words, no invented numbers |

## 2. Versions

| Version | Size | Length | For |
|---|---|---|---|
| Master | 16:9, 1920x1080 | about 60s | Website homepage, sales calls, pitch decks, events |
| LinkedIn | 4:5, 1080x1350 | about 60s | Company page featured video |
| Cutdown | 4:5, 1080x1350 | about 18s | LinkedIn posts and ads |

All versions: voiceover and music at -14 LUFS, a caption file (`.srt`), and a cover image. On-screen text carries the story on its own, so the video still works muted on the homepage and on an event screen.

## 3. Script (master, about 60s)

Eleven scenes. Times are estimates; the final timing follows the recorded voice, as in V01 to V04.

| # | Time | Voiceover | On screen |
|---|---|---|---|
| 1 | 0–3s | "We're QUAICU." | A spark becomes the QUAICU mark; "We're QUAICU." |
| 2 | 3–8s | "We build software and AI for growing businesses, and we look after it once it's live." | Glass UI cards drift in: a dashboard, a mobile app, an AI assistant. Line: "Software and AI for *growing businesses.*" |
| 3 | 8–16s | "If you've worked with a tech partner before, you know how it often goes. A great first month. Then new faces, slower replies, and everything's 'next week'." | The month 1 to 12 chart (tag `Illustrative`): a grey line sags past "New faces", "Slower replies", "Next week" |
| 4 | 16–19s | "We built QUAICU so that doesn't happen." | The QUAICU line draws flat across the chart |
| 5 | 19–24s | "Every client gets one engineer from day one. They learn your business, and they stay with you." | Engineer card, "Your engineer, from day one", on a timeline from Day 1 to Month 12 |
| 6 | 24–33s | "Behind them, our AI agent does the repeatable work, the same way every time. For small bugs, it drafts the fix, and your engineer checks it before it goes live." | The delivery console in a laptop: "AI agent drafted a fix", "ran every check", "Your engineer approved" |
| 7 | 33–39s | "Anything serious goes straight to your engineer. If they're away, the next person on our team picks it up." | A "Major issue" alert routes to "Your engineer" (away), then to "Next engineer on call", who picks it up |
| 8 | 39–46s | "We started out in AI governance, so oversight is built in. A person signs off every delivery, and every step is on record." | A record of deliveries fills in, each row stamped "Signed off" with a name and time; a lock marks the record |
| 9 | 46–50s | "Work with us on a new build, or on ongoing support, priced per ticket." | Two glass cards: "New builds: designed, built and launched with you" and "Ongoing support: priced per ticket" |
| 10 | 50–54s | "We're based in Hyderabad, India." | "Hyderabad, India" with its coordinates; below, "Supported by Google for Startups and T-Hub. In NVIDIA Inception and NASSCOM DeepTech 2026." |
| 11 | 54–60s | "QUAICU. Software service that doesn't fade." | End card: logo, "Software service that doesn't fade.", "quaicu.org" |

About 165 words, which Kokoro speaks in about 48 seconds; the rest is scene changes, the logo moments and the end card.

Every fact in the script matches the live site (`index.html`, `company.html`, `support.html`, `builds.html`) or what the founders have confirmed about the service model: the engineer is also the relationship manager, the AI agent drafts fixes for minor bugs and a person approves them, and major issues go to the engineer or, if they are away, to the next available person on the team. The script makes no promise about response times.

## 4. Cutdown (4:5, about 18s)

| Voiceover | On screen |
|---|---|
| "We're QUAICU. We build software and AI for growing businesses." | Scene 1 into scene 2 |
| "Every client gets one engineer from day one, and they stay." | Scene 5 |
| "Our AI agent does the repeatable work, and a person signs off every delivery." | Scenes 6 and 8, shortened |
| "Software service that doesn't fade." | End card |

## 5. What has to be built

The Month Twelve engine (`marketing/launch-video`, Zelios style) already has the chart, engineer card, console, text and end card scenes, in 4:5 only.

1. **16:9 layouts** for the Zelios scenes (wide compositions: text on one side, UI on the other).
2. **Six new scenes:** the opening mark, the UI cards montage, the escalation route, the signed-off record, the two ways to work, and the Hyderabad and programmes card.
3. **A 60-second music arrangement:** intro under the logo, the drop as the story starts, a softer break under the governance scene, a lift into the end card.
4. **Captions and covers** for each version, as for V01 to V04.

## 6. Review checkpoints

1. **This plan and script.** You mark up the wording; I change nothing else until it is agreed.
2. **Styleframes.** One still per scene in 16:9 and 4:5, sent as a contact sheet, before any full render.
3. **First full render** of the 16:9 master with voice and music.
4. **The rest:** 4:5 version, cutdown, captions and covers.

## 7. Open questions

1. **Programme logos.** The site has logo files in `uploads/partners/`. Either use the programme names as text (safe, and the plan above assumes this), or the official programme badges if you have them. The NVIDIA file looks like the NVIDIA company logo rather than the Inception member badge, which has its own usage rules.
2. **India and the UAE.** Scene 10 says only "Hyderabad, India". Add "working with businesses in India and the UAE" only if that is already true.
3. **"30% more efficient".** The site says builds are delivered 30% more efficiently in price and timeline. The plan leaves it out until there is public proof behind it.
4. **Spoken sign-off.** The plan speaks "QUAICU. Software service that doesn't fade." at the end. The Month Twelve videos end silently; say if you want this one to match.
5. **Founders.** Not in this cut. A 90-second sales version could add a short founders' moment later, with photos of Deepak and Xavier.
