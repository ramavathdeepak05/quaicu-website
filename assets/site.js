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

  // Pool of plausible institutional AI actions
  const actions = [
    { id: "ADM", op: "grant_offer_letter", actor: "ALIS·Admissions", policy: "DPDP+Consent", approver: "Registrar", risk: "med" },
    { id: "FIN", op: "post_journal_entry", actor: "ALIS·Finance", policy: "SOD+CFO_Sign", approver: "CFO", risk: "high" },
    { id: "ACA", op: "publish_lesson_plan", actor: "ALIS·Academics", policy: "Curriculum_Auth", approver: "Dean", risk: "low" },
    { id: "EXA", op: "release_results", actor: "ALIS·Exams", policy: "Dual_Control", approver: "CoE", risk: "high" },
    { id: "HR ", op: "process_payroll_run", actor: "ALIS·HR", policy: "Det_Calc+Audit", approver: "Director_HR", risk: "high" },
    { id: "GRV", op: "triage_grievance", actor: "ALIS·StudentSvc", policy: "SLA<24h", approver: "Auto+SPOC", risk: "low" },
    { id: "REG", op: "compile_NAAC_evid", actor: "ALIS·Regulatory", policy: "Hash_Chain", approver: "Coordinator", risk: "med" },
    { id: "RES", op: "score_grant_propos", actor: "ALIS·Research", policy: "IP_Boundary", approver: "Dean_Research", risk: "med" },
    { id: "COM", op: "send_bulk_advisory", actor: "ALIS·Comms", policy: "Consent+Throttle", approver: "Communications", risk: "low" },
    { id: "FEE", op: "version_fee_schedule", actor: "ALIS·Finance", policy: "Versioned+VC", approver: "VC", risk: "high" },
    { id: "CER", op: "issue_certificate", actor: "ALIS·StudentSvc", policy: "Signed_Ledger", approver: "Registrar", risk: "med" },
    { id: "ATT", op: "flag_attendance_anomaly", actor: "ALIS·HR", policy: "HITL_Review", approver: "HOD", risk: "low" },
    { id: "PRO", op: "assemble_question_paper", actor: "ALIS·Exams", policy: "Air_Gap+Dual", approver: "CoE", risk: "high" },
    { id: "RIS", op: "raise_student_risk_flag", actor: "ALIS·Academics", policy: "Confidential", approver: "Mentor", risk: "med" },
    { id: "REC", op: "reconcile_ledger", actor: "ALIS·Finance", policy: "Det_Only", approver: "", risk: "low" },
    { id: "INV", op: "validate_invoice", actor: "ALIS·Finance", policy: "Three_Way_Match", approver: "AP_Manager", risk: "med" },
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
