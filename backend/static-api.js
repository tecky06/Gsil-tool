(function () {
  const originalFetch = window.fetch.bind(window);
  const storageKey = "gsil-static-demo-db-v2";
  const prismLabels = {
    P: "Performance",
    R: "Risk Profile",
    I: "Integration",
    S: "Score & Value",
    M: "Market Fit"
  };
  const standardWeights = { P: 0.25, R: 0.15, I: 0.2, S: 0.25, M: 0.15 };
  const specialistWeights = { P: 0.15, R: 0.1, I: 0.35, S: 0.15, M: 0.25 };
  const rolePermissions = {
    admin: ["view", "vendor:write", "source:write", "signal:pull", "signal:approve", "signal:reject", "signal:bulk", "internal:write", "connector:sync", "qbr:write", "report:export", "settings:write"],
    procurement_head: ["view", "vendor:write", "signal:pull", "signal:approve", "signal:reject", "signal:bulk", "connector:sync", "qbr:write", "report:export"],
    analyst: ["view", "signal:pull", "signal:reject", "internal:write", "source:write", "report:export"],
    finance_controller: ["view", "internal:write", "qbr:write", "report:export"],
    viewer: ["view", "report:export"]
  };

  window.fetch = async function gsilStaticFetch(input, options = {}) {
    const url = typeof input === "string" ? input : input.url;
    const requestUrl = new URL(url, window.location.href);
    if (requestUrl.origin !== window.location.origin) return originalFetch(input, options);
    const path = requestUrl.pathname;
    if (!path.startsWith("/api/")) return originalFetch(input, options);
    try {
      const payload = await handleApi(path, options);
      return jsonResponse(payload, 200);
    } catch (error) {
      return jsonResponse({ error: error.message || "Static demo request failed" }, error.status || 400);
    }
  };

  async function handleApi(path, options) {
    const method = String(options.method || "GET").toUpperCase();
    const db = await loadDb();
    const user = currentUser();

    if (method === "GET" && path === "/api/health") {
      return { ok: true, service: "GSIL Static Demo", mode: "netlify-static", time: new Date().toISOString() };
    }
    if (method === "GET" && path === "/api/state") return statePayload(db, user);
    if (method === "POST" && path === "/api/scheduler/run-pull") {
      requirePermission(user, "signal:pull");
      const generated = runScheduledPull(db, user.name);
      saveDb(db);
      return { generated, state: statePayload(db, user) };
    }
    if (method === "POST" && path === "/api/vendors") {
      requirePermission(user, "vendor:write");
      const body = readBody(options);
      if (!body.name || !body.category) throw httpError(400, "Vendor name and category are required");
      const vendor = normalizeVendor({
        id: createVendorId(body.name, db.vendors.map((item) => item.id)),
        name: body.name.trim(),
        category: body.category.trim(),
        tier: body.tier || "Core",
        schedule: body.schedule || "Daily",
        lastPull: "Not pulled yet",
        nextPull: body.schedule === "Manual" ? "Manual only" : body.schedule === "Weekly" ? "Next week 02:00" : "Tomorrow 02:00",
        specialist: Boolean(body.specialist),
        dimensions: { P: 7, R: 7, I: body.specialist ? 8 : 7, S: 7, M: body.specialist ? 8 : 7 },
        history: []
      });
      vendor.history = [vendor.score];
      db.vendors.unshift(vendor);
      addAudit(db, `${vendor.name} added as a ${vendor.tier} vendor.`, user.name, { vendorId: vendor.id });
      saveDb(db);
      return { vendor, state: statePayload(db, user) };
    }
    if (method === "PATCH" && path.startsWith("/api/vendors/")) {
      requirePermission(user, "vendor:write");
      const vendorId = path.split("/").at(-1);
      const body = readBody(options);
      const vendor = db.vendors.find((item) => item.id === vendorId);
      if (!vendor) throw httpError(404, "Vendor not found");
      if (body.schedule) {
        vendor.schedule = body.schedule;
        vendor.nextPull = body.schedule === "Manual" ? "Manual only" : body.schedule === "Weekly" ? "Next week 02:00" : "Tomorrow 02:00";
        addAudit(db, `${vendor.name} schedule changed to ${vendor.schedule}.`, user.name, { vendorId });
      }
      if (typeof body.specialist === "boolean") {
        vendor.specialist = body.specialist;
        normalizeVendor(vendor);
        vendor.history.push(vendor.score);
        addAudit(db, `${vendor.name} ${vendor.specialist ? "marked as" : "removed from"} Specialist Partner override.`, user.name, { vendorId });
      }
      saveDb(db);
      return { vendor, state: statePayload(db, user) };
    }
    if (method === "POST" && path.match(/^\/api\/signals\/\d+\/approve$/)) {
      requirePermission(user, "signal:approve");
      const signalId = Number(path.split("/")[3]);
      const body = readBody(options);
      const signal = db.signals.find((item) => item.id === signalId && item.status === "pending");
      if (!signal) throw httpError(404, "Pending signal not found");
      const vendor = db.vendors.find((item) => item.id === signal.vendorId);
      if (!vendor) throw httpError(404, "Vendor not found");
      signal.summary = body.summary || signal.summary;
      signal.dimension = body.dimension || signal.dimension;
      signal.impact = Number(body.impact || signal.impact);
      signal.status = "approved";
      signal.reviewedAt = new Date().toISOString();
      signal.reviewedBy = user.name;
      applySignalImpact(vendor, signal);
      addAudit(db, `${vendor.name}: approved "${signal.title}" with impact ${signal.impact} on ${prismLabels[signal.dimension]}.`, user.name, { signalId, vendorId: vendor.id });
      saveDb(db);
      return { signal, vendor, state: statePayload(db, user) };
    }
    if (method === "POST" && path.match(/^\/api\/signals\/\d+\/reject$/)) {
      requirePermission(user, "signal:reject");
      const signalId = Number(path.split("/")[3]);
      const body = readBody(options);
      const signal = db.signals.find((item) => item.id === signalId && item.status === "pending");
      if (!signal) throw httpError(404, "Pending signal not found");
      const vendor = db.vendors.find((item) => item.id === signal.vendorId);
      signal.status = "rejected";
      signal.rejectionReason = body.reason || "Rejected by reviewer";
      signal.reviewedAt = new Date().toISOString();
      signal.reviewedBy = user.name;
      addAudit(db, `${vendor?.name || "Vendor"}: rejected "${signal.title}". Reason: ${signal.rejectionReason}`, user.name, { signalId });
      saveDb(db);
      return { signal, state: statePayload(db, user) };
    }
    if (method === "POST" && path === "/api/signals/bulk") {
      requirePermission(user, "signal:bulk");
      const body = readBody(options);
      const affected = [];
      if (body.action === "approve-high") {
        db.signals.filter((signal) => signal.status === "pending" && signal.confidence >= 70).forEach((signal) => {
          const vendor = db.vendors.find((item) => item.id === signal.vendorId);
          if (vendor) applySignalImpact(vendor, signal);
          signal.status = "approved";
          signal.reviewedAt = new Date().toISOString();
          signal.reviewedBy = user.name;
          affected.push(signal);
        });
        addAudit(db, `Bulk approved ${affected.length} high confidence signals.`, user.name);
      } else if (body.action === "reject-low") {
        db.signals.filter((signal) => signal.status === "pending" && signal.confidence < 45).forEach((signal) => {
          signal.status = "rejected";
          signal.rejectionReason = "Low confidence source";
          signal.reviewedAt = new Date().toISOString();
          signal.reviewedBy = user.name;
          affected.push(signal);
        });
        addAudit(db, `Bulk rejected ${affected.length} low confidence signals.`, user.name);
      }
      saveDb(db);
      return { affected, state: statePayload(db, user) };
    }
    if (method === "POST" && path === "/api/sources") {
      requirePermission(user, "source:write");
      const body = readBody(options);
      if (!body.name || !body.url) throw httpError(400, "Source name and URL are required");
      const source = {
        id: nextId(db),
        name: body.name.trim(),
        url: body.url.trim(),
        category: body.category || "Business News",
        confidence: body.confidence || "Medium",
        active: true
      };
      db.sources.unshift(source);
      addAudit(db, `${source.name} added to source library as ${source.confidence} confidence.`, user.name, { sourceId: source.id });
      saveDb(db);
      return { source, state: statePayload(db, user) };
    }
    if (method === "PATCH" && path.startsWith("/api/sources/")) {
      requirePermission(user, "source:write");
      const sourceId = Number(path.split("/").at(-1));
      const body = readBody(options);
      const source = db.sources.find((item) => item.id === sourceId);
      if (!source) throw httpError(404, "Source not found");
      if (typeof body.active === "boolean") source.active = body.active;
      if (body.confidence) source.confidence = body.confidence;
      addAudit(db, `${source.name} source updated.`, user.name, { sourceId });
      saveDb(db);
      return { source, state: statePayload(db, user) };
    }
    if (method === "POST" && path === "/api/internal-inputs") {
      requirePermission(user, "internal:write");
      const body = readBody(options);
      const vendor = db.vendors.find((item) => item.id === body.vendorId);
      if (!vendor) throw httpError(404, "Vendor not found");
      const input = {
        id: nextId(db),
        vendorId: vendor.id,
        period: body.period || "FY26 Q1",
        feedType: body.feedType || "Manual Upload",
        dimension: body.dimension || "P",
        evidence: body.evidence || "Internal evidence added through static demo.",
        weight: Number(body.weight || 30),
        status: "approved",
        createdBy: user.name,
        createdAt: new Date().toISOString()
      };
      db.internalInputs.unshift(input);
      applyInternalImpact(vendor, input);
      addAudit(db, `${vendor.name}: internal gate input applied to ${prismLabels[input.dimension]}.`, user.name, { inputId: input.id, vendorId: vendor.id });
      saveDb(db);
      return { input, vendor, state: statePayload(db, user) };
    }
    if (method === "POST" && path.match(/^\/api\/connectors\/[^/]+\/sync$/)) {
      requirePermission(user, "connector:sync");
      const connectorId = path.split("/")[3];
      const result = syncDemoConnector(db, connectorId, user.name);
      saveDb(db);
      return { ...result, state: statePayload(db, user) };
    }
    if (method === "POST" && path === "/api/qbr") {
      requirePermission(user, "qbr:write");
      const body = readBody(options);
      const vendor = db.vendors.find((item) => item.id === body.vendorId) || db.vendors[0];
      const snapshot = {
        id: nextId(db),
        vendor: vendor.name,
        score: scoreVendor(vendor),
        status: vendor.status,
        generatedAt: new Date().toISOString(),
        dimensions: vendor.dimensions,
        recentAudit: db.audit.slice(0, 5)
      };
      addAudit(db, `${vendor.name} QBR snapshot generated.`, user.name, { snapshotId: snapshot.id });
      saveDb(db);
      return { snapshot, state: statePayload(db, user) };
    }
    throw httpError(404, "Static demo route not found");
  }

  async function loadDb() {
    const saved = localStorage.getItem(storageKey);
    if (saved) return normalizeDatabase(JSON.parse(saved));
    const response = await originalFetch("data/gsil-db.json", { cache: "no-store" });
    const db = normalizeDatabase(await response.json());
    saveDb(db);
    return db;
  }

  function saveDb(db) {
    localStorage.setItem(storageKey, JSON.stringify(normalizeDatabase(db)));
  }

  function statePayload(db, user) {
    const pendingSignals = db.signals.filter((signal) => signal.status === "pending");
    const connectors = buildConnectors(db);
    const failedFeeds = connectors
      .filter((connector) => connector.status === "failed" || connector.status === "degraded")
      .map((connector) => ({
        id: connector.id,
        name: connector.name,
        owner: connector.owner,
        status: connector.status,
        error: connector.lastError,
        nextRetry: connector.nextRetry
      }));
    return {
      meta: db.meta,
      currentUser: user,
      vendors: db.vendors.map((vendor) => ({ ...vendor, score: scoreVendor(vendor) })),
      sources: db.sources,
      signals: pendingSignals,
      internalInputs: db.internalInputs,
      audit: db.audit,
      connectors,
      failedFeeds,
      uploadHistory: buildUploadHistory(db),
      monitoring: buildMonitoring(db, pendingSignals, connectors, failedFeeds),
      roles: buildRoles(),
      prismLabels,
      standardWeights,
      specialistWeights
    };
  }

  function buildConnectors(db) {
    const sourceConnectors = db.sources.map((source, index) => {
      const status = !source.active ? "paused" : source.confidence === "Low" ? "degraded" : "healthy";
      return {
        id: `source-${source.id}`,
        name: source.name,
        type: "External Source",
        category: source.category,
        status,
        confidence: source.confidence,
        lastSync: source.active ? `${index + 1}h ago` : "Paused",
        nextSync: source.active ? "02:00 IST" : "Manual resume",
        owner: "Source Admin",
        lastError: status === "degraded" ? "Low confidence source requires manual review." : "",
        nextRetry: status === "degraded" ? "Next scheduler run" : ""
      };
    });
    return [
      ...sourceConnectors,
      { id: "coupa", name: "Coupa Spend Management", type: "Enterprise System", category: "Procurement / Spend", status: "healthy", confidence: "High", lastSync: "Demo ready", nextSync: "On demand", owner: "Procurement Systems", lastError: "", nextRetry: "", demoIntegration: true, description: "Pulls suppliers, POs, invoices, contracts, approvals, and supplier risk signals into GSIL." },
      { id: "littlebig", name: "LittleBig Connection", type: "Enterprise System", category: "Talent / Services Marketplace", status: "healthy", confidence: "Medium", lastSync: "Demo ready", nextSync: "On demand", owner: "Services Procurement", lastError: "", nextRetry: "", demoIntegration: true, description: "Pulls project missions, expert skills, contract status, and delivery activity into GSIL." },
      { id: "internal-sla", name: "Internal SLA Feed", type: "Internal Data", category: "Performance", status: "healthy", confidence: "High", lastSync: "Today 09:14", nextSync: "Daily 07:30 IST", owner: "Operations PMO", lastError: "", nextRetry: "" },
      { id: "internal-invoice", name: "Invoice / PO Feed", type: "Internal Data", category: "Score & Value", status: "degraded", confidence: "High", lastSync: "Yesterday 19:40", nextSync: "Daily 20:00 IST", owner: "Finance Controller", lastError: "2 records missing vendor tags.", nextRetry: "Today 20:15 IST" },
      { id: "internal-audit", name: "Audit Findings Feed", type: "Internal Data", category: "Risk", status: "failed", confidence: "High", lastSync: "2 days ago", nextSync: "Retry queued", owner: "Risk Office", lastError: "Schema mismatch: control_area column missing.", nextRetry: "Manual mapping required" }
    ];
  }

  function runScheduledPull(db, actor) {
    const templates = crediblePullTemplates();
    const activeSources = db.sources.filter((source) => source.active && source.confidence !== "Low");
    const strictMode = (localStorage.getItem("gsil-signal-quality-policy") || "strict") === "strict";
    const minConfidence = strictMode ? 82 : 75;
    const maxGenerated = strictMode ? 2 : 3;
    const seed = Number(db.meta.nextId || 0);
    const generated = [];
    const candidates = db.vendors
      .filter((vendor) => vendor.schedule !== "Manual")
      .map((vendor, index) => {
        const options = templates[vendor.id] || [];
        const template = options[(seed + index) % Math.max(options.length, 1)];
        return template ? { vendor, template, index } : null;
      })
      .filter(Boolean)
      .filter(({ vendor, template }) => {
        const duplicate = db.signals.some((signal) => signal.status === "pending" && signal.vendorId === vendor.id && signal.title === template.title);
        return !duplicate && template.confidence >= minConfidence && template.vendorSpecific;
      })
      .sort((a, b) => {
        const statusWeight = { red: 3, amber: 2, green: 1 };
        return (statusWeight[b.vendor.status] || 0) - (statusWeight[a.vendor.status] || 0) || b.template.confidence - a.template.confidence;
      })
      .slice(0, maxGenerated);
    candidates.forEach(({ vendor, template, index }) => {
      const source = activeSources[index % Math.max(activeSources.length, 1)];
      vendor.lastPull = "Just now";
      vendor.nextPull = vendor.schedule === "Weekly" ? "Next week 02:00" : "Tomorrow 02:00";
      const signal = {
        id: nextId(db),
        vendorId: vendor.id,
        title: template.title,
        source: source?.name || "Configured source",
        sourceName: source?.name || "Configured source",
        summary: template.summary,
        type: template.type,
        signalType: template.type,
        sentiment: template.sentiment,
        dimension: template.dimension,
        confidence: template.confidence,
        impact: template.impact,
        status: "pending",
        aiProvider: "rules",
        aiExplanation: template.aiExplanation,
        createdAt: new Date().toISOString()
      };
      db.signals.unshift(signal);
      generated.push(signal);
    });
    db.meta.lastSchedulerRun = new Date().toISOString();
    addAudit(db, `Credible signal pull generated ${generated.length} vendor-specific pending signals.`, actor, { generated: generated.length, minConfidence, maxGenerated });
    return generated;
  }

  function crediblePullTemplates() {
    return {
      tcs: [
        { vendorSpecific: true, title: "PwC India SLA and audit closure signal verified", summary: "PwC India shows 97.4% SLA attainment against a 96.0% threshold and closed 16 of 19 audit remediation actions within 30 days; both metrics are directly linked to current managed-risk scope.", type: "Operational", sentiment: "Positive", dimension: "P", confidence: 90, impact: 6, aiExplanation: "Vendor-specific SLA and remediation closure evidence meets strict relevance threshold for Performance." },
        { vendorSpecific: true, title: "PwC India rate-card variance needs review", summary: "Invoice sampling for PwC India shows 2.9% blended rate variance across 126 line items, equal to estimated INR 11.2 lakh quarterly exposure against the active advisory rate card.", type: "Financial", sentiment: "Negative", dimension: "S", confidence: 84, impact: 5, aiExplanation: "Rate-card variance is vendor-specific and directly affects Score & Value." }
      ],
      infosys: [
        { vendorSpecific: true, title: "EY India invoice match rate improves", summary: "EY India reached 94.8% first-pass invoice match across 284 invoices, reducing manual finance exceptions by 31 cases versus the previous month.", type: "Financial", sentiment: "Positive", dimension: "S", confidence: 88, impact: 6, aiExplanation: "Invoice match improvement is direct vendor evidence for Score & Value." },
        { vendorSpecific: true, title: "EY India advisory dependency concentration rises", summary: "EY India now owns 61% of open tax advisory requests, up from 49% last quarter, creating a concentration risk for quarter-close support.", type: "Risk", sentiment: "Negative", dimension: "R", confidence: 85, impact: 6, aiExplanation: "Concentration movement is vendor-specific and maps to Risk Profile." }
      ],
      sabrelink: [
        { vendorSpecific: true, title: "Deloitte India integration defect leakage below threshold", summary: "Deloitte India integration workstream shows 1.7% API defect leakage versus a 3.0% threshold across 29 closed stories, supporting specialist Integration strength.", type: "Operational", sentiment: "Positive", dimension: "I", confidence: 92, impact: 7, aiExplanation: "API defect leakage and closed story count are direct Integration indicators." }
      ],
      globex: [
        { vendorSpecific: true, title: "KPMG India compliance evidence aging exceeds threshold", summary: "KPMG India has 8 of 22 compliance evidence items older than 45 days, or 36.4% aging versus a 20.0% threshold; three items relate to access-control review evidence.", type: "Risk", sentiment: "Negative", dimension: "R", confidence: 91, impact: 8, aiExplanation: "Aged compliance evidence is high-confidence vendor-specific Risk Profile evidence." },
        { vendorSpecific: true, title: "KPMG India SLA remains below target", summary: "KPMG India recorded 92.1% SLA attainment against a 95.0% target for the current cycle, with 13 late cases and average breach aging of 3.4 business days.", type: "Operational", sentiment: "Negative", dimension: "P", confidence: 88, impact: 7, aiExplanation: "Repeated SLA shortfall directly affects Performance and requires approval." }
      ],
      "cloud-engineering": [
        { vendorSpecific: true, title: "Accenture India cloud staffing gap persists", summary: "Accenture India filled 10 of 14 requested cloud profiles by the planned date, leaving a 28.6% open staffing gap and 5.8-day average delay on environment readiness tasks.", type: "People", sentiment: "Negative", dimension: "P", confidence: 83, impact: 6, aiExplanation: "Profile-fill gap is directly linked to delivery Performance." },
        { vendorSpecific: true, title: "Accenture India API uptime above threshold", summary: "Accenture India maintained 99.73% API availability across 18 services versus the 99.50% threshold, with zero P1 incidents this month.", type: "Operational", sentiment: "Positive", dimension: "I", confidence: 90, impact: 6, aiExplanation: "Vendor-specific uptime evidence supports Integration." }
      ],
      facilities: [
        { vendorSpecific: true, title: "Capgemini India support SLA within tolerance", summary: "Capgemini India closed 412 support tickets with 93.2% within SLA against a 92.0% threshold; backlog older than 10 days reduced from 26 to 17 tickets.", type: "Operational", sentiment: "Positive", dimension: "P", confidence: 84, impact: 5, aiExplanation: "Ticket and SLA metrics are vendor-specific Performance evidence." }
      ],
      "talent-marketplace": [
        { vendorSpecific: true, title: "Wipro specialist fill rate below plan", summary: "Wipro filled 19 of 26 requested specialist engineering roles within the 21-day SLA, a 73.1% fill rate versus the 85.0% target.", type: "People", sentiment: "Negative", dimension: "M", confidence: 86, impact: 7, aiExplanation: "Fill-rate gap directly affects specialist Market Fit." }
      ],
      "procurement-platform": [
        { vendorSpecific: true, title: "Cognizant India MTTR improves", summary: "Cognizant India improved P2 incident MTTR from 9.1 hours to 6.6 hours while repeat incidents reduced from 10 to 4 over the current monthly window.", type: "Operational", sentiment: "Positive", dimension: "I", confidence: 88, impact: 6, aiExplanation: "MTTR and repeat incident reduction are direct Integration evidence." }
      ]
    };
  }

  function syncDemoConnector(db, connectorId, actor) {
    const now = new Date().toISOString();
    let signals = [];
    if (connectorId === "coupa") {
      signals = [
        { id: nextId(db), vendorId: "tcs", source: "Coupa", sourceName: "Coupa", title: "PO savings variance above target", summary: "Coupa purchase order data shows PwC India realized 6.8% savings above contracted baseline across 146 PO lines, equal to an estimated INR 31.4 lakh quarterly value capture.", type: "Financial", signalType: "Financial", sentiment: "Positive", dimension: "S", confidence: 91, impact: 8, status: "pending", aiProvider: "rules", aiExplanation: "Coupa PO savings variance maps to Score & Value because it measures realized value against commercial baseline.", createdAt: now },
        { id: nextId(db), vendorId: "globex", source: "Coupa", sourceName: "Coupa", title: "Invoice exception rate exceeds threshold", summary: "Coupa invoice records show KPMG India at 8.9% exception rate versus a 3.0% tolerance across 158 invoices, with 21 missing PO references and 7 rate-card mismatches.", type: "Financial", signalType: "Financial", sentiment: "Negative", dimension: "R", confidence: 88, impact: 7, status: "pending", aiProvider: "rules", aiExplanation: "Invoice exceptions, PO-reference gaps and rate-card mismatches increase Risk Profile and should be reviewed before PRISM update.", createdAt: now }
      ];
      addAudit(db, "Coupa demo sync completed: 2 procurement signals generated.", actor, { connectorId, generatedSignals: signals.map((signal) => signal.id) });
    } else if (connectorId === "littlebig") {
      signals = [
        { id: nextId(db), vendorId: "sabrelink", source: "LittleBig Connection", sourceName: "LittleBig Connection", title: "Specialist integration talent availability improved", summary: "LittleBig-style capacity data shows Deloitte India has 11 certified integration architects available within 14 days versus 7 last month, raising specialist coverage from 72% to 91%.", type: "Strategic", signalType: "Strategic", sentiment: "Positive", dimension: "M", confidence: 83, impact: 7, status: "pending", aiProvider: "rules", aiExplanation: "Certified specialist availability and coverage improvement map to Market Fit for specialist vendors.", createdAt: now },
        { id: nextId(db), vendorId: "cloud-engineering", source: "LittleBig Connection", sourceName: "LittleBig Connection", title: "Cloud migration staffing milestone delayed", summary: "Mission activity indicates Accenture India filled 9 of 13 requested cloud migration profiles by the planned date, creating a 6-day average staffing delay for environment readiness tasks.", type: "Operational", signalType: "Operational", sentiment: "Negative", dimension: "P", confidence: 76, impact: 6, status: "pending", aiProvider: "rules", aiExplanation: "Staffing delay and profile-fill gap affect delivery performance and map to PRISM Performance.", createdAt: now }
      ];
      addAudit(db, "LittleBig Connection demo sync completed: 2 talent/service signals generated.", actor, { connectorId, generatedSignals: signals.map((signal) => signal.id) });
    } else {
      throw httpError(404, "Connector sync is available for Coupa and LittleBig demo connectors");
    }
    db.signals.unshift(...signals);
    return { connectorId, generated: signals };
  }

  function classifySignal(rawSignal, source) {
    const text = `${rawSignal.title || ""} ${rawSignal.summary || ""} ${rawSignal.type || ""}`.toLowerCase();
    const dimension = /invoice|saving|cost|margin|commercial|financial|po/.test(text) ? "S" : /risk|compliance|audit|control|exception/.test(text) ? "R" : /integration|api|certification|cloud/.test(text) ? "I" : /talent|workforce|attrition|specialist|mission/.test(text) ? "M" : "P";
    const sentiment = /delay|churn|risk|exception|breach|failure|slipped|missing/.test(text) ? "Negative" : "Positive";
    const confidenceBase = source?.confidence === "High" ? 88 : source?.confidence === "Low" ? 48 : 72;
    return {
      ...rawSignal,
      sourceName: rawSignal.sourceName || rawSignal.source || source?.name || "Configured source",
      signalType: rawSignal.signalType || rawSignal.type || "Operational",
      sentiment,
      dimension,
      confidence: rawSignal.confidence || confidenceBase,
      impact: rawSignal.impact || (sentiment === "Negative" ? 6 : 5),
      status: "pending",
      aiProvider: "rules",
      aiExplanation: `Static AI relevance demo mapped this signal to ${prismLabels[dimension]} with ${sentiment.toLowerCase()} sentiment.`,
      createdAt: rawSignal.createdAt || new Date().toISOString()
    };
  }

  function buildUploadHistory(db) {
    return db.internalInputs.slice(0, 10).map((input) => ({
      id: input.id,
      vendor: db.vendors.find((vendor) => vendor.id === input.vendorId)?.name || "Unknown vendor",
      feedType: input.feedType || "Manual Input",
      dimension: input.dimension,
      weight: input.weight,
      status: input.status || "approved",
      period: input.period,
      submittedBy: input.createdBy || "Demo user",
      createdAt: input.createdAt || new Date().toISOString(),
      evidence: input.evidence
    }));
  }

  function buildMonitoring(db, pendingSignals, connectors, failedFeeds) {
    return {
      apiStatus: "healthy",
      schedulerStatus: db.meta.lastSchedulerRun ? "active" : "not run",
      pendingReviews: pendingSignals.length,
      failedConnectors: failedFeeds.filter((feed) => feed.status === "failed").length,
      degradedConnectors: failedFeeds.filter((feed) => feed.status === "degraded").length,
      lastBackup: "Static demo local backup",
      auditVolume: db.audit.length,
      activeConnectors: connectors.filter((connector) => connector.status === "healthy").length
    };
  }

  function buildRoles() {
    return [
      { role: "admin", label: "Admin", permissions: ["Manage demo policy", "Manage vendors", "Manage sources", "Run ingestion", "Approve signals", "Sync connectors"] },
      { role: "procurement_head", label: "Procurement Head", permissions: ["Approve score changes", "Bulk gate actions", "Manage vendors", "Sync connectors", "Generate QBR"] },
      { role: "analyst", label: "Analyst", permissions: ["Run research pull", "Reject weak signals", "Upload evidence", "Manage source trust", "Export reports"] },
      { role: "finance_controller", label: "Finance Controller", permissions: ["Upload financial evidence", "Generate QBR", "Export reports", "View audit"] },
      { role: "viewer", label: "Viewer", permissions: ["View dashboards", "View audit", "Export reports", "No score-changing actions"] }
    ];
  }

  function addAudit(db, message, actor, metadata = {}) {
    db.audit.unshift({
      id: nextId(db),
      message,
      actor,
      metadata,
      createdAt: new Date().toISOString()
    });
  }

  function currentUser() {
    try {
      const session = JSON.parse(localStorage.getItem("gsil-demo-session") || "null");
      if (session?.role) {
        return { name: session.name || "Demo User", role: session.role, email: session.username || `${session.role}@gsil.demo` };
      }
    } catch {
      // fall through to legacy role support
    }
    const role = localStorage.getItem("gsil-demo-role") || "viewer";
    const labels = { admin: "Admin", procurement_head: "Procurement Head", analyst: "Analyst", finance_controller: "Finance Controller", viewer: "Viewer" };
    return { name: `${labels[role] || "Demo User"} Demo`, role, email: `${role}@gsil.demo` };
  }

  function requirePermission(user, permission) {
    if ((rolePermissions[user.role] || []).includes(permission)) return;
    throw httpError(403, `Permission denied for ${user.role}. Required: ${permission}`);
  }

  function normalizeDatabase(db) {
    db.meta ||= {};
    db.meta.schemaVersion ||= 1;
    db.meta.nextId ||= 4000;
    db.vendors ||= [];
    db.sources ||= [];
    db.signals ||= [];
    db.internalInputs ||= [];
    db.audit ||= [];
    db.vendors.forEach(normalizeVendor);
    return db;
  }

  function normalizeVendor(vendor) {
    vendor.dimensions ||= { P: 7, R: 7, I: 7, S: 7, M: 7 };
    Object.keys(prismLabels).forEach((key) => {
      vendor.dimensions[key] = Number(vendor.dimensions[key] ?? 7);
    });
    vendor.score = scoreVendor(vendor);
    vendor.status = scoreClass(vendor.score);
    vendor.history ||= [vendor.score];
    return vendor;
  }

  function scoreVendor(vendor) {
    const weights = vendor.specialist ? specialistWeights : standardWeights;
    return Number(Object.entries(vendor.dimensions).reduce((sum, [key, value]) => sum + Number(value || 0) * weights[key], 0).toFixed(2));
  }

  function scoreClass(score) {
    if (score >= 7.8) return "green";
    if (score >= 6.6) return "amber";
    return "red";
  }

  function applySignalImpact(vendor, signal) {
    const direction = signal.sentiment === "Positive" ? 1 : -1;
    const delta = direction * (Number(signal.impact || 0) / 20);
    vendor.dimensions[signal.dimension] = clamp(Number(vendor.dimensions[signal.dimension] || 7) + delta);
    normalizeVendor(vendor);
    vendor.history.push(vendor.score);
  }

  function applyInternalImpact(vendor, input) {
    const negative = /breach|risk|issue|delay|audit|failure|penalty|non-compliance|variance/i.test(input.evidence || "");
    const delta = (negative ? -0.35 : 0.35) * (Number(input.weight || 30) / 30);
    vendor.dimensions[input.dimension] = clamp(Number(vendor.dimensions[input.dimension] || 7) + delta);
    normalizeVendor(vendor);
    vendor.history.push(vendor.score);
  }

  function clamp(value) {
    return Number(Math.max(1, Math.min(10, value)).toFixed(2));
  }

  function createVendorId(name, existingIds) {
    const base = String(name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `vendor-${Date.now()}`;
    let candidate = base;
    let suffix = 2;
    while (existingIds.includes(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  function nextId(db) {
    db.meta.nextId = Number(db.meta.nextId || 4000) + 1;
    return db.meta.nextId;
  }

  function readBody(options) {
    if (!options.body) return {};
    if (typeof options.body === "string") return JSON.parse(options.body || "{}");
    return options.body;
  }

  function jsonResponse(payload, status) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  function httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
  }
})();
