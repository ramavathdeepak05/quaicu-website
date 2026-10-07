// QUAICU shared site JS
// =====================
// - Live kernel ticker
// - Reveal on scroll
// - Active nav

(function () {
  // ---- reveal on scroll ----
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // Active nav is handled by assets/nav.js (which knows about /blog/ paths).

  // ---- year ----
  document.querySelectorAll("[data-year]").forEach((n) => (n.textContent = new Date().getFullYear()));
})();

// ---- LIVE KERNEL STREAM ----
// Each line of the ticker = one AI action flowing through Propose → Enforce → Approve.
(function () {
  const root = document.querySelector("[data-kernel]");
  if (!root) return;

  const cols = {
    propose: root.querySelector('[data-stream="propose"]'),
    enforce: root.querySelector('[data-stream="enforce"]'),
    approve: root.querySelector('[data-stream="approve"]'),
  };
  const counters = {
    proposed: root.querySelector('[data-count="proposed"]'),
    blocked: root.querySelector('[data-count="blocked"]'),
    approved: root.querySelector('[data-count="approved"]'),
    pending: root.querySelector('[data-count="pending"]'),
  };

  let state = { proposed: 18432, blocked: 142, approved: 14209, pending: 27 };

  // Pool of illustrative support and build actions (demo only)
  const actions = [
    { id: "TKT", op: "triage_ticket", actor: "Support·Intake", policy: "Scope_Check", approver: "Engineer", risk: "low" },
    { id: "FIX", op: "draft_bug_fix", actor: "Support·Engine", policy: "Change_Review", approver: "Engineer", risk: "med" },
    { id: "REL", op: "ship_release", actor: "Build·Release", policy: "Dual_Control", approver: "Lead", risk: "high" },
    { id: "MIG", op: "run_db_migration", actor: "Build·Data", policy: "Air_Gap+Dual", approver: "Lead", risk: "high" },
    { id: "UPD", op: "update_client", actor: "Support·Manager", policy: "Consent+Throttle", approver: "Manager", risk: "low" },
    { id: "DOC", op: "draft_release_notes", actor: "Build·Docs", policy: "Style_Check", approver: "Engineer", risk: "low" },
    { id: "TST", op: "run_regression_suite", actor: "Build·QA", policy: "Hash_Chain", approver: "", risk: "low" },
    { id: "DEP", op: "deploy_to_staging", actor: "Build·Infra", policy: "Env_Boundary", approver: "Lead", risk: "med" },
    { id: "PRD", op: "deploy_to_production", actor: "Build·Infra", policy: "Dual_Control", approver: "Lead", risk: "high" },
    { id: "ACC", op: "grant_repo_access", actor: "Support·Access", policy: "Least_Privilege", approver: "Manager", risk: "med" },
    { id: "RCA", op: "draft_root_cause", actor: "Support·Engine", policy: "Change_Review", approver: "Engineer", risk: "med" },
    { id: "SCP", op: "draft_scope_summary", actor: "Build·Scoping", policy: "Scope_Check", approver: "Manager", risk: "low" },
    { id: "SEC", op: "apply_security_patch", actor: "Support·Infra", policy: "Change_Review", approver: "Lead", risk: "high" },
    { id: "BKP", op: "verify_backup", actor: "Support·Infra", policy: "Det_Only", approver: "", risk: "low" },
    { id: "INV", op: "prepare_ticket_summary", actor: "Support·Manager", policy: "Three_Way_Match", approver: "Manager", risk: "med" },
    { id: "RVW", op: "request_code_review", actor: "Build·Engine", policy: "HITL_Review", approver: "Engineer", risk: "low" },
  ];

  const now = () => {
    const d = new Date();
    return (
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0") +
      ":" +
      String(d.getSeconds()).padStart(2, "0") +
      "." +
      String(d.getMilliseconds()).padStart(3, "0").slice(0, 2)
    );
  };

  const seq = () => Math.floor(700000 + Math.random() * 99999);

  const addRow = (col, html, cls = "") => {
    const div = document.createElement("div");
    div.className = "kernel-row " + cls;
    div.innerHTML = html;
    col.prepend(div);
    // cap rows to avoid memory growth
    while (col.children.length > 14) col.removeChild(col.lastChild);
  };

  const updateCounters = () => {
    if (counters.proposed) counters.proposed.textContent = state.proposed.toLocaleString();
    if (counters.blocked) counters.blocked.textContent = state.blocked.toLocaleString();
    if (counters.approved) counters.approved.textContent = state.approved.toLocaleString();
    if (counters.pending) counters.pending.textContent = state.pending.toLocaleString();
  };

  const runOne = () => {
    const a = actions[Math.floor(Math.random() * actions.length)];
    const id = "#" + seq();
    const t = now();
    // PROPOSE
    addRow(
      cols.propose,
      `<div class="row-top"><span>${t}</span><span>${id}</span></div>
       <div class="row-body">${a.actor} → <strong>${a.op}()</strong></div>`,
      "kr-wait"
    );
    state.proposed++;
    state.pending++;
    updateCounters();

    // ENFORCE (after 600–1100ms)
    setTimeout(() => {
      // ~8% block rate
      const block = Math.random() < 0.08;
      addRow(
        cols.enforce,
        `<div class="row-top"><span>${now()}</span><span>${id} · ${a.policy}</span></div>
         <div class="row-body row-stat">${block ? "BLOCK · policy violation" : "PASS · within authority"}</div>`,
        block ? "kr-block" : "kr-pass"
      );
      if (block) {
        state.blocked++;
        state.pending--;
        updateCounters();
        return;
      }

      // APPROVE (after 700–1400ms)
      setTimeout(() => {
        // 'auto' actor cases auto-approve, else queue for human
        const autoOk = a.approver === "" || a.approver.startsWith("Auto");
        addRow(
          cols.approve,
          `<div class="row-top"><span>${now()}</span><span>${id} · ${a.approver}</span></div>
           <div class="row-body row-stat">${autoOk ? "AUTO · ledger-sealed" : "APPROVED · " + a.approver}</div>`,
          "kr-ok"
        );
        state.approved++;
        state.pending--;
        updateCounters();
      }, 700 + Math.random() * 700);
    }, 600 + Math.random() * 500);
  };

  // seed a few rows so it doesn't start empty
  for (let i = 0; i < 4; i++) setTimeout(runOne, i * 250);

  // main loop
  setInterval(runOne, 1400);
  updateCounters();
})();

// ---- MOTION LAYER ----
// Scroll reveals, headline rises, count-ups, self-typing code blocks, a signal
// travelling through the stack diagrams and a slow drift on the image bands.
// Skipped entirely when the visitor prefers reduced motion; nothing is hidden
// unless this script runs (styles are gated by html.motion).
(function () {
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  if ((mq && mq.matches) || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");

  const seen = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("m-in");
        seen.unobserve(e.target);
        pending.delete(e.target);
        if (e.target._mOnIn) e.target._mOnIn();
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  const pending = new Set();
  const watch = (el, delay) => {
    if (delay) el.style.setProperty("--m-d", delay + "ms");
    pending.add(el);
    seen.observe(el);
  };
  // Safety net for fast scrolls: anything already above the fold's bottom edge is shown,
  // even if it flew past between two observer checks.
  let sweepQueued = false;
  const sweep = () => {
    sweepQueued = false;
    const vh = window.innerHeight;
    pending.forEach((el) => {
      if (el.classList.contains("m-in")) return pending.delete(el);
      if (el.getBoundingClientRect().top < vh) {
        el.classList.add("m-in");
        seen.unobserve(el);
        pending.delete(el);
        if (el._mOnIn) el._mOnIn();
      }
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!sweepQueued && pending.size) {
        sweepQueued = true;
        setTimeout(sweep, 200);
      }
    },
    { passive: true }
  );
  const insideTagged = (el) => el.parentElement && el.parentElement.closest(".m-r, .m-split");

  // 1. headlines rise line by line (lines are the <br>-separated runs)
  document
    .querySelectorAll(".hero h1, .page-hero h1, .section-head h2, h2.display")
    .forEach((h) => {
      if (insideTagged(h)) return;
      const lines = [[]];
      Array.from(h.childNodes).forEach((n) => {
        if (n.nodeName === "BR") lines.push([]);
        else lines[lines.length - 1].push(n);
      });
      const kept = lines.filter((ln) => ln.some((n) => n.nodeType !== 3 || n.textContent.trim()));
      if (!kept.length) return;
      h.textContent = "";
      kept.forEach((ln, i) => {
        const outer = document.createElement("span");
        const inner = document.createElement("span");
        outer.className = "m-line";
        inner.className = "m-li";
        inner.style.setProperty("--m-d", i * 90 + "ms");
        ln.forEach((n) => inner.appendChild(n));
        outer.appendChild(inner);
        h.appendChild(outer);
      });
      h.classList.add("m-split");
      watch(h);
    });

  // 2. section dividers carry a one-off signal sweep
  document.querySelectorAll(".section-head").forEach((s) => watch(s));

  // 3. staggered reveals: groups first, then single elements not already inside a group
  const groups = [
    ["section:not(.hero):not(.page-hero) .grid-12", ':scope > [class*="col-"]'],
    [".kpi", ":scope > div"],
    ["table.brutal tbody", ":scope > tr"],
    [".planes", ":scope > .plane"],
    [".enforce-grid", ":scope > div"],
    [".module-grid", ":scope > div"],
    [".roles-grid", ":scope > div"],
    [".partners-grid", ":scope > div"],
    [".gates-row", ":scope > div"],
    [".hybrid-split", ":scope > div"],
    [".notes-list", ":scope > *"],
  ];
  groups.forEach(([parentSel, childSel]) => {
    document.querySelectorAll(parentSel).forEach((p) => {
      let i = 0;
      p.querySelectorAll(childSel).forEach((c) => {
        if (insideTagged(c) || c.classList.contains("m-r")) return;
        c.classList.add("m-r");
        watch(c, Math.min(i++ * 80, 560));
      });
    });
  });
  const singles = [
    ".hero .eyebrow", ".hero .lead", ".hero .row", ".hero p.muted",
    ".page-hero .breadcrumb", ".page-hero .eyebrow", ".page-hero .lead", ".page-hero .rule-l",
    ".section-head .kicker", ".atmos-caption", ".appwin-wrap--stack", ".mermaid-frame",
    ".band-foundation", ".legal-block", ".form-block", ".form-aside",
    ".m-viz", ".m-steps",
  ];
  let k = 0;
  document.querySelectorAll(singles.join(",")).forEach((el) => {
    if (insideTagged(el) || el.classList.contains("m-r")) return;
    el.classList.add("m-r");
    const inHero = el.closest(".hero, .page-hero");
    watch(el, inHero ? 150 + (k++ % 4) * 90 : 0);
  });

  // 4. numeric stat tiles count up
  document.querySelectorAll(".kpi .v").forEach((v) => {
    const t = v.textContent.trim();
    if (!/^\d+$/.test(t)) return;
    const end = parseInt(t, 10);
    const pad = t.length;
    v.textContent = "0".padStart(pad, "0");
    v._mOnIn = () => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 900);
        v.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3)))).padStart(pad, "0");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    watch(v);
  });

  // 5. code blocks type out line by line, then show a caret
  document.querySelectorAll(".codeblock").forEach((cb) => {
    const lines = Array.from(cb.children);
    lines.forEach((ln, i) => {
      ln.classList.add("m-code");
      ln.style.setProperty("--m-d", 200 + i * 110 + "ms");
    });
    const last = lines[lines.length - 1];
    if (last) {
      const caret = document.createElement("span");
      caret.className = "m-caret";
      caret.setAttribute("aria-hidden", "true");
      caret.style.setProperty("--m-d", 200 + lines.length * 110 + "ms");
      last.appendChild(caret);
    }
    watch(cb);
  });

  // 6. stack diagrams: a signal runs through the chips while the diagram is on screen
  document.querySelectorAll(".kernel--stack").forEach((st) => {
    const chips = st.querySelectorAll(".kernel-stack-body .chip:not(.chip--accent)");
    if (!chips.length) return;
    const stepMs = 240;
    st.style.setProperty("--m-cycle", Math.max(chips.length * stepMs + 1800, 4200) + "ms");
    chips.forEach((c, i) => c.style.setProperty("--m-i-d", i * stepMs + "ms"));
    new IntersectionObserver(
      (es) => es.forEach((e) => st.classList.toggle("m-live", e.isIntersecting)),
      { threshold: 0.2 }
    ).observe(st);
  });

  // 7. image bands drift a little as they pass (desktop pointers only)
  const fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  if (fine) {
    const bands = new Set();
    const bandIo = new IntersectionObserver((es) =>
      es.forEach((e) => (e.isIntersecting ? bands.add(e.target) : bands.delete(e.target)))
    );
    document.querySelectorAll(".atmos").forEach((b) => bandIo.observe(b));
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      bands.forEach((b) => {
        const r = b.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        b.style.setProperty("--m-par", (p * -24).toFixed(1) + "px");
      });
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  // Printing shows everything.
  window.addEventListener("beforeprint", () =>
    document.querySelectorAll(".m-r, .m-split, .codeblock, .section-head").forEach((el) => el.classList.add("m-in"))
  );
})();

// ---- MOTION ELEMENTS ----
// Loops on the illustrative diagrams run only while they are on screen, and only
// when the motion layer is active. Without it they show their finished state.
(function () {
  if (!document.documentElement.classList.contains("motion")) return;

  // on-screen toggle for every looping element
  const live = new IntersectionObserver(
    (es) => es.forEach((e) => e.target.classList.toggle("m-live", e.isIntersecting)),
    { threshold: 0.15 }
  );

  // proof page: a signal moves across the kernel modules
  document.querySelectorAll(".module-grid").forEach((g) => {
    const cells = g.querySelectorAll(":scope > div");
    const step = 220;
    g.style.setProperty("--m-cycle", Math.max(cells.length * step + 1800, 4200) + "ms");
    cells.forEach((c, i) => c.style.setProperty("--m-i-d", i * step + "ms"));
    live.observe(g);
  });
  document.querySelectorAll("[data-m-live]").forEach((el) => live.observe(el));

  // ticket journey: a ticket walks Raised -> Engine -> Review -> Delivered, then the next one starts
  const tickets = [
    ["#T-2041", "Bug report"],
    ["#T-2042", "Minor feature update"],
    ["#T-2043", "Bug report"],
    ["#T-2044", "Minor feature update"],
  ];
  const msgs = [
    "Ticket raised. We get to work.",
    "Our AI engine takes the repeatable work.",
    "A person reviews it before anything ships.",
    "Delivered. Billed as one ticket.",
  ];
  document.querySelectorAll("[data-m-journey]").forEach((j) => {
    const stations = j.querySelectorAll(".mj-st");
    const card = j.querySelector(".mj-ticket");
    const id = j.querySelector(".mj-id");
    const type = j.querySelector(".mj-type");
    const msg = j.querySelector(".mj-msg");
    let t = 0;
    let step = 0;
    const render = () => {
      j.style.setProperty("--mj-step", step);
      j.style.setProperty("--mj-p", step / 3);
      stations.forEach((s, i) => {
        s.classList.toggle("is-done", i < step);
        s.classList.toggle("is-active", i === step);
      });
      msg.textContent = msgs[step];
    };
    const tick = () => {
      if (j.classList.contains("m-live")) {
        if (step < 3) {
          step++;
          render();
        } else {
          // next ticket: hide, jump back to the start, show again
          card.classList.add("is-reset");
          t = (t + 1) % tickets.length;
          step = 0;
          render();
          id.textContent = tickets[t][0];
          type.textContent = tickets[t][1];
          requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("is-reset")));
        }
      }
      setTimeout(tick, step === 3 ? 2600 : 1700);
    };
    render();
    setTimeout(tick, 1700);
  });
})();

// ---- LEAD TRACKING ----
// Sends events to the Google Tag Manager data layer (the container is already on every page).
// The tags in Tag Manager only fire once the visitor has accepted analytics (see COOKIE CONSENT
// below). It also remembers where a visit started, so a contact-form message can say how the
// person found us: that is stored in sessionStorage (cleared when the tab closes), and only
// after the visitor has accepted analytics. Everything here is optional and fails quietly if
// storage or the data layer is unavailable.
(function () {
  var KEY = "qFirstTouch";
  function read() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function write(v) {
    try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
  }
  function consented() {
    try { return localStorage.getItem("qConsent") === "granted"; } catch (e) { return false; }
  }

  function start() {
    if (read()) return;
    var q = new URLSearchParams(location.search);
    var ref = "";
    try {
      if (document.referrer && new URL(document.referrer).origin !== location.origin) ref = document.referrer.slice(0, 200);
    } catch (e) {}
    write({
      landing: location.pathname,
      referrer: ref,
      source: (q.get("utm_source") || "").slice(0, 60),
      medium: (q.get("utm_medium") || "").slice(0, 60),
      campaign: (q.get("utm_campaign") || "").slice(0, 60),
    });
  }
  function stop() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
  }
  if (consented()) start();

  window.qStartAttribution = start;
  window.qStopAttribution = stop;
  window.qFirstTouch = read;
  window.qTrack = function (name, params) {
    var evt = { event: name };
    for (var k in params || {}) evt[k] = params[k];
    (window.dataLayer = window.dataLayer || []).push(evt);
  };

  // Every link to the contact page counts as an intent signal.
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^(https:\/\/quaicu\.org)?\/contact(?:[#?]|$)/.test(href)) {
      window.qTrack("cta_click", {
        cta_text: (a.textContent || "").trim().slice(0, 60),
        cta_url: href,
        page_path: location.pathname,
      });
    }
  });
})();

// ---- COOKIE CONSENT ----
// Every page head sets Consent Mode to "denied" before Tag Manager loads. This shows a small bar
// on the first visit, records the choice in localStorage and tells Tag Manager. "Cookie settings"
// in the footer reopens it. Decline and Accept carry equal weight.
(function () {
  var KEY = "qConsent";
  function get() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function set(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  function update(v) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag("consent", "update", { analytics_storage: v });
  }

  function close() {
    var bar = document.querySelector(".consent-bar");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }
  function choose(v) {
    set(v);
    update(v);
    if (v === "granted") { if (window.qStartAttribution) window.qStartAttribution(); }
    else if (window.qStopAttribution) window.qStopAttribution();
    close();
  }
  function show(focus) {
    if (document.querySelector(".consent-bar")) return;
    var bar = document.createElement("div");
    bar.className = "consent-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Cookie consent");
    bar.innerHTML =
      '<p class="consent-text">We use analytics cookies to see how the site is used. They stay off unless you accept. ' +
      '<a href="/legal#privacy">Privacy Policy</a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn" data-consent="denied">Decline</button>' +
      '<button type="button" class="btn" data-consent="granted">Accept</button>' +
      "</div>";
    bar.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-consent]") : null;
      if (b) choose(b.getAttribute("data-consent"));
    });
    document.body.appendChild(bar);
    if (focus) {
      var first = bar.querySelector("button");
      if (first) first.focus();
    }
  }

  if (!get()) show(false);

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("[data-cookie-settings]") : null;
    if (a) {
      e.preventDefault();
      show(true);
    }
  });
})();
