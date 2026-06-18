import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const prismWeights = { P: 0.25, R: 0.15, I: 0.2, S: 0.25, M: 0.15 };
const specialistPrismWeights = { P: 0.15, R: 0.1, I: 0.35, S: 0.15, M: 0.25 };

app.use(cors());
app.use(express.json());

app.get("/api/render-health", (_req, res) => {
  res.json({
    ok: true,
    service: "GSIL Backend",
    mode: "render-startup",
    time: new Date().toISOString()
  });
});

function clampScore(value) {
  return Math.max(1, Math.min(10, Number(value)));
}

function calculatePrismScore(dimensions, specialist = false) {
  const weights = specialist ? specialistPrismWeights : prismWeights;
  return Object.entries(weights).reduce((sum, [dimension, weight]) => {
    return sum + Number(dimensions[dimension] || 0) * weight;
  }, 0);
}

function statusFromScore(score) {
  if (score >= 7.5) return "green";
  if (score >= 6.7) return "amber";
  return "red";
}

function confidenceToTrustScore(confidence) {
  if (confidence === "High") return 88;
  if (confidence === "Low") return 46;
  return 70;
}

function trustScoreToConfidence(score) {
  if (score >= 80) return "High";
  if (score < 60) return "Low";
  return "Medium";
}

function clampTrustScore(value) {
  return Math.max(20, Math.min(98, Number(value)));
}

function actorFromRequest(req, fallback = "Backend Demo Reviewer") {
  return req.headers["x-gsil-user"] || req.body?.reviewer || fallback;
}

async function ensureOperationalTables() {
  await query(`
    create table if not exists tasks (
      id uuid primary key default gen_random_uuid(),
      vendor_id uuid references vendors(id) on delete set null,
      signal_id uuid references signals(id) on delete set null,
      title text not null,
      vendor_name text,
      stage text not null default 'To Review',
      owner text not null default 'Procurement Owner',
      due text not null default 'This week',
      action text,
      source text not null default 'manual',
      metadata jsonb not null default '{}'::jsonb,
      created_by text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists decisions (
      id uuid primary key default gen_random_uuid(),
      vendor_id uuid references vendors(id) on delete set null,
      action text not null,
      owner text not null default 'Procurement Owner',
      context text,
      status text not null default 'open',
      metadata jsonb not null default '{}'::jsonb,
      created_by text,
      created_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_tasks_vendor_stage on tasks(vendor_id, stage)");
  await query("create index if not exists idx_decisions_vendor_created on decisions(vendor_id, created_at desc)");
}

function signalTemplates() {
  return {
    "vendor-pwc-india": [
      {
        title: "PwC India rate-card variance needs review",
        summary: "Invoice sampling shows 2.9% blended rate variance across 126 line items, equal to estimated INR 11.2 lakh quarterly exposure against the active advisory rate card.",
        sourceName: "Approved Market Intelligence",
        type: "Financial",
        sentiment: "Negative",
        dimension: "S",
        impact: 5,
        confidence: 86,
        aiExplanation: "Rate-card variance is vendor-specific and directly affects Score & Value.",
        evidence: { metric: "rate variance", current: "2.9%", exposure: "INR 11.2 lakh", sample_size: 126 }
      }
    ],
    "vendor-ey-india": [
      {
        title: "EY India advisory dependency concentration rises",
        summary: "EY India now owns 61% of open tax advisory requests, up from 49% last quarter, creating continuity risk for quarter-close support.",
        sourceName: "Approved Market Intelligence",
        type: "Risk",
        sentiment: "Negative",
        dimension: "R",
        impact: 6,
        confidence: 85,
        aiExplanation: "Concentration movement is vendor-specific and maps to Risk Profile.",
        evidence: { metric: "request concentration", current: "61%", previous: "49%" }
      }
    ],
    "vendor-kpmg-india": [
      {
        title: "KPMG India compliance evidence aging exceeds threshold",
        summary: "KPMG India has 8 of 22 compliance evidence items older than 45 days, or 36.4% aging versus a 20.0% threshold.",
        sourceName: "Internal SLA Review",
        type: "Risk",
        sentiment: "Negative",
        dimension: "R",
        impact: 8,
        confidence: 91,
        aiExplanation: "Aged compliance evidence is high-confidence vendor-specific Risk Profile evidence.",
        evidence: { metric: "evidence aging", current: "36.4%", threshold: "20.0%", aged_items: 8, total_items: 22 }
      }
    ],
    "vendor-wipro": [
      {
        title: "Wipro specialist fill rate below plan",
        summary: "Wipro filled 19 of 26 requested specialist engineering roles within the 21-day SLA, a 73.1% fill rate versus the 85.0% target.",
        sourceName: "Approved Market Intelligence",
        type: "People",
        sentiment: "Negative",
        dimension: "M",
        impact: 7,
        confidence: 86,
        aiExplanation: "Fill-rate gap directly affects specialist Market Fit.",
        evidence: { metric: "specialist fill rate", current: "73.1%", target: "85.0%", filled: 19, requested: 26 }
      }
    ],
    "vendor-cognizant-india": [
      {
        title: "Cognizant India MTTR improves",
        summary: "Cognizant India improved P2 incident MTTR from 9.1 hours to 6.6 hours while repeat incidents reduced from 10 to 4 over the current monthly window.",
        sourceName: "Internal SLA Review",
        type: "Operational",
        sentiment: "Positive",
        dimension: "I",
        impact: 6,
        confidence: 88,
        aiExplanation: "MTTR and repeat incident reduction are direct Integration evidence.",
        evidence: { metric: "P2 MTTR", current: "6.6h", previous: "9.1h", repeat_incidents_current: 4, repeat_incidents_previous: 10 }
      }
    ],
    "vendor-accenture-india": [
      {
        title: "Accenture India API uptime above threshold",
        summary: "Accenture India maintained 99.73% API availability across 18 services versus the 99.50% threshold, with zero P1 incidents this month.",
        sourceName: "LittleBig Mission Feed",
        type: "Operational",
        sentiment: "Positive",
        dimension: "I",
        impact: 6,
        confidence: 90,
        aiExplanation: "Vendor-specific uptime evidence supports Integration.",
        evidence: { metric: "API availability", current: "99.73%", threshold: "99.50%", services: 18, p1_incidents: 0 }
      }
    ]
  };
}

function connectorSignalTemplates(connectorId) {
  if (connectorId === "coupa") {
    return {
      "vendor-deloitte-india": {
        title: "Deloitte India invoice exception rate exceeds tolerance",
        summary: "Coupa extract shows Deloitte India at 7.1% invoice exception rate versus 3.0% tolerance across 184 invoices, with 14 missing PO references and 6 rate-card mismatches.",
        sourceName: "Coupa Spend Export",
        type: "Financial",
        sentiment: "Negative",
        dimension: "S",
        impact: 7,
        confidence: 91,
        aiExplanation: "Invoice exceptions and PO-reference gaps directly affect Score & Value.",
        evidence: { source_system: "Coupa", metric: "invoice exception rate", current: "7.1%", tolerance: "3.0%", invoices: 184, missing_po_refs: 14, rate_card_mismatches: 6 }
      },
      "vendor-kpmg-india": {
        title: "KPMG India PO cycle time above benchmark",
        summary: "Coupa PO data shows average PO cycle time at 8.7 days versus a 5.5-day benchmark across 63 service purchase orders.",
        sourceName: "Coupa Spend Export",
        type: "Financial",
        sentiment: "Negative",
        dimension: "S",
        impact: 6,
        confidence: 87,
        aiExplanation: "PO cycle delay affects procurement efficiency and value realization.",
        evidence: { source_system: "Coupa", metric: "PO cycle time", current: "8.7d", benchmark: "5.5d", purchase_orders: 63 }
      }
    };
  }
  if (connectorId === "littlebig") {
    return {
      "vendor-accenture-india": {
        title: "Accenture India mission milestone adherence improved",
        summary: "LittleBig-style mission feed shows milestone adherence improving to 94% across 31 active missions, up from 88% last month.",
        sourceName: "LittleBig Mission Feed",
        type: "Operational",
        sentiment: "Positive",
        dimension: "I",
        impact: 5,
        confidence: 89,
        aiExplanation: "Milestone adherence indicates workflow fit and integration quality.",
        evidence: { source_system: "LittleBig", metric: "milestone adherence", current: "94%", previous: "88%", missions: 31 }
      },
      "vendor-wipro": {
        title: "Wipro mission staffing delay visible",
        summary: "LittleBig-style mission feed shows Wipro filled 18 of 25 requested profiles on time, creating a 28% on-time staffing gap against active service missions.",
        sourceName: "LittleBig Mission Feed",
        type: "People",
        sentiment: "Negative",
        dimension: "P",
        impact: 6,
        confidence: 84,
        aiExplanation: "Staffing delay affects delivery performance and service continuity.",
        evidence: { source_system: "LittleBig", metric: "on-time staffing", filled_on_time: 18, requested: 25, gap: "28%" }
      }
    };
  }
  return {};
}

async function createSignalForVendor(vendor, template) {
  const duplicate = await query(
    "select id from signals where vendor_id = $1 and title = $2 and status = 'pending' limit 1",
    [vendor.id, template.title]
  );
  if (duplicate.rows[0]) return null;
  const saved = await query(
    `
      insert into signals (
        vendor_id,
        title,
        summary,
        source_name,
        type,
        sentiment,
        dimension,
        impact,
        confidence,
        status,
        ai_explanation,
        evidence
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,$11)
      returning *
    `,
    [
      vendor.id,
      template.title,
      template.summary,
      template.sourceName,
      template.type,
      template.sentiment,
      template.dimension,
      template.impact,
      template.confidence,
      template.aiExplanation,
      JSON.stringify(template.evidence || {})
    ]
  );
  return saved.rows[0];
}

async function generateCredibleSignals(actor) {
  const vendors = await query("select * from vendors where schedule <> 'Manual' order by updated_at asc, created_at asc");
  const templates = signalTemplates();
  const generated = [];
  for (const vendor of vendors.rows) {
    const options = templates[vendor.external_id] || [];
    for (const template of options) {
      if (generated.length >= 3) break;
      if (template.confidence < 82) continue;
      const signal = await createSignalForVendor(vendor, template);
      if (signal) generated.push(signal);
    }
    if (generated.length >= 3) break;
  }
  await query(
    "insert into audit_events (actor_name, event_type, message, metadata) values ($1, 'signal_pull_run', $2, $3)",
    [actor, `Credible signal pull generated ${generated.length} vendor-specific pending signals.`, JSON.stringify({ generated: generated.length, mode: "postgres" })]
  );
  return generated;
}

function recommendedVendorAction(vendor, pendingSignals = []) {
  if (vendor.status === "red") return "Assign executive owner and validate remediation plan before the next sourcing decision.";
  if (pendingSignals.some((signal) => signal.sentiment === "Negative" && Number(signal.impact) >= 7)) {
    return "Review high-impact negative evidence in Approval Gate before score movement.";
  }
  if (vendor.status === "amber") return "Use QBR to validate watch areas and agree near-term owner actions.";
  return "Protect current performance and evaluate expansion, consolidation, or commercial leverage opportunities.";
}

function weakestDimension(dimensions = {}) {
  return Object.entries(dimensions)
    .map(([key, value]) => ({ key, value: Number(value || 0) }))
    .sort((a, b) => a.value - b.value)[0] || { key: "P", value: 0 };
}

function strongestDimension(dimensions = {}) {
  return Object.entries(dimensions)
    .map(([key, value]) => ({ key, value: Number(value || 0) }))
    .sort((a, b) => b.value - a.value)[0] || { key: "P", value: 0 };
}

function applySignalToDimensions(dimensions, signal) {
  const next = { ...dimensions };
  const direction = signal.sentiment === "Positive" ? 1 : -1;
  const movement = (Number(signal.impact || 5) / 10) * 0.6 * direction;
  next[signal.dimension] = Number(clampScore(Number(next[signal.dimension] || 7) + movement).toFixed(2));
  return next;
}

function applyInternalInputToDimensions(dimensions, input) {
  const next = { ...dimensions };
  const text = String(input.evidence || "").toLowerCase();
  const negativeWords = ["breach", "delay", "exception", "risk", "issue", "miss", "failed", "above target", "increase"];
  const positiveWords = ["stable", "improved", "improvement", "strong", "ahead", "reduced", "below target", "resolved"];
  const negative = negativeWords.some((word) => text.includes(word));
  const positive = positiveWords.some((word) => text.includes(word));
  const direction = positive && !negative ? 1 : -1;
  const movement = (Number(input.weight || 30) / 100) * 0.7 * direction;
  next[input.dimension] = Number(clampScore(Number(next[input.dimension] || 7) + movement).toFixed(2));
  return next;
}

async function statePayload() {
  await ensureOperationalTables();
  const [vendors, signals, sources, connectors, audit, tasks, decisions] = await Promise.all([
    query("select * from vendors order by created_at desc"),
    query("select * from signals where status = 'pending' order by created_at desc"),
    query("select * from sources order by created_at desc"),
    query("select * from connectors order by name asc"),
    query("select * from audit_events order by created_at desc limit 100"),
    query("select * from tasks order by created_at desc limit 200"),
    query("select * from decisions order by created_at desc limit 100")
  ]);

  return {
    vendors: vendors.rows,
    signals: signals.rows,
    sources: sources.rows,
    connectors: connectors.rows,
    audit: audit.rows,
    tasks: tasks.rows,
    decisions: decisions.rows,
    meta: {
      mode: "postgres",
      generatedAt: new Date().toISOString()
    }
  };
}

app.get("/api/health", async (_req, res) => {
  try {
    const result = await query("select now() as database_time");
    res.json({
      ok: true,
      service: "GSIL Backend",
      databaseTime: result.rows[0].database_time
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      service: "GSIL Backend",
      error: error.message
    });
  }
});

app.get("/api/vendors", async (_req, res) => {
  try {
    const result = await query(`
      select
        id,
        external_id,
        name,
        category,
        tier,
        status,
        schedule,
        specialist,
        prism_score,
        dimensions,
        metadata,
        created_at,
        updated_at
      from vendors
      order by created_at desc
    `);
    res.json({ vendors: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/state", async (_req, res) => {
  try {
    res.json(await statePayload());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/audit", async (_req, res) => {
  try {
    const result = await query("select * from audit_events order by created_at desc limit 100");
    res.json({ audit: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tasks", async (_req, res) => {
  try {
    await ensureOperationalTables();
    const result = await query("select * from tasks order by created_at desc limit 200");
    res.json({ tasks: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    await ensureOperationalTables();
    const actor = actorFromRequest(req, "Task Creator");
    const { title, vendorId, vendor, stage, owner, due, action, source, metadata, signalId } = req.body || {};
    if (!title) return res.status(400).json({ error: "title is required" });
    const task = await query(
      `
        insert into tasks (vendor_id, signal_id, title, vendor_name, stage, owner, due, action, source, metadata, created_by)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        returning *
      `,
      [
        vendorId || null,
        signalId || null,
        title,
        vendor || null,
        stage || "To Review",
        owner || "Procurement Owner",
        due || "This week",
        action || null,
        source || "manual",
        JSON.stringify(metadata || {}),
        actor
      ]
    );
    const audit = await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, metadata)
        values ($1, 'task_created', $2, $3, $4)
        returning *
      `,
      [actor, `${task.rows[0].vendor_name || "Portfolio"}: task created - ${task.rows[0].title}.`, task.rows[0].vendor_id, JSON.stringify({ taskId: task.rows[0].id, stage: task.rows[0].stage })]
    );
    const state = await statePayload();
    res.status(201).json({ task: task.rows[0], auditEvent: audit.rows[0], state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    await ensureOperationalTables();
    const actor = actorFromRequest(req, "Task Reviewer");
    const { id } = req.params;
    const { stage, owner, due, action, metadata } = req.body || {};
    const existing = await query("select * from tasks where id = $1", [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Task not found" });
    const nextMetadata = { ...(existing.rows[0].metadata || {}), ...(metadata || {}) };
    const task = await query(
      `
        update tasks
        set stage = coalesce($2, stage),
            owner = coalesce($3, owner),
            due = coalesce($4, due),
            action = coalesce($5, action),
            metadata = $6,
            updated_at = now()
        where id = $1
        returning *
      `,
      [id, stage || null, owner || null, due || null, action || null, JSON.stringify(nextMetadata)]
    );
    await query(
      "insert into audit_events (actor_name, event_type, message, vendor_id, metadata) values ($1, 'task_updated', $2, $3, $4)",
      [actor, `${task.rows[0].vendor_name || "Portfolio"}: task updated - ${task.rows[0].title}.`, task.rows[0].vendor_id, JSON.stringify({ taskId: id, stage: task.rows[0].stage })]
    );
    const state = await statePayload();
    res.json({ task: task.rows[0], state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/decisions", async (_req, res) => {
  try {
    await ensureOperationalTables();
    const result = await query("select * from decisions order by created_at desc limit 100");
    res.json({ decisions: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/decisions", async (req, res) => {
  try {
    await ensureOperationalTables();
    const actor = actorFromRequest(req, "Decision Reviewer");
    const { vendorId, action: decisionAction, owner, context, status, metadata } = req.body || {};
    if (!decisionAction) return res.status(400).json({ error: "action is required" });
    const decision = await query(
      `
        insert into decisions (vendor_id, action, owner, context, status, metadata, created_by)
        values ($1, $2, $3, $4, $5, $6, $7)
        returning *
      `,
      [
        vendorId || null,
        decisionAction,
        owner || "Procurement Owner",
        context || null,
        status || "open",
        JSON.stringify(metadata || {}),
        actor
      ]
    );
    const vendorName = metadata?.vendor || "Portfolio";
    const task = await query(
      `
        insert into tasks (vendor_id, title, vendor_name, stage, owner, due, action, source, metadata, created_by)
        values ($1, $2, $3, $4, $5, $6, $7, 'decision', $8, $9)
        returning *
      `,
      [
        vendorId || null,
        `${decisionAction}: ${vendorName}`,
        vendorName,
        decisionAction === "Approved" ? "Ready For Approval" : decisionAction === "Escalated" ? "Owner Assigned" : "Waiting For Evidence",
        owner || "Procurement Owner",
        decisionAction === "Escalated" ? "Today" : "This week",
        context || decisionAction,
        JSON.stringify({ decisionId: decision.rows[0].id, ...(metadata || {}) }),
        actor
      ]
    );
    const audit = await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, metadata)
        values ($1, 'decision_logged', $2, $3, $4)
        returning *
      `,
      [actor, `${vendorName}: decision logged - ${decisionAction}.`, vendorId || null, JSON.stringify({ decisionId: decision.rows[0].id, taskId: task.rows[0].id })]
    );
    const state = await statePayload();
    res.status(201).json({ decision: decision.rows[0], task: task.rows[0], auditEvent: audit.rows[0], state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/scheduler/run-pull", async (req, res) => {
  try {
    const actor = actorFromRequest(req, "Signal Pull Reviewer");
    const generated = await generateCredibleSignals(actor);
    res.json({
      generated,
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/connectors/:id/sync", async (req, res) => {
  try {
    const { id } = req.params;
    const actor = actorFromRequest(req, "Connector Sync Reviewer");
    const templates = connectorSignalTemplates(id);
    if (!Object.keys(templates).length) {
      return res.status(404).json({ error: "Connector sync is available for Coupa and LittleBig Connection" });
    }

    const connectorResult = await query("select * from connectors where id = $1", [id]);
    const connector = connectorResult.rows[0];
    if (!connector) return res.status(404).json({ error: "Connector not found" });

    const run = await query(
      `
        insert into connector_runs (connector_id, status, started_at)
        values ($1, 'running', now())
        returning *
      `,
      [id]
    );

    const generated = [];
    const externalIds = Object.keys(templates);
    const vendors = await query("select * from vendors where external_id = any($1::text[])", [externalIds]);
    for (const vendor of vendors.rows) {
      const signal = await createSignalForVendor(vendor, templates[vendor.external_id]);
      if (signal) generated.push(signal);
    }

    await query(
      `
        update connector_runs
        set status = 'completed',
            records_seen = $1,
            signals_created = $2,
            completed_at = now()
        where id = $3
      `,
      [externalIds.length, generated.length, run.rows[0].id]
    );

    const updatedConnector = await query(
      `
        update connectors
        set status = 'healthy',
            last_sync = now(),
            next_sync = now() + interval '6 hours',
            last_error = null,
            updated_at = now()
        where id = $1
        returning *
      `,
      [id]
    );

    await query(
      `
        insert into audit_events (actor_name, event_type, message, metadata)
        values ($1, 'connector_sync_completed', $2, $3)
      `,
      [
        actor,
        `${connector.name}: sync completed with ${generated.length} pending signals created.`,
        JSON.stringify({ connectorId: id, connectorRunId: run.rows[0].id, generatedSignals: generated.map((signal) => signal.id) })
      ]
    );

    res.json({
      connectorId: id,
      connector: updatedConnector.rows[0],
      generated,
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function handleQbrRequest(req, res) {
  try {
    const vendorId = req.params.vendorId || req.body?.vendorId || req.query?.vendorId;
    const actor = actorFromRequest(req, "QBR Reviewer");
    if (!vendorId) return res.status(400).json({ error: "Select a vendor before generating QBR" });

    const vendorResult = await query("select * from vendors where id = $1", [vendorId]);
    const vendor = vendorResult.rows[0];
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const [pendingSignals, recentSignals, recentAudit, internalEvidence] = await Promise.all([
      query("select * from signals where vendor_id = $1 and status = 'pending' order by created_at desc limit 10", [vendor.id]),
      query("select * from signals where vendor_id = $1 order by created_at desc limit 12", [vendor.id]),
      query("select * from audit_events where vendor_id = $1 order by created_at desc limit 8", [vendor.id]),
      query("select * from internal_inputs where vendor_id = $1 order by created_at desc limit 8", [vendor.id])
    ]);

    const score = Number(vendor.prism_score);
    const weakest = weakestDimension(vendor.dimensions);
    const strongest = strongestDimension(vendor.dimensions);
    const negativeSignals = pendingSignals.rows.filter((signal) => signal.sentiment === "Negative");
    const highConfidence = pendingSignals.rows.filter((signal) => Number(signal.confidence) >= 85);
    const action = recommendedVendorAction(vendor, pendingSignals.rows);

    const snapshot = {
      vendor: vendor.name,
      vendorId: vendor.id,
      generatedAt: new Date().toISOString(),
      score,
      status: vendor.status,
      dimensions: vendor.dimensions,
      strongestFactor: strongest,
      watchFactor: weakest,
      pendingSignals: pendingSignals.rows.length,
      highConfidenceSignals: highConfidence.length,
      negativeSignals: negativeSignals.length,
      recentSignals: recentSignals.rows.map((signal) => ({
        title: signal.title,
        sentiment: signal.sentiment,
        dimension: signal.dimension,
        confidence: signal.confidence,
        impact: signal.impact,
        source: signal.source_name,
        status: signal.status
      })),
      recentAudit: recentAudit.rows.map((event) => ({
        message: event.message,
        actor: event.actor_name,
        eventType: event.event_type,
        createdAt: event.created_at
      })),
      internalEvidence: internalEvidence.rows.map((input) => ({
        dimension: input.dimension,
        period: input.period,
        evidence: input.evidence,
        weight: input.weight,
        feedType: input.feed_type,
        createdAt: input.created_at
      })),
      recommendedAction: action,
      executiveSummary: `${vendor.name} is currently ${vendor.status} with PRISM ${score.toFixed(1)}. Strongest factor is ${strongest.key} at ${strongest.value.toFixed(1)}; watch area is ${weakest.key} at ${weakest.value.toFixed(1)}. ${action}`
    };

    const saved = await query(
      `
        insert into qbr_snapshots (vendor_id, score, status, dimensions, recent_audit)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [
        vendor.id,
        score,
        vendor.status,
        JSON.stringify(vendor.dimensions),
        JSON.stringify({
          snapshot,
          audit: snapshot.recentAudit,
          signals: snapshot.recentSignals,
          internalEvidence: snapshot.internalEvidence
        })
      ]
    );

    await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, metadata)
        values ($1, 'qbr_snapshot_generated', $2, $3, $4)
      `,
      [
        actor,
        `${vendor.name}: QBR snapshot generated at PRISM ${score.toFixed(2)} with ${pendingSignals.rows.length} pending signals.`,
        vendor.id,
        JSON.stringify({ qbrSnapshotId: saved.rows[0].id, score, status: vendor.status, pendingSignals: pendingSignals.rows.length })
      ]
    );

    res.json({
      snapshotId: saved.rows[0].id,
      snapshot,
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

app.post("/api/qbr/:vendorId", handleQbrRequest);
app.post("/api/qbr", handleQbrRequest);

app.post("/api/vendors", async (req, res) => {
  try {
    const { name, category, tier = "Core", schedule = "Daily", specialist = false } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: "Vendor name and category are required" });
    }

    const result = await query(
      `
        insert into vendors (name, category, tier, schedule, specialist)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [name, category, tier, schedule, specialist]
    );

    await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, metadata)
        values ($1, 'vendor_added', $2, $3, $4)
      `,
      [
        actorFromRequest(req, "Vendor Creator"),
        `${name} added as a ${tier} vendor.`,
        result.rows[0].id,
        JSON.stringify({ category, schedule, specialist })
      ]
    );
    res.status(201).json({ vendor: result.rows[0], state: await statePayload() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/vendors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    const reviewer = patch.reviewer || "Backend Demo Reviewer";

    const existingResult = await query("select * from vendors where id = $1", [id]);
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ error: "Vendor not found" });

    const nextName = patch.name !== undefined ? String(patch.name).trim() : existing.name;
    const nextCategory = patch.category !== undefined ? String(patch.category).trim() : existing.category;
    const nextTier = patch.tier !== undefined ? String(patch.tier).trim() : existing.tier;
    const nextSchedule = patch.schedule !== undefined ? String(patch.schedule).trim() : existing.schedule;
    const nextSpecialist = typeof patch.specialist === "boolean" ? patch.specialist : existing.specialist;
    const nextMetadata = {
      ...(existing.metadata || {}),
      ...(patch.metadata || {})
    };

    if (!nextName || !nextCategory) {
      return res.status(400).json({ error: "Vendor name and category are required" });
    }

    const nextScore = Number(calculatePrismScore(existing.dimensions, nextSpecialist).toFixed(2));
    const nextStatus = statusFromScore(nextScore);

    const updated = await query(
      `
        update vendors
        set name = $1,
            category = $2,
            tier = $3,
            schedule = $4,
            specialist = $5,
            prism_score = $6,
            status = $7,
            metadata = $8,
            updated_at = now()
        where id = $9
        returning *
      `,
      [nextName, nextCategory, nextTier, nextSchedule, nextSpecialist, nextScore, nextStatus, JSON.stringify(nextMetadata), id]
    );

    const changed = Object.entries({
      name: [existing.name, nextName],
      category: [existing.category, nextCategory],
      tier: [existing.tier, nextTier],
      schedule: [existing.schedule, nextSchedule],
      specialist: [existing.specialist, nextSpecialist]
    })
      .filter(([, values]) => values[0] !== values[1])
      .map(([key, values]) => `${key}: ${values[0]} -> ${values[1]}`);

    await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, metadata)
        values ($1, 'vendor_updated', $2, $3, $4)
      `,
      [
        reviewer,
        `${nextName}: vendor setup updated${changed.length ? ` (${changed.join(", ")})` : ""}. PRISM recalculated to ${nextScore}.`,
        id,
        JSON.stringify({
          previousScore: existing.prism_score,
          nextScore,
          previousStatus: existing.status,
          nextStatus,
          changed
        })
      ]
    );

    res.json({
      vendor: updated.rows[0],
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sources", async (req, res) => {
  try {
    const {
      name,
      url = "",
      category = "Business News",
      confidence = "Medium",
      active = true,
      trustScore,
      trust_score,
      reviewer = "Backend Demo Reviewer"
    } = req.body || {};

    if (!name) return res.status(400).json({ error: "Source name is required" });
    const score = clampTrustScore(trustScore ?? trust_score ?? confidenceToTrustScore(confidence));
    const nextConfidence = trustScore !== undefined || trust_score !== undefined ? trustScoreToConfidence(score) : confidence;

    const saved = await query(
      `
        insert into sources (name, url, category, confidence, active, trust_score)
        values ($1, $2, $3, $4, $5, $6)
        returning *
      `,
      [String(name).trim(), String(url).trim(), category, nextConfidence, Boolean(active), score]
    );

    await query(
      `
        insert into audit_events (actor_name, event_type, message, metadata)
        values ($1, 'source_added', $2, $3)
      `,
      [
        reviewer,
        `${saved.rows[0].name}: source added with ${score} trust score.`,
        JSON.stringify({ sourceId: saved.rows[0].id, confidence: nextConfidence, trustScore: score })
      ]
    );

    res.status(201).json({
      source: saved.rows[0],
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/sources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    const reviewer = patch.reviewer || "Backend Demo Reviewer";

    const existingResult = await query("select * from sources where id = $1", [id]);
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ error: "Source not found" });

    const requestedTrust = patch.trustScore ?? patch.trust_score;
    const nextConfidence = patch.confidence || (requestedTrust !== undefined ? trustScoreToConfidence(Number(requestedTrust)) : existing.confidence);
    const confidenceScore = confidenceToTrustScore(nextConfidence);
    const nextTrustScore = clampTrustScore(requestedTrust ?? confidenceScore);
    const nextActive = typeof patch.active === "boolean" ? patch.active : existing.active;

    const updated = await query(
      `
        update sources
        set name = $1,
            url = $2,
            category = $3,
            confidence = $4,
            active = $5,
            trust_score = $6,
            updated_at = now()
        where id = $7
        returning *
      `,
      [
        patch.name !== undefined ? String(patch.name).trim() : existing.name,
        patch.url !== undefined ? String(patch.url).trim() : existing.url,
        patch.category !== undefined ? String(patch.category).trim() : existing.category,
        nextConfidence,
        nextActive,
        nextTrustScore,
        id
      ]
    );

    await query(
      `
        insert into audit_events (actor_name, event_type, message, metadata)
        values ($1, 'source_updated', $2, $3)
      `,
      [
        reviewer,
        `${updated.rows[0].name}: source governance updated. Trust ${existing.trust_score} -> ${nextTrustScore}; status ${existing.active ? "active" : "paused"} -> ${nextActive ? "active" : "paused"}.`,
        JSON.stringify({
          sourceId: id,
          previousTrustScore: existing.trust_score,
          nextTrustScore,
          previousConfidence: existing.confidence,
          nextConfidence,
          previousActive: existing.active,
          nextActive
        })
      ]
    );

    res.json({
      source: updated.rows[0],
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/signals/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const reviewer = req.body?.reviewer || "Backend Demo Reviewer";
    const patch = req.body || {};

    const signalResult = await query(
      "select * from signals where id = $1 and status = 'pending'",
      [id]
    );
    const signal = signalResult.rows[0];
    if (!signal) return res.status(404).json({ error: "Pending signal not found" });

    const vendorResult = await query("select * from vendors where id = $1", [signal.vendor_id]);
    const vendor = vendorResult.rows[0];
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const approvedSignal = {
      ...signal,
      summary: patch.summary || signal.summary,
      dimension: patch.dimension || signal.dimension,
      impact: Number(patch.impact || signal.impact)
    };

    const nextDimensions = applySignalToDimensions(vendor.dimensions, approvedSignal);
    const nextScore = Number(calculatePrismScore(nextDimensions, vendor.specialist).toFixed(2));
    const nextStatus = statusFromScore(nextScore);

    const [updatedVendor, updatedSignal] = await Promise.all([
      query(
        `
          update vendors
          set dimensions = $1,
              prism_score = $2,
              status = $3,
              updated_at = now()
          where id = $4
          returning *
        `,
        [nextDimensions, nextScore, nextStatus, vendor.id]
      ),
      query(
        `
          update signals
          set summary = $1,
              dimension = $2,
              impact = $3,
              status = 'approved',
              reviewed_at = now()
          where id = $4
          returning *
        `,
        [approvedSignal.summary, approvedSignal.dimension, approvedSignal.impact, signal.id]
      )
    ]);

    await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, signal_id, metadata)
        values ($1, 'signal_approved', $2, $3, $4, $5)
      `,
      [
        reviewer,
        `${vendor.name}: approved "${signal.title}" with impact ${approvedSignal.impact} on ${approvedSignal.dimension}. PRISM moved to ${nextScore}.`,
        vendor.id,
        signal.id,
        JSON.stringify({
          previousScore: vendor.prism_score,
          nextScore,
          previousStatus: vendor.status,
          nextStatus,
          nextDimensions
        })
      ]
    );

    res.json({
      signal: updatedSignal.rows[0],
      vendor: updatedVendor.rows[0],
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/signals/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const reviewer = req.body?.reviewer || "Backend Demo Reviewer";
    const reason = req.body?.reason || "Rejected by reviewer";

    const signalResult = await query(
      "select * from signals where id = $1 and status = 'pending'",
      [id]
    );
    const signal = signalResult.rows[0];
    if (!signal) return res.status(404).json({ error: "Pending signal not found" });

    const vendorResult = await query("select * from vendors where id = $1", [signal.vendor_id]);
    const vendor = vendorResult.rows[0];

    const updatedSignal = await query(
      `
        update signals
        set status = 'rejected',
            rejection_reason = $1,
            reviewed_at = now()
        where id = $2
        returning *
      `,
      [reason, id]
    );

    await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, signal_id, metadata)
        values ($1, 'signal_rejected', $2, $3, $4, $5)
      `,
      [
        reviewer,
        `${vendor?.name || "Vendor"}: rejected "${signal.title}". Reason: ${reason}`,
        signal.vendor_id,
        signal.id,
        JSON.stringify({ reason })
      ]
    );

    res.json({
      signal: updatedSignal.rows[0],
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/internal-inputs", async (req, res) => {
  try {
    const {
      vendorId,
      dimension = "P",
      period = "FY26 Q1",
      evidence,
      weight = 30,
      feedType = "Manual Upload",
      reviewer = "Internal Gate Demo Reviewer"
    } = req.body || {};

    if (!vendorId || !evidence) {
      return res.status(400).json({ error: "vendorId and evidence are required" });
    }
    if (!["P", "R", "I", "S", "M"].includes(dimension)) {
      return res.status(400).json({ error: "dimension must be one of P, R, I, S, M" });
    }

    const vendorResult = await query("select * from vendors where id = $1", [vendorId]);
    const vendor = vendorResult.rows[0];
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const input = { dimension, evidence, weight };
    const nextDimensions = applyInternalInputToDimensions(vendor.dimensions, input);
    const nextScore = Number(calculatePrismScore(nextDimensions, vendor.specialist).toFixed(2));
    const nextStatus = statusFromScore(nextScore);

    const savedInput = await query(
      `
        insert into internal_inputs (vendor_id, dimension, period, evidence, weight, feed_type, status)
        values ($1, $2, $3, $4, $5, $6, 'approved')
        returning *
      `,
      [vendor.id, dimension, period, evidence, Number(weight), feedType]
    );

    const updatedVendor = await query(
      `
        update vendors
        set dimensions = $1,
            prism_score = $2,
            status = $3,
            updated_at = now()
        where id = $4
        returning *
      `,
      [nextDimensions, nextScore, nextStatus, vendor.id]
    );

    const audit = await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, metadata)
        values ($1, 'internal_input_added', $2, $3, $4)
        returning *
      `,
      [
        reviewer,
        `${vendor.name}: internal gate evidence applied to ${dimension} with ${weight}% influence. PRISM moved to ${nextScore}.`,
        vendor.id,
        JSON.stringify({
          internalInputId: savedInput.rows[0].id,
          previousScore: vendor.prism_score,
          nextScore,
          previousStatus: vendor.status,
          nextStatus,
          nextDimensions,
          period,
          feedType
        })
      ]
    );

    res.status(201).json({
      input: savedInput.rows[0],
      vendor: updatedVendor.rows[0],
      auditEvent: audit.rows[0],
      state: await statePayload()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/demo/internal-input", async (_req, res) => {
  try {
    const vendorResult = await query(
      "select * from vendors where external_id = 'vendor-wipro' limit 1"
    );
    const vendor = vendorResult.rows[0];
    if (!vendor) return res.status(404).json({ error: "Wipro vendor not found" });

    const evidence = "Internal SLA review: MTTR remains above target at 13.8 hours; escalation owner required for FY26 Q1.";
    const dimension = "P";
    const period = "FY26 Q1";
    const weight = 40;
    const input = { dimension, evidence, weight };
    const nextDimensions = applyInternalInputToDimensions(vendor.dimensions, input);
    const nextScore = Number(calculatePrismScore(nextDimensions, vendor.specialist).toFixed(2));
    const nextStatus = statusFromScore(nextScore);

    const savedInput = await query(
      `
        insert into internal_inputs (vendor_id, dimension, period, evidence, weight, feed_type, status)
        values ($1, $2, $3, $4, $5, 'Browser Demo', 'approved')
        returning *
      `,
      [vendor.id, dimension, period, evidence, weight]
    );

    const updatedVendor = await query(
      `
        update vendors
        set dimensions = $1,
            prism_score = $2,
            status = $3,
            updated_at = now()
        where id = $4
        returning *
      `,
      [nextDimensions, nextScore, nextStatus, vendor.id]
    );

    const audit = await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, metadata)
        values ($1, 'internal_input_added', $2, $3, $4)
        returning *
      `,
      [
        "Browser Internal Gate Demo",
        `${vendor.name}: browser demo internal evidence applied to ${dimension}. PRISM moved to ${nextScore}.`,
        vendor.id,
        JSON.stringify({
          internalInputId: savedInput.rows[0].id,
          previousScore: vendor.prism_score,
          nextScore,
          nextDimensions
        })
      ]
    );

    res.json({
      ok: true,
      input: savedInput.rows[0],
      updatedVendor: updatedVendor.rows[0],
      auditEvent: audit.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/demo/approve-next", async (_req, res) => {
  try {
    const nextSignal = await query(
      "select id from signals where status = 'pending' order by created_at desc limit 1"
    );
    const signalId = nextSignal.rows[0]?.id;
    if (!signalId) return res.status(404).json({ error: "No pending signals left to approve" });

    const signalResult = await query("select * from signals where id = $1", [signalId]);
    const signal = signalResult.rows[0];
    const vendorResult = await query("select * from vendors where id = $1", [signal.vendor_id]);
    const vendor = vendorResult.rows[0];
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const nextDimensions = applySignalToDimensions(vendor.dimensions, signal);
    const nextScore = Number(calculatePrismScore(nextDimensions, vendor.specialist).toFixed(2));
    const nextStatus = statusFromScore(nextScore);

    const updatedVendor = await query(
      `
        update vendors
        set dimensions = $1,
            prism_score = $2,
            status = $3,
            updated_at = now()
        where id = $4
        returning *
      `,
      [nextDimensions, nextScore, nextStatus, vendor.id]
    );

    const updatedSignal = await query(
      `
        update signals
        set status = 'approved',
            reviewed_at = now()
        where id = $1
        returning *
      `,
      [signal.id]
    );

    const audit = await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, signal_id, metadata)
        values ($1, 'signal_approved', $2, $3, $4, $5)
        returning *
      `,
      [
        "Browser Demo Reviewer",
        `${vendor.name}: approved "${signal.title}" from browser demo endpoint. PRISM moved to ${nextScore}.`,
        vendor.id,
        signal.id,
        JSON.stringify({
          previousScore: vendor.prism_score,
          nextScore,
          previousStatus: vendor.status,
          nextStatus,
          nextDimensions
        })
      ]
    );

    res.json({
      ok: true,
      approvedSignal: updatedSignal.rows[0],
      updatedVendor: updatedVendor.rows[0],
      auditEvent: audit.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/demo/reject-next", async (_req, res) => {
  try {
    const nextSignal = await query(
      "select * from signals where status = 'pending' order by created_at desc limit 1"
    );
    const signal = nextSignal.rows[0];
    if (!signal) return res.status(404).json({ error: "No pending signals left to reject" });

    const vendorResult = await query("select * from vendors where id = $1", [signal.vendor_id]);
    const vendor = vendorResult.rows[0];
    const reason = "Rejected through browser demo endpoint";

    const updatedSignal = await query(
      `
        update signals
        set status = 'rejected',
            rejection_reason = $1,
            reviewed_at = now()
        where id = $2
        returning *
      `,
      [reason, signal.id]
    );

    const audit = await query(
      `
        insert into audit_events (actor_name, event_type, message, vendor_id, signal_id, metadata)
        values ($1, 'signal_rejected', $2, $3, $4, $5)
        returning *
      `,
      [
        "Browser Demo Reviewer",
        `${vendor?.name || "Vendor"}: rejected "${signal.title}". Reason: ${reason}`,
        signal.vendor_id,
        signal.id,
        JSON.stringify({ reason })
      ]
    );

    res.json({
      ok: true,
      rejectedSignal: updatedSignal.rows[0],
      auditEvent: audit.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`GSIL backend running at http://localhost:${port}`);
});
