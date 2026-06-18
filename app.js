const api = {
  async request(path, options = {}) {
    const response = await fetch(apiUrl(path), {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
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
const defaultBackendUrl = "http://localhost:3001";

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

const connectorTerms = {
  healthy: "Operational Ready",
  degraded: "Data Watch",
  failed: "Owner Escalation",
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
