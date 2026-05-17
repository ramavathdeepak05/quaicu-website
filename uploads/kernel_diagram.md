# ALIS — Core Kernel Architecture

> `server/core/` · `server/process_engine/` — *Governed Autonomy Kernel*

```mermaid
graph TB
    %% ── Inbound ──────────────────────────────────────────────────────
    REQ(["Inbound Request\n(FastAPI Router / Celery Task)"])

    %% ── L4: Global Locks ─────────────────────────────────────────────
    subgraph L4["L4 · Global Lock Precedence"]
        FIN_LOCK["🔒 Financial Lock\n(Highest)"]
        ACA_LOCK["🔒 Academic Lock"]
        DIS_LOCK["🔒 Disciplinary Lock"]
        REG_LOCK["🔒 Regulatory Lock"]
        FIN_LOCK --> ACA_LOCK --> DIS_LOCK --> REG_LOCK
    end

    %% ── L5: Authority ────────────────────────────────────────────────
    subgraph L5["L5 · Authority & Quorum"]
        RBAC["RBAC\nrequire_permission\nverify_access (ABAC)"]
        QUORUM["ApprovalManager\nQuorum Engine"]
    end

    %% ── L3: State Machine ────────────────────────────────────────────
    subgraph L3["L3 · State Machine"]
        STATE_REG["StateRegistry\nvalidate_transition()"]
    end

    %% ── Constitutional Layer ─────────────────────────────────────────
    subgraph CONST["Policy Engine · Constitutional Layer"]
        PE["PolicyEngine\npolicy_engine.py"]
        PS["PolicyService\nDRAFT → SUBMITTED → ACTIVATED"]
        PR["PolicyResolver\nRequirePolicy dependency"]
        PSIM["PolicySimulation\nShadow-run before activation"]
        PE --> PR
        PS --> PE
        PSIM --> PE
    end

    %% ── Process Engine ───────────────────────────────────────────────
    subgraph PROC["Process Engine · Execution Runtime"]
        FORM["FORM Step\nCollects input → DRAFT"]
        APPR["APPROVAL Step\nRoutes to Quorum"]
        COND["CONDITION Step\nPolicy Engine branch"]
        AI_STEP["AI_EVALUATION Step\nBaseALISAgent · Advisory only"]
        AUTO["AUTO_ACTION Step\nDeterministic mutation"]
        UNDO["UndoSequence\n90-hour reversal workflow"]
    end

    %% ── L2: AI Advisory ──────────────────────────────────────────────
    subgraph L2["L2 · Agent Advisory (AI Gateway)"]
        AIGT["AIGateway\ninvoke_ai()"]
        GUARD["AIGuardrails\ntoxicity · hallucination · policy"]
        HITL["HITL Router\nconfidence < 0.60 → escalate"]
        LLMR["LLM Router\nOllama local — no external net"]
        AIR["AIResponse\nstate_impact = DRAFT only"]
        AIGT --> GUARD --> HITL --> LLMR --> AIR
    end

    %% ── L1: Module Isolation ─────────────────────────────────────────
    subgraph L1["L1 · Module Isolation · Event Bus"]
        DEB["DomainEventBus\ndomain_events.py"]
        DB_PERSIST["Event persisted to DB\nbefore Celery dispatch"]
        CELERY["Celery Workers\nidempotent handlers"]
        DEB --> DB_PERSIST --> CELERY
    end

    %% ── L6: Audit Ledger ─────────────────────────────────────────────
    subgraph L6["L6 · Resilience · Audit Ledger"]
        AL["AuditLedger\nhash-chained · immutable"]
        SNAP["Snapshot\npolicy_version · model_version\nprompt_version · logic_version"]
        REPLAY["Forensic Replay\ndeterministic re-run"]
        AL --> SNAP --> REPLAY
    end

    %% ── Storage ──────────────────────────────────────────────────────
    DB[("PostgreSQL\n+ pgvector\nTenant RLS")]

    %% ── Flow ─────────────────────────────────────────────────────────
    REQ --> L4
    L4 -->|"Locks cleared"| L5
    L5 -->|"RBAC + Quorum passed"| L3
    L3 -->|"Transition legal"| CONST
    CONST -->|"Policy verdict: ELIGIBLE / PASS"| PROC
    PROC -->|"AI_EVALUATION step"| L2
    L2 -->|"DRAFT advisory returned"| PROC
    PROC -->|"AUTO_ACTION emits event"| L1
    PROC -->|"Atomic write + hash"| L6
    L6 --> DB
    L1 --> DB

    %% ── Rejection paths ──────────────────────────────────────────────
    L4 -->|"LOCKED"| HALT["🛑 HALT\nFail-closed"]
    L5 -->|"UNAUTHORIZED"| HALT
    L3 -->|"Illegal transition"| HALT
    CONST -->|"BLOCK / REJECT"| HALT

    %% ── Styling ──────────────────────────────────────────────────────
    style L4 fill:#1a1a2e,stroke:#e94560,color:#fff
    style L5 fill:#16213e,stroke:#f5a623,color:#fff
    style L3 fill:#0f3460,stroke:#4fc3f7,color:#fff
    style CONST fill:#1b2838,stroke:#a8dadc,color:#fff
    style PROC fill:#1b2838,stroke:#90caf9,color:#fff
    style L2 fill:#1a1a2e,stroke:#ce93d8,color:#fff
    style L1 fill:#0a1628,stroke:#80cbc4,color:#fff
    style L6 fill:#1b2838,stroke:#ffcc80,color:#fff
    style HALT fill:#7f0000,stroke:#ff1744,color:#fff
    style DB fill:#263238,stroke:#546e7a,color:#fff
    style REQ fill:#004d40,stroke:#00e676,color:#fff
```

## Kernel Component Map

| Layer | File | Role |
|---|---|---|
| **L1 — Event Bus** | `core/domain_events.py` | Durable cross-module messaging; events persisted before Celery dispatch |
| **L2 — AI Gateway** | `core/ai_gateway.py` | PII masking, guardrails, HITL routing, DRAFT-only output contract |
| **L3 — State Machine** | `core/state_registry.py` | Enforces legal transition paths for every domain entity |
| **L4 — Global Locks** | `core/locks.py` | Financial → Academic → Disciplinary → Regulatory precedence |
| **L5 — Authority** | `core/rbac.py` + `core/approvals.py` | RBAC `@require_permission` + `ApprovalManager` quorum |
| **L6 — Audit Ledger** | `core/audit.py` | Immutable hash-chain; snapshots `policy_version`, `model_version` |
| **Policy Engine** | `core/policy_engine.py` | Rules-as-data (`asteval`); verdicts: ELIGIBLE / PASS / BLOCK / REJECT |
| **Process Engine** | `process_engine/` | Stateful multi-step workflow runtime (FORM, APPROVAL, AI, AUTO_ACTION) |
| **Undo Sequence** | `core/undo_sequence.py` | 90-hour formal reversal — workflow, not DB rollback |
