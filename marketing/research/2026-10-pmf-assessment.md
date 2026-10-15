# QUAICU product-market fit assessment

*October 2026. Built on [the market research](2026-10-market-research.md) (search-snippet sources, so figures are provisional) and what the founders have described about how QUAICU works. QUAICU has 1 to 5 paying clients, so nothing here is proof of fit. It is a judgement of where fit is most likely, and a plan to test it.*

---

## 1. Bottom line

- **No product-market fit yet, and that's expected at 1 to 5 clients.** Fit shows up as retention, expansion and referrals over months, not as a score.
- **Strongest candidate:** ongoing software and AI support for **Indian mid-market firms**, regulated sectors first, sold as *service that doesn't fade*: one forward deployed engineer (FDE) per client, an AI agent alongside them, and a record of every action. The pain is measured, competitors leave the space open, and you can reach these buyers in person.
- **Second candidate:** **UAE small and lower mid-market businesses**, where data residency is a real question you can answer. Fit is plausible but unproven, and the research found no first-hand voices from these buyers.
- **The biggest risk isn't demand. It's the business model.** An FDE per client is a fixed cost. Per-ticket pricing is variable revenue. A client who raises few tickets could cost more than they pay. This has to be fixed before you scale (Section 4).
- **The second biggest risk is proof.** Mid-market buyers check for ISO 27001 or SOC 2 and reviews before they read any positioning. Today QUAICU has neither.

---

## 2. The offer being tested

| Part | What it is | What it's for |
|---|---|---|
| Forward deployed engineer | One engineer per client: manages the relationship, works in the client's tools, remote or on site, classifies issues as minor or major, signs off every delivery | Answers the top complaint about agencies: people swapped, nobody accountable |
| AI agent | Prepares fixes for minor bugs (a person approves them), alerts the FDE to major issues, escalates to the next available engineer or internal team | Consistency and speed without depending on one person's memory or hours |
| Record of every action | What the AI did, what a person did, who signed it off | Trust, audits, and cover when the FDE is away |
| Support priced per ticket | Pay for the tickets you raise | Low entry price, no unused retainer |
| Platform builds priced per project | New systems, designed and launched with the client | The larger first purchase for some clients |

---

## 3. Fit by segment

Scored 1 (weak) to 5 (strong) from the research. "Offer match" is how directly the offer above answers the segment's top problems.

| | India mid-market, regulated first | UAE SMB and lower mid-market | India SMB | US / UK / EU |
|---|---|---|---|---|
| **How painful the problem is** | **5.** Only 10–15% of GenAI pilots reach production (NASSCOM); missing governance is the top AI challenge at 53% (IBM); DPDP main obligations start 13 May 2027 | **4.** Only 12% of businesses pay for AI tools [VENDOR]; data residency questions are real | **4.** Run on WhatsApp and spreadsheets; 52.6% find choosing digital tools hard | **4.** Agency complaints are loudest here |
| **Ability to pay** | **4.** Real budgets, but 3–6+ month cycles and big buying groups | **3.** Local agencies charge $50–150/hr, so there's room above Indian rates | **2.** Very price-sensitive; Hyderabad median is $37/hr | **5** |
| **Offer match** | **5.** FDE + record + approval maps to what compliance and finance ask | **4.** Deployment choice and no-training terms answer residency directly | **3.** They want relief at a low price; governance reassures but doesn't sell | **4** |
| **Competition** | **4 (open).** Big IT firms start at $500M revenue; mid-size agencies compete on price | **3.** Local agencies sell compliance language, not governed delivery | **1.** Crowded and price-led | **2.** Nearshore and local firms, plus distrust of Indian vendors |
| **Can QUAICU reach them?** | **5.** In person; NASSCOM and T-Hub routes | **3.** Remote; GITEX and partner programmes | **4** | **2.** Needs SOC 2, reviews, references |
| **Proof needed** | ISO 27001, references, a paid pilot | Case studies, written residency terms | Low | SOC 2 Type II, reviews |
| **Verdict** | **Best fit. Focus here.** | **Second. Test with 2–3 clients.** | **Avoid as a target. Take good ones opportunistically.** | **Content only for now.** |

---

## 4. Fit by component

### Forward deployed engineer: strongest part of the offer, and its biggest cost

- **Fit:** the most common buyer complaints (people swapped mid-project, status calls without progress, "who actually did the work?") are all answered by one engineer who stays. The term already resonates with CTOs.
- **Risk:** it doesn't scale like software. The questions that decide whether this is a business:
  - How many clients can one FDE carry while keeping the "doesn't fade" promise? `[FILL]`
  - What does an FDE cost per month, fully loaded? `[FILL]`
  - How much of the FDE's time does the AI agent actually save, per client, per month? `[FILL]`
- **The AI agent is what makes the FDE affordable.** The real product is "one engineer can look after N clients well because the AI does the repeatable work". N is the most important number in the company.

### Per-ticket pricing: good for getting in, risky for keeping the FDE paid

- **Fit for SMBs:** easy to understand, low entry price, no unused retainer. No competitor was found publishing it for custom software.
- **Concern for mid-market:** budgets are unpredictable ("a ticket can take 5 minutes or 60"), and critics say it rewards closing tickets fast.
- **Clash with the FDE model:** the FDE is a fixed monthly cost; ticket revenue isn't. Fix: **a monthly base fee that covers the FDE, plus a bundle of sized tickets**, with extra tickets priced per ticket. Publish a ticket catalogue (small, medium, large, with examples) so buyers can predict spend.

### AI agent: sell the outcome, not the AI

- Buyers are tired of AI demos ("the rest are wrappers or science projects"). The agent fits when it's described by what it does for the client: minor bugs fixed and approved fast, major issues escalated at 2 AM, nothing forgotten.
- Risk: claims of speed ("instantly") need data before they go public.

### Governance and the record: a gate for mid-market, a comfort for SMBs

- For mid-market and regulated buyers it gets past compliance and finance, but only with recognised proof behind it (ISO 27001 first).
- For SMBs it answers "will this AI embarrass me or leak my data", but it isn't why they buy.

### Platform builds: likely the first purchase, and the way into support

- A build is how many clients will start. The fit question is whether build clients convert to ongoing FDE support. Track it.

---

## 5. Riskiest assumptions, and how to test them

Ordered by how badly the business suffers if each is wrong.

| # | Assumption | Evidence so far | Test (next 90 days) | Signal that it's true |
|---|---|---|---|---|
| 1 | One FDE can serve enough clients to be profitable | None yet | Log FDE hours per client per week, split by AI-handled vs person-handled work | Hours per client fall over time; N clients per FDE reaches your break-even `[FILL]` |
| 2 | Clients will pay a monthly base fee, not just per ticket | Per-ticket attracts SMBs; mid-market wants predictable budgets | Offer base + bundle to the next 3 prospects | 2 of 3 accept without pushing back to pure per-ticket |
| 3 | Indian mid-market firms will buy "AI from pilot to production" from a small vendor | Pain is measured (NASSCOM, IBM); buying groups are large | Offer a paid, fixed-scope pilot: take one stalled proof of concept to production | 1 signed paid pilot from a regulated-sector firm |
| 4 | "Service that doesn't fade" is believable without a track record | Agency decay is the top complaint | Publish the delivery record (on-time, response, clients still with their original FDE) | Prospects mention it unprompted; it shortens first calls |
| 5 | The lack of ISO 27001 doesn't block mid-market deals | Research: 77% reference SOC 2/ISO 27001/NIST in vendor requirements (secondary) | Track every deal lost or delayed for lack of certification | If 1+ deal stalls on it, certification becomes urgent |
| 6 | UAE SMBs will buy from a Hyderabad team | Residency is answerable; rates leave room; no first-hand buyer voices found | 10 discovery calls with UAE owners; 2–3 paid engagements | 2+ paying UAE clients by mid-January |
| 7 | Clients don't need speed promises in writing | Not tested | Ask in every discovery call what response time they'd need for a major issue | You can set a target you can meet, then publish it |

---

## 6. Measuring fit with 1 to 5 clients

A PMF survey (the "how would you feel if you could no longer use us?" question) needs around 40 responses to mean much. With 1 to 5 clients, use these instead:

| Signal | What to track | Fit looks like |
|---|---|---|
| Retention | Clients still active at month 6 and month 12 | Nobody leaves for reasons you control |
| Expansion | Tickets per client per month over time; builds that turn into support | Usage grows without you pushing |
| Pull | Referrals and introductions from clients | At least 1 unprompted referral |
| Dependence | Talk to each client 1:1 (questions below) | They describe QUAICU as part of how they run, not a vendor |
| Unit economics | Gross margin per client after FDE time | Positive and improving as the AI handles more |
| Inbound | Leads from the Month Twelve campaign that mention it | First by week 10–13 |

### Client interview (20 minutes, each client, every quarter)

1. What were you using before QUAICU, and why did you change?
2. What would you do if QUAICU stopped tomorrow?
3. What's the one thing we do that you'd miss most?
4. Has anything got worse since the first month? *(the "doesn't fade" test)*
5. Have you told anyone about us? What did you say?
6. What almost stopped you from signing?
7. If you were paying for this out of your own budget, what would feel like a fair price?

Write down their exact words. They feed the content playbook's problem bank too.

---

## 7. What this means for the next 90 days

1. **Fix the price structure:** monthly base (covers the FDE) + ticket bundle + per-ticket overage, with a published ticket catalogue.
2. **Measure N:** FDE hours per client, AI-handled vs person-handled, from this week.
3. **Sell one paid pilot** to an Indian mid-market firm in a regulated sector: one stalled AI proof of concept taken to production.
4. **Run 10 UAE discovery calls** before investing more in UAE content.
5. **Start ISO 27001 scoping** (it's already in the campaign plan for Days 31–60).
6. **Interview every current client** with the questions above, then update this assessment in January.

The Month Twelve campaign stays as planned: it builds demand in the best-fit segment and tests assumption 4 in public.

---

## 8. What I need from you to sharpen this

- Number of clients, and for each: segment, country, start date, build or support
- Monthly revenue per client and tickets per client per month
- FDE fully loaded monthly cost, and how many clients each FDE carries today
- Share of tickets the AI agent handles end to end (with approval) vs those that need the FDE's own work
- Any deal lost so far, and why
