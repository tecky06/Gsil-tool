const api = {
  async request(path, options = {}) {
    const { headers: optionHeaders = {}, ...requestOptions } = options;
    const response = await fetch(apiUrl(path), {
      ...requestOptions,
      headers: { "Content-Type": "application/json", ...optionHeaders }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Request failed");
    return normalizeApiPayload(payload);
  },
  getState() {
    return this.request("/api/state", { headers: roleHeaders() });
  },
  runPull() {
    return this.request("/api/scheduler/run-pull", { method: "POST", body: "{}", headers: roleHeaders() });
  },
  addVendor(vendor) {
    return this.request("/api/vendors", { method: "POST", body: JSON.stringify(vendor), headers: roleHeaders() });
  },
  updateVendor(id, patch) {
    return this.request(`/api/vendors/${id}`, { method: "PATCH", body: JSON.stringify(patch), headers: roleHeaders() });
  },
  approveSignal(id, body) {
    return this.request(`/api/signals/${id}/approve`, { method: "POST", body: JSON.stringify(body), headers: roleHeaders() });
  },
  rejectSignal(id, reason) {
    return this.request(`/api/signals/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }), headers: roleHeaders() });
  },
  bulkSignals(action) {
    return this.request("/api/signals/bulk", { method: "POST", body: JSON.stringify({ action }), headers: roleHeaders() });
  },
  addSource(source) {
    return this.request("/api/sources", { method: "POST", body: JSON.stringify(source), headers: roleHeaders() });
  },
  updateSource(id, patch) {
    return this.request(`/api/sources/${id}`, { method: "PATCH", body: JSON.stringify(patch), headers: roleHeaders() });
  },
  addInternalInput(input) {
    return this.request("/api/internal-inputs", { method: "POST", body: JSON.stringify(input), headers: roleHeaders() });
  },
  syncConnector(id) {
    return this.request(`/api/connectors/${id}/sync`, { method: "POST", body: "{}", headers: roleHeaders() });
  },
  qbr(vendorId) {
    const resolvedVendorId = vendorId || document.querySelector("#qbrVendor")?.value || document.querySelector("#historyVendor")?.value || state.vendors[0]?.id || "";
    return this.request(`/api/qbr/${encodeURIComponent(resolvedVendorId)}`, { method: "POST", body: "{}", headers: roleHeaders() });
  },
  addTask(task) {
    return this.request("/api/tasks", { method: "POST", body: JSON.stringify(task), headers: roleHeaders() });
  },
  updateTask(id, patch) {
    return this.request(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch), headers: roleHeaders() });
  },
  addDecision(decision) {
    return this.request("/api/decisions", { method: "POST", body: JSON.stringify(decision), headers: roleHeaders() });
  }
};

const backendModeKey = "gsil-backend-mode";
const backendUrlKey = "gsil-backend-url";
const pendingVendorDraftsKey = "gsil-pending-vendor-drafts";
const clientVendorOverlayKey = "gsil-client-visible-vendors";
const presentationModeKey = "gsil-presentation-mode";
const productionBackendUrl = "https://gsil-backend.onrender.com";
const hostedFrontendHosts = ["tecky06.github.io", "gsil-tool.netlify.app"];
const defaultBackendUrl = hostedFrontendHosts.includes(window.location.hostname)
  ? productionBackendUrl
  : "http://localhost:3001";

const prismLabels = {
  P: "Performance",
  R: "Risk",
  I: "Integration",
  S: "Score & Value",
  M: "Market Fit"
};

const standardWeights = { P: 0.25, R: 0.15, I: 0.2, S: 0.25, M: 0.15 };
const specialistWeights = { P: 0.15, R: 0.1, I: 0.35, S: 0.15, M: 0.25 };

const statusTerms = {
  green: { label: "Strategic Advantage", metric: "Advantage Vendors", action: "Scale partnership", tone: "Strength" },
  amber: { label: "Performance Watch", metric: "Watchlist Vendors", action: "Review next QBR", tone: "Monitor" },
  red: { label: "Executive Attention", metric: "Attention Vendors", action: "Escalate owner action", tone: "Intervene" }
};

const vendorRelationshipTypes = {
  direct: {
    label: "Direct Vendor",
    scoreType: "Full PRISM",
    coverage: "Full evidence",
    note: "Internal and external evidence can influence PRISM."
  },
  external_watchlist: {
    label: "External Watchlist",
    scoreType: "Market-only",
    coverage: "Limited evidence",
    note: "Tracked for credible external signals; internal performance evidence is not available yet."
  },
  potential_supplier: {
    label: "Potential Supplier",
    scoreType: "Market-only",
    coverage: "Limited evidence",
    note: "Useful for RFP shortlisting and capability monitoring."
  },
  former_vendor: {
    label: "Former Vendor",
    scoreType: "Historical/market",
    coverage: "Partial evidence",
    note: "Can retain historical context and continue market monitoring."
  },
  competitor_benchmark: {
    label: "Competitor Benchmark",
    scoreType: "Benchmark-only",
    coverage: "Limited evidence",
    note: "Used for comparison, not active supplier performance scoring."
  },
  strategic_market_entity: {
    label: "Strategic Market Entity",
    scoreType: "Market-only",
    coverage: "Limited evidence",
    note: "Tracked for category, capability, or market movement."
  }
};

const connectorTerms = {
  healthy: "Connected",
  degraded: "Attention Needed",
  failed: "Attention Needed",
  paused: "Paused"
};

const demoUsers = [
  { username: "admin@gsil.demo", password: "Admin@123", name: "Admin Demo", role: "admin" },
  { username: "head@gsil.demo", password: "Head@123", name: "Procurement Head Demo", role: "procurement_head" },
  { username: "analyst@gsil.demo", password: "Analyst@123", name: "Analyst Demo", role: "analyst" },
  { username: "finance@gsil.demo", password: "Finance@123", name: "Finance Controller Demo", role: "finance_controller" },
  { username: "viewer@gsil.demo", password: "Viewer@123", name: "Viewer Demo", role: "viewer" }
];

const roleLabels = {
  admin: "Admin",
  procurement_head: "Procurement Head",
  analyst: "Analyst",
  finance_controller: "Finance Controller",
  viewer: "Viewer"
};

const rolePermissions = {
  admin: ["view", "vendor:write", "source:write", "signal:pull", "signal:approve", "signal:reject", "signal:bulk", "internal:write", "connector:sync", "qbr:write", "report:export", "settings:write"],
  procurement_head: ["view", "vendor:write", "signal:pull", "signal:approve", "signal:reject", "signal:bulk", "connector:sync", "qbr:write", "report:export"],
  analyst: ["view", "signal:pull", "signal:reject", "internal:write", "source:write", "report:export"],
  finance_controller: ["view", "internal:write", "qbr:write", "report:export"],
  viewer: ["view", "report:export"]
};

function backendModeEnabled() {
  const storedMode = localStorage.getItem(backendModeKey);
  if (storedMode) return storedMode === "active";
  return hostedFrontendHosts.includes(window.location.hostname);
}

function backendBaseUrl() {
  return (localStorage.getItem(backendUrlKey) || defaultBackendUrl).replace(/\/+$/, "");
}

function apiUrl(path) {
  if (!backendModeEnabled() || !path.startsWith("/api/")) return path;
  return `${backendBaseUrl()}${path}`;
}

function applyBackendUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const backendParam = params.get("backend");
  const backendUrlParam = params.get("backendUrl");
  if (backendUrlParam) {
    localStorage.setItem(backendUrlKey, backendUrlParam.replace(/\/+$/, ""));
  } else if (hostedFrontendHosts.includes(window.location.hostname)) {
    localStorage.setItem(backendUrlKey, productionBackendUrl);
  }
  if (backendParam === "1" || backendParam === "true") {
    localStorage.setItem(backendModeKey, "active");
  }
  if (backendParam === "0" || backendParam === "false") {
    localStorage.setItem(backendModeKey, "static");
  } else if (!backendParam && hostedFrontendHosts.includes(window.location.hostname)) {
    localStorage.setItem(backendModeKey, "active");
  }
}

function buildLocalRoles() {
  return Object.entries(roleLabels).map(([role, label]) => ({
    role,
    label,
    permissions: rolePermissions[role] || []
  }));
}

function normalizeApiPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const normalized = { ...payload };
  if (Array.isArray(normalized.vendors)) normalized.vendors = normalized.vendors.map(normalizeApiVendor);
  if (Array.isArray(normalized.signals)) normalized.signals = normalized.signals.map(normalizeApiSignal);
  if (Array.isArray(normalized.sources)) normalized.sources = normalized.sources.map(normalizeApiSource);
  if (Array.isArray(normalized.connectors)) normalized.connectors = normalized.connectors.map(normalizeApiConnector);
  if (Array.isArray(normalized.audit)) normalized.audit = normalized.audit.map(normalizeApiAudit);
  if (Array.isArray(normalized.tasks)) normalized.tasks = normalized.tasks.map(normalizeApiTask);
  if (Array.isArray(normalized.decisions)) normalized.decisions = normalized.decisions.map(normalizeApiDecision);
  if (Array.isArray(normalized.internalInputs)) normalized.internalInputs = normalized.internalInputs.map(normalizeApiInternalInput);
  if (normalized.vendor) normalized.vendor = normalizeApiVendor(normalized.vendor);
  if (normalized.signal) normalized.signal = normalizeApiSignal(normalized.signal);
  if (normalized.source) normalized.source = normalizeApiSource(normalized.source);
  if (normalized.connector) normalized.connector = normalizeApiConnector(normalized.connector);
  if (normalized.task) normalized.task = normalizeApiTask(normalized.task);
  if (normalized.decision) normalized.decision = normalizeApiDecision(normalized.decision);
  if (normalized.input) normalized.input = normalizeApiInternalInput(normalized.input);
  if (normalized.state) normalized.state = normalizeApiPayload(normalized.state);
  normalized.currentUser ||= state.currentUser || currentSession();
  normalized.roles ||= state.roles?.length ? state.roles : buildLocalRoles();
  normalized.internalInputs ||= state.internalInputs || [];
  normalized.tasks ||= state.tasks || [];
  normalized.decisions ||= state.decisions || [];
  normalized.failedFeeds ||= buildFailedFeeds(normalized.connectors || state.connectors || []);
  normalized.uploadHistory ||= state.uploadHistory || [];
  normalized.monitoring ||= buildBackendMonitoring(normalized);
  return normalized;
}

function normalizeApiTask(task) {
  return {
    ...task,
    id: String(task.id),
    vendorId: String(task.vendorId ?? task.vendor_id ?? ""),
    signalId: task.signalId ?? task.signal_id ?? null,
    vendor: task.vendor || task.vendor_name || "Portfolio",
    stage: task.stage || "To Review",
    owner: task.owner || "Procurement Owner",
    due: task.due || "This week",
    action: task.action || task.title || "",
    createdAt: task.createdAt || task.created_at || new Date().toISOString()
  };
}

function normalizeApiDecision(decision) {
  return {
    ...decision,
    id: String(decision.id),
    vendorId: String(decision.vendorId ?? decision.vendor_id ?? ""),
    vendor: decision.vendor || decision.metadata?.vendor || vendorById(decision.vendor_id)?.name || "Portfolio",
    action: decision.action || "Decision captured",
    owner: decision.owner || "Procurement Owner",
    context: decision.context || "",
    status: decision.status || "open",
    createdAt: decision.createdAt || decision.created_at || new Date().toISOString()
  };
}

function normalizeApiVendor(vendor) {
  const rawScore = vendor.score ?? vendor.prism_score;
  const score = rawScore === undefined || rawScore === null || rawScore === ""
    ? calculateVendorScore(vendor)
    : Number(rawScore);
  const metadata = vendor.metadata || {};
  const relationshipType = metadata.relationshipType || metadata.relationship_type || vendor.relationshipType || "direct";
  const relationship = vendorRelationshipTypes[relationshipType] ? relationshipType : "direct";
  const evidenceCoverage = metadata.evidenceCoverage || metadata.evidence_coverage || vendorRelationshipTypes[relationship].coverage;
  const scoreType = metadata.scoreType || metadata.score_type || vendorRelationshipTypes[relationship].scoreType;
  return {
    ...vendor,
    id: String(vendor.id),
    score,
    dimensions: vendor.dimensions || {},
    history: vendor.history || [score],
    lastPull: vendor.lastPull || vendor.updated_at || "Backend sync",
    nextPull: vendor.nextPull || (vendor.schedule === "Manual" ? "Manual only" : "Backend controlled"),
    status: vendor.status || (score >= 7.8 ? "green" : score >= 6.6 ? "amber" : "red"),
    relationshipType: relationship,
    evidenceCoverage,
    scoreType,
    metadata: {
      ...metadata,
      relationshipType: relationship,
      evidenceCoverage,
      scoreType
    }
  };
}

function normalizeApiSignal(signal) {
  return {
    ...signal,
    id: String(signal.id),
    vendorId: String(signal.vendorId ?? signal.vendor_id ?? ""),
    source: signal.source || signal.source_name || "Backend source",
    sourceName: signal.source_name || signal.source || "Backend source",
    aiExplanation: signal.aiExplanation || signal.ai_explanation || "",
    createdAt: signal.createdAt || signal.created_at || new Date().toISOString(),
    reviewedAt: signal.reviewedAt || signal.reviewed_at || null,
    reviewedBy: signal.reviewedBy || signal.reviewed_by || null,
    rejectionReason: signal.rejectionReason || signal.rejection_reason || "",
    impact: Number(signal.impact || 0),
    confidence: Number(signal.confidence || 0)
  };
}

function normalizeApiSource(source) {
  const trustScore = source.trustScore ?? source.trust_score ?? (source.confidence === "High" ? 88 : source.confidence === "Medium" ? 70 : 46);
  return {
    ...source,
    id: String(source.id),
    trustScore: Number(trustScore)
  };
}

function normalizeApiConnector(connector) {
  const id = String(connector.id);
  return {
    ...connector,
    id,
    type: connector.type || connector.connector_type || "Connector",
    trustScore: Number(connector.trustScore ?? connector.trust_score ?? 70),
    lastSync: connector.lastSync || connector.last_sync || "Not synced",
    nextSync: connector.nextSync || connector.next_sync || "Manual",
    lastError: connector.lastError || connector.last_error || "",
    demoIntegration: connector.demoIntegration ?? ["coupa", "littlebig"].includes(id),
    description: connector.description || (id === "coupa"
      ? "Pulls PO, invoice, exception and savings indicators into GSIL."
      : id === "littlebig"
        ? "Pulls mission, staffing and service performance indicators into GSIL."
        : "")
  };
}

function normalizeApiAudit(event) {
  return {
    ...event,
    id: String(event.id),
    actor: event.actor || event.actor_name || "Backend",
    createdAt: event.createdAt || event.created_at || new Date().toISOString(),
    message: event.message || event.event_type || "Audit event"
  };
}

function normalizeApiInternalInput(input) {
  return {
    ...input,
    id: String(input.id),
    vendorId: String(input.vendorId ?? input.vendor_id ?? ""),
    feedType: input.feedType || input.feed_type || "Manual Input",
    attachment: input.attachment || null,
    createdAt: input.createdAt || input.created_at || new Date().toISOString()
  };
}

function buildFailedFeeds(connectors) {
  return connectors
    .filter((connector) => connector.status === "failed" || connector.status === "degraded")
    .map((connector) => ({
      id: connector.id,
      name: connector.name,
      owner: connector.owner,
      status: connector.status,
      error: connector.lastError,
      nextRetry: connector.nextRetry || "Manual retry"
    }));
}

function buildBackendMonitoring(payload) {
  const connectors = payload.connectors || [];
  return {
    apiStatus: backendModeEnabled() ? "healthy" : "paused",
    schedulerStatus: backendModeEnabled() ? "active" : "demo",
    pendingReviews: (payload.signals || []).filter((signal) => signal.status === "pending").length,
    failedConnectors: connectors.filter((connector) => connector.status === "failed" || connector.status === "degraded").length
  };
}

let state = {
  activeFilter: "all",
  vendors: [],
  sources: [],
  signals: [],
  internalInputs: [],
  audit: [],
  meta: {},
  connectors: [],
  failedFeeds: [],
  uploadHistory: [],
  monitoring: {},
  tasks: [],
  decisions: [],
  roles: [],
  currentUser: null
};

let autoPullTimer = null;
let autoPullInFlight = false;
let selectedInternalEvidenceFile = null;
const internalEvidenceMaxBytes = 3 * 1024 * 1024;
const internalEvidenceExtensions = new Set(["pdf", "docx", "xlsx", "csv", "pptx", "txt", "png", "jpg", "jpeg", "webp"]);
const autoPullFrequencies = {
  manual: { label: "Manual only", ms: 0 },
  "15min": { label: "Every 15 minutes", ms: 15 * 60 * 1000 },
  hourly: { label: "Hourly", ms: 60 * 60 * 1000 },
  "6h": { label: "Every 6 hours", ms: 6 * 60 * 60 * 1000 },
  daily: { label: "Daily", ms: 24 * 60 * 60 * 1000 }
};
let demoGuide = { active: false, step: 0 };
let latestCopilotTask = null;

const demoSteps = [
  {
    view: "dashboard",
    title: "Start with portfolio truth",
    text: "Open on the dashboard and explain the portfolio posture, pending gate, executive attention vendors, and active source coverage."
  },
  {
    view: "connectors",
    title: "Show enterprise signal intake",
    text: "Open Connectors and run Coupa or LittleBig demo sync to create procurement-ready pending signals."
  },
  {
    view: "signals",
    title: "Validate before scores move",
    text: "Open Approval Gate and show that GSIL requires human review before high-impact signals affect PRISM scores."
  },
  {
    view: "vendors",
    title: "Turn insight into vendor action",
    text: "Open a vendor workspace and use the playbook actions: validate evidence, request clarification, compare alternatives, and generate QBR."
  },
  {
    view: "client",
    title: "Explain value and trust",
    text: "Use Client View to show stakeholder benefits, governance controls, data lineage, and expected pilot outcomes."
  },
  {
    view: "pilot",
    title: "Close with pilot readiness",
    text: "Finish on Pilot Readiness to show the required data, owners, integrations, value case, and next production path."
  }
];

const roleWorkspaceConfig = {
  admin: {
    title: "Admin Control Tower",
    scope: "Owns policy, roles, connectors, and source governance",
    primaryView: "dashboard",
    primaryLabel: "Open dashboard",
    actions: ["Change auto-pull policy", "Tune scoring thresholds", "Manage source trust", "Sync connectors", "Approve any score action"],
    queue: ["Confirm production role map", "Review failed connector owners", "Lock source governance policy"]
  },
  procurement_head: {
    title: "Procurement Head Queue",
    scope: "Owns vendor decisions, approvals, QBRs, and executive actions",
    primaryView: "signals",
    primaryLabel: "Open approval gate",
    actions: ["Approve score-changing signals", "Bulk approve/reject gated signals", "Mark Specialist vendors", "Generate QBR snapshots", "Sync Coupa/LittleBig demo feeds"],
    queue: ["Approve high-confidence pending signals", "Review executive attention vendors", "Prepare QBR pack"]
  },
  analyst: {
    title: "Analyst Research Desk",
    scope: "Owns source quality, research pulls, weak-signal rejection, and evidence prep",
    primaryView: "sources",
    primaryLabel: "Open source library",
    actions: ["Run credible research pull", "Reject weak signals", "Add internal evidence", "Raise or reduce source trust", "Export reports"],
    queue: ["Review source trust scores", "Reject low-confidence signal noise", "Attach evidence to watchlist vendors"]
  },
  finance_controller: {
    title: "Finance Evidence Desk",
    scope: "Owns cost, invoice, savings, and financial evidence validation",
    primaryView: "internal",
    primaryLabel: "Open internal gate",
    actions: ["Upload financial evidence", "Generate QBR snapshots", "Export reports", "View audit history"],
    queue: ["Add invoice exception evidence", "Validate savings leakage", "Prepare QBR financial note"]
  },
  viewer: {
    title: "Leadership Read-Only View",
    scope: "Views portfolio health, audit trail, and exported reports without changing scores",
    primaryView: "dashboard",
    primaryLabel: "Open dashboard",
    actions: ["View dashboards", "View audit trail", "Export quarterly and FY reports", "Open Client View"],
    queue: ["Review portfolio health", "Inspect executive attention vendors", "Download leadership summary"]
  }
};

const productionChecklist = [
  ["SSO and access control", "Required", "Map GSIL roles to enterprise identity groups and approval ownership.", "Security / IT"],
  ["Coupa connector", "Required", "Read-only API for spend, invoice exceptions, supplier IDs, PO cycle and savings fields.", "Procurement Ops"],
  ["LittleBig Connection connector", "Required", "Mission, capacity, delivery, rate-card and services performance feeds.", "Services Procurement"],
  ["PostgreSQL data layer", "Required", "Persistent storage for vendors, signals, audit events, source policy and scoring history.", "Engineering"],
  ["Backend auth and API", "Required", "Move demo logic from browser storage into governed API routes with role enforcement.", "Engineering"],
  ["Data privacy approval", "Required", "Confirm vendor, invoice, internal evidence and external source handling rules.", "Legal / Privacy"],
  ["Model validation", "Required", "Sign off PRISM weights, AI relevance factors, confidence thresholds and exception handling.", "Procurement CoE"],
  ["Monitoring and alerting", "Recommended", "Track connector failures, scheduler runs, pending approvals and score drift.", "Operations"],
  ["UAT pilot cohort", "Recommended", "Select 20-30 representative vendors, owners, approvers and QBR users.", "Business Owners"]
];

const benchmarkGroups = {
  riskCompliance: {
    title: "Risk & Compliance",
    promise: "Move procurement from reactive vendor reviews to early warnings, compliance visibility, and predictive service risk.",
    owner: "Procurement risk, compliance, operations",
    relatedView: "monitoring",
    features: [
      {
        name: "Vendor Risk Early Warning System",
        value: "Predict vendors likely to move into performance watch or executive attention before the next QBR.",
        sample: "Early warning: Accenture India shows 18% higher delivery pressure from SLA, attrition, and pending issue signals.",
        metric: "18%",
        metricLabel: "risk lift",
        action: "Open risk queue"
      },
      {
        name: "Vendor ESG & Compliance Monitor",
        value: "Track compliance, regulatory, ESG, sanctions, data privacy, and cyber-risk signals in one governed view.",
        sample: "Compliance watch: 2 vendors require source review before score impact is allowed.",
        metric: "2",
        metricLabel: "watch items",
        action: "Review controls"
      },
      {
        name: "Predictive SLA Breach Forecasting",
        value: "Use internal performance, incidents, staffing, and historical score movement to forecast likely SLA breach areas.",
        sample: "Forecast: Wipro has a 64% breach likelihood on support turnaround if current trend persists.",
        metric: "64%",
        metricLabel: "breach likelihood",
        action: "Open forecast"
      }
    ]
  },
  commercialIntel: {
    title: "Commercial Intelligence",
    promise: "Turn spend, rate, invoice, and supplier footprint data into savings, leakage, negotiation, and category actions.",
    owner: "Procurement, finance, category managers",
    relatedView: "compare",
    features: [
      {
        name: "Spend Leakage Detection",
        value: "Identify invoice exceptions, duplicate spend, off-contract buying, rate-card mismatch, and savings leakage.",
        sample: "Leakage signal: Deloitte India invoice exceptions trend 3.8% to 7.1%, creating commercial review priority.",
        metric: "7.1%",
        metricLabel: "exception rate",
        action: "Inspect leakage"
      },
      {
        name: "Supplier Consolidation Recommendation",
        value: "Suggest where overlapping suppliers can be consolidated to reduce cost, risk, and operating complexity.",
        sample: "Consolidation candidate: 3 consulting/service providers overlap in transformation support.",
        metric: "3",
        metricLabel: "overlaps",
        action: "View options"
      },
      {
        name: "Category Intelligence Dashboard",
        value: "Benchmark vendors by category, geography, cost, performance, specialization, and strategic importance.",
        sample: "Category view: IT services has the highest signal volume and strongest value opportunity.",
        metric: "IT",
        metricLabel: "top category",
        action: "Open category"
      },
      {
        name: "Negotiation Readiness Score",
        value: "Tell procurement when a vendor is ready for renegotiation based on risk, spend, performance, and market movement.",
        sample: "Negotiation ready: EY India shows leverage from performance watch plus upcoming commercial review.",
        metric: "82",
        metricLabel: "readiness",
        action: "Prepare negotiation"
      },
      {
        name: "Benchmarking Against Market Rates",
        value: "Compare vendor rates, delivery quality, and commercial terms against market benchmarks.",
        sample: "Rate benchmark: 4-6% savings opportunity visible for selected services portfolio.",
        metric: "4-6%",
        metricLabel: "opportunity",
        action: "Open benchmark"
      }
    ]
  },
  contractRenewal: {
    title: "Contract & Renewal",
    promise: "Convert contract obligations and renewal dates into proactive sourcing, QBR, and negotiation decisions.",
    owner: "Procurement, legal, category owners",
    relatedView: "audit",
    features: [
      {
        name: "Contract Intelligence Layer",
        value: "Read contract clauses, renewal dates, SLAs, penalty terms, rate cards, and obligations.",
        sample: "Contract insight: 5 vendors need SLA and rate-card clause mapping before production rollout.",
        metric: "5",
        metricLabel: "contracts to map",
        action: "Map clauses"
      },
      {
        name: "Contract Renewal Risk Calendar",
        value: "Show upcoming renewals with risk, leverage, savings opportunity, and action owner.",
        sample: "Renewal watch: KPMG India renewal window should trigger 90-day evidence review.",
        metric: "90d",
        metricLabel: "review window",
        action: "Open calendar"
      }
    ]
  },
  decisionAutomation: {
    title: "Decision Automation",
    promise: "Make vendor decisions explainable, faster, and repeatable through copilot, QBR automation, and audit-grade lineage.",
    owner: "Procurement leadership, analysts, finance",
    relatedView: "explainability",
    features: [
      {
        name: "Procurement Copilot",
        value: "Ask questions like which vendors need executive attention, why scores moved, or what to do before renewal.",
        sample: "Copilot answer: Prioritize PwC India and EY India due to negative signals and weak PRISM dimensions.",
        metric: "Ask",
        metricLabel: "natural language",
        action: "Ask copilot"
      },
      {
        name: "Automated QBR Generator",
        value: "Generate quarterly business review packs with score movement, risks, actions, evidence, and recommendations.",
        sample: "QBR ready: 6 vendors have enough audit or signal history for an executive snapshot.",
        metric: "6",
        metricLabel: "QBR-ready",
        action: "Generate QBR"
      },
      {
        name: "Decision Audit & Explainability Center",
        value: "Show signal source, internal evidence, approver, score movement, business rationale, and timestamp.",
        sample: "Explainability center links every score movement to source trust, human approval, and audit history.",
        metric: "100%",
        metricLabel: "traceable",
        action: "Open lineage"
      }
    ]
  },
  benchmarkScenario: {
    title: "Benchmarking & Scenario Planning",
    promise: "Help procurement compare alternatives and simulate business impact before making sourcing decisions.",
    owner: "Category managers, sourcing teams, leadership",
    relatedView: "dashboard",
    features: [
      {
        name: "Vendor Substitution Engine",
        value: "Recommend alternate vendors when a supplier is underperforming, risky, too expensive, or capacity constrained.",
        sample: "Substitution candidate: Capgemini India can be compared against Wipro for selected delivery-risk scenarios.",
        metric: "2",
        metricLabel: "alternatives",
        action: "Compare vendors"
      },
      {
        name: "Scenario Planning Simulator",
        value: "Model what happens if spend increases, SLA drops, invoice exceptions spike, or a vendor exits.",
        sample: "Scenario: invoice exception spike reduces Score & Value and pushes vendor into performance watch.",
        metric: "4",
        metricLabel: "scenario types",
        action: "Run scenario"
      }
    ]
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const on = (selector, eventName, handler) => {
  const element = $(selector);
  if (element) element.addEventListener(eventName, handler);
};

function roleHeaders() {
  const session = currentSession();
  const role = session?.role || "viewer";
  return {
    "x-gsil-role": role,
    "x-gsil-user": session?.username || `${role}@amadeus.example`
  };
}

function currentSession() {
  try {
    return JSON.parse(localStorage.getItem("gsil-demo-session") || "null");
  } catch {
    return null;
  }
}

function pendingVendorDrafts() {
  try {
    const pending = JSON.parse(localStorage.getItem(pendingVendorDraftsKey) || "[]");
    const overlay = JSON.parse(localStorage.getItem(clientVendorOverlayKey) || "[]");
    const byName = new Map([...overlay, ...pending].map((vendor) => [String(vendor.name || "").toLowerCase(), vendor]));
    return Array.from(byName.values()).map(normalizeApiVendor);
  } catch {
    return [];
  }
}

function savePendingVendorDraft(vendor) {
  const drafts = [
    vendor,
    ...pendingVendorDrafts().filter((item) => item.id !== vendor.id && item.name.toLowerCase() !== vendor.name.toLowerCase())
  ].slice(0, 20);
  localStorage.setItem(pendingVendorDraftsKey, JSON.stringify(drafts));
  localStorage.setItem(clientVendorOverlayKey, JSON.stringify(drafts));
}

function removePendingVendorDraft(localId, vendorName) {
  const lowerName = String(vendorName || "").toLowerCase();
  const drafts = pendingVendorDrafts().filter((item) => item.id !== localId && item.name.toLowerCase() !== lowerName);
  localStorage.setItem(pendingVendorDraftsKey, JSON.stringify(drafts));
  localStorage.setItem(clientVendorOverlayKey, JSON.stringify(drafts));
}

function mergePendingVendorDrafts(vendors = []) {
  const liveVendors = vendors.map(normalizeApiVendor);
  const liveNames = new Set(liveVendors.map((vendor) => vendor.name.toLowerCase()));
  const drafts = pendingVendorDrafts().filter((draft) => !liveNames.has(draft.name.toLowerCase()));
  return [
    ...drafts,
    ...liveVendors.filter((vendor) => !drafts.some((draft) => draft.id === vendor.id || draft.name.toLowerCase() === vendor.name.toLowerCase()))
  ];
}

async function resetDemoState() {
  if (!requireUiPermission("settings:write", "Only Admin can reset the demo state.")) return;
  if (!window.confirm("Reset local demo vendors, tasks, decisions, and cached demo activity? Backend records will not be deleted.")) return;
  [
    pendingVendorDraftsKey,
    clientVendorOverlayKey,
    "gsil-static-demo-db-v2",
    "gsil-action-tasks",
    "gsil-decision-log",
    "gsil-last-auto-pull"
  ].forEach((key) => localStorage.removeItem(key));
  demoGuide = { active: false, step: 0 };
  showAllVendorsBeforeRender();
  await refreshWithFallback();
  setActiveView("dashboard");
  showOperationStatus("Demo state reset", "success", true);
  toast("Demo state reset");
}

function presentationModeEnabled() {
  return localStorage.getItem(presentationModeKey) === "active";
}

function applyPresentationMode() {
  const enabled = presentationModeEnabled();
  document.body.classList.toggle("presentation-mode", enabled);
  const button = $("#presentationModeBtn");
  if (button) {
    button.hidden = state.currentUser?.role !== "admin";
    button.textContent = enabled ? "Exit presentation" : "Presentation mode";
    button.classList.toggle("active", enabled);
  }
}

function togglePresentationMode() {
  if (!requireUiPermission("settings:write", "Only Admin can change presentation mode.")) return;
  const enabling = !presentationModeEnabled();
  localStorage.setItem(presentationModeKey, enabling ? "active" : "inactive");
  if (enabling) setActiveView("dashboard");
  applyPresentationMode();
  applyPermissionState();
  toast(presentationModeEnabled() ? "Presentation mode enabled" : "Presentation mode disabled");
}

function can(permission) {
  const role = state.currentUser?.role || currentSession()?.role || "viewer";
  return (rolePermissions[role] || []).includes(permission);
}

function requireUiPermission(permission, message) {
  if (can(permission)) return true;
  toast(message || "Your demo role does not have permission for this action");
  return false;
}

function defaultViewForRole(role) {
  return roleWorkspaceConfig[role]?.primaryView || "dashboard";
}

function disabledIfNo(permission) {
  return can(permission) ? "" : `disabled aria-disabled="true" title="Not available for ${roleLabels[state.currentUser?.role] || "this role"}"`;
}

function setDisabled(selector, disabled) {
  const element = $(selector);
  if (!element) return;
  element.disabled = disabled;
  element.title = disabled ? "Admin permission required for this demo policy" : "";
}

function showLogin() {
  document.body.classList.add("auth-locked");
  $("#loginScreen").hidden = false;
  $("#loginUsername").focus();
}

function hideLogin() {
  document.body.classList.remove("auth-locked");
  $("#loginScreen").hidden = true;
}

function setSession(user) {
  const session = {
    username: user.username,
    name: user.name,
    role: user.role,
    signedInAt: new Date().toISOString()
  };
  localStorage.setItem("gsil-demo-session", JSON.stringify(session));
  localStorage.setItem("gsil-demo-role", user.role);
  state.currentUser = { name: user.name, role: user.role, email: user.username };
}

function clearSession() {
  localStorage.removeItem("gsil-demo-session");
  localStorage.removeItem("gsil-demo-role");
  state.currentUser = null;
}

async function signIn(event) {
  event.preventDefault();
  const username = $("#loginUsername").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  const user = demoUsers.find((item) => item.username === username && item.password === password);
  if (!user) {
    $("#loginError").textContent = "Demo username or password is incorrect.";
    return;
  }
  $("#loginError").textContent = "";
  setSession(user);
  hideLogin();
  setActiveView(defaultViewForRole(user.role));
  startAutoPullLoop();
  toast(`Signed in as ${roleLabels[user.role]}`);
  refreshWithFallback().catch((error) => {
    console.error("GSIL background refresh failed", error);
    toast(`Signed in, but data could not load: ${error.message}`);
  });
}

function signOut() {
  clearSession();
  if (autoPullTimer) window.clearInterval(autoPullTimer);
  autoPullTimer = null;
  $("#loginForm").reset();
  $("#loginError").textContent = "";
  showLogin();
  toast("Signed out");
}

async function boot() {
  applyBackendUrlParams();
  bindNavigation();
  bindGlobalEvents();
  const session = currentSession();
  if (!session) {
    showLogin();
    return;
  }
  state.currentUser = { name: session.name, role: session.role, email: session.username };
  hideLogin();
  setActiveView(defaultViewForRole(session.role));
  startAutoPullLoop();
  refreshWithFallback().catch((error) => {
    console.error("GSIL background refresh failed", error);
    toast(`Signed in, but data could not load: ${error.message}`);
  });
}

function vendorById(id) {
  return state.vendors.find((vendor) => sameId(vendor.id, id));
}

function sameId(left, right) {
  return String(left) === String(right);
}

function scoreVendor(vendor) {
  const rawScore = vendor?.score ?? vendor?.prism_score;
  if (rawScore !== undefined && rawScore !== null && rawScore !== "") return Number(rawScore);
  return calculateVendorScore(vendor);
}

function calculateVendorScore(vendor) {
  const dimensions = vendor?.dimensions || {};
  const weights = vendor?.specialist ? specialistWeights : standardWeights;
  const hasDimensions = Object.keys(prismLabels).some((key) => dimensions[key] !== undefined && dimensions[key] !== null);
  if (!hasDimensions) return 0;
  return Number(Object.keys(prismLabels).reduce((sum, key) => {
    return sum + Number(dimensions[key] ?? 0) * weights[key];
  }, 0).toFixed(2));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The evidence document could not be read"));
    reader.readAsDataURL(file);
  });
}

function clearSelectedEvidenceFile() {
  selectedInternalEvidenceFile = null;
  const input = $("#internalEvidenceFile");
  if (input) input.value = "";
  const summary = $("#selectedEvidenceFile");
  if (summary) {
    summary.hidden = true;
    summary.innerHTML = "";
  }
}

function validateInternalEvidenceFile(file) {
  const extension = String(file?.name || "").split(".").pop().toLowerCase();
  if (!internalEvidenceExtensions.has(extension)) throw new Error("Use PDF, DOCX, XLSX, CSV, PPTX, TXT, PNG, JPG or WEBP");
  if (Number(file.size || 0) > internalEvidenceMaxBytes) throw new Error("Evidence documents must be 3 MB or smaller");
  if (!file.size) throw new Error("The selected evidence document is empty");
}

function statusLabel(status) {
  return statusTerms[status]?.label || String(status || "Unclassified");
}

function vendorRelationship(vendor) {
  return vendorRelationshipTypes[vendor?.relationshipType] || vendorRelationshipTypes.direct;
}

function isMarketOnlyVendor(vendor) {
  return vendor?.relationshipType && vendor.relationshipType !== "direct";
}

function vendorScoreLabel(vendor) {
  return isMarketOnlyVendor(vendor) ? "Market score" : "PRISM score";
}

function connectorLabel(status) {
  return connectorTerms[status] || String(status || "Unknown");
}

function clientFacingText(value, fallback = "Not available") {
  return String(value || fallback)
    .replace(/demo ready/gi, "Ready for sync")
    .replace(/demo sync/gi, "sync")
    .replace(/static demo/gi, "local continuity mode")
    .replace(/integration shell/gi, "integration");
}

function sourceTrustScore(source) {
  if (source.trustScore !== undefined && source.trustScore !== null) return Number(source.trustScore);
  const base = source.confidence === "High" ? 88 : source.confidence === "Medium" ? 70 : 46;
  const activeBoost = source.active ? 6 : -12;
  const categoryBoost = /Regulatory|Industry|Financial/.test(source.category || "") ? 5 : 0;
  return Math.max(20, Math.min(98, base + activeBoost + categoryBoost));
}

function connectorTrustScore(connector) {
  const confidence = connector.confidence === "High" ? 90 : connector.confidence === "Medium" ? 76 : 55;
  const status = connector.status === "healthy" ? 6 : connector.status === "degraded" ? -8 : connector.status === "failed" ? -20 : -12;
  return Math.max(20, Math.min(98, confidence + status));
}

function nextLowerConfidence(confidence) {
  if (confidence === "High") return "Medium";
  if (confidence === "Medium") return "Low";
  return "Low";
}

function nextHigherConfidence(confidence) {
  if (confidence === "Low") return "Medium";
  if (confidence === "Medium") return "High";
  return "High";
}

function playbookForSignal(signal) {
  const playbooks = {
    P: "Operations remediation playbook: validate SLA data, assign delivery owner, set weekly recovery checkpoint.",
    R: "Risk office review playbook: confirm control impact, inspect contract exposure, document mitigation owner.",
    I: "Integration readiness playbook: validate API/system dependency, confirm certification, create technical action plan.",
    S: "Finance validation playbook: reconcile PO/invoice data, confirm savings or variance, align commercial owner.",
    M: "Strategic fit playbook: review capability depth, talent availability, roadmap fit, and expansion case."
  };
  return playbooks[signal.dimension] || playbooks.P;
}

function vendorActionPlaybook(vendor, pending = []) {
  const weakDimension = Object.entries(vendor.dimensions || {}).sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0] || "P";
  const negative = pending.filter((signal) => signal.sentiment === "Negative").length;
  const playbooks = [
    {
      title: "Validate contract and commercial exposure",
      owner: "Procurement Lead",
      detail: vendor.status === "red" || weakDimension === "S"
        ? "Check open contract obligations, savings leakage, PO exceptions, and price variance before next sourcing action."
        : "Confirm commercial terms still match the current delivery scope and renewal assumptions."
    },
    {
      title: "Request SLA and delivery evidence",
      owner: "Vendor Owner",
      detail: weakDimension === "P" || negative > 1
        ? "Ask for latest SLA pack, incident backlog, milestone recovery plan, and owner commitment dates."
        : "Keep latest SLA evidence attached for the next QBR snapshot."
    },
    {
      title: "Compare alternatives",
      owner: "Category Manager",
      detail: "Benchmark this vendor against two alternatives using PRISM strength, weak area, pending signals, and specialist fit."
    },
    {
      title: "Start QBR or executive review",
      owner: vendor.status === "red" ? "Procurement Head" : "Procurement Analyst",
      detail: vendor.status === "red"
        ? "Create an executive attention review with risk mitigation, decision options, and closure dates."
        : "Generate a QBR snapshot and convert validated signals into discussion points."
    }
  ];
  if (vendor.specialist) {
    playbooks.push({
      title: "Validate specialist capability depth",
      owner: "Services Procurement",
      detail: "Confirm niche skills, capacity, delivery continuity, and whether specialist weighting should remain active."
    });
  }
  return playbooks;
}

function generatedTasks() {
  const manualTasks = loadActionTasks();
  const signalTasks = state.signals.slice(0, 8).map((signal) => ({
    id: `signal-${signal.id}`,
    title: signal.title,
    vendor: vendorById(signal.vendorId)?.name || "Vendor",
    stage: signal.confidence >= 85 ? "Ready For Approval" : signal.confidence >= 70 ? "To Review" : "Waiting For Evidence",
    owner: signal.dimension === "R" ? "Risk Office" : signal.dimension === "S" ? "Finance Controller" : "Procurement Analyst",
    due: signal.confidence >= 85 ? "Today" : "This week",
    action: playbookForSignal(signal),
    signalId: signal.id,
    vendorId: signal.vendorId
  }));
  const connectorTasks = (state.failedFeeds || []).map((feed) => ({
    id: `connector-${feed.id}`,
    title: `${feed.name} remediation`,
    vendor: "Connector",
    stage: feed.status === "failed" ? "Owner Assigned" : "Waiting For Evidence",
    owner: feed.owner,
    due: feed.nextRetry || "Next sync",
    action: feed.error || "Review connector health.",
    connectorId: feed.id
  }));
  return [...manualTasks, ...signalTasks, ...connectorTasks];
}

function loadActionTasks() {
  if (backendModeEnabled()) return state.tasks || [];
  try {
    return JSON.parse(localStorage.getItem("gsil-action-tasks") || "[]");
  } catch {
    return [];
  }
}

function saveActionTasks(tasks) {
  if (backendModeEnabled()) return;
  localStorage.setItem("gsil-action-tasks", JSON.stringify(tasks.slice(0, 30)));
}

async function createActionTask({ title, vendorId, vendor, owner, stage = "To Review", due = "This week", action: actionText, source = "manual", metadata = {} }) {
  if (backendModeEnabled()) {
    const result = await action("", () => api.addTask({ title, vendorId, vendor, owner, stage, due, action: actionText, source, metadata }));
    return result.task;
  }
  const task = {
    id: `manual-${Date.now()}`,
    title,
    vendorId: vendorId || "",
    vendor: vendor || vendorById(vendorId)?.name || "Portfolio",
    stage,
    owner: owner || "Procurement Owner",
    due,
    action: actionText || title,
    source,
    metadata,
    createdAt: new Date().toISOString()
  };
  saveActionTasks([task, ...loadActionTasks()]);
  renderTaskBoard();
  return task;
}

function loadDecisionLog() {
  if (backendModeEnabled()) return state.decisions || [];
  try {
    return JSON.parse(localStorage.getItem("gsil-decision-log") || "[]");
  } catch {
    return [];
  }
}

function saveDecisionLog(entries) {
  if (backendModeEnabled()) return;
  localStorage.setItem("gsil-decision-log", JSON.stringify(entries.slice(0, 50)));
}

async function recordDecision(actionName, vendorId, context = "Vendor decision") {
  const vendor = vendorById(vendorId);
  const labels = {
    decisionApprove: "Approved",
    decisionSendBack: "Sent back",
    decisionEscalate: "Escalated",
    decisionDefer: "Deferred",
    decisionEvidence: "Evidence requested"
  };
  const owners = {
    decisionApprove: "Procurement Head",
    decisionSendBack: "Vendor Owner",
    decisionEscalate: "Executive Sponsor",
    decisionDefer: "Category Manager",
    decisionEvidence: "Procurement Analyst"
  };
  const label = labels[actionName] || "Decision captured";
  const entry = {
    id: `decision-${Date.now()}`,
    vendorId: vendorId || "",
    vendor: vendor?.name || "Portfolio",
    action: label,
    owner: owners[actionName] || "Procurement Owner",
    context,
    createdAt: new Date().toISOString()
  };
  if (backendModeEnabled()) {
    const result = await action("", () => api.addDecision({
      vendorId,
      action: label,
      owner: entry.owner,
      context,
      metadata: { vendor: entry.vendor, actionName }
    }));
    return result.decision;
  }
  saveDecisionLog([entry, ...loadDecisionLog()]);
  void createActionTask({
    title: `${label}: ${entry.vendor}`,
    vendorId,
    vendor: entry.vendor,
    owner: entry.owner,
    stage: actionName === "decisionApprove" ? "Ready For Approval" : actionName === "decisionEscalate" ? "Owner Assigned" : "Waiting For Evidence",
    due: actionName === "decisionEscalate" ? "Today" : "This week",
    action: context
  });
  renderWatchlist();
  return entry;
}

function recommendedAction(vendor) {
  const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
  const negative = pending.filter((signal) => signal.sentiment === "Negative").length;
  const strongest = pending.slice().sort((a, b) => b.impact - a.impact)[0];
  if (vendor.status === "red") return "Assign executive owner and resolve open risk signals before next sourcing decision.";
  if (negative >= 2) return "Move into weekly procurement review until repeated negative signals clear.";
  if (strongest?.confidence >= 85) return "Review high-confidence signal and approve or reject score movement.";
  if (vendor.specialist) return "Validate specialist capability fit and convert evidence into QBR discussion points.";
  if (vendor.status === "green") return "Protect as a preferred partner and look for expansion opportunities.";
  return "Monitor next connector sync and request supporting evidence where confidence is low.";
}

function toast(message) {
  const toastEl = $("#toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.clearTimeout(toastEl._timer);
  toastEl._timer = window.setTimeout(() => toastEl.classList.remove("show"), 2800);
}

function showOperationStatus(message, type = "working", autoHide = false) {
  const status = $("#operationStatus");
  if (!status) return;
  status.hidden = false;
  status.className = `operation-status ${type}`;
  status.textContent = message;
  window.clearTimeout(status._timer);
  if (autoHide) {
    status._timer = window.setTimeout(() => {
      status.hidden = true;
    }, 3600);
  }
}

function autoPullEnabled() {
  return localStorage.getItem("gsil-auto-pull") !== "paused" && autoPullFrequency().ms > 0;
}

function autoPullFrequencyKey() {
  return localStorage.getItem("gsil-auto-pull-frequency") || "6h";
}

function autoPullFrequency() {
  return autoPullFrequencies[autoPullFrequencyKey()] || autoPullFrequencies["6h"];
}

function signalQualityPolicy() {
  return localStorage.getItem("gsil-signal-quality-policy") || "strict";
}

function updateAutoPullStatus() {
  const enabled = autoPullEnabled();
  const frequency = autoPullFrequency();
  const qualityLabel = signalQualityPolicy() === "strict" ? "strict credible signals" : "balanced credible signals";
  $("#autoPullStatus").textContent = enabled ? "Auto-pull active" : localStorage.getItem("gsil-auto-pull") === "paused" ? "Auto-pull paused" : "Manual pull mode";
  $("#autoPullDetail").textContent = enabled ? `${frequency.label} · ${qualityLabel}` : "Manual pull only";
  $("#autoPullToggle").textContent = enabled ? "Pause" : "Resume";
  const frequencySelect = $("#autoPullFrequency");
  if (frequencySelect) frequencySelect.value = autoPullFrequencyKey();
  const qualitySelect = $("#signalQualityPolicy");
  if (qualitySelect) qualitySelect.value = signalQualityPolicy();
}

async function runAutoPullIfDue(force = false) {
  if ((!force && !autoPullEnabled()) || autoPullInFlight) return;
  const intervalMs = autoPullFrequency().ms;
  if (!force && intervalMs <= 0) return;
  const lastRun = Number(localStorage.getItem("gsil-last-auto-pull") || 0);
  if (!force && Date.now() - lastRun < intervalMs) return;
  try {
    autoPullInFlight = true;
    const result = await api.runPull();
    localStorage.setItem("gsil-last-auto-pull", String(Date.now()));
    if (result?.state) await refresh(result.state);
    toast(result.generated.length ? `Auto-pull generated ${result.generated.length} credible signals` : "No new credible vendor-specific signals found");
  } catch (error) {
    toast(`Auto-pull paused: ${error.message || "check permissions"}`);
  } finally {
    autoPullInFlight = false;
    updateAutoPullStatus();
  }
}

function startAutoPullLoop() {
  updateAutoPullStatus();
  if (autoPullTimer) window.clearInterval(autoPullTimer);
  autoPullTimer = window.setInterval(() => runAutoPullIfDue(false), 60000);
  window.setTimeout(() => runAutoPullIfDue(false), 12000);
}

function setActiveView(viewId) {
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
}

function openActionModal(title, html) {
  $("#actionModalTitle").textContent = title;
  $("#actionModalContent").innerHTML = html;
  $("#actionModal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeActionModal() {
  $("#actionModal").hidden = true;
  $("#actionModalContent").innerHTML = "";
  document.body.classList.remove("modal-open");
}

function actionButton(action, id, label, style = "secondary-btn") {
  return `<button class="${style}" data-modal-action="${action}" data-action-id="${id}" type="button">${label}</button>`;
}

function decisionButtons(vendorId) {
  return `
    <div class="decision-controls">
      ${actionButton("decisionApprove", vendorId, "Approve", "primary-btn")}
      ${actionButton("decisionEvidence", vendorId, "Request evidence")}
      ${actionButton("decisionSendBack", vendorId, "Send back")}
      ${actionButton("decisionEscalate", vendorId, "Escalate")}
      ${actionButton("decisionDefer", vendorId, "Defer")}
    </div>
  `;
}

function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dimensionRows(vendor) {
  return Object.entries(vendor.dimensions).map(([key, value]) => `
    <div class="modal-kv">
      <span>${prismLabels[key]}</span>
      <strong>${Number(value).toFixed(1)}</strong>
    </div>
  `).join("");
}

function openVendorWorkspace(vendorId) {
  const vendor = vendorById(vendorId);
  if (!vendor) return;
  const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
  const lastAudit = state.audit.find((entry) => entry.metadata?.vendorId === vendor.id || entry.message?.includes(vendor.name));
  const playbooks = vendorActionPlaybook(vendor, pending);
  openActionModal(`${vendor.name} workspace`, `
    <div class="modal-summary-grid">
      <article>
        <span>Current posture</span>
        <strong>${statusLabel(vendor.status)}</strong>
      </article>
      <article>
        <span>PRISM score</span>
        <strong>${scoreVendor(vendor).toFixed(1)}</strong>
      </article>
      <article>
        <span>Pending evidence</span>
        <strong>${pending.length} signals</strong>
      </article>
    </div>
    <div class="modal-section">
      <h3>PRISM validation checklist</h3>
      <div class="modal-kv-grid">${dimensionRows(vendor)}</div>
    </div>
    <div class="modal-section">
      <h3>Recommended procurement action</h3>
      <p>${recommendedAction(vendor)}</p>
      <p class="muted">${lastAudit ? `Latest audit: ${escapeHtml(lastAudit.message)}` : "No recent audit item found for this vendor."}</p>
    </div>
    <div class="modal-section">
      <h3>Procurement action playbook</h3>
      <div class="playbook-grid">
        ${playbooks.map((item) => `
          <article class="playbook-card">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.owner)}</span>
            <p>${escapeHtml(item.detail)}</p>
          </article>
        `).join("")}
      </div>
    </div>
    <div class="modal-section action-output" id="vendorActionOutput">
      <h3>Action memo</h3>
      <p class="muted">Choose an action below to generate a procurement-ready note for this vendor.</p>
    </div>
    <div class="modal-section">
      <h3>Decision workflow</h3>
      <p class="muted">Capture what procurement wants to do next and route it into the Task Board.</p>
      ${decisionButtons(vendor.id)}
    </div>
    <div class="modal-actions">
      ${actionButton("reviewVendorSignals", vendor.id, "Review pending signals", "primary-btn")}
      ${actionButton("validateEvidence", vendor.id, "Validate evidence")}
      ${actionButton("requestClarification", vendor.id, "Request clarification")}
      ${actionButton("generateQbr", vendor.id, "Generate QBR")}
      ${actionButton("compareAlternatives", vendor.id, "Compare alternatives")}
      ${actionButton("markWatchlist", vendor.id, "Mark watchlist")}
      ${actionButton("downloadVendorBrief", vendor.id, "Download action brief")}
    </div>
  `);
}

function vendorActionMemo(actionName, vendor) {
  const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
  const weakest = Object.entries(vendor.dimensions || {}).sort((a, b) => Number(a[1]) - Number(b[1]))[0] || ["P", 0];
  const strongest = Object.entries(vendor.dimensions || {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || ["I", 0];
  const actions = {
    validateEvidence: {
      title: "Evidence validation",
      owner: "Procurement Analyst",
      steps: [
        "Confirm vendor/entity match against vendor master.",
        `Validate ${pending.length || "no"} open signal(s), source trust, and evidence date.`,
        `Check weakest PRISM factor: ${prismLabels[weakest[0]]} at ${Number(weakest[1]).toFixed(1)}.`,
        "Record decision in Audit Trail before any score-changing approval."
      ]
    },
    requestClarification: {
      title: "Clarification request",
      owner: "Vendor Owner",
      steps: [
        `Ask ${vendor.name} for supporting evidence on the current ${statusLabel(vendor.status)} posture.`,
        `Request explanation for ${prismLabels[weakest[0]]} movement and mitigation date.`,
        "Attach SLA, PO, invoice, mission, or staffing reference where applicable.",
        "Route response back through Internal Gate before updating PRISM."
      ]
    },
    markWatchlist: {
      title: "Watchlist review",
      owner: vendor.status === "red" ? "Procurement Head" : "Category Manager",
      steps: [
        `Place ${vendor.name} into the next QBR watchlist.`,
        `Track ${prismLabels[weakest[0]]} as the primary watch factor.`,
        "Set owner action, due date, and evidence requirement.",
        "Escalate if PRISM drops below 6.5 or negative high-confidence signal appears."
      ]
    },
    downloadVendorBrief: {
      title: "Vendor action brief",
      owner: "Procurement Team",
      steps: [
        `Current score: ${scoreVendor(vendor).toFixed(1)} (${statusLabel(vendor.status)}).`,
        `Strongest factor: ${prismLabels[strongest[0]]} ${Number(strongest[1]).toFixed(1)}.`,
        `Watch factor: ${prismLabels[weakest[0]]} ${Number(weakest[1]).toFixed(1)}.`,
        recommendedAction(vendor)
      ]
    }
  };
  return actions[actionName] || actions.downloadVendorBrief;
}

function renderVendorActionMemo(actionName, vendorId) {
  const vendor = vendorById(vendorId);
  const target = $("#vendorActionOutput");
  if (!vendor || !target) return;
  const memo = vendorActionMemo(actionName, vendor);
  target.innerHTML = `
    <h3>${escapeHtml(memo.title)}</h3>
    <div class="modal-kv-grid compact">
      <div class="modal-kv"><span>Owner</span><strong>${escapeHtml(memo.owner)}</strong></div>
      <div class="modal-kv"><span>Vendor</span><strong>${escapeHtml(vendor.name)}</strong></div>
      <div class="modal-kv"><span>Posture</span><strong>${statusLabel(vendor.status)}</strong></div>
    </div>
    <ol class="modal-checklist numbered">
      ${memo.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
    </ol>
  `;
}

function buildVendorBrief(vendor) {
  const memo = vendorActionMemo("downloadVendorBrief", vendor);
  const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
  return [
    `GSIL Vendor Action Brief - ${vendor.name}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `Category: ${vendor.category}`,
    `Tier: ${vendor.tier}`,
    `Posture: ${statusLabel(vendor.status)}`,
    `PRISM Score: ${scoreVendor(vendor).toFixed(1)}`,
    "",
    "PRISM Factors",
    ...Object.entries(vendor.dimensions || {}).map(([key, value]) => `- ${prismLabels[key]}: ${Number(value).toFixed(1)}`),
    "",
    "Recommended Action",
    recommendedAction(vendor),
    "",
    "Action Steps",
    ...memo.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Open Signals",
    ...(pending.length ? pending.map((signal) => `- ${signal.title} (${signal.source}, ${signal.confidence}% confidence)`) : ["- No pending signals currently visible."])
  ].join("\n");
}

function openSignalWorkspace(signalId) {
  const signal = state.signals.find((item) => sameId(item.id, signalId));
  if (!signal) return;
  const vendor = vendorById(signal.vendorId);
  openActionModal(`Validate signal`, `
    <div class="modal-section">
      <h3>${escapeHtml(signal.title)}</h3>
      <p>${escapeHtml(signal.summary)}</p>
    </div>
    <div class="modal-summary-grid">
      <article><span>Vendor</span><strong>${escapeHtml(vendor?.name || "Vendor")}</strong></article>
      <article><span>AI relevance</span><strong>${signal.confidence}%</strong></article>
      <article><span>PRISM dimension</span><strong>${prismLabels[signal.dimension]}</strong></article>
    </div>
    <div class="modal-section">
      <h3>Validation steps</h3>
      <ul class="modal-checklist">
        <li>Confirm vendor/entity match.</li>
        <li>Check source reliability and recency.</li>
        <li>Validate PRISM dimension mapping.</li>
        <li>Confirm suggested impact before approval.</li>
      </ul>
    </div>
    <div class="modal-section evidence-locker">
      <h3>Evidence locker</h3>
      <div class="modal-kv-grid">
        <div class="modal-kv"><span>Source system</span><strong>${escapeHtml(signal.source)}</strong></div>
        <div class="modal-kv"><span>Evidence ID</span><strong>GSIL-${signal.id}</strong></div>
        <div class="modal-kv"><span>Created</span><strong>${signal.createdAt ? new Date(signal.createdAt).toLocaleDateString() : "Demo"}</strong></div>
      </div>
      <p class="muted">Attach Coupa transaction ID, LittleBig mission ID, source URL, reviewer note, or internal document reference during production integration.</p>
    </div>
    <div class="modal-section">
      <h3>Recommended playbook</h3>
      <p>${playbookForSignal(signal)}</p>
    </div>
    <div class="modal-actions">
      <button class="primary-btn" data-modal-action="approveSignal" data-action-id="${signal.id}" type="button" ${disabledIfNo("signal:approve")}>Approve</button>
      <button class="secondary-btn" data-modal-action="rejectSignal" data-action-id="${signal.id}" type="button" ${disabledIfNo("signal:reject")}>Reject</button>
    </div>
  `);
}

function openConnectorWorkspace(connectorId) {
  const connector = (state.connectors || []).find((item) => item.id === connectorId);
  if (!connector) return;
  openActionModal(`${connector.name}`, `
    <div class="modal-summary-grid">
      <article><span>Operational posture</span><strong>${connectorLabel(connector.status)}</strong></article>
      <article><span>Trust score</span><strong>${connectorTrustScore(connector)}</strong></article>
      <article><span>Owner</span><strong>${connector.owner}</strong></article>
    </div>
    <div class="modal-section">
      <h3>Connector details</h3>
      <p>${escapeHtml(connector.description || `${connector.type} feed for ${connector.category}.`)}</p>
      <p class="muted">Last sync: ${connector.lastSync}. Next: ${connector.nextSync}.</p>
      ${connector.lastError ? `<p class="error-note">${escapeHtml(connector.lastError)}</p>` : ""}
    </div>
    <div class="modal-actions">
      ${connector.demoIntegration ? actionButton("syncConnector", connector.id, "Run sync", "primary-btn") : ""}
      ${actionButton("inspectConnector", connector.id, "Inspect mapping")}
      ${actionButton("routeConnectorOwner", connector.id, "Route to owner")}
      ${actionButton("openMonitoring", connector.id, "Open monitoring")}
    </div>
  `);
}

function openSourceWorkspace(sourceId) {
  const source = state.sources.find((item) => sameId(item.id, sourceId));
  if (!source) return;
  openActionModal(`${source.name}`, `
    <div class="modal-summary-grid">
      <article><span>Source trust score</span><strong>${sourceTrustScore(source)}</strong></article>
      <article><span>Status</span><strong>${source.active ? "Active" : "Paused"}</strong></article>
      <article><span>Category</span><strong>${source.category}</strong></article>
    </div>
    <div class="modal-section">
      <h3>Source review</h3>
      <p>${escapeHtml(source.url)}</p>
      <p class="muted">Procurement can validate whether this source should influence AI relevance and PRISM movement.</p>
    </div>
    <div class="modal-actions">
      ${actionButton("toggleSource", source.id, source.active ? "Pause source" : "Activate source", "primary-btn")}
      ${actionButton("sourceIncreaseTrust", source.id, "Increase trust")}
      ${actionButton("sourceDecreaseTrust", source.id, "Reduce trust")}
      ${actionButton("sourceReview", source.id, "Schedule source review")}
    </div>
  `);
}

function openAuditWorkspace(auditId) {
  const entry = state.audit.find((item) => sameId(item.id, auditId));
  if (!entry) return;
  openActionModal(`Audit event`, `
    <div class="modal-section">
      <h3>${escapeHtml(entry.message)}</h3>
      <p class="muted">${escapeHtml(entry.actor || "GSIL")} · ${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Logged"}</p>
    </div>
    <div class="modal-actions">
      ${actionButton("copyAudit", entry.id, "Copy audit note", "primary-btn")}
      ${actionButton("openAuditTrail", entry.id, "Open Audit Trail")}
    </div>
  `);
}

function openPortfolioWorkspace(status) {
  const vendors = state.vendors.filter((vendor) => vendor.status === status);
  const pending = state.signals.filter((signal) => vendors.some((vendor) => vendor.id === signal.vendorId));
  const weakest = vendors
    .flatMap((vendor) => Object.entries(vendor.dimensions).map(([dimension, value]) => ({ vendor, dimension, value: Number(value) })))
    .sort((a, b) => a.value - b.value)[0];
  openActionModal(`${statusLabel(status)} portfolio`, `
    <div class="modal-summary-grid">
      <article><span>Vendors</span><strong>${vendors.length}</strong></article>
      <article><span>Pending signals</span><strong>${pending.length}</strong></article>
      <article><span>Lowest PRISM area</span><strong>${weakest ? `${prismLabels[weakest.dimension]} ${weakest.value.toFixed(1)}` : "N/A"}</strong></article>
    </div>
    <div class="modal-section">
      <h3>Vendors in this posture</h3>
      <div class="portfolio-vendor-list">
        ${vendors.map((vendor) => `
          <button class="portfolio-vendor-link" data-modal-action="openVendorWorkspace" data-action-id="${vendor.id}" type="button">
            <strong>${vendor.name}</strong>
            <span>${vendor.category} · PRISM ${scoreVendor(vendor).toFixed(1)}</span>
          </button>
        `).join("") || `<p class="muted">No vendors currently in this posture.</p>`}
      </div>
    </div>
    <div class="modal-section">
      <h3>Recommended portfolio action</h3>
      <p>${status === "red" ? "Prioritize executive owner assignment, resolve pending negative signals, and validate remediation dates." : status === "amber" ? "Use QBR and evidence validation to prevent drift into executive attention." : "Protect high-performing relationships and look for expansion or consolidation opportunities."}</p>
    </div>
    <div class="modal-actions">
      ${actionButton("filterPortfolio", status, "Filter scorecards", "primary-btn")}
      ${actionButton("openTasks", status, "Open task board")}
      ${actionButton("openCompare", status, "Compare vendors")}
    </div>
  `);
}

async function handleModalAction(button) {
  const actionName = button.dataset.modalAction;
  const id = button.dataset.actionId;
  if (actionName === "openVendorWorkspace") {
    openVendorWorkspace(id);
    return;
  }
  if (actionName === "filterPortfolio") {
    state.activeFilter = id;
    $$(".segmented button").forEach((item) => item.classList.toggle("active", item.dataset.filter === id));
    renderVendorCards();
    closeActionModal();
    toast(`Filtered scorecards to ${statusLabel(id)}`);
    return;
  }
  if (actionName === "openTasks") {
    setActiveView("tasks");
    closeActionModal();
    toast("Opened task board");
    return;
  }
  if (actionName === "openCompare") {
    setActiveView("compare");
    closeActionModal();
    toast("Opened vendor comparison");
    return;
  }
  if (actionName === "reviewVendorSignals") {
    $("#signalVendorFilter").value = id;
    setActiveView("signals");
    renderSignals();
    closeActionModal();
    toast("Filtered Approval Gate for selected vendor");
    return;
  }
  if (actionName === "openApprovalGate") {
    const signal = state.signals.find((item) => sameId(item.id, id));
    if (signal) $("#signalVendorFilter").value = signal.vendorId;
    setActiveView("signals");
    renderSignals();
    closeActionModal();
    toast("Opened signal in Approval Gate");
    return;
  }
  if (actionName === "generateQbr") {
    if (!requireUiPermission("qbr:write", "This role cannot generate QBR snapshots in the demo.")) return;
    const result = await action("", () => api.qbr(id));
    closeActionModal();
    toast(`QBR snapshot ready for ${result.snapshot.vendor}`);
    return;
  }
  if (actionName === "syncConnector") {
    if (!requireUiPermission("connector:sync", "Only Admin and Procurement Head can sync connector demo data.")) return;
    const result = await action("", () => api.syncConnector(id));
    closeActionModal();
    toast(`${result.connectorId === "coupa" ? "Coupa" : "LittleBig"} sync generated ${result.generated.length} signals`);
    return;
  }
  if (actionName === "toggleSource") {
    if (!requireUiPermission("source:write", "Only Admin and Analyst can change source trust controls.")) return;
    const source = state.sources.find((item) => sameId(item.id, id));
    if (source?.active && !window.confirm(`Pause ${source.name}? It will stop contributing new signals until reactivated.`)) return;
    if (source) await action("", () => api.updateSource(source.id, { active: !source.active }));
    closeActionModal();
    toast("Source status updated");
    return;
  }
  if (actionName === "sourceIncreaseTrust") {
    if (!requireUiPermission("source:write", "Only Admin and Analyst can change source trust controls.")) return;
    const source = state.sources.find((item) => sameId(item.id, id));
    if (source) await action("", () => api.updateSource(id, { confidence: nextHigherConfidence(source.confidence), trustScore: Math.min(98, sourceTrustScore(source) + 10) }));
    closeActionModal();
    toast("Source trust increased");
    return;
  }
  if (actionName === "sourceDecreaseTrust") {
    if (!requireUiPermission("source:write", "Only Admin and Analyst can change source trust controls.")) return;
    const source = state.sources.find((item) => sameId(item.id, id));
    if (source && !window.confirm(`Reduce trust for ${source.name} from ${sourceTrustScore(source)}?`)) return;
    if (source) await action("", () => api.updateSource(id, { confidence: nextLowerConfidence(source.confidence), trustScore: Math.max(20, sourceTrustScore(source) - 10) }));
    closeActionModal();
    toast("Source trust reduced");
    return;
  }
  if (actionName === "sourceReview") {
    const source = state.sources.find((item) => sameId(item.id, id));
    if (!source) return;
    await createActionTask({
      title: `Source review: ${source.name}`,
      vendor: "Source Governance",
      owner: "Procurement Analyst",
      stage: "To Review",
      due: "This week",
      action: `Review ${source.name} trust score ${sourceTrustScore(source)}, active status ${source.active ? "ON" : "OFF"}, and source category ${source.category}.`,
      source: "source-review",
      metadata: { sourceId: source.id, sourceName: source.name }
    });
    openActionModal(`Source review scheduled`, `
      <div class="modal-section">
        <h3>${escapeHtml(source.name)}</h3>
        <p>Review task created for source governance.</p>
      </div>
      <div class="modal-kv-grid">
        <div class="modal-kv"><span>Owner</span><strong>Procurement Analyst</strong></div>
        <div class="modal-kv"><span>Due</span><strong>This week</strong></div>
        <div class="modal-kv"><span>Trust</span><strong>${sourceTrustScore(source)}</strong></div>
      </div>
      <div class="modal-actions">
        ${actionButton("openTasks", "source-review", "Open task board", "primary-btn")}
      </div>
    `);
    toast("Source review task created");
    return;
  }
  if (actionName === "openMonitoring") {
    setActiveView("monitoring");
    closeActionModal();
    toast("Opened Monitoring");
    return;
  }
  if (actionName === "openAuditTrail") {
    setActiveView("audit");
    closeActionModal();
    toast("Opened Audit Trail");
    return;
  }
  if (actionName === "compareAlternatives") {
    setActiveView("compare");
    const target = vendorById(id);
    if (target && $("#compareVendorA")) $("#compareVendorA").value = target.id;
    renderCompareMatrix();
    closeActionModal();
    toast("Opened vendor comparison");
    return;
  }
  if (actionName === "approveSignal") {
    if (!requireUiPermission("signal:approve", "Only Admin and Procurement Head can approve score-changing signals.")) return;
    const signal = state.signals.find((item) => sameId(item.id, id));
    if (!signal) return;
    await action("Signal approved and PRISM recalculated", () => api.approveSignal(signal.id, {
      summary: signal.summary,
      dimension: signal.dimension,
      impact: signal.impact
    }));
    closeActionModal();
    return;
  }
  if (actionName === "rejectSignal") {
    if (!requireUiPermission("signal:reject", "This role cannot reject signals in the Approval Gate.")) return;
    if (!window.confirm("Reject this signal? It will be removed from the pending Approval Gate.")) return;
    await action("Signal rejected", () => api.rejectSignal(id, "Reviewer rejected signal during gate review."));
    closeActionModal();
    return;
  }
  if (["decisionApprove", "decisionSendBack", "decisionEscalate", "decisionDefer", "decisionEvidence"].includes(actionName)) {
    const entry = await recordDecision(actionName, id, "Decision captured from procurement workspace");
    closeActionModal();
    setActiveView("watchlist");
    toast(`${entry.action} for ${entry.vendor}`);
    return;
  }
  if (["validateEvidence", "requestClarification", "markWatchlist"].includes(actionName)) {
    renderVendorActionMemo(actionName, id);
    const vendor = vendorById(id);
    const memo = vendor ? vendorActionMemo(actionName, vendor) : null;
    if (vendor && memo) {
      await createActionTask({
        title: `${memo.title}: ${vendor.name}`,
        vendorId: vendor.id,
        vendor: vendor.name,
        owner: memo.owner,
        stage: actionName === "requestClarification" ? "Waiting For Evidence" : actionName === "markWatchlist" ? "Owner Assigned" : "To Review",
        due: actionName === "markWatchlist" ? "Next QBR" : "This week",
        action: memo.steps.join(" ")
      });
    }
    toast("Action memo generated");
    return;
  }
  if (actionName === "downloadVendorBrief") {
    if (!requireUiPermission("report:export", "This role cannot export reports.")) return;
    const vendor = vendorById(id);
    if (!vendor) return;
    renderVendorActionMemo(actionName, id);
    downloadTextFile(`${vendor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-gsil-action-brief.txt`, buildVendorBrief(vendor));
    toast("Vendor action brief downloaded");
    return;
  }
  if (actionName === "validateSignal") {
    const signal = state.signals.find((item) => sameId(item.id, id));
    if (!signal) return;
    const vendor = vendorById(signal.vendorId);
    await createActionTask({
      title: `Validate signal: ${signal.title}`,
      vendorId: signal.vendorId,
      vendor: vendor?.name || "Vendor",
      owner: signal.dimension === "R" ? "Risk Office" : signal.dimension === "S" ? "Finance Controller" : "Procurement Analyst",
      stage: "To Review",
      due: "Today",
      action: `Validate source ${signal.source || signal.sourceName}, confidence ${signal.confidence}%, PRISM mapping ${prismLabels[signal.dimension]}, and impact ${signal.impact}/10 before approval.`,
      source: "signal-validation",
      metadata: { signalId: signal.id }
    });
    openSignalWorkspace(signal.id);
    toast("Signal validation task created");
    return;
  }
  if (actionName === "requestSignalClarification") {
    const signal = state.signals.find((item) => sameId(item.id, id));
    if (!signal) return;
    const vendor = vendorById(signal.vendorId);
    await createActionTask({
      title: `Clarification needed: ${signal.title}`,
      vendorId: signal.vendorId,
      vendor: vendor?.name || "Vendor",
      owner: "Source Owner",
      stage: "Waiting For Evidence",
      due: "This week",
      action: `Request supporting evidence for ${signal.title}. Ask for source date, vendor/entity match, numeric support, and whether internal evidence is available.`,
      source: "signal-clarification",
      metadata: { signalId: signal.id }
    });
    openActionModal("Clarification request created", `
      <div class="modal-section">
        <h3>${escapeHtml(signal.title)}</h3>
        <p>Clarification task routed to Source Owner.</p>
      </div>
      <div class="modal-kv-grid">
        <div class="modal-kv"><span>Vendor</span><strong>${escapeHtml(vendor?.name || "Vendor")}</strong></div>
        <div class="modal-kv"><span>Stage</span><strong>Waiting For Evidence</strong></div>
        <div class="modal-kv"><span>Due</span><strong>This week</strong></div>
      </div>
      <div class="modal-actions">${actionButton("openTasks", "signal", "Open task board", "primary-btn")}</div>
    `);
    toast("Signal clarification task created");
    return;
  }
  if (actionName === "inspectConnector") {
    const connector = (state.connectors || []).find((item) => item.id === id);
    if (!connector) return;
    openActionModal(`${connector.name} mapping`, `
      <div class="modal-section">
        <h3>Mapped GSIL fields</h3>
        <div class="modal-kv-grid">
          <div class="modal-kv"><span>Vendor identity</span><strong>vendor_id, legal_name, owner</strong></div>
          <div class="modal-kv"><span>Evidence</span><strong>metric, period, current, previous</strong></div>
          <div class="modal-kv"><span>Governance</span><strong>source, trust, reviewer, timestamp</strong></div>
        </div>
      </div>
      <div class="modal-section">
        <h3>Production integration note</h3>
        <p>${escapeHtml(connector.description || "Connector mapping will be finalized with read-only API access and approved field mapping.")}</p>
      </div>
      <div class="modal-actions">
        ${actionButton("routeConnectorOwner", connector.id, "Create owner task", "primary-btn")}
        ${actionButton("openMonitoring", connector.id, "Open monitoring")}
      </div>
    `);
    toast("Connector mapping opened");
    return;
  }
  if (actionName === "routeConnectorOwner") {
    const connector = (state.connectors || []).find((item) => item.id === id);
    if (!connector) return;
    await createActionTask({
      title: `Connector owner review: ${connector.name}`,
      vendor: "Connector",
      owner: connector.owner || "Data Governance",
      stage: "Owner Assigned",
      due: "This week",
      action: `Confirm field mapping, auth method, data freshness SLA, and failure handling for ${connector.name}.`,
      source: "connector-routing",
      metadata: { connectorId: connector.id }
    });
    setActiveView("tasks");
    closeActionModal();
    toast("Connector owner task created");
    return;
  }
  if (actionName === "copyAudit") {
    const entry = state.audit.find((item) => sameId(item.id, id));
    if (!entry) return;
    const note = `${entry.message} | ${entry.actor || "GSIL"} | ${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Logged"}`;
    await createActionTask({
      title: "Audit note for stakeholder readout",
      vendor: "Audit",
      owner: "Procurement Analyst",
      stage: "Ready For Approval",
      due: "Today",
      action: note,
      source: "audit-note",
      metadata: { auditId: entry.id }
    });
    openActionModal("Audit note prepared", `
      <div class="modal-section">
        <h3>Stakeholder readout note</h3>
        <p>${escapeHtml(note)}</p>
      </div>
      <div class="modal-actions">
        ${actionButton("openTasks", "audit", "Open task board", "primary-btn")}
        ${actionButton("openAuditTrail", entry.id, "Open Audit Trail")}
      </div>
    `);
    toast("Audit note task created");
    return;
  }
  toast("Action captured");
}

function handleInteractiveOpen(target) {
  const interactive = target.closest(".interactive-item");
  if (!interactive || target.closest("button,input,select,textarea,summary,details,[contenteditable='true']")) return;
  if (interactive.dataset.openPortfolio) openPortfolioWorkspace(interactive.dataset.openPortfolio);
  if (interactive.dataset.openVendor) openVendorWorkspace(interactive.dataset.openVendor);
  if (interactive.dataset.openSignal) openSignalWorkspace(interactive.dataset.openSignal);
  if (interactive.dataset.openConnector) openConnectorWorkspace(interactive.dataset.openConnector);
  if (interactive.dataset.openSource) openSourceWorkspace(interactive.dataset.openSource);
  if (interactive.dataset.openAudit) openAuditWorkspace(interactive.dataset.openAudit);
}

function openNotificationCenter() {
  const notifications = [
    ...state.signals.slice(0, 5).map((signal) => ({
      title: signal.confidence >= 85 ? "High-confidence signal ready" : "Signal awaiting review",
      body: `${vendorById(signal.vendorId)?.name || "Vendor"} · ${signal.title}`,
      action: actionButton("openApprovalGate", signal.id, "Open signal", "primary-btn")
    })),
    ...state.failedFeeds.map((feed) => ({
      title: "Connector owner action needed",
      body: `${feed.name}: ${feed.error || "Review failed feed"}`,
      action: actionButton("openMonitoring", feed.id, "Open monitoring")
    }))
  ].slice(0, 7);
  openActionModal("Notification center", `
    ${notifications.map((item) => `
      <article class="notification-item">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.body)}</p>
        <div class="modal-actions">${item.action}</div>
      </article>
    `).join("") || `<article class="notification-item"><strong>No notifications</strong><p>Everything is clear right now.</p></article>`}
  `);
}

function setBusy(isBusy) {
  document.body.classList.toggle("busy", isBusy);
  if (isBusy) showOperationStatus("Working…", "working");
}

async function refresh(nextState) {
  if (nextState) {
    state = { ...state, ...normalizeApiPayload(nextState) };
  } else {
    const payload = await api.getState();
    state = { ...state, ...payload };
  }
  state.vendors = mergePendingVendorDrafts(state.vendors);
  const roleSwitcher = $("#roleSwitcher");
  if (roleSwitcher && state.currentUser?.role) roleSwitcher.value = state.currentUser.role;
  renderSelects();
  renderAll();
}

async function refreshWithFallback() {
  try {
    await refresh();
    return;
  } catch (error) {
    console.error("GSIL initial refresh failed", error);
    if (!backendModeEnabled()) throw error;
    localStorage.setItem(backendModeKey, "static");
    await refresh();
    toast("Backend could not load, so GSIL opened in built-in demo mode.");
  }
}

async function action(label, fn) {
  try {
    setBusy(true);
    const result = await fn();
    if (result?.state) await refresh(result.state);
    const successMessage = label || "Action completed successfully";
    showOperationStatus(successMessage, "success", true);
    toast(successMessage);
    return result;
  } catch (error) {
    console.error("GSIL action failed", error);
    const errorMessage = error.message || "The action could not be completed";
    showOperationStatus(errorMessage, "error", true);
    toast(errorMessage);
    throw error;
  } finally {
    setBusy(false);
  }
}

function renderMetrics() {
  const pending = state.signals.length;
  const attention = state.vendors.filter((vendor) => vendor.status === "red").length;
  const activeSources = state.sources.filter((source) => source.active).length;
  const avgScore = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length
    : 0;
  $("#metricGrid").innerHTML = [
    ["Portfolio PRISM", avgScore.toFixed(1), "Weighted across all vendors"],
    ["Pending Gate", pending, "Signals awaiting human action"],
    ["Executive Attention", attention, "Need procurement action"],
    ["Active Sources", activeSources, "Client-approved monitors"]
  ].map(([label, value, note]) => `<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
}

function renderClientBrief() {
  const avgScore = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length
    : 0;
  const executiveAttention = state.vendors.filter((vendor) => vendor.status === "red").length;
  const connectorIssues = state.failedFeeds.length;
  $("#clientBrief").innerHTML = [
    ["Decision clarity", `${state.signals.length} signals`, "Evidence is routed to review instead of staying buried across systems."],
    ["Governed scoring", avgScore.toFixed(1), "Current portfolio PRISM with human approval before material score movement."],
    ["Early warning", executiveAttention, "Vendors requiring executive attention before the next sourcing or QBR cycle."],
    ["Operational trust", connectorIssues, "Open connector or feed issues visible with owner routing."]
  ].map(([label, value, note]) => `
    <article class="client-brief-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${note}</p>
    </article>
  `).join("");
}

function renderPortfolio() {
  const counts = {
    green: state.vendors.filter((vendor) => vendor.status === "green").length,
    amber: state.vendors.filter((vendor) => vendor.status === "amber").length,
    red: state.vendors.filter((vendor) => vendor.status === "red").length
  };
  const total = Math.max(1, state.vendors.length);
  const avgScore = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length
    : 0;
  const priorAvg = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + Number(vendor.history?.at(-2) || vendor.score || 0), 0) / state.vendors.length
    : avgScore;
  const drift = avgScore - priorAvg;
  const pendingNegative = state.signals.filter((signal) => signal.sentiment === "Negative").length;
  const highConfidence = state.signals.filter((signal) => signal.confidence >= 85).length;
  const openFeedIssues = state.failedFeeds.length;
  $("#portfolioBars").innerHTML = Object.entries(counts).map(([key, count]) => {
    const width = (count / total) * 100;
    const vendors = state.vendors.filter((vendor) => vendor.status === key);
    const avg = vendors.length ? vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / vendors.length : 0;
    return `
      <article class="portfolio-row interactive-item" role="button" tabindex="0" data-open-portfolio="${key}">
        <div class="portfolio-row-head">
          <strong>${statusLabel(key)}</strong>
          <span>${count} vendors · ${Math.round(width)}%</span>
        </div>
        <div class="bar-track portfolio-track">
          <span class="bar-fill" style="width:${Math.max(4, width)}%;background:var(--${key})"></span>
          <span class="bar-ghost"></span>
        </div>
        <div class="portfolio-row-foot">
          <span>Avg PRISM ${avg ? avg.toFixed(1) : "0.0"}</span>
          <span>${vendors.slice(0, 3).map((vendor) => vendor.name).join(" · ") || "No vendors"}</span>
        </div>
      </article>
    `;
  }).join("");
  $("#portfolioInsights").innerHTML = `
    <article class="portfolio-insight">
      <span>Portfolio drift</span>
      <strong class="${drift >= 0 ? "positive" : "negative"}">${drift >= 0 ? "+" : ""}${drift.toFixed(2)}</strong>
      <small>Since last score point</small>
    </article>
    <article class="portfolio-insight">
      <span>Negative signals</span>
      <strong>${pendingNegative}</strong>
      <small>Need validation or rejection</small>
    </article>
    <article class="portfolio-insight">
      <span>High-confidence items</span>
      <strong>${highConfidence}</strong>
      <small>Ready for decision</small>
    </article>
    <article class="portfolio-insight">
      <span>Feed escalations</span>
      <strong>${openFeedIssues}</strong>
      <small>Connector owner follow-up</small>
    </article>
  `;
  $("#portfolioActions").innerHTML = `
    <button class="secondary-btn" data-portfolio-nav="signals" type="button">Open Approval Gate</button>
    <button class="secondary-btn" data-portfolio-nav="vendors" type="button">Open Vendors</button>
    <button class="secondary-btn" data-portfolio-nav="monitoring" type="button">Open Monitoring</button>
  `;
  const lastRun = state.meta?.lastSchedulerRun ? new Date(state.meta.lastSchedulerRun).toLocaleString() : "Live";
  $("#portfolioUpdated").textContent = lastRun;
}

function renderRisks() {
  const risks = state.signals
    .filter((signal) => signal.sentiment === "Negative")
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);
  $("#riskList").innerHTML = risks.map((signal) => `
    <article class="risk-item interactive-item" role="button" tabindex="0" data-open-signal="${signal.id}">
      <strong>${vendorById(signal.vendorId)?.name || "Vendor"}: ${signal.title}</strong>
      <p>${signal.summary}</p>
    </article>
  `).join("") || `<article class="risk-item"><strong>No active risk signals</strong><p>The current pending queue has no negative high-impact signals.</p></article>`;
}

function renderActionCockpit() {
  const ranked = state.vendors
    .map((vendor) => {
      const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
      const negativeImpact = pending.filter((signal) => signal.sentiment === "Negative").reduce((sum, signal) => sum + Number(signal.impact || 0), 0);
      const positiveImpact = pending.filter((signal) => signal.sentiment === "Positive").reduce((sum, signal) => sum + Number(signal.impact || 0), 0);
      const urgency = (vendor.status === "red" ? 30 : vendor.status === "amber" ? 15 : 4) + negativeImpact + pending.length * 2 - positiveImpact / 3;
      return { vendor, pending, urgency };
    })
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, 4);
  $("#actionCockpit").innerHTML = ranked.map(({ vendor, pending }) => {
    const topSignal = pending.slice().sort((a, b) => b.impact - a.impact)[0];
    return `
      <article class="action-card interactive-item" role="button" tabindex="0" data-open-vendor="${vendor.id}">
        <div class="card-top">
          <div>
            <h4>${vendor.name}</h4>
            <span class="muted">${statusLabel(vendor.status)} · PRISM ${scoreVendor(vendor).toFixed(1)}</span>
          </div>
          <span class="badge ${vendor.status}">${statusTerms[vendor.status]?.tone || "Review"}</span>
        </div>
        <p>${recommendedAction(vendor)}</p>
        <small>${topSignal ? `Trigger: ${topSignal.title} (${topSignal.confidence}% confidence)` : "No pending trigger. Use latest score trend and QBR context."}</small>
      </article>
    `;
  }).join("");
}

function renderVendor360() {
  const vendor = vendorById($("#vendor360Select").value) || state.vendors[0];
  if (!vendor) return;
  const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
  const topDimension = Object.entries(vendor.dimensions).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const weakDimension = Object.entries(vendor.dimensions).sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  $("#vendor360Panel").innerHTML = `
    <div class="vendor360-summary">
      <div>
        <span class="muted">${vendor.category}</span>
        <h4>${vendor.name}</h4>
        <p>${statusLabel(vendor.status)} · ${vendor.tier}${vendor.specialist ? " · Specialist Partner" : ""}</p>
      </div>
      <div class="score-pill">${scoreVendor(vendor).toFixed(1)}</div>
    </div>
    <div class="insight-grid">
      <article>
        <span>Primary strength</span>
        <strong>${prismLabels[topDimension[0]]} ${Number(topDimension[1]).toFixed(1)}</strong>
      </article>
      <article>
        <span>Improvement area</span>
        <strong>${prismLabels[weakDimension[0]]} ${Number(weakDimension[1]).toFixed(1)}</strong>
      </article>
      <article>
        <span>Pending evidence</span>
        <strong>${pending.length} signals</strong>
      </article>
    </div>
    <div class="recommendation-box">
      <strong>GSIL recommended action</strong>
      <p>${recommendedAction(vendor)}</p>
    </div>
    <div class="dimension-list vendor360-dimensions">
      ${Object.entries(vendor.dimensions).map(([key, value]) => `
        <div class="dimension" title="${prismLabels[key]}">
          <span>${key}</span>
          <strong>${Number(value).toFixed(1)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderScenarioSimulator() {
  const vendor = vendorById($("#scenarioVendor").value) || state.vendors[0];
  if (!vendor) return;
  const scenarios = {
    "sla-delay": { label: "Delivery SLA pressure", dimension: "P", movement: -0.55, rationale: "SLA or milestone pressure reduces delivery confidence." },
    "coupa-savings": { label: "Coupa savings improvement", dimension: "S", movement: 0.6, rationale: "Verified PO savings improves Score & Value." },
    "invoice-risk": { label: "Invoice exception spike", dimension: "R", movement: -0.5, rationale: "Invoice tolerance failures increase commercial and process risk." },
    "specialist-capacity": { label: "Specialist capacity improvement", dimension: "M", movement: 0.45, rationale: "LittleBig capacity signal improves capability and market fit." }
  };
  const scenario = scenarios[$("#scenarioType").value] || scenarios["sla-delay"];
  const beforeDimension = Number(vendor.dimensions[scenario.dimension] || 0);
  const afterDimension = Math.max(1, Math.min(10, beforeDimension + scenario.movement));
  const weights = vendor.specialist
    ? { P: 0.15, R: 0.1, I: 0.35, S: 0.15, M: 0.25 }
    : { P: 0.25, R: 0.15, I: 0.2, S: 0.25, M: 0.15 };
  const beforeScore = scoreVendor(vendor);
  const afterScore = beforeScore + (afterDimension - beforeDimension) * weights[scenario.dimension];
  const afterStatus = afterScore >= 7.8 ? "green" : afterScore >= 6.6 ? "amber" : "red";
  $("#scenarioResult").innerHTML = `
    <article>
      <span class="muted">${scenario.label}</span>
      <h4>${beforeScore.toFixed(1)} → ${afterScore.toFixed(1)}</h4>
      <p>${prismLabels[scenario.dimension]} moves ${beforeDimension.toFixed(1)} → ${afterDimension.toFixed(1)}. ${scenario.rationale}</p>
      <span class="badge ${afterStatus}">${statusLabel(afterStatus)}</span>
    </article>
  `;
}

function renderVendorCards() {
  const query = $("#globalSearch").value.trim().toLowerCase();
  const vendors = state.vendors.filter((vendor) => {
    const matchesFilter = state.activeFilter === "all" || vendor.status === state.activeFilter;
    const matchesQuery = !query || `${vendor.name} ${vendor.category} ${vendor.tier}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });
  $("#vendorGrid").innerHTML = vendors.map((vendor) => {
    const score = scoreVendor(vendor);
    const degrees = Math.round((score / 10) * 360);
    const relationship = vendorRelationship(vendor);
    const dimensions = Object.entries(vendor.dimensions).map(([key, value]) => `
      <div class="dimension" title="${prismLabels[key]}">
        <span>${key}</span>
        <strong>${Number(value).toFixed(1)}</strong>
      </div>
    `).join("");
    return `
      <article class="vendor-card interactive-item" role="button" tabindex="0" data-open-vendor="${vendor.id}">
        <div class="card-top">
          <div>
            <h4>${vendor.specialist ? "★ " : ""}${vendor.name}</h4>
            <span class="muted">${vendor.category}</span>
            <div class="badge-row">
              <span class="badge relationship">${relationship.label}</span>
              <span class="badge evidence">${vendor.scoreType || relationship.scoreType}</span>
            </div>
          </div>
          <span class="badge ${vendor.status}">${statusLabel(vendor.status)}</span>
        </div>
        <div class="score-row">
          <div>
            <p class="muted">${vendor.tier}</p>
            ${vendor.specialist ? '<span class="badge specialist">Specialist Partner</span>' : ""}
            ${isMarketOnlyVendor(vendor) ? `<small class="score-note">${relationship.note}</small>` : ""}
          </div>
          <div>
            <div class="donut" style="background:conic-gradient(var(--${vendor.status}) 0deg ${degrees}deg,#e7ecef ${degrees}deg 360deg)"><span>${score.toFixed(1)}</span></div>
            <small class="score-type">${vendorScoreLabel(vendor)}</small>
          </div>
        </div>
        <div class="dimension-list">${dimensions}</div>
        <div class="vendor-meta">
          <span>Last pull: ${vendor.lastPull}</span>
          <span>Next: ${vendor.nextPull}</span>
        </div>
      </article>
    `;
  }).join("") || `<article class="risk-item"><strong>No matches</strong><p>Try a different search or status filter.</p></article>`;
}

function showAllVendorsBeforeRender() {
  state.activeFilter = "all";
  const search = $("#globalSearch");
  if (search) search.value = "";
  $$(".segmented button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
}

function createVisibleVendorDraft(input) {
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const relationshipType = vendorRelationshipTypes[input.relationshipType] ? input.relationshipType : "direct";
  const marketOnly = relationshipType !== "direct";
  const dimensions = marketOnly
    ? { P: 6.6, R: 6.8, I: 6.4, S: 6.6, M: 7.6 }
    : input.specialist
    ? { P: 7, R: 7, I: 8, S: 7, M: 8 }
    : { P: 7, R: 7, I: 7, S: 7, M: 7 };
  const score = calculateVendorScore({ dimensions, specialist: input.specialist });
  const relationship = vendorRelationshipTypes[relationshipType];
  return normalizeApiVendor({
    id,
    name: input.name,
    category: input.category,
    tier: input.tier,
    schedule: input.schedule,
    specialist: input.specialist,
    relationshipType,
    dimensions,
    score,
    history: [score],
    status: score >= 7.8 ? "green" : score >= 6.6 ? "amber" : "red",
    lastPull: "Newly added",
    nextPull: input.schedule === "Manual" ? "Manual only" : input.schedule === "Weekly" ? "Next week 02:00" : "Tomorrow 02:00",
    metadata: {
      syncStatus: "Pending backend sync",
      relationshipType,
      evidenceCoverage: relationship.coverage,
      scoreType: relationship.scoreType
    }
  });
}

function renderVendorTable() {
  $("#vendorTable").innerHTML = state.vendors.map((vendor) => `
    <article class="table-row interactive-item" role="button" tabindex="0" data-open-vendor="${vendor.id}">
      <div>
        <strong>${vendor.name}</strong>
        <div class="muted">${vendor.category}</div>
        <div class="badge-row">
          <span class="badge relationship">${vendorRelationship(vendor).label}</span>
          <span class="badge evidence">${vendor.evidenceCoverage || vendorRelationship(vendor).coverage}</span>
        </div>
      </div>
      <span class="badge ${vendor.status}">${statusLabel(vendor.status)}</span>
      <div class="schedule-control">
        <select data-schedule-select="${vendor.id}" aria-label="${vendor.name} schedule" ${disabledIfNo("vendor:write")}>
          ${["Daily", "Weekly", "Manual"].map((option) => `<option value="${option}" ${option === vendor.schedule ? "selected" : ""}>${option}</option>`).join("")}
        </select>
        <button class="mini-save-btn" data-save-schedule="${vendor.id}" type="button" ${disabledIfNo("vendor:write")}>Save</button>
        <small data-current-schedule="${vendor.id}">Current: ${vendor.schedule}</small>
      </div>
      <label class="toggle">
        <input type="checkbox" data-specialist="${vendor.id}" ${vendor.specialist ? "checked" : ""} ${disabledIfNo("vendor:write")}>
        Specialist
      </label>
      <div class="score-cell">
        <strong>${scoreVendor(vendor).toFixed(1)}</strong>
        <small>${vendorScoreLabel(vendor)}</small>
      </div>
    </article>
  `).join("");
  $$("[data-specialist]").forEach((checkbox) => {
    checkbox.addEventListener("change", async () => {
      if (!requireUiPermission("vendor:write", "Only Admin and Procurement Head can change vendor setup.")) return;
      const vendor = vendorById(checkbox.dataset.specialist);
      const previous = vendor?.specialist;
      const verb = checkbox.checked ? "enable" : "remove";
      if (!window.confirm(`${verb[0].toUpperCase() + verb.slice(1)} specialist weighting for ${vendor?.name || "this vendor"}?`)) {
        checkbox.checked = Boolean(previous);
        return;
      }
      if (vendor) vendor.specialist = checkbox.checked;
      try {
        await action("Specialist override updated and saved", () => api.updateVendor(checkbox.dataset.specialist, { specialist: checkbox.checked }));
      } catch (error) {
        if (vendor) vendor.specialist = previous;
        checkbox.checked = Boolean(previous);
        toast(`Specialist change could not be saved: ${error.message || "Check Backend Mode and backend server."}`);
      }
    });
  });
}

async function saveVendorSchedule(control) {
  if (!requireUiPermission("vendor:write", "Only Admin and Procurement Head can change vendor setup.")) return;
  const vendorId = control.dataset.saveSchedule || control.dataset.scheduleSelect;
  const select = document.querySelector(`[data-schedule-select="${vendorId}"]`);
  const nextSchedule = select?.value || control.value;
  const vendor = vendorById(vendorId);
  const previous = vendor?.schedule;
  if (vendor) vendor.schedule = nextSchedule;
  const currentLabel = document.querySelector(`[data-current-schedule="${vendorId}"]`);
  try {
    await action("Schedule updated and saved", () => api.updateVendor(vendorId, { schedule: nextSchedule }));
    if (currentLabel) currentLabel.textContent = `Current: ${nextSchedule}`;
    document.querySelectorAll(`[data-schedule-select="${vendorId}"]`).forEach((item) => { item.value = nextSchedule; });
  } catch (error) {
    if (vendor) vendor.schedule = previous;
    if (currentLabel) currentLabel.textContent = `Current: ${previous || "Unknown"}`;
    document.querySelectorAll(`[data-schedule-select="${vendorId}"]`).forEach((item) => { item.value = previous || item.value; });
    toast(`Schedule could not be saved: ${error.message || "Check Backend Mode and backend server."}`);
  }
}

function renderSelects() {
  const vendorOptions = state.vendors.map((vendor) => `<option value="${vendor.id}">${vendor.name}</option>`).join("");
  const currentSignalVendor = $("#signalVendorFilter").value || "all";
  const currentInternalVendor = $("#internalVendor").value;
  const currentHistoryVendor = $("#historyVendor").value;
  const currentQbrVendor = $("#qbrVendor")?.value;
  const currentVendor360 = $("#vendor360Select")?.value;
  const currentScenarioVendor = $("#scenarioVendor")?.value;
  const currentExplainVendor = $("#explainVendor")?.value;
  const currentCompare = ["#compareVendorA", "#compareVendorB", "#compareVendorC"].map((selector) => $(selector)?.value);
  $("#signalVendorFilter").innerHTML = `<option value="all">All vendors</option>${vendorOptions}`;
  $("#internalVendor").innerHTML = vendorOptions;
  $("#historyVendor").innerHTML = vendorOptions;
  if ($("#qbrVendor")) $("#qbrVendor").innerHTML = vendorOptions;
  if ($("#explainVendor")) $("#explainVendor").innerHTML = vendorOptions;
  if ($("#vendor360Select")) $("#vendor360Select").innerHTML = vendorOptions;
  if ($("#scenarioVendor")) $("#scenarioVendor").innerHTML = vendorOptions;
  ["#compareVendorA", "#compareVendorB", "#compareVendorC"].forEach((selector) => {
    if ($(selector)) $(selector).innerHTML = vendorOptions;
  });
  if ([...$("#signalVendorFilter").options].some((option) => option.value === currentSignalVendor)) $("#signalVendorFilter").value = currentSignalVendor;
  if ([...$("#internalVendor").options].some((option) => option.value === currentInternalVendor)) $("#internalVendor").value = currentInternalVendor;
  if ([...$("#historyVendor").options].some((option) => option.value === currentHistoryVendor)) $("#historyVendor").value = currentHistoryVendor;
  if ($("#qbrVendor") && [...$("#qbrVendor").options].some((option) => option.value === currentQbrVendor)) $("#qbrVendor").value = currentQbrVendor;
  if ($("#qbrVendor") && !$("#qbrVendor").value && state.vendors[0]) $("#qbrVendor").value = state.vendors[0].id;
  updateQbrVendorStatus();
  if ($("#explainVendor") && [...$("#explainVendor").options].some((option) => option.value === currentExplainVendor)) $("#explainVendor").value = currentExplainVendor;
  if ($("#vendor360Select") && [...$("#vendor360Select").options].some((option) => option.value === currentVendor360)) $("#vendor360Select").value = currentVendor360;
  if ($("#scenarioVendor") && [...$("#scenarioVendor").options].some((option) => option.value === currentScenarioVendor)) $("#scenarioVendor").value = currentScenarioVendor;
  ["#compareVendorA", "#compareVendorB", "#compareVendorC"].forEach((selector, index) => {
    const select = $(selector);
    const fallback = state.vendors[index]?.id;
    const wanted = currentCompare[index] || fallback;
    if (select && [...select.options].some((option) => option.value === wanted)) select.value = wanted;
  });
}

function updateQbrVendorStatus() {
  const status = $("#qbrVendorStatus");
  const select = $("#qbrVendor");
  if (!status || !select) return;
  status.textContent = select.selectedOptions?.[0]?.textContent ? `QBR for: ${select.selectedOptions[0].textContent}` : "Select vendor";
}

function renderSignals() {
  const type = $("#signalTypeFilter").value;
  const sentiment = $("#signalSentimentFilter").value;
  const vendorFilter = $("#signalVendorFilter").value;
  const query = $("#globalSearch").value.trim().toLowerCase();
  const signals = state.signals.filter((signal) => {
    const vendor = vendorById(signal.vendorId);
    const matchesQuery = !query || `${signal.title} ${signal.source} ${signal.summary} ${vendor?.name || ""}`.toLowerCase().includes(query);
    return (type === "all" || signal.type === type) && (sentiment === "all" || signal.sentiment === sentiment) && (vendorFilter === "all" || signal.vendorId === vendorFilter) && matchesQuery;
  });
  $("#signalList").innerHTML = signals.map((signal) => {
    const vendor = vendorById(signal.vendorId);
    const confClass = signal.confidence >= 70 ? "green" : signal.confidence >= 45 ? "amber" : "red";
    return `
      <article class="signal-card interactive-item" role="button" tabindex="0" data-signal-card="${signal.id}" data-open-signal="${signal.id}">
        <div class="signal-top">
          <div>
            <h4>${signal.title}</h4>
            <span class="muted">${vendor?.name || "Vendor"} · ${signal.source}</span>
          </div>
          <span class="badge ${confClass}">${signal.confidence}% confidence</span>
        </div>
        <div class="signal-decision-row">
          <span>${signal.type}</span>
          <span>${signal.sentiment}</span>
          <span>${prismLabels[signal.dimension]}</span>
          <strong>Impact ${signal.impact}/10</strong>
        </div>
        <p class="signal-summary" contenteditable="${can("signal:approve") ? "true" : "false"}" data-summary="${signal.id}">${signal.summary}</p>
        <details class="signal-evidence">
          <summary>View evidence and impact</summary>
          <p>${escapeHtml(signal.aiExplanation || `Mapped to ${prismLabels[signal.dimension]} using vendor relevance, source trust, and numeric evidence.`)}</p>
          <div class="signal-controls">
            <label>
              Impact: <strong data-impact-value="${signal.id}">${signal.impact}/10</strong>
              <input type="range" min="1" max="10" value="${signal.impact}" data-impact="${signal.id}" ${disabledIfNo("signal:approve")}>
            </label>
            <label>
              PRISM dimension
              <select data-dimension="${signal.id}" ${disabledIfNo("signal:approve")}>
                ${Object.keys(prismLabels).map((key) => `<option value="${key}" ${key === signal.dimension ? "selected" : ""}>${key} - ${prismLabels[key]}</option>`).join("")}
              </select>
            </label>
          </div>
        </details>
        <div class="signal-actions">
          <button class="primary-btn" data-approve="${signal.id}" type="button" ${disabledIfNo("signal:approve")}>Approve</button>
          <button class="secondary-btn" data-reject="${signal.id}" type="button" ${disabledIfNo("signal:reject")}>Reject</button>
        </div>
      </article>
    `;
  }).join("") || `<article class="risk-item"><strong>No pending signals</strong><p>The human gate is clear for the selected filters.</p></article>`;
  bindSignalEvents();
}

function signalPayload(signalId) {
  const card = document.querySelector(`[data-signal-card="${signalId}"]`);
  const signal = state.signals.find((item) => sameId(item.id, signalId));
  return {
    summary: card?.querySelector("[data-summary]")?.textContent.trim() || signal?.summary,
    dimension: card?.querySelector("[data-dimension]")?.value || signal?.dimension,
    impact: Number(card?.querySelector("[data-impact]")?.value || signal?.impact)
  };
}

function bindSignalEvents() {
  $$("[data-impact]").forEach((input) => {
    input.addEventListener("input", () => {
      const value = $(`[data-impact-value="${input.dataset.impact}"]`);
      if (value) value.textContent = `${input.value}/10`;
    });
  });
  $$("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!requireUiPermission("signal:approve", "Only Admin and Procurement Head can approve score-changing signals.")) return;
      action("Signal approved and PRISM recalculated", () => api.approveSignal(button.dataset.approve, signalPayload(button.dataset.approve)));
    });
  });
  $$("[data-reject]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!requireUiPermission("signal:reject", "This role cannot reject signals in the demo gate.")) return;
      if (!window.confirm("Reject this signal? It will be removed from the pending Approval Gate.")) return;
      const reason = "Reviewer rejected signal during gate review.";
      action("Signal rejected", () => api.rejectSignal(button.dataset.reject, reason));
    });
  });
}

function sourceGroup(source) {
  if (source.category === "Internal System") return "Internal sources";
  if (source.category === "Regulatory") return "Regulatory sources";
  return "External intelligence";
}

function sourceTrustRationale(source) {
  if (source.notes) return source.notes;
  if (source.category === "Internal System") return "First-party operational evidence with controlled ownership and traceability.";
  if (source.category === "Regulatory") return "Authoritative context used only when entity match and reporting period are confirmed.";
  return "External context accepted only after vendor match, recency, numeric evidence, and confidence checks.";
}

function sourceReviewDate(source) {
  const value = source.updated_at || source.updatedAt || source.created_at || source.createdAt;
  return value ? new Date(value).toLocaleDateString() : "Scheduled";
}

function renderSources() {
  const groups = ["Internal sources", "External intelligence", "Regulatory sources"];
  $("#sourceList").innerHTML = groups.map((group) => {
    const sources = state.sources.filter((source) => sourceGroup(source) === group);
    if (!sources.length) return "";
    return `<section class="source-group"><div class="source-group-heading"><h3>${group}</h3><span>${sources.length} configured</span></div>${sources.map((source) => `
    <article class="source-card interactive-item" role="button" tabindex="0" data-open-source="${source.id}">
      <div>
        <h4>${source.name}</h4>
        <span class="muted">${sourceTrustRationale(source)}</span>
      </div>
      <span>${source.category}<small>Reviewed: ${sourceReviewDate(source)}</small></span>
      <span class="badge ${source.confidence === "High" ? "green" : source.confidence === "Medium" ? "amber" : "red"}">Trust ${sourceTrustScore(source)}</span>
      <button class="switch-btn ${source.active ? "on" : ""}" data-source-toggle="${source.id}" type="button" ${disabledIfNo("source:write")}>${source.active ? "Active" : "Paused"}</button>
    </article>
  `).join("")}</section>`;
  }).join("");
  $$("[data-source-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!requireUiPermission("source:write", "Only Admin and Analyst can change source trust controls.")) return;
      const source = state.sources.find((item) => sameId(item.id, button.dataset.sourceToggle));
      if (source?.active && !window.confirm(`Pause ${source.name}? It will stop contributing new signals until reactivated.`)) return;
      action("Source library updated", () => api.updateSource(source.id, { active: !source.active }));
    });
  });
}

function renderInternalFeed() {
  $("#internalFeed").innerHTML = state.internalInputs.map((input) => `
    <article class="audit-item">
      <strong>${escapeHtml(vendorById(input.vendorId)?.name || "Vendor")} · ${escapeHtml(prismLabels[input.dimension])} · ${escapeHtml(input.period)}</strong>
      <p>${escapeHtml(input.evidence)} Internal weighting: ${Number(input.weight || 0)}%.</p>
      ${input.attachment ? `
        <div class="attachment-summary">
          <span>${escapeHtml(input.attachment.fileName || input.attachment.name || "Evidence document")}</span>
          <span>${escapeHtml(input.attachment.category || "Supporting evidence")}</span>
          <span>${escapeHtml(input.attachment.confidentiality || "Internal")}</span>
          <span>${formatFileSize(input.attachment.sizeBytes || input.attachment.size)}</span>
        </div>
        <div class="attachment-actions">
          <button class="secondary-btn" type="button" data-download-evidence="${escapeHtml(input.id)}">Download evidence</button>
          <button class="secondary-btn" type="button" data-open-vendor="${escapeHtml(input.vendorId)}">Open vendor</button>
        </div>
      ` : `<div class="attachment-actions"><button class="secondary-btn" type="button" data-open-vendor="${escapeHtml(input.vendorId)}">Open vendor</button></div>`}
    </article>
  `).join("");
}

async function downloadInternalEvidence(inputId) {
  const input = state.internalInputs.find((item) => sameId(item.id, inputId));
  const attachment = input?.attachment;
  if (!attachment) return toast("No evidence document is attached to this input");
  if (attachment.dataUrl) {
    const link = document.createElement("a");
    link.href = attachment.dataUrl;
    link.download = attachment.fileName || attachment.name || "gsil-evidence";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  const documentId = attachment.documentId || attachment.id;
  if (!documentId) return toast("The evidence document reference is unavailable");
  try {
    const response = await fetch(apiUrl(`/api/evidence-documents/${encodeURIComponent(documentId)}/download`), { headers: roleHeaders() });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Evidence download failed");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.fileName || "gsil-evidence";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    showOperationStatus(error.message, "error", true);
    toast(error.message);
  }
}

function renderAudit() {
  $("#auditCount").textContent = `${state.audit.length} events`;
  $("#auditList").innerHTML = state.audit.map((entry) => `
    <article class="audit-item interactive-item" role="button" tabindex="0" data-open-audit="${entry.id}">
      <strong>${entry.message}</strong>
      <p>${entry.actor || "GSIL"} · ${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Logged"}</p>
    </article>
  `).join("");
}

function renderConnectors() {
  const allConnectors = state.connectors || [];
  const coreConnectors = [
    allConnectors.find((connector) => String(connector.id).toLowerCase() === "coupa") || allConnectors.find((connector) => /coupa/i.test(connector.name)),
    allConnectors.find((connector) => String(connector.id).toLowerCase() === "littlebig") || allConnectors.find((connector) => /littlebig/i.test(connector.name)),
    allConnectors.find((connector) => String(connector.id).toLowerCase() === "vendor-master") || allConnectors.find((connector) => /vendor master/i.test(connector.name))
  ].filter(Boolean);
  const connectors = coreConnectors.length ? coreConnectors : allConnectors.slice(0, 3);
  const healthy = connectors.filter((connector) => connector.status === "healthy").length;
  const attention = connectors.filter((connector) => connector.status === "failed" || connector.status === "degraded").length;
  const paused = connectors.filter((connector) => connector.status === "paused").length;
  $("#connectorMetrics").innerHTML = [
    ["Connected", healthy, "Feeds available"],
    ["Attention Needed", attention, "Owner review required"],
    ["Paused", paused, "Temporarily inactive"]
  ].map(([label, value, note]) => `<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  $("#connectorGrid").innerHTML = connectors.map((connector) => `
    <article class="connector-card interactive-item" role="button" tabindex="0" data-open-connector="${connector.id}">
      <div class="card-top">
        <div>
          <h4>${connector.name}</h4>
          <span class="muted">${connector.category === "Internal System" ? "Enterprise Data" : clientFacingText(connector.type)} · ${connector.category}</span>
        </div>
        <span class="badge ${statusClass(connector.status)}">${connectorLabel(connector.status)}</span>
      </div>
      <div class="connector-meta">
        <span>Owner: ${connector.owner}</span>
        <span>Last successful sync: ${clientFacingText(connector.lastSync, "Not yet synced")}</span>
        <span>Data freshness: ${connector.lastSync ? "Within configured window" : "Awaiting first sync"}</span>
        <span>Next action: ${connector.status === "healthy" ? "Continue scheduled monitoring" : connector.status === "paused" ? "Confirm reactivation owner" : "Review issue and retry"}</span>
      </div>
      ${connector.description ? `<p class="muted connector-description">${escapeHtml(clientFacingText(connector.description))}</p>` : ""}
      ${connector.lastError ? `<p class="error-note">${connector.lastError}</p>` : ""}
      ${connector.demoIntegration ? `<button class="secondary-btn connector-sync" data-sync-connector="${connector.id}" type="button" ${disabledIfNo("connector:sync")}>Run sync</button>` : ""}
    </article>
  `).join("");
  $("#failedFeedList").innerHTML = (state.failedFeeds || []).map((feed) => `
    <article class="audit-item interactive-item" role="button" tabindex="0" data-open-connector="${feed.id}">
      <strong>${feed.name} · ${connectorLabel(feed.status)}</strong>
      <p>${feed.error || "No error detail"} Owner: ${feed.owner}. Next retry: ${feed.nextRetry || "Not scheduled"}.</p>
    </article>
  `).join("") || `<article class="audit-item"><strong>No failed feeds</strong><p>All configured feeds are currently healthy or paused.</p></article>`;
  const testButton = $("#simulateFailureBtn");
  if (testButton) testButton.textContent = (state.failedFeeds || []).some((feed) => feed.testAlert) ? "Clear test alert" : "Test monitoring alert";
  $$("[data-sync-connector]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!requireUiPermission("connector:sync", "Only Admin and Procurement Head can sync connector demo data.")) return;
      const result = await action("", () => api.syncConnector(button.dataset.syncConnector));
      toast(`${result.connectorId === "coupa" ? "Coupa" : "LittleBig"} sync generated ${result.generated.length} signals`);
    });
  });
}

function renderSettings() {
  const role = state.currentUser?.role || "procurement_head";
  $("#currentRoleLabel").textContent = `Current: ${state.currentUser?.name || "Demo user"} · ${roleLabels[role] || role}`;
  $("#roleGrid").innerHTML = (state.roles || []).map((item) => `
    <article class="role-card ${item.role === role ? "active" : ""}">
      <strong>${item.label}</strong>
      <p>${item.permissions.join(" · ")}</p>
    </article>
  `).join("");
  const adminLocked = !can("settings:write");
  ["#fastTrackConfidence", "#lowConfidenceThreshold", "#scoreDropThreshold", "#autoPullFrequency", "#signalQualityPolicy"].forEach((selector) => setDisabled(selector, adminLocked));
  setDisabled("#saveSettingsBtn", adminLocked);
  renderBackendModeControls();
}

function renderBackendModeControls() {
  const toggle = $("#backendModeToggle");
  const input = $("#backendBaseUrl");
  const status = $("#backendModeStatus");
  if (!toggle || !input || !status) return;
  toggle.checked = backendModeEnabled();
  input.value = backendBaseUrl();
  status.textContent = backendModeEnabled() ? "Live backend enabled" : "Static demo";
  status.className = backendModeEnabled() ? "backend-status live" : "backend-status demo";
}

function applyPermissionState() {
  const controls = [
    ["#runPullBtn", "signal:pull", "Only Admin, Procurement Head, and Analyst can run signal pulls."],
    ["#bulkApproveBtn", "signal:bulk", "Only Admin and Procurement Head can bulk approve."],
    ["#bulkRejectBtn", "signal:bulk", "Only Admin and Procurement Head can bulk reject."],
    ["#vendorForm button[type='submit']", "vendor:write", "Only Admin and Procurement Head can add vendors."],
    ["#sourceForm button[type='submit']", "source:write", "Only Admin and Analyst can add sources."],
    ["#internalForm button[type='submit']", "internal:write", "Only Admin, Analyst, and Finance Controller can add internal evidence."],
    ["#qbrBtn", "qbr:write", "This role cannot generate QBR snapshots."],
    ["#simulateFailureBtn", "connector:sync", "Only Admin and Procurement Head can test connector monitoring."],
    ["#autoPullToggle", "settings:write", "Only Admin can pause or resume auto-pull."],
    ["#resetDemoBtn", "settings:write", "Only Admin can reset the demo state."],
    ["#resetDemoSettingsBtn", "settings:write", "Only Admin can reset the demo state."]
  ];
  controls.forEach(([selector, permission, title]) => {
    const element = $(selector);
    if (!element) return;
    element.disabled = !can(permission);
    element.title = element.disabled ? title : "";
  });
  const adminSettingsNav = $("#adminSettingsNav");
  if (adminSettingsNav) adminSettingsNav.hidden = state.currentUser?.role !== "admin" || presentationModeEnabled();
  applyPresentationMode();
}

function renderMonitoring() {
  const monitoring = state.monitoring || {};
  $("#monitoringMetrics").innerHTML = [
    ["Data Service", connectorLabel(monitoring.apiStatus) || "Unknown", "Application data availability"],
    ["Signal Refresh", monitoring.schedulerStatus === "active" ? "Active" : "Manual", "Current refresh mode"],
    ["Pending Reviews", monitoring.pendingReviews || 0, "Human gate workload"],
    ["Connector Issues", monitoring.failedConnectors || 0, "Needs owner action"]
  ].map(([label, value, note]) => `<article class="metric"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  $("#aiExplanationList").innerHTML = (state.connectors || []).slice(0, 6).map((connector) => `
    <article class="audit-item interactive-item" role="button" tabindex="0" data-open-connector="${connector.id}">
      <strong>${connector.name} · ${connectorLabel(connector.status)}</strong>
      <p>Freshness: ${clientFacingText(connector.lastSync, "Awaiting first sync")}. Owner: ${connector.owner || "Data Governance"}. ${connector.lastError ? `Issue: ${escapeHtml(connector.lastError)}` : "Next action: continue scheduled monitoring."}</p>
    </article>
  `).join("") || `<article class="audit-item"><strong>No connectors configured</strong><p>Connect Coupa, LittleBig, or Vendor Master to begin monitoring.</p></article>`;
  const uploadActivity = (state.uploadHistory || []).map((upload) => `
    <article class="audit-item interactive-item" role="button" tabindex="0" data-open-vendor="${state.vendors.find((vendor) => vendor.name === upload.vendor)?.id || ""}">
      <strong>${upload.vendor} · ${upload.feedType} · ${upload.status}</strong>
      <p>${upload.period} · ${prismLabels[upload.dimension] || upload.dimension} · ${upload.weight}% weight · ${upload.evidence}</p>
    </article>
  `);
  const auditActivity = state.audit.slice(0, 6).map((entry) => `
    <article class="audit-item interactive-item" role="button" tabindex="0" data-open-audit="${entry.id}">
      <strong>${escapeHtml(entry.message)}</strong>
      <p>${escapeHtml(entry.actor || "GSIL")} · ${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Logged"}</p>
    </article>
  `);
  $("#uploadHistoryList").innerHTML = [...uploadActivity, ...auditActivity].slice(0, 8).join("") || `<article class="audit-item"><strong>No recent activity</strong><p>Internal evidence and approved signal activity will appear here.</p></article>`;
}

function renderRiskHeatmap() {
  const keys = Object.keys(prismLabels);
  $("#riskHeatmap").innerHTML = `
    <div class="heatmap-head">
      <span>Vendor</span>
      ${keys.map((key) => `<span>${key}</span>`).join("")}
    </div>
    ${state.vendors.map((vendor) => `
      <div class="heatmap-row interactive-item" role="button" tabindex="0" data-open-vendor="${vendor.id}">
        <strong>${vendor.name}</strong>
        ${keys.map((key) => {
          const value = Number(vendor.dimensions[key] || 0);
          const cls = value >= 7.8 ? "green" : value >= 6.6 ? "amber" : "red";
          return `<span class="heat-cell ${cls}" title="${prismLabels[key]} ${value.toFixed(1)}">${value.toFixed(1)}</span>`;
        }).join("")}
      </div>
    `).join("")}
  `;
}

function renderBusinessValueTracker() {
  const processed = state.audit.filter((entry) => /approved|rejected|generated|sync/i.test(entry.message || "")).length;
  const risks = state.signals.filter((signal) => signal.sentiment === "Negative").length + state.failedFeeds.length;
  const savingsSignals = state.signals.filter((signal) => signal.dimension === "S" || /saving|invoice|PO|purchase/i.test(signal.summary || "")).length;
  const monitoredVendors = state.vendors.length;
  const qbrReady = state.vendors.filter((vendor) => state.audit.some((entry) => entry.message?.includes(vendor.name))).length;
  $("#businessValueTracker").innerHTML = [
    ["Review hours saved", `${Math.max(6, processed * 0.4).toFixed(1)}h`, "Estimated from automated signal triage"],
    ["Risks surfaced", risks, "Pending negative signals and feed escalations"],
    ["Value signals found", savingsSignals, "Savings, invoice, and commercial indicators"],
    ["QBR prep reduced", "45%", "Demo estimate from auto-briefing"],
    ["Vendors monitored", monitoredVendors, "Portfolio coverage in current demo"],
    ["QBR-ready vendors", qbrReady, "Have audit activity or validated evidence"]
  ].map(([label, value, note]) => `
    <article class="value-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${note}</p>
    </article>
  `).join("");
}

function renderSourceGovernance() {
  const sources = state.sources || [];
  const highTrust = sources.filter((source) => sourceTrustScore(source) >= 80).length;
  const watch = sources.filter((source) => sourceTrustScore(source) < 70).length;
  $("#sourceGovernance").innerHTML = `
    <div class="trust-rule-grid">
      <article>
        <strong>80-100</strong>
        <span>Preferred Evidence</span>
        <p>Can support high-confidence AI relevance, but material score changes still pass the approval gate.</p>
      </article>
      <article>
        <strong>60-79</strong>
        <span>Review Weighted</span>
        <p>Allowed into signal review, with stronger need for corroboration or internal evidence.</p>
      </article>
      <article>
        <strong>Below 60</strong>
        <span>Low Influence</span>
        <p>Signals should be routed to manual validation and should not move PRISM without extra evidence.</p>
      </article>
    </div>
    <div class="source-governance-summary">
      <article><span>Preferred sources</span><strong>${highTrust}</strong></article>
      <article><span>Trust watch</span><strong>${watch}</strong></article>
      <article><span>Paused sources</span><strong>${sources.filter((source) => !source.active).length}</strong></article>
    </div>
  `;
}

function renderTaskBoard() {
  const stages = ["To Review", "Waiting For Evidence", "Owner Assigned", "Ready For Approval", "Closed"];
  const tasks = generatedTasks();
  $("#taskBoard").innerHTML = stages.map((stage) => {
    const stageTasks = tasks.filter((task) => task.stage === stage).slice(0, 5);
    return `
      <section class="task-column">
        <div class="task-column-title">
          <h3>${stage}</h3>
          <span>${stageTasks.length}</span>
        </div>
        ${stageTasks.map((task) => `
          <article class="task-card interactive-item" role="button" tabindex="0" ${task.signalId ? `data-open-signal="${task.signalId}"` : task.connectorId ? `data-open-connector="${task.connectorId}"` : `data-open-vendor="${task.vendorId}"`}>
            <strong>${task.title}</strong>
            <p>${task.vendor} · ${task.owner}</p>
            <small>Due: ${task.due}</small>
          </article>
        `).join("") || `<article class="task-card empty"><strong>No tasks</strong><p>Nothing waiting in this stage.</p></article>`}
      </section>
    `;
  }).join("");
}

const copilotQuestions = [
  { id: "today", label: "Which vendors need action today?" },
  { id: "qbr", label: "Which vendors are QBR-ready?" },
  { id: "commercial", label: "Where is commercial risk highest?" },
  { id: "movement", label: "What changed this week?" },
  { id: "wipro", label: "Why is Wipro in Executive Attention?" },
  { id: "next", label: "What should procurement do next?" }
];

function vendorWatchFactor(vendor) {
  const weakest = Object.entries(vendor.dimensions || {}).sort((a, b) => Number(a[1]) - Number(b[1]))[0] || ["P", 0];
  return { key: weakest[0], label: prismLabels[weakest[0]], value: Number(weakest[1] || 0) };
}

function copilotAnswer(questionId) {
  const avgScore = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length
    : 0;
  const pending = state.signals || [];
  const attention = state.vendors.filter((vendor) => vendor.status === "red");
  const watch = state.vendors.filter((vendor) => vendor.status === "amber");
  const qbrReady = state.vendors
    .filter((vendor) => state.audit.some((entry) => entry.message?.includes(vendor.name)) || pending.some((signal) => signal.vendorId === vendor.id))
    .sort((a, b) => scoreVendor(a) - scoreVendor(b));
  const commercialRisk = [...state.vendors]
    .map((vendor) => ({ vendor, value: Number(vendor.dimensions?.S || 0), pending: pending.filter((signal) => signal.vendorId === vendor.id && signal.dimension === "S") }))
    .sort((a, b) => a.value - b.value || b.pending.length - a.pending.length);
  const wipro = state.vendors.find((vendor) => vendor.name.toLowerCase().includes("wipro")) || attention[0] || state.vendors[0];
  const templates = {
    today: {
      title: "Today’s priority queue",
      summary: attention.length
        ? `${attention.length} vendor(s) need executive attention before the next sourcing decision.`
        : `${watch.length} vendor(s) are in performance watch and should be reviewed before QBR.`,
      bullets: [...attention, ...watch].slice(0, 5).map((vendor) => {
        const factor = vendorWatchFactor(vendor);
        return `${vendor.name}: ${statusLabel(vendor.status)}, PRISM ${scoreVendor(vendor).toFixed(1)}, watch factor ${factor.label} ${factor.value.toFixed(1)}. ${recommendedAction(vendor)}`;
      }),
      task: attention[0] || watch[0]
    },
    qbr: {
      title: "QBR-ready vendors",
      summary: `${qbrReady.length || state.vendors.length} vendor(s) have enough score, audit, or signal context for a QBR snapshot.`,
      bullets: (qbrReady.length ? qbrReady : state.vendors).slice(0, 5).map((vendor) => `${vendor.name}: PRISM ${scoreVendor(vendor).toFixed(1)}, posture ${statusLabel(vendor.status)}, pending signals ${pending.filter((signal) => signal.vendorId === vendor.id).length}.`),
      task: qbrReady[0] || state.vendors[0]
    },
    commercial: {
      title: "Highest commercial risk",
      summary: "Commercial risk is read from Score & Value, invoice/PO signals, and procurement exceptions.",
      bullets: commercialRisk.slice(0, 5).map(({ vendor, value, pending: vendorSignals }) => `${vendor.name}: Score & Value ${value.toFixed(1)}, ${vendorSignals.length} commercial signal(s), recommended action: ${recommendedAction(vendor)}`),
      task: commercialRisk[0]?.vendor
    },
    movement: {
      title: "What changed this week",
      summary: `${state.audit.length} audit event(s), ${pending.length} pending signal(s), and portfolio PRISM ${avgScore.toFixed(1)} are currently visible.`,
      bullets: state.audit.slice(0, 5).map((entry) => `${entry.message || entry.eventType} ${entry.createdAt ? `(${new Date(entry.createdAt).toLocaleDateString()})` : ""}`),
      task: state.vendors.find((vendor) => state.audit.some((entry) => entry.message?.includes(vendor.name))) || state.vendors[0]
    },
    wipro: {
      title: `${wipro?.name || "Vendor"} executive attention`,
      summary: wipro ? `${wipro.name} is at PRISM ${scoreVendor(wipro).toFixed(1)} with posture ${statusLabel(wipro.status)}.` : "No Wipro record is available.",
      bullets: wipro ? [
        `Watch factor: ${vendorWatchFactor(wipro).label} ${vendorWatchFactor(wipro).value.toFixed(1)}.`,
        `Recommended action: ${recommendedAction(wipro)}`,
        `Open signals: ${pending.filter((signal) => signal.vendorId === wipro.id).length}.`,
        `Next move: assign owner, validate evidence, and generate QBR snapshot.`
      ] : ["No vendor record found."],
      task: wipro
    },
    next: {
      title: "Recommended next procurement move",
      summary: "Focus on evidence-backed actions that can change vendor decisions, not more dashboard review.",
      bullets: [
        "Generate QBR snapshots for the top watchlist vendors.",
        "Create owner tasks for every executive attention vendor.",
        "Approve or reject high-confidence pending signals.",
        "Use Internal Gate to add SLA, invoice, or mission evidence before score changes."
      ],
      task: attention[0] || watch[0] || state.vendors[0]
    }
  };
  return templates[questionId] || templates.today;
}

function renderCopilot(questionId = "today") {
  const promptWrap = $("#copilotPrompts");
  const answerWrap = $("#copilotAnswer");
  if (!promptWrap || !answerWrap) return;
  promptWrap.innerHTML = copilotQuestions.map((question) => `
    <button class="copilot-prompt ${question.id === questionId ? "active" : ""}" data-copilot-question="${question.id}" type="button">
      ${question.label}
    </button>
  `).join("");
  const answer = copilotAnswer(questionId);
  latestCopilotTask = answer.task ? {
    title: answer.title,
    vendorId: answer.task.id,
    vendor: answer.task.name,
    owner: answer.task.status === "red" ? "Procurement Head" : "Category Manager",
    stage: answer.task.status === "red" ? "Owner Assigned" : "To Review",
    due: answer.task.status === "red" ? "Today" : "This week",
    action: answer.summary
  } : {
    title: answer.title,
    vendor: "Portfolio",
    owner: "Procurement Team",
    stage: "To Review",
    due: "This week",
    action: answer.summary
  };
  $("#copilotAnswerMeta").textContent = `Portfolio PRISM ${state.vendors.length ? (state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length).toFixed(1) : "0.0"}`;
  answerWrap.innerHTML = `
    <article class="copilot-response">
      <h3>${escapeHtml(answer.title)}</h3>
      <p>${escapeHtml(answer.summary)}</p>
      <ul>
        ${(answer.bullets.length ? answer.bullets : ["No matching evidence available yet."]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function watchlistVendors() {
  return [...state.vendors]
    .filter((vendor) => vendor.status !== "green" || state.signals.some((signal) => signal.vendorId === vendor.id && signal.sentiment === "Negative"))
    .sort((a, b) => {
      const postureWeight = (vendor) => vendor.status === "red" ? 0 : vendor.status === "amber" ? 1 : 2;
      return postureWeight(a) - postureWeight(b) || scoreVendor(a) - scoreVendor(b);
    });
}

function vendorDecisionStatus(vendor) {
  return loadDecisionLog().find((entry) => entry.vendorId === vendor.id);
}

function qbrReadiness(vendor) {
  const hasAudit = state.audit.some((entry) => entry.message?.includes(vendor.name));
  const hasSignals = state.signals.some((signal) => signal.vendorId === vendor.id);
  const weakFactor = vendorWatchFactor(vendor);
  const ready = hasAudit || hasSignals || vendor.status === "red";
  return {
    label: ready ? "Ready" : "Needs evidence",
    detail: ready ? `Use QBR to review ${weakFactor.label} and owner action.` : "Add internal evidence or approve/reject pending signals first.",
    ready
  };
}

function renderWatchlist() {
  const metricWrap = $("#watchlistMetrics");
  const grid = $("#watchlistGrid");
  if (!metricWrap || !grid) return;
  const vendors = watchlistVendors();
  const decisions = loadDecisionLog();
  const executive = vendors.filter((vendor) => vendor.status === "red").length;
  const qbrReady = vendors.filter((vendor) => qbrReadiness(vendor).ready).length;
  metricWrap.innerHTML = [
    ["Watchlist Vendors", vendors.length, "Need owner review"],
    ["Executive Attention", executive, "Leadership action needed"],
    ["QBR Ready", qbrReady, "Ready for snapshot"],
    ["Decisions Logged", decisions.length, "Captured locally"]
  ].map(([label, value, detail]) => `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
    </article>
  `).join("");
  grid.innerHTML = vendors.map((vendor) => {
    const factor = vendorWatchFactor(vendor);
    const readiness = qbrReadiness(vendor);
    const decision = vendorDecisionStatus(vendor);
    const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
    return `
      <article class="watchlist-card interactive-item" role="button" tabindex="0" data-open-vendor="${vendor.id}">
        <div class="card-top">
          <div>
            <h3>${escapeHtml(vendor.name)}</h3>
            <span class="muted">${escapeHtml(vendor.category)} · ${escapeHtml(vendor.tier)}</span>
          </div>
          <span class="badge ${vendor.status}">${statusLabel(vendor.status)}</span>
        </div>
        <div class="watchlist-summary">
          <article><span>PRISM</span><strong>${scoreVendor(vendor).toFixed(1)}</strong></article>
          <article><span>Watch factor</span><strong>${factor.label} ${factor.value.toFixed(1)}</strong></article>
          <article><span>Signals</span><strong>${pending.length}</strong></article>
          <article><span>QBR</span><strong>${readiness.label}</strong></article>
        </div>
        <p>${escapeHtml(recommendedAction(vendor))}</p>
        <div class="decision-state">
          <strong>${decision ? decision.action : "Decision pending"}</strong>
          <span>${decision ? `${decision.owner} · ${new Date(decision.createdAt).toLocaleDateString()}` : readiness.detail}</span>
        </div>
        <div class="modal-actions">
          ${actionButton("decisionApprove", vendor.id, "Approve", "primary-btn")}
          ${actionButton("decisionEvidence", vendor.id, "Request evidence")}
          ${actionButton("decisionEscalate", vendor.id, "Escalate")}
          ${actionButton("generateQbr", vendor.id, "Generate QBR")}
        </div>
      </article>
    `;
  }).join("") || `<article class="watchlist-card"><h3>No watchlist vendors</h3><p class="muted">All vendors currently sit in Strategic Advantage posture.</p></article>`;
}

function renderCompareControls() {
  const options = state.vendors.map((vendor) => `<option value="${vendor.id}">${vendor.name}</option>`).join("");
  ["#compareVendorA", "#compareVendorB", "#compareVendorC"].forEach((selector, index) => {
    const select = $(selector);
    if (!select) return;
    const current = select.value || state.vendors[index]?.id;
    select.innerHTML = options;
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  });
}

function renderCompareMatrix() {
  const selected = ["#compareVendorA", "#compareVendorB", "#compareVendorC"]
    .map((selector) => vendorById($(selector)?.value))
    .filter(Boolean);
  $("#compareMatrix").innerHTML = selected.map((vendor) => {
    const strongest = Object.entries(vendor.dimensions).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    const weakest = Object.entries(vendor.dimensions).sort((a, b) => Number(a[1]) - Number(b[1]))[0];
    return `
      <article class="compare-card interactive-item" role="button" tabindex="0" data-open-vendor="${vendor.id}">
        <div class="card-top">
          <div>
            <h3>${vendor.name}</h3>
            <span class="muted">${vendor.category}</span>
          </div>
          <span class="badge ${vendor.status}">${statusLabel(vendor.status)}</span>
        </div>
        <strong class="compare-score">${scoreVendor(vendor).toFixed(1)}</strong>
        <div class="modal-kv-grid">
          <div class="modal-kv"><span>Strength</span><strong>${prismLabels[strongest[0]]} ${Number(strongest[1]).toFixed(1)}</strong></div>
          <div class="modal-kv"><span>Watch area</span><strong>${prismLabels[weakest[0]]} ${Number(weakest[1]).toFixed(1)}</strong></div>
          <div class="modal-kv"><span>Pending</span><strong>${state.signals.filter((signal) => signal.vendorId === vendor.id).length} signals</strong></div>
        </div>
        <p>${recommendedAction(vendor)}</p>
      </article>
    `;
  }).join("");
}

function renderClientView() {
  const pending = state.signals.length;
  const risks = state.signals.filter((signal) => signal.sentiment === "Negative").length + state.failedFeeds.length;
  const activeSources = state.sources.filter((source) => source.active).length;
  const reviewedEvents = state.audit.filter((entry) => /approved|rejected|QBR|sync|generated/i.test(entry.message || "")).length;
  $("#stakeholderLenses").innerHTML = [
    ["Procurement", "One place to review vendor signals, validate evidence, compare alternatives, and convert score movement into actions."],
    ["Finance", "Commercial signals from Coupa-style PO, invoice, savings, and exception data become visible in Score & Value."],
    ["Operations", "SLA, incident, mission, staffing, and delivery evidence can be mapped to PRISM dimensions and QBR actions."],
    ["IT / Security", "Connector health, source trust, audit logs, SSO path, and data ownership are visible before production hardening."],
    ["Leadership", "Portfolio posture, executive attention vendors, risk concentration, and pilot value are visible without spreadsheet assembly."]
  ].map(([team, value]) => `
    <article class="stakeholder-card">
      <strong>${team}</strong>
      <p>${value}</p>
    </article>
  `).join("");
  $("#trustControls").innerHTML = [
    ["Human approval gate", "No material PRISM movement should happen silently; pending signals must be approved, edited, or rejected."],
    ["Source trust scoring", `${activeSources} active sources are tracked with confidence, pause, increase, and reduce trust controls.`],
    ["Evidence locker", "Each signal can carry source system, evidence ID, created date, reviewer notes, and internal document reference."],
    ["Audit trail", `${reviewedEvents} review/sync/report events are visible for defensible decisions and QBR preparation.`],
    ["Connector monitoring", `${state.failedFeeds.length} feed issue(s) are routed through owner visibility instead of hidden failure.`]
  ].map(([control, detail]) => `
    <article class="control-card">
      <strong>${control}</strong>
      <p>${detail}</p>
    </article>
  `).join("");
  $("#dataLineage").innerHTML = [
    ["1", "Source / connector", "Coupa, LittleBig, internal feeds, vendor master, approved external sources."],
    ["2", "AI relevance", "Signal is classified for confidence, PRISM dimension, sentiment, severity, recency, and evidence fit."],
    ["3", "Approval gate", "Reviewer validates source trust, vendor match, dimension mapping, and suggested score impact."],
    ["4", "PRISM update", "Only approved signals move a PRISM dimension and recalculate vendor posture."],
    ["5", "Audit and QBR", "Decision, reviewer, rationale, score movement, and QBR-ready output stay traceable."]
  ].map(([step, title, detail]) => `
    <article class="lineage-step">
      <span>${step}</span>
      <div>
        <strong>${title}</strong>
        <p>${detail}</p>
      </div>
    </article>
  `).join("");
  $("#pilotOutcomes").innerHTML = [
    ["Portfolio baseline", `${state.vendors.length} demo vendors now`, "Pilot target: 20-50 representative vendors with clean owner/category mapping."],
    ["Signal validation", `${pending} pending now`, "Pilot target: process 50+ signals through relevance, approval, and audit."],
    ["Risk discovery", `${risks} current risk indicators`, "Pilot target: identify repeatable early-warning categories and escalation rules."],
    ["Integration confidence", `${state.connectors.length} connectors shown`, "Pilot target: prove 2-3 read-only feed patterns before live API integration."],
    ["Governance decision", "4-6 weeks", "Pilot output: scoring policy, data ownership, integration backlog, and rollout recommendation."]
  ].map(([label, value, note]) => `
    <article class="outcome-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${note}</p>
    </article>
  `).join("");
}

function renderPilotReadiness() {
  const avgScore = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length
    : 0;
  const tasks = generatedTasks();
  const readiness = [
    ["Vendor master", "Required", "Vendor ID, category, owner, tier, status, legal entity mapping."],
    ["Coupa export/API", "Required", "PO, invoice, savings, exception, contract and supplier risk fields."],
    ["LittleBig export/API", "Recommended", "Mission activity, staffing milestones, profile availability, delivery scope."],
    ["Internal performance feed", "Required", "SLA, incidents, CSAT, audit, project delivery or service review data."],
    ["Identity and access", "Required", "SSO approach, role mapping, procurement approvers, admin ownership."],
    ["PostgreSQL environment", "Required", "Managed database for persistent audit, scores, signals and settings."],
    ["Security owner", "Required", "Retention, logging, secrets, network and production approval guardrails."]
  ];
  $("#pilotChecklist").innerHTML = readiness.map(([name, status, detail]) => `
    <article class="pilot-check-item">
      <div>
        <strong>${name}</strong>
        <p>${detail}</p>
      </div>
      <span class="pilot-status ${status === "Required" ? "required" : "recommended"}">${status}</span>
    </article>
  `).join("");
  const processed = state.audit.filter((entry) => /approved|rejected|generated|sync/i.test(entry.message || "")).length;
  const risks = state.signals.filter((signal) => signal.sentiment === "Negative").length + state.failedFeeds.length;
  const savingsSignals = state.signals.filter((signal) => signal.dimension === "S" || /saving|invoice|PO|purchase/i.test(signal.summary || "")).length;
  $("#pilotValueCase").innerHTML = `
    <div class="modal-summary-grid">
      <article><span>Portfolio PRISM</span><strong>${avgScore.toFixed(1)}</strong></article>
      <article><span>Open pilot tasks</span><strong>${tasks.length}</strong></article>
      <article><span>Signals in gate</span><strong>${state.signals.length}</strong></article>
    </div>
    <div class="pilot-value-list">
      <article><strong>${Math.max(6, processed * 0.4).toFixed(1)}h</strong><span>Review hours potentially saved</span></article>
      <article><strong>${risks}</strong><span>Risks surfaced for earlier action</span></article>
      <article><strong>${savingsSignals}</strong><span>Commercial value signals identified</span></article>
      <article><strong>45%</strong><span>Estimated QBR preparation reduction</span></article>
    </div>
    <div class="recommendation-box">
      <strong>Recommended next move</strong>
      <p>Run a 4-6 week read-only pilot with 20 representative vendors, Coupa/procurement data, one operational feed, and governed human approval for all material score movement.</p>
    </div>
  `;
  $("#pilotIntegrationPlan").innerHTML = [
    ["1", "Confirm data owners", "Procurement, IT/security, vendor master, Coupa, LittleBig or services procurement."],
    ["2", "Load read-only sample feeds", "Use exports first so value can be validated before API credentials are requested."],
    ["3", "Tune scoring governance", "Agree PRISM weights, source trust thresholds, approval routing and audit retention."],
    ["4", "Harden production path", "Add PostgreSQL persistence, SSO, connector retries, monitoring alerts and backup policy."],
    ["5", "Review pilot decision", "Decide whether to expand categories, vendors and live integrations."]
  ].map(([step, title, detail]) => `
    <article class="roadmap-step">
      <span>${step}</span>
      <div><strong>${title}</strong><p>${detail}</p></div>
    </article>
  `).join("");
}

function renderRoleWorkspace() {
  const role = state.currentUser?.role || "viewer";
  const config = roleWorkspaceConfig[role] || roleWorkspaceConfig.viewer;
  const pending = state.signals.length;
  const attention = state.vendors.filter((vendor) => vendor.status === "red");
  const roleQueue = [
    ...config.queue.map((title, index) => ({ title, detail: index === 0 ? config.scope : "Demo task mapped to current access rights.", view: config.primaryView })),
    ...(role === "procurement_head" || role === "admin" ? state.signals.slice(0, 3).map((signal) => ({ title: signal.title, detail: `${vendorById(signal.vendorId)?.name || "Vendor"} needs approval gate review.`, view: "signals" })) : []),
    ...(role === "finance_controller" ? state.internalInputs.slice(0, 3).map((input) => ({ title: `${vendorById(input.vendorId)?.name || "Vendor"} financial evidence`, detail: `${prismLabels[input.dimension]} · ${input.period}`, view: "internal" })) : []),
    ...(role === "viewer" ? attention.slice(0, 3).map((vendor) => ({ title: `${vendor.name} executive attention`, detail: `PRISM ${scoreVendor(vendor).toFixed(1)} · ${recommendedAction(vendor)}`, view: "dashboard" })) : [])
  ].slice(0, 7);
  $("#roleWorkspaceName").textContent = config.title;
  $("#roleWorkspaceScope").textContent = roleLabels[role] || "Viewer";
  $("#rolePrimaryActionBtn").textContent = config.primaryLabel;
  $("#roleWorkspaceSummary").innerHTML = `
    <div class="role-hero-score">
      <strong>${pending}</strong>
      <span>Pending approval signals</span>
    </div>
    <p>${config.scope}</p>
    <div class="modal-summary-grid">
      <article><span>Accessible actions</span><strong>${config.actions.length}</strong></article>
      <article><span>Attention vendors</span><strong>${attention.length}</strong></article>
      <article><span>Audit events</span><strong>${state.audit.length}</strong></article>
    </div>
  `;
  $("#roleAllowedActions").innerHTML = config.actions.map((actionText) => `
    <article class="permission-card">
      <strong>${actionText}</strong>
      <span>Available to ${roleLabels[role] || role}</span>
    </article>
  `).join("");
  $("#roleQueueCount").textContent = `${roleQueue.length} items`;
  $("#roleQueue").innerHTML = roleQueue.map((item) => `
    <article class="role-queue-item interactive-item" role="button" tabindex="0" data-role-open="${item.view}">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.detail)}</p>
      <span>Open ${item.view}</span>
    </article>
  `).join("");
}

function renderExplainability() {
  const vendor = vendorById($("#explainVendor")?.value) || state.vendors[0];
  if (!vendor) return;
  const pendingSignals = state.signals.filter((signal) => signal.vendorId === vendor.id);
  const internalEvidence = state.internalInputs.filter((input) => input.vendorId === vendor.id);
  const auditEvents = state.audit.filter((entry) => entry.metadata?.vendorId === vendor.id || entry.message?.includes(vendor.name));
  const dimensions = Object.entries(vendor.dimensions).map(([key, value]) => ({ key, value: Number(value) }));
  const strongest = [...dimensions].sort((a, b) => b.value - a.value)[0];
  const weakest = [...dimensions].sort((a, b) => a.value - b.value)[0];
  const history = vendor.history || [scoreVendor(vendor)];
  const previous = Number(history.length > 1 ? history[history.length - 2] : history[0]);
  const current = scoreVendor(vendor);
  const movement = current - previous;
  const internalWeight = internalEvidence.length ? Math.round(internalEvidence.reduce((sum, input) => sum + Number(input.weight || 0), 0) / internalEvidence.length) : 0;
  const externalWeight = Math.max(0, 100 - internalWeight);
  $("#explainScoreLabel").textContent = `${vendor.name} · ${statusLabel(vendor.status)}`;
  $("#explainScorePanel").innerHTML = `
    <div class="explain-score-main">
      <strong>${current.toFixed(1)}</strong>
      <span>${movement >= 0 ? "+" : ""}${movement.toFixed(1)} since previous score</span>
    </div>
    <div class="modal-summary-grid">
      <article><span>Strongest factor</span><strong>${prismLabels[strongest.key]} ${strongest.value.toFixed(1)}</strong></article>
      <article><span>Watch factor</span><strong>${prismLabels[weakest.key]} ${weakest.value.toFixed(1)}</strong></article>
      <article><span>Pending signals</span><strong>${pendingSignals.length}</strong></article>
    </div>
    <p>${recommendedAction(vendor)}</p>
  `;
  $("#evidenceMixPanel").innerHTML = `
    <div class="evidence-bars">
      <article>
        <span>Internal evidence</span>
        <strong>${internalWeight || 30}%</strong>
        <div><i style="width:${internalWeight || 30}%"></i></div>
      </article>
      <article>
        <span>External signals</span>
        <strong>${internalEvidence.length ? externalWeight : 70}%</strong>
        <div><i style="width:${internalEvidence.length ? externalWeight : 70}%"></i></div>
      </article>
    </div>
    <div class="modal-summary-grid">
      <article><span>Internal inputs</span><strong>${internalEvidence.length}</strong></article>
      <article><span>Audit events</span><strong>${auditEvents.length}</strong></article>
      <article><span>Evidence confidence</span><strong>${pendingSignals[0]?.confidence || 82}%</strong></article>
    </div>
  `;
  const lineage = [
    ["Vendor baseline", `${vendor.name} starts at PRISM ${previous.toFixed(1)} from current vendor master and history.`],
    ["AI relevance", pendingSignals[0] ? `${pendingSignals[0].title} mapped to ${prismLabels[pendingSignals[0].dimension]} with ${pendingSignals[0].confidence}% confidence.` : "No pending external signal is currently waiting for this vendor."],
    ["Internal gate", internalEvidence[0] ? `${internalEvidence[0].evidence} Internal influence ${internalEvidence[0].weight}%.` : "No internal evidence has been applied yet for this vendor."],
    ["Human approval", auditEvents[0] ? auditEvents[0].message : "Next approval or rejection will be written into the audit trail."],
    ["Score outcome", `Current posture is ${statusLabel(vendor.status)} with strongest factor ${prismLabels[strongest.key]} and watch factor ${prismLabels[weakest.key]}.`]
  ];
  $("#decisionLineagePanel").innerHTML = lineage.map(([title, detail], index) => `
    <article class="lineage-step">
      <span>${index + 1}</span>
      <div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>
    </article>
  `).join("");
}

function renderDemoScript() {
  const steps = [
    ["1", "Portfolio Health", "Start on Dashboard. Show strategic advantage, performance watch, and executive attention vendors.", "dashboard"],
    ["2", "AI Signal Arrives", "Open Approval Gate. Explain confidence, PRISM dimension mapping, and why human approval is required.", "signals"],
    ["3", "Internal Gate Validates", "Open Internal Gate. Add SLA, Coupa, LittleBig, or finance evidence before score movement.", "internal"],
    ["4", "Explain The Score", "Open Explainability. Show internal/external evidence mix and decision lineage.", "explainability"],
    ["5", "Role Ownership", "Open Role Workspace. Show who can approve, upload, sync, or only view.", "roleWorkspace"],
    ["6", "Production Path", "Open Production. Close with SSO, PostgreSQL, Coupa, LittleBig and pilot gates.", "production"]
  ];
  $("#demoScriptSteps").innerHTML = steps.map(([number, title, detail, view]) => `
    <article class="demo-script-card">
      <span>${number}</span>
      <div>
        <strong>${title}</strong>
        <p>${detail}</p>
      </div>
      <button class="secondary-btn" data-demo-view="${view}" type="button">Open</button>
    </article>
  `).join("");
}

function renderProductionReadiness() {
  const required = productionChecklist.filter((item) => item[1] === "Required");
  const completeNow = 3;
  const readiness = Math.round((completeNow / required.length) * 100);
  $("#productionScorePanel").innerHTML = `
    <div class="production-score-ring">
      <strong>${readiness}%</strong>
      <span>pilot-ready shell</span>
    </div>
    <p>The demo proves workflow, governance, scoring logic, and stakeholder experience. Production work now focuses on secure data, persistence, access, and real integrations.</p>
    <div class="modal-summary-grid">
      <article><span>Required gates</span><strong>${required.length}</strong></article>
      <article><span>Demo-ready</span><strong>${completeNow}</strong></article>
      <article><span>Next build</span><strong>${required.length - completeNow}</strong></article>
    </div>
  `;
  $("#productionGatePanel").innerHTML = [
    ["Gate 1", "Client data approval", "Confirm which vendor, procurement, finance, and service data can be used."],
    ["Gate 2", "Read-only pilot", "Run with exports or sandbox APIs before live automation."],
    ["Gate 3", "Security hardening", "SSO, backend auth, secrets, audit retention, backup and monitoring."],
    ["Gate 4", "Scale decision", "Approve category expansion, live connectors, and operating model."]
  ].map(([gate, title, detail]) => `
    <article class="roadmap-step">
      <span>${gate.replace("Gate ", "")}</span>
      <div><strong>${title}</strong><p>${detail}</p></div>
    </article>
  `).join("");
  $("#productionChecklist").innerHTML = productionChecklist.map(([name, status, detail, owner], index) => `
    <article class="production-check-item">
      <div>
        <strong>${name}</strong>
        <p>${detail}</p>
        <small>Owner: ${owner}</small>
      </div>
      <span class="pilot-status ${status === "Required" ? "required" : "recommended"}">${index < completeNow ? "Demo ready" : status}</span>
    </article>
  `).join("");
}

function renderBenchmarkGroups() {
  Object.entries(benchmarkGroups).forEach(([groupId, group]) => {
    const hero = $(`#${groupId}Hero`);
    const grid = $(`#${groupId}Features`);
    if (!hero || !grid) return;
    const featureCount = group.features.length;
    const linkedSignals = state.signals.filter((signal) => {
      const text = `${signal.title} ${signal.summary} ${signal.type}`.toLowerCase();
      return group.features.some((feature) => feature.name.toLowerCase().split(" ")[0] && text.includes(feature.name.toLowerCase().split(" ")[0]));
    }).length;
    hero.innerHTML = `
      <div>
        <span class="benchmark-kicker">${group.owner}</span>
        <h3>${group.title}</h3>
        <p>${group.promise}</p>
      </div>
      <div class="benchmark-hero-metrics">
        <article><span>Features</span><strong>${featureCount}</strong></article>
        <article><span>Vendors</span><strong>${state.vendors.length}</strong></article>
        <article><span>Signal fit</span><strong>${linkedSignals || state.signals.length}</strong></article>
      </div>
    `;
    grid.innerHTML = group.features.map((feature, index) => `
      <article class="benchmark-feature-card">
        <div class="card-top">
          <div>
            <span class="benchmark-feature-number">${index + 1}</span>
            <h3>${feature.name}</h3>
          </div>
          <span class="benchmark-metric"><strong>${feature.metric}</strong>${feature.metricLabel}</span>
        </div>
        <p>${feature.value}</p>
        <div class="benchmark-sample">
          <span>Demo output</span>
          <strong>${feature.sample}</strong>
        </div>
        <button class="secondary-btn" data-benchmark-nav="${group.relatedView}" type="button">${feature.action}</button>
      </article>
    `).join("");
  });
}

function exportPilotSummary() {
  const avgScore = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length
    : 0;
  const rows = [
    ["Metric", "Value"],
    ["Portfolio PRISM", avgScore.toFixed(1)],
    ["Vendors monitored", state.vendors.length],
    ["Pending approval signals", state.signals.length],
    ["Executive attention vendors", state.vendors.filter((vendor) => vendor.status === "red").length],
    ["Active sources", state.sources.filter((source) => source.active).length],
    ["Connector escalations", state.failedFeeds.length],
    ["Recommended pilot", "4-6 week read-only pilot with Coupa, LittleBig/services data, vendor master, and one internal performance feed"]
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gsil-pilot-summary.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("Pilot summary downloaded");
}

function exportProductionChecklist() {
  const rows = [
    ["Item", "Status", "Owner", "Detail"],
    ...productionChecklist.map(([name, status, detail, owner]) => [name, status, owner, detail])
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gsil-production-readiness-checklist.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("Production readiness checklist downloaded");
}

function exportClientBrief() {
  const rows = [
    ["Section", "Summary"],
    ["Client value", "GSIL gives procurement, finance, operations, IT/security and leadership a shared evidence layer for vendor decisions."],
    ["Governance", "Human approval gate, source trust, evidence locker, audit trail, and connector monitoring keep scoring defensible."],
    ["Data lineage", "Source or connector -> AI relevance -> approval gate -> PRISM update -> audit/QBR."],
    ["Pilot outcome", "Validate 20-50 vendors, 50+ signals, 2-3 read-only feed patterns, scoring policy, and rollout recommendation."],
    ["Current demo", `${state.vendors.length} vendors, ${state.signals.length} pending signals, ${state.sources.filter((source) => source.active).length} active sources, ${state.failedFeeds.length} connector escalations.`]
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gsil-client-brief.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("Client brief downloaded");
}

function showDemoStep() {
  const guide = $("#demoGuide");
  if (!guide) return;
  guide.hidden = !demoGuide.active;
  if (!demoGuide.active) return;
  const step = demoSteps[demoGuide.step];
  $("#demoStepCount").textContent = `Step ${demoGuide.step + 1} of ${demoSteps.length}`;
  $("#demoStepTitle").textContent = step.title;
  $("#demoStepText").textContent = step.text;
  $("#demoBackBtn").disabled = demoGuide.step === 0;
  $("#demoNextBtn").textContent = demoGuide.step === demoSteps.length - 1 ? "Finish demo" : "Next step";
}

function moveDemoStep(direction) {
  if (!demoGuide.active) return;
  demoGuide.step += direction;
  if (demoGuide.step >= demoSteps.length) {
    demoGuide.active = false;
    showDemoStep();
    toast("Guided demo complete");
    return;
  }
  demoGuide.step = Math.max(0, demoGuide.step);
  const step = demoSteps[demoGuide.step];
  setActiveView(step.view);
  showDemoStep();
  toast(step.title);
}

function statusClass(status) {
  if (status === "healthy") return "green";
  if (status === "failed") return "red";
  return "amber";
}

function renderHistoryChart() {
  const vendor = vendorById($("#historyVendor").value) || state.vendors[0];
  if (!vendor) return;
  const values = vendor.history.slice(-8);
  const width = 720;
  const height = 260;
  const pad = 48;
  const step = (width - pad * 2) / Math.max(1, values.length - 1);
  const point = (value, index) => {
    const x = pad + index * step;
    const y = height - pad - ((value - 4) / 6) * (height - pad * 2);
    return [x, Math.max(pad, Math.min(height - pad, y))];
  };
  const points = values.map(point);
  const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const yTicks = [10, 8, 6, 4];
  const xLabels = values.map((_, index) => `P${index + 1}`);
  $("#historyChart").innerHTML = `
    <text x="${pad}" y="24" class="chart-title">${vendor.name} PRISM trend</text>
    <text x="12" y="${height / 2}" class="chart-axis-label" transform="rotate(-90 12 ${height / 2})">Y: PRISM score</text>
    <text x="${width / 2 - 44}" y="${height - 4}" class="chart-axis-label">X: score period</text>
    ${yTicks.map((tick) => {
      const y = height - pad - ((tick - 4) / 6) * (height - pad * 2);
      return `
        <line class="chart-grid" x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}"></line>
        <text x="${pad - 30}" y="${y + 4}" class="chart-tick">${tick}</text>
      `;
    }).join("")}
    <line class="chart-axis" x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}"></line>
    <line class="chart-axis" x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}"></line>
    <path class="chart-line" d="${path}"></path>
    ${points.map(([x, y], index) => `
      <circle class="chart-dot" cx="${x}" cy="${y}" r="6"><title>${xLabels[index]} · ${Number(values[index]).toFixed(1)}</title></circle>
      <text x="${x - 8}" y="${height - pad + 18}" class="chart-tick">${xLabels[index]}</text>
    `).join("")}
    <text x="${width - 112}" y="24" class="chart-title">Now ${Number(values[values.length - 1]).toFixed(1)}</text>
  `;
}

function renderQbrSnapshot(snapshot) {
  const vendor = state.vendors.find((item) => item.name === snapshot.vendor) || vendorById($("#historyVendor").value) || state.vendors[0];
  const recentSignals = snapshot.recentSignals || [];
  const recentAudit = snapshot.recentAudit || [];
  $("#qbrSnapshotPanel").innerHTML = `
    <article class="qbr-card">
      <div class="card-top">
        <div>
          <h3>${snapshot.vendor} QBR Snapshot</h3>
          <span class="muted">${new Date(snapshot.generatedAt).toLocaleString()}</span>
        </div>
        <span class="badge ${vendor?.status || "amber"}">${statusLabel(vendor?.status)}</span>
      </div>
      <div class="modal-summary-grid">
        <article><span>PRISM score</span><strong>${Number(snapshot.score).toFixed(1)}</strong></article>
        <article><span>Pending signals</span><strong>${snapshot.pendingSignals ?? state.signals.filter((signal) => signal.vendorId === vendor?.id).length}</strong></article>
        <article><span>High confidence</span><strong>${snapshot.highConfidenceSignals ?? 0}</strong></article>
        <article><span>Watch factor</span><strong>${snapshot.watchFactor ? `${snapshot.watchFactor.key} ${Number(snapshot.watchFactor.value).toFixed(1)}` : "N/A"}</strong></article>
      </div>
      <p>${escapeHtml(snapshot.executiveSummary || snapshot.recommendedAction || (vendor ? recommendedAction(vendor) : "Review latest score movement and open evidence items."))}</p>
      <div class="qbr-detail-grid">
        <div>
          <h4>Recent signals</h4>
          ${recentSignals.slice(0, 4).map((signal) => `<p><strong>${escapeHtml(signal.title)}</strong><br><span class="muted">${signal.source || "Source"} · ${signal.sentiment} · ${signal.confidence}%</span></p>`).join("") || `<p class="muted">No recent signal evidence.</p>`}
        </div>
        <div>
          <h4>Audit trail</h4>
          ${recentAudit.slice(0, 4).map((event) => `<p><strong>${escapeHtml(event.eventType || "Audit")}</strong><br><span class="muted">${escapeHtml(event.message || "")}</span></p>`).join("") || `<p class="muted">No recent audit events.</p>`}
        </div>
      </div>
    </article>
  `;
}

function buildReport(period) {
  const title = period === "fy" ? "GSIL Financial Year Vendor Intelligence Report" : "GSIL Quarterly Vendor Intelligence Report";
  const rows = state.vendors.map((vendor) => ({
    vendor: vendor.name,
    posture: statusLabel(vendor.status),
    score: scoreVendor(vendor).toFixed(1),
    performance: Number(vendor.dimensions.P).toFixed(1),
    risk: Number(vendor.dimensions.R).toFixed(1),
    integration: Number(vendor.dimensions.I).toFixed(1),
    value: Number(vendor.dimensions.S).toFixed(1),
    marketFit: Number(vendor.dimensions.M).toFixed(1),
    pendingSignals: state.signals.filter((signal) => signal.vendorId === vendor.id).length,
    action: recommendedAction(vendor)
  }));
  const headers = ["Vendor", "Posture", "PRISM Score", "Performance", "Risk", "Integration", "Score & Value", "Market Fit", "Pending Signals", "Recommended Action"];
  const csv = [
    title,
    `Generated,${new Date().toLocaleString()}`,
    `Period,${period === "fy" ? "Financial Year" : "Quarterly"}`,
    "",
    headers.join(","),
    ...rows.map((row) => [
      row.vendor,
      row.posture,
      row.score,
      row.performance,
      row.risk,
      row.integration,
      row.value,
      row.marketFit,
      row.pendingSignals,
      row.action
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  return csv;
}

function buildPortfolioSummary() {
  const avgScore = state.vendors.length
    ? state.vendors.reduce((sum, vendor) => sum + scoreVendor(vendor), 0) / state.vendors.length
    : 0;
  const postureCounts = ["green", "amber", "red"].map((status) => `${statusLabel(status)}: ${state.vendors.filter((vendor) => vendor.status === status).length}`).join(" | ");
  const strongestVendors = [...state.vendors].sort((a, b) => scoreVendor(b) - scoreVendor(a)).slice(0, 3);
  const watchVendors = [...state.vendors].sort((a, b) => scoreVendor(a) - scoreVendor(b)).slice(0, 3);
  const rows = state.vendors.map((vendor) => {
    const weakest = Object.entries(vendor.dimensions || {}).sort((a, b) => Number(a[1]) - Number(b[1]))[0] || ["P", 0];
    return [
      vendor.name,
      vendor.category,
      vendor.tier,
      statusLabel(vendor.status),
      scoreVendor(vendor).toFixed(1),
      prismLabels[weakest[0]],
      Number(weakest[1]).toFixed(1),
      state.signals.filter((signal) => signal.vendorId === vendor.id).length,
      recommendedAction(vendor)
    ];
  });
  const headers = ["Vendor", "Category", "Tier", "Posture", "PRISM", "Watch Factor", "Watch Score", "Pending Signals", "Recommended Action"];
  return [
    "GSIL Portfolio Summary",
    `Generated,${new Date().toLocaleString()}`,
    `Portfolio PRISM,${avgScore.toFixed(1)}`,
    `Posture Mix,${postureCounts}`,
    `Top Vendors,${strongestVendors.map((vendor) => `${vendor.name} ${scoreVendor(vendor).toFixed(1)}`).join(" | ")}`,
    `Watchlist,${watchVendors.map((vendor) => `${vendor.name} ${scoreVendor(vendor).toFixed(1)}`).join(" | ")}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
  ].join("\n");
}

function buildSelectedQbrReport(vendorId) {
  const vendor = vendorById(vendorId) || state.vendors[0];
  if (!vendor) return "";
  const pending = state.signals.filter((signal) => signal.vendorId === vendor.id);
  const audit = state.audit.filter((entry) => entry.metadata?.vendorId === vendor.id || entry.message?.includes(vendor.name)).slice(0, 8);
  const strongest = Object.entries(vendor.dimensions || {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || ["I", 0];
  const weakest = Object.entries(vendor.dimensions || {}).sort((a, b) => Number(a[1]) - Number(b[1]))[0] || ["P", 0];
  return [
    `GSIL QBR Snapshot - ${vendor.name}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `Posture: ${statusLabel(vendor.status)}`,
    `PRISM Score: ${scoreVendor(vendor).toFixed(1)}`,
    `Strongest Factor: ${prismLabels[strongest[0]]} ${Number(strongest[1]).toFixed(1)}`,
    `Watch Factor: ${prismLabels[weakest[0]]} ${Number(weakest[1]).toFixed(1)}`,
    "",
    "Executive Summary",
    `${vendor.name} is currently ${statusLabel(vendor.status)} with PRISM ${scoreVendor(vendor).toFixed(1)}. ${recommendedAction(vendor)}`,
    "",
    "PRISM Factors",
    ...Object.entries(vendor.dimensions || {}).map(([key, value]) => `- ${prismLabels[key]}: ${Number(value).toFixed(1)}`),
    "",
    "Open Signals",
    ...(pending.length ? pending.map((signal) => `- ${signal.title} | ${signal.source} | ${signal.sentiment} | ${signal.confidence}% confidence | Impact ${signal.impact}`) : ["- No pending signals currently visible."]),
    "",
    "Recent Audit Evidence",
    ...(audit.length ? audit.map((entry) => `- ${new Date(entry.createdAt || Date.now()).toLocaleString()} | ${entry.message}`) : ["- No recent audit events found for this vendor."]),
    "",
    "QBR Actions",
    `1. Validate ${prismLabels[weakest[0]]} evidence before next score movement.`,
    "2. Confirm owner, due date, and business impact.",
    "3. Route material changes through Approval Gate and Audit Trail."
  ].join("\n");
}

function downloadReport(period) {
  const csv = buildReport(period);
  downloadTextFile(period === "fy" ? "gsil-financial-year-report.csv" : "gsil-quarterly-report.csv", csv, "text/csv;charset=utf-8");
  toast(period === "fy" ? "Financial year report downloaded" : "Quarterly report downloaded");
}

function downloadPortfolioSummary() {
  downloadTextFile("gsil-portfolio-summary.csv", buildPortfolioSummary(), "text/csv;charset=utf-8");
  toast("Portfolio summary downloaded");
}

function downloadSelectedQbr() {
  if (!requireUiPermission("report:export", "This role cannot export reports.")) return;
  const vendorId = $("#qbrVendor")?.value || $("#historyVendor")?.value || state.vendors[0]?.id;
  const vendor = vendorById(vendorId);
  if (!vendor) {
    toast("Select a vendor before downloading QBR");
    return;
  }
  downloadTextFile(`${vendor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qbr-snapshot.txt`, buildSelectedQbrReport(vendor.id));
  toast(`QBR report downloaded for ${vendor.name}`);
}

function renderAll() {
  renderMetrics();
  renderClientBrief();
  renderPortfolio();
  renderRisks();
  renderActionCockpit();
  renderVendor360();
  renderScenarioSimulator();
  renderRiskHeatmap();
  renderBusinessValueTracker();
  renderVendorCards();
  renderVendorTable();
  renderSignals();
  renderCopilot();
  renderWatchlist();
  renderTaskBoard();
  renderSources();
  renderSourceGovernance();
  renderInternalFeed();
  renderAudit();
  renderConnectors();
  renderSettings();
  renderMonitoring();
  renderCompareMatrix();
  renderClientView();
  renderPilotReadiness();
  renderRoleWorkspace();
  renderExplainability();
  renderDemoScript();
  renderProductionReadiness();
  renderBenchmarkGroups();
  renderHistoryChart();
  showDemoStep();
  applyPermissionState();
  $("#notificationCount").textContent = state.signals.length;
}

function bindNavigation() {
  $$(".nav-item, #adminSettingsNav").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view);
    });
  });
}

function bindGlobalEvents() {
  document.addEventListener("click", (event) => {
    const saveSchedule = event.target.closest("[data-save-schedule]");
    if (saveSchedule) {
      event.preventDefault();
      event.stopPropagation();
      saveVendorSchedule(saveSchedule);
      return;
    }
    const scheduleButton = event.target.closest("[data-schedule-vendor]");
    if (scheduleButton) {
      event.preventDefault();
      event.stopPropagation();
      saveVendorSchedule(scheduleButton);
      return;
    }
    const portfolioNav = event.target.closest("[data-portfolio-nav]");
    if (portfolioNav) {
      setActiveView(portfolioNav.dataset.portfolioNav);
      toast(`Opened ${portfolioNav.textContent.trim()}`);
      return;
    }
    const modalAction = event.target.closest("[data-modal-action]");
    if (modalAction) {
      handleModalAction(modalAction);
      return;
    }
    const roleOpen = event.target.closest("[data-role-open]");
    if (roleOpen) {
      setActiveView(roleOpen.dataset.roleOpen);
      toast(`Opened ${roleOpen.dataset.roleOpen}`);
      return;
    }
    const demoOpen = event.target.closest("[data-demo-view]");
    if (demoOpen) {
      setActiveView(demoOpen.dataset.demoView);
      toast("Opened demo step");
      return;
    }
    const benchmarkNav = event.target.closest("[data-benchmark-nav]");
    if (benchmarkNav) {
      setActiveView(benchmarkNav.dataset.benchmarkNav);
      toast("Opened related GSIL workflow");
      return;
    }
    handleInteractiveOpen(event.target);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#actionModal").hidden) closeActionModal();
    if ((event.key === "Enter" || event.key === " ") && event.target.classList?.contains("interactive-item")) {
      event.preventDefault();
      handleInteractiveOpen(event.target);
    }
  });
  $("#closeActionModal").addEventListener("click", closeActionModal);
  $("#actionModal").addEventListener("click", (event) => {
    if (event.target.id === "actionModal") closeActionModal();
  });
  on("#loginForm", "submit", signIn);
  on("#presentationModeBtn", "click", togglePresentationMode);
  on("#logoutBtn", "click", signOut);
  $("#globalSearch").addEventListener("input", () => {
    renderVendorCards();
    renderSignals();
  });
  $$(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".segmented button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.activeFilter = button.dataset.filter;
      renderVendorCards();
    });
  });
  ["#signalTypeFilter", "#signalSentimentFilter", "#signalVendorFilter"].forEach((selector) => {
    $(selector).addEventListener("change", renderSignals);
  });
  on("#historyVendor", "change", renderHistoryChart);
  on("#qbrVendor", "change", () => {
    updateQbrVendorStatus();
    if ($("#historyVendor") && $("#qbrVendor").value) {
      $("#historyVendor").value = $("#qbrVendor").value;
      renderHistoryChart();
    }
  });
  on("#downloadQuarterBtn", "click", () => downloadReport("quarter"));
  on("#downloadFyBtn", "click", () => downloadReport("fy"));
  on("#downloadPortfolioBtn", "click", downloadPortfolioSummary);
  on("#downloadQbrBtn", "click", downloadSelectedQbr);
  on("#copilotCreateTaskBtn", "click", async () => {
    if (!latestCopilotTask) {
      toast("Choose a Copilot question first");
      return;
    }
    const task = await createActionTask(latestCopilotTask);
    setActiveView("tasks");
    toast(`Task created: ${task.title}`);
  });
  on("#watchlistCreateReviewBtn", "click", async () => {
    const vendors = watchlistVendors().slice(0, 5);
    for (const vendor of vendors) {
      const factor = vendorWatchFactor(vendor);
      await createActionTask({
        title: `Watchlist review: ${vendor.name}`,
        vendorId: vendor.id,
        vendor: vendor.name,
        owner: vendor.status === "red" ? "Procurement Head" : "Category Manager",
        stage: vendor.status === "red" ? "Owner Assigned" : "To Review",
        due: vendor.status === "red" ? "Today" : "This week",
        action: `Review ${factor.label} at ${factor.value.toFixed(1)} and confirm next procurement decision.`
      });
    }
    setActiveView("tasks");
    toast(`Created ${vendors.length} watchlist review tasks`);
  });
  document.addEventListener("click", (event) => {
    const prompt = event.target.closest("[data-copilot-question]");
    if (!prompt) return;
    renderCopilot(prompt.dataset.copilotQuestion);
  });
  on("#vendor360Select", "change", renderVendor360);
  on("#scenarioVendor", "change", renderScenarioSimulator);
  on("#scenarioType", "change", renderScenarioSimulator);
  on("#runScenarioBtn", "click", () => {
    renderScenarioSimulator();
    toast("Scenario simulation refreshed");
  });
  ["#compareVendorA", "#compareVendorB", "#compareVendorC"].forEach((selector) => {
    $(selector).addEventListener("change", renderCompareMatrix);
  });
  on("#addDemoTaskBtn", "click", () => {
    const vendor = state.vendors.find((item) => item.status === "red") || state.vendors[0];
    createActionTask({
      title: `Demo review task: ${vendor?.name || "Portfolio"}`,
      vendorId: vendor?.id || "",
      vendor: vendor?.name || "Portfolio",
      owner: "Procurement Analyst",
      stage: "To Review",
      due: "Today",
      action: "Use this task to show how procurement work is routed from vendor intelligence into owner follow-up.",
      source: "demo-task"
    }).then(() => {
      setActiveView("tasks");
      toast("Demo task created");
    });
  });
  on("#startDemoBtn", "click", () => {
    demoGuide = { active: true, step: 0 };
    setActiveView(demoSteps[0].view);
    showDemoStep();
    toast("Guided demo mode started");
  });
  on("#demoBackBtn", "click", () => moveDemoStep(-1));
  on("#demoNextBtn", "click", () => moveDemoStep(1));
  on("#demoExitBtn", "click", () => {
    demoGuide.active = false;
    showDemoStep();
    toast("Guided demo mode closed");
  });
  on("#exportPilotBtn", "click", exportPilotSummary);
  on("#exportClientBriefBtn", "click", exportClientBrief);
  on("#exportProductionBtn", "click", exportProductionChecklist);
  on("#explainVendor", "change", renderExplainability);
  on("#rolePrimaryActionBtn", "click", () => {
    const role = state.currentUser?.role || "viewer";
    setActiveView(roleWorkspaceConfig[role]?.primaryView || "dashboard");
  });
  on("#launchDemoScriptBtn", "click", () => {
    demoGuide = { active: true, step: 0 };
    setActiveView("dashboard");
    showDemoStep();
    toast("Client demo script launched");
  });
  on("#resetDemoBtn", "click", resetDemoState);
  on("#resetDemoSettingsBtn", "click", resetDemoState);
  on("#internalWeight", "input", () => {
    const value = Number($("#internalWeight").value);
    $("#internalWeightValue").textContent = `${value}% internal / ${100 - value}% external`;
  });
  [
    ["#fastTrackConfidence", "#fastTrackValue", "%"],
    ["#lowConfidenceThreshold", "#lowConfidenceValue", "%"],
    ["#scoreDropThreshold", "#scoreDropValue", ""]
  ].forEach(([inputSelector, valueSelector, suffix]) => {
    on(inputSelector, "input", () => {
      const raw = Number($(inputSelector).value);
      $(valueSelector).textContent = inputSelector === "#scoreDropThreshold" ? (raw / 10).toFixed(1) : `${raw}${suffix}`;
    });
  });
  on("#saveSettingsBtn", "click", () => {
    if (!requireUiPermission("settings:write", "Only Admin can save demo policy settings.")) return;
    toast("Settings shell saved for demo policy");
  });
  on("#backendBaseUrl", "change", () => {
    const value = $("#backendBaseUrl").value.trim().replace(/\/+$/, "") || defaultBackendUrl;
    localStorage.setItem(backendUrlKey, value);
    renderBackendModeControls();
  });
  on("#backendModeToggle", "change", async () => {
    if (!requireUiPermission("settings:write", "Only Admin can switch backend mode.")) {
      renderBackendModeControls();
      return;
    }
    localStorage.setItem(backendModeKey, $("#backendModeToggle").checked ? "active" : "static");
    renderBackendModeControls();
    try {
      await refresh();
      toast(backendModeEnabled() ? "Backend Mode enabled" : "Static demo mode enabled");
    } catch (error) {
      toast(`Backend Mode could not load: ${error.message}`);
    }
  });
  on("#testBackendBtn", "click", async () => {
    const value = $("#backendBaseUrl").value.trim().replace(/\/+$/, "") || defaultBackendUrl;
    localStorage.setItem(backendUrlKey, value);
    try {
      const response = await fetch(`${backendBaseUrl()}/api/health`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Health check failed");
      $("#backendModeStatus").textContent = `Connected: ${payload.service || "GSIL Backend"}`;
      $("#backendModeStatus").className = "backend-status live";
      toast("Backend is reachable");
    } catch (error) {
      $("#backendModeStatus").textContent = "Backend not reachable";
      $("#backendModeStatus").className = "backend-status error";
      toast(`Backend test failed: ${error.message}`);
    }
  });
  on("#autoPullFrequency", "change", () => {
    if (!requireUiPermission("settings:write", "Only Admin can change the auto-pull timer.")) {
      $("#autoPullFrequency").value = autoPullFrequencyKey();
      return;
    }
    localStorage.setItem("gsil-auto-pull-frequency", $("#autoPullFrequency").value);
    if ($("#autoPullFrequency").value !== "manual") localStorage.setItem("gsil-auto-pull", "active");
    updateAutoPullStatus();
    toast(`Auto-pull frequency set to ${autoPullFrequency().label}`);
  });
  on("#signalQualityPolicy", "change", () => {
    if (!requireUiPermission("settings:write", "Only Admin can change signal quality policy.")) {
      $("#signalQualityPolicy").value = signalQualityPolicy();
      return;
    }
    localStorage.setItem("gsil-signal-quality-policy", $("#signalQualityPolicy").value);
    updateAutoPullStatus();
    toast($("#signalQualityPolicy").value === "strict" ? "Strict signal quality enabled" : "Balanced signal quality enabled");
  });
  on("#simulateFailureBtn", "click", () => {
    if (!requireUiPermission("connector:sync", "Only Admin and Procurement Head can test connector monitoring.")) return;
    const existingTestAlert = (state.failedFeeds || []).find((feed) => feed.testAlert);
    if (existingTestAlert) {
      state.failedFeeds = state.failedFeeds.filter((feed) => !feed.testAlert);
      state.connectors = (state.connectors || []).map((item) => item.id === existingTestAlert.id
        ? { ...item, status: "healthy", lastError: "", nextRetry: "" }
        : item);
      state.monitoring = { ...(state.monitoring || {}), failedConnectors: state.failedFeeds.length };
      renderConnectors();
      renderMonitoring();
      showOperationStatus("Test monitoring alert cleared", "success", true);
      toast("Test monitoring alert cleared");
      return;
    }
    const connector = (state.connectors || []).find((item) => item.id === "coupa") || state.connectors?.[0];
    if (!connector) {
      toast("No connector is available for the monitoring test");
      return;
    }
    const alert = {
      id: connector.id,
      name: connector.name,
      owner: connector.owner || "Data Governance",
      status: "degraded",
      error: "Test alert: connector response exceeded the monitoring threshold. No real integration was interrupted.",
      nextRetry: "Demo retry in 5 minutes",
      testAlert: true
    };
    state.connectors = state.connectors.map((item) => item.id === connector.id
      ? { ...item, status: "degraded", lastError: alert.error, nextRetry: alert.nextRetry }
      : item);
    state.failedFeeds = [alert, ...(state.failedFeeds || []).filter((feed) => !feed.testAlert && feed.id !== connector.id)];
    state.monitoring = {
      ...(state.monitoring || {}),
      failedConnectors: state.failedFeeds.length
    };
    renderConnectors();
    renderMonitoring();
    showOperationStatus("Test monitoring alert added to Failed Feed Queue", "success", true);
    toast("Test monitoring alert added to Failed Feed Queue");
  });
  on("#runPullBtn", "click", async () => {
    if (!requireUiPermission("signal:pull", "Only Admin, Procurement Head, and Analyst can run signal pulls.")) return;
    const result = await action("", () => api.runPull());
    localStorage.setItem("gsil-last-auto-pull", String(Date.now()));
    updateAutoPullStatus();
    toast(result.generated.length ? `Pull generated ${result.generated.length} credible signals` : "No new credible vendor-specific signals found");
  });
  on("#autoPullToggle", "click", () => {
    if (!requireUiPermission("settings:write", "Only Admin can pause or resume auto-pull.")) return;
    const shouldPause = localStorage.getItem("gsil-auto-pull") !== "paused" && autoPullFrequency().ms > 0;
    localStorage.setItem("gsil-auto-pull", shouldPause ? "paused" : "active");
    if (autoPullFrequencyKey() === "manual" && !shouldPause) {
      localStorage.setItem("gsil-auto-pull-frequency", "6h");
    }
    updateAutoPullStatus();
    if (localStorage.getItem("gsil-auto-pull") !== "paused") runAutoPullIfDue(true);
  });
  $("#bulkApproveBtn").addEventListener("click", () => {
    if (!requireUiPermission("signal:bulk", "Only Admin and Procurement Head can bulk approve signals.")) return;
    action("High confidence signals approved", () => api.bulkSignals("approve-high"));
  });
  $("#bulkRejectBtn").addEventListener("click", () => {
    if (!requireUiPermission("signal:bulk", "Only Admin and Procurement Head can bulk reject signals.")) return;
    if (!window.confirm("Reject all low-confidence pending signals?")) return;
    action("Low confidence signals rejected", () => api.bulkSignals("reject-low"));
  });
  $("#vendorForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireUiPermission("vendor:write", "Only Admin and Procurement Head can add vendors.")) return;
    const vendor = {
      name: $("#vendorName").value.trim(),
      category: $("#vendorCategory").value.trim(),
      relationshipType: $("#vendorRelationshipType").value,
      tier: $("#vendorTier").value,
      schedule: $("#vendorSchedule").value,
      specialist: $("#vendorSpecialist").checked,
      metadata: {
        relationshipType: $("#vendorRelationshipType").value,
        evidenceCoverage: vendorRelationshipTypes[$("#vendorRelationshipType").value]?.coverage,
        scoreType: vendorRelationshipTypes[$("#vendorRelationshipType").value]?.scoreType
      }
    };
    if (!vendor.name || !vendor.category) {
      toast("Vendor name and category are required");
      return;
    }

    const visibleDraft = createVisibleVendorDraft(vendor);
    savePendingVendorDraft(visibleDraft);
    state.vendors = [
      visibleDraft,
      ...state.vendors.filter((item) => item.name.toLowerCase() !== visibleDraft.name.toLowerCase())
    ];
    event.target.reset();
    showAllVendorsBeforeRender();
    renderSelects();
    renderAll();
    setActiveView("vendors");
    showOperationStatus(`${visibleDraft.name} saved locally; syncing with backend…`, "working");
    toast(`${visibleDraft.name} added to the visible vendor list`);

    api.addVendor(vendor).then(async (result) => {
      if (result?.state) {
        state = { ...state, ...normalizeApiPayload(result.state) };
        state.vendors = mergePendingVendorDrafts(state.vendors);
        showAllVendorsBeforeRender();
        renderSelects();
        renderAll();
        setActiveView("vendors");
        showOperationStatus(`${vendor.name} saved and synced`, "success", true);
        toast(`${vendor.name} synced with backend`);
        return;
      }
      if (result?.vendor) {
        state.vendors = [
          result.vendor,
          ...state.vendors.filter((item) => item.id !== visibleDraft.id && item.id !== result.vendor.id)
        ];
        renderSelects();
        renderAll();
        setActiveView("vendors");
        showOperationStatus(`${result.vendor.name} saved and synced`, "success", true);
        toast(`${result.vendor.name} synced with backend`);
        return;
      }
      await refresh();
    }).catch((error) => {
      console.error("Vendor backend sync failed", error);
      showAllVendorsBeforeRender();
      renderSelects();
      renderAll();
      setActiveView("vendors");
      showOperationStatus(`${visibleDraft.name} is saved locally; backend sync needs retry`, "error", true);
      toast(`${visibleDraft.name} is visible locally; backend sync will need retry.`);
    });
  });
  $("#sourceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireUiPermission("source:write", "Only Admin and Analyst can add sources.")) return;
    const source = {
      name: $("#sourceName").value.trim(),
      url: $("#sourceUrl").value.trim(),
      category: $("#sourceCategory").value,
      confidence: $("#sourceConfidence").value
    };
    action("New source added", () => api.addSource(source)).then(() => event.target.reset());
  });
  $("#internalEvidenceFile").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return clearSelectedEvidenceFile();
    try {
      validateInternalEvidenceFile(file);
      selectedInternalEvidenceFile = file;
      const summary = $("#selectedEvidenceFile");
      summary.hidden = false;
      summary.innerHTML = `
        <div><strong>${escapeHtml(file.name)}</strong><br><span>${escapeHtml(file.type || "Document")} · ${formatFileSize(file.size)}</span></div>
        <button class="secondary-btn" id="removeEvidenceFile" type="button">Remove</button>
      `;
      showOperationStatus(`${file.name} is ready to attach`, "success", true);
    } catch (error) {
      clearSelectedEvidenceFile();
      showOperationStatus(error.message, "error", true);
      toast(error.message);
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("#removeEvidenceFile")) clearSelectedEvidenceFile();
    const downloadButton = event.target.closest("[data-download-evidence]");
    if (downloadButton) downloadInternalEvidence(downloadButton.dataset.downloadEvidence);
  });
  $("#internalForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireUiPermission("internal:write", "Only Admin, Analyst, and Finance Controller can add internal evidence.")) return;
    const evidenceNote = $("#internalEvidence").value.trim();
    const file = selectedInternalEvidenceFile;
    if (!evidenceNote && !file) {
      showOperationStatus("Add an evidence note or attach a document", "error", true);
      return toast("Add an evidence note or attach a document");
    }
    await action("Internal evidence saved and score recalculated", async () => {
      const attachment = file ? {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        dataUrl: await fileToDataUrl(file),
        category: $("#internalDocumentCategory").value,
        confidentiality: $("#internalConfidentiality").value,
        owner: $("#internalEvidenceOwner").value.trim(),
        expiryDate: $("#internalExpiryDate").value || null
      } : null;
      return api.addInternalInput({
        vendorId: $("#internalVendor").value,
        dimension: $("#internalDimension").value,
        weight: Number($("#internalWeight").value),
        period: $("#internalPeriod").value,
        feedType: attachment ? "Document Upload" : "Manual Input",
        evidence: evidenceNote || `Attached ${attachment.category}: ${attachment.fileName}.`,
        attachment
      });
    }).then(() => {
      $("#internalEvidence").value = "";
      $("#internalEvidenceOwner").value = "";
      $("#internalExpiryDate").value = "";
      clearSelectedEvidenceFile();
    }).catch(() => {});
  });
  on("#qbrBtn", "click", async () => {
    if (!requireUiPermission("qbr:write", "This role cannot generate QBR snapshots in the demo.")) return;
    const selectedVendor = $("#qbrVendor")?.value || $("#historyVendor").value || $("#historyVendor").selectedOptions?.[0]?.value || state.vendors[0]?.id || "";
    const vendorId = selectedVendor || null;
    const result = await action("", () => api.qbr(vendorId));
    renderQbrSnapshot(result.snapshot);
    toast(`QBR snapshot ready for ${result.snapshot.vendor} at ${result.snapshot.score.toFixed(1)}`);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-open-pilot]")) return;
    setActiveView("pilot");
    toast("Opened Pilot Readiness");
  });
  $("#notifyBtn").addEventListener("click", openNotificationCenter);
}

boot().catch((error) => {
  toast(`Could not load GSIL: ${error.message}`);
});
