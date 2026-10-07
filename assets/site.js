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
