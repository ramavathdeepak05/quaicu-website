// 2. Tension: AI writes code fast, but nobody is on the hook for it.

import { h, lines, rise, show, outro, prog, blink, clamp, ease, pulse } from "../lib.js";
import { COPY } from "../copy.js";

const CODE = `// TCK-2041 · checkout times out under load
export async function applyFix(ticket: Ticket) {
  const diff = await engine.draftFix(ticket);
  const tests = await engine.writeTests(diff);
  if (!tests.pass) return engine.retry(ticket);

  await repo.commit(diff, { message: ticket.title });
  await deploy.toProduction(diff);
  return { status: "shipped" };
}

export async function migrate(db: Database) {
  const plan = await engine.planMigration(db.schema);
  for (const step of plan.steps) {
    await db.run(step.sql);
  }
  await cache.flush("orders");
  return plan.summary;
}

export async function grantAccess(user: User) {
  await repo.addMember(user, { role: "admin" });
  await notify.team(\`\${user.name} added\`);
}`;

const KW = /\b(export|async|function|const|await|return|if|for|of)\b/g;

function highlight(line) {
  if (line.trim().startsWith("//")) return `<span class="cm">${line}</span>`;
  return line
    .replace(/("[^"]*"|`[^`]*`)/g, '<span class="st">$1</span>')
    .replace(KW, '<span class="kw">$1</span>');
}

export default {
  build({ dur }) {
    const c = COPY.tension;
    const k = Math.min(1, dur / 4);
    const el = h("div", "scene s-tension");

    const text = h("div", "text");
    el.append(text);
    const a = lines(text, c.white, "display hl");
    const b = lines(text, c.grey.map((t) => ({ text: t, cls: "dim" })), "display hl hl2");

    const panel = h("div", "code-panel");
    panel.innerHTML = `
      <div class="cp-head">
        <span class="cp-file">${c.file}</span>
        <span class="cp-flag"><span class="sq"></span>${c.flag}</span>
        <span class="cp-status"><span class="lamp"></span>${c.status}</span>
      </div>
      <div class="cp-body"><div class="cp-scroll"></div></div>
      <div class="cp-foot"><span class="cp-count"></span><span>approver: <b>none</b></span></div>`;
    el.append(panel);
    const scroll = panel.querySelector(".cp-scroll");
    const count = panel.querySelector(".cp-count");
    const flag = panel.querySelector(".cp-flag");
    const lamp = panel.querySelector(".lamp");

    const codeLines = CODE.split("\n");
    const total = CODE.length;
    const T = { a: 0.08, b: 1.35 * k, panel: 0.15, code: 0.35, flag: 1.5 * k };
    const cps = 190;
    const lineH = 40;

    return {
      el,
      update(t) {
        rise(a.inners, t, T.a, { stagger: 0.1 });
        rise(b.inners, t, T.b, { stagger: 0.1 });
        show(panel, t, T.panel, 0.6, 30);

        // Stream the code in, character by character, and keep the newest
        // line in view.
        const n = Math.floor(clamp((t - T.code) * cps, 0, total));
        let left = n, html = "", shown = 0, frac = 0;
        for (const ln of codeLines) {
          if (left <= 0) break;
          const part = ln.slice(0, left);
          left -= ln.length + 1;
          shown++;
          frac = Math.min(1, part.length / Math.max(1, ln.length));
          const caret = left <= 0 ? `<span class="caret" style="opacity:${blink(t, 3) ? 1 : 0.2}"></span>` : "";
          html += `<div class="cl">${highlight(part) || "&nbsp;"}${caret}</div>`;
        }
        scroll.innerHTML = html;
        const visible = 13;
        const y = Math.max(0, shown - 1 + frac - (visible - 1)) * lineH;
        scroll.style.transform = `translate3d(0, ${-y}px, 0)`;
        count.textContent = `+${Math.max(0, shown)} lines · 0 reviewed`;

        lamp.style.opacity = 0.35 + 0.65 * pulse(t, 0.7);
        const pf = prog(t, T.flag, 0.3, ease.out);
        flag.style.opacity = pf * (blink(t - T.flag, 1.1) ? 1 : 0.55);

        outro(el, t, dur, 0.28);
      },
      cues: () => [
        { t: T.code, type: "stream", dur: Math.min(dur - T.code - 0.3, total / cps) },
        { t: T.b, type: "swell" },
      ],
    };
  },
};
