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
  const bundledSeedDatabase = {"meta":{"nextId":5074,"lastSchedulerRun":"2026-06-13T19:15:57.538Z","schedulerMode":"demo","generatedAt":"2026-06-19T08:21:03.295Z","schemaVersion":1},"vendors":[{"id":"tcs","name":"PwC India","category":"Consulting & Risk Advisory","tier":"Strategic","schedule":"Daily","specialist":false,"dimensions":{"P":8.2,"R":8.4,"I":7.8,"S":8.1,"M":8.6},"history":[7.7,7.8,7.9,8,8.1,8,8.2,8.18],"lastPull":"Just now","nextPull":"Tomorrow 02:00","status":"green","score":8.18},{"id":"infosys","name":"EY India","category":"Tax, Risk & Transformation Advisory","tier":"Strategic","schedule":"Weekly","specialist":false,"dimensions":{"P":7.7,"R":8.1,"I":7.4,"S":7.8,"M":8.2},"history":[7.5,7.6,7.7,7.8,7.7,7.9,7.85,7.86],"lastPull":"Just now","nextPull":"Next week 02:00","status":"green","score":7.8},{"id":"sabrelink","name":"Deloitte India","category":"Technology Consulting & Integration","tier":"Strategic","schedule":"Daily","specialist":true,"dimensions":{"P":7.8,"R":7.6,"I":8.9,"S":7.7,"M":8.8},"history":[7.8,8,8.1,8.2,8.3,8.25,8.34,8.35],"lastPull":"Just now","nextPull":"Tomorrow 02:00","status":"green","score":8.4},{"id":"globex","name":"KPMG India","category":"Managed Risk & Compliance Services","tier":"Watchlist","schedule":"Daily","specialist":false,"dimensions":{"P":6.2,"R":5.9,"I":6.8,"S":6.5,"M":6.9},"history":[7.1,6.9,6.8,6.6,6.5,6.4,6.32,6.29],"lastPull":"Just now","nextPull":"Tomorrow 02:00","status":"red","score":6.46},{"id":"cloud-engineering","name":"Accenture India","category":"Cloud, Digital & Operations Services","tier":"Core","schedule":"Weekly","specialist":false,"dimensions":{"P":7.3,"R":7.2,"I":8.3,"S":7.4,"M":7.7},"history":[7.1,7.2,7.3,7.35,7.45,7.5,7.48,7.56],"lastPull":"Just now","nextPull":"Next week 02:00","status":"amber","score":7.57},{"id":"facilities","name":"Capgemini India","category":"Application Services & Workplace Support","tier":"Core","schedule":"Manual","specialist":false,"dimensions":{"P":7,"R":6.9,"I":7.3,"S":7.1,"M":7},"history":[6.8,6.9,7,7.05,7.1,7.08,7.02,7.05],"lastPull":"Manual only","nextPull":"Manual only","status":"amber","score":7.07},{"id":"talent-marketplace","name":"Wipro","category":"Engineering Services & Talent Delivery","tier":"Specialist","schedule":"Weekly","specialist":true,"dimensions":{"P":7.1,"R":6.8,"I":7.9,"S":7,"M":8.5},"history":[7,7.1,7.2,7.35,7.45,7.6,7.65,7.7],"lastPull":"Just now","nextPull":"Next week 02:00","status":"amber","score":7.69},{"id":"procurement-platform","name":"Cognizant India","category":"Digital Operations & Platform Services","tier":"Strategic","schedule":"Daily","specialist":false,"dimensions":{"P":8,"R":7.8,"I":8,"S":8.2,"M":7.9},"history":[7.6,7.7,7.8,7.95,8.05,8,8.12,8.05],"lastPull":"Just now","nextPull":"Tomorrow 02:00","status":"green","score":8}],"sources":[{"id":1,"name":"Coupa Spend Export","url":"https://coupa.example/internal-export","category":"Internal System","confidence":"High","trustScore":92,"active":true,"notes":"Spend, PO, invoice exception, supplier and contract data."},{"id":2,"name":"LittleBig Mission Feed","url":"https://littlebigconnection.example/internal-feed","category":"Internal System","confidence":"High","trustScore":88,"active":true,"notes":"Mission, milestone, staffing and services delivery evidence."},{"id":3,"name":"Vendor Master","url":"https://internal.example/vendor-master","category":"Internal System","confidence":"High","trustScore":91,"active":true,"notes":"Vendor identity, ownership, category, region and tier controls."},{"id":4,"name":"Internal SLA Review","url":"https://internal.example/sla-review","category":"Internal System","confidence":"High","trustScore":90,"active":true,"notes":"SLA, MTTR, CSAT and operational performance evidence."},{"id":5,"name":"Approved Market Intelligence","url":"https://market.example/vendor-intelligence","category":"Industry Benchmark","confidence":"Medium","trustScore":76,"active":true,"notes":"Curated market context and vendor/category intelligence."},{"id":6,"name":"LinkedIn Workforce Intelligence","url":"https://linkedin.com","category":"Workforce Intelligence","confidence":"Medium","trustScore":72,"active":true,"notes":"Hiring, attrition, leadership and capability movement signals."},{"id":7,"name":"Economic Times","url":"https://economictimes.indiatimes.com","category":"Financial News","confidence":"Medium","trustScore":70,"active":true,"notes":"India business and market news requiring vendor-specific relevance checks."},{"id":8,"name":"NASSCOM Reports","url":"https://nasscom.in","category":"Industry Benchmark","confidence":"Medium","trustScore":74,"active":true,"notes":"Technology services market benchmarks and industry trend context."},{"id":9,"name":"Moneycontrol","url":"https://moneycontrol.com","category":"Financial News","confidence":"Medium","trustScore":68,"active":true,"notes":"Financial and company news used only after vendor-specific filtering."},{"id":10,"name":"Business Standard","url":"https://business-standard.com","category":"Business News","confidence":"Medium","trustScore":67,"active":true,"notes":"Business news context subject to relevance and confidence gates."},{"id":11,"name":"EPFO / Regulatory Data","url":"https://epfindia.gov.in","category":"Regulatory","confidence":"Medium","trustScore":73,"active":false,"notes":"Regulatory/workforce compliance context; inactive until access and policy are approved."}],"signals":[{"id":5024,"vendorId":"procurement-platform","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Invoice exception pocket requires review","summary":"Coupa-style controls show 4.9% invoice exception rate on platform support invoices, above the 3.0% tolerance, driven by 17 missing PO references.","type":"Financial","signalType":"Financial","sentiment":"Negative","dimension":"S","confidence":80,"impact":5,"status":"pending","aiProvider":"rules","aiExplanation":"Invoice exception rate and PO-reference gaps reduce Score & Value until corrected.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5023,"vendorId":"procurement-platform","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Platform incident MTTR improves","summary":"Mean time to resolve P2 platform incidents improved from 9.4 hours to 6.8 hours, while repeat incident count reduced from 11 to 5 over the same monthly window.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"I","confidence":88,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"MTTR improvement and repeat incident reduction strengthen Integration.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5022,"vendorId":"procurement-platform","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Digital operations SLA consistently above target","summary":"Cognizant India delivered 98.6% operations SLA attainment across 61 queues, exceeding the 97.0% threshold for three consecutive months.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"P","confidence":92,"impact":7,"status":"pending","aiProvider":"rules","aiExplanation":"Sustained SLA over target strengthens Performance.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5021,"vendorId":"talent-marketplace","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Attrition in specialist pod remains elevated","summary":"Specialist engineering pod attrition is 18.5% annualized versus a 12.0% target, with replacement lead time averaging 32 days for automation engineers.","type":"People","signalType":"People","sentiment":"Negative","dimension":"P","confidence":82,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"High attrition and replacement lead time affect continuity and Performance.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5020,"vendorId":"talent-marketplace","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Automation delivery improves ticket effort","summary":"Wipro automation release reduced manual L2 ticket handling by 22% across the pilot queue, saving an estimated 118 analyst hours in the last 30 days.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"S","confidence":84,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"Quantified effort reduction improves Score & Value.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5019,"vendorId":"talent-marketplace","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Engineering capacity fill rate below plan","summary":"Wipro filled 18 of 25 requested engineering roles within the 21-day SLA, a 72% fill rate versus the 85% target; four open roles are in API and automation skill areas.","type":"People","signalType":"People","sentiment":"Negative","dimension":"M","confidence":86,"impact":7,"status":"pending","aiProvider":"rules","aiExplanation":"Fill-rate gap and niche skill shortages reduce Market Fit for specialist delivery.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5018,"vendorId":"facilities","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Knowledge-transfer completion improves","summary":"Capgemini India completed 86% of planned knowledge-transfer artifacts, up from 71% last month, reducing single-person dependency count from 12 to 6 services.","type":"Risk","signalType":"Risk","sentiment":"Positive","dimension":"R","confidence":78,"impact":5,"status":"pending","aiProvider":"rules","aiExplanation":"Reduced dependency count lowers operational risk exposure.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5017,"vendorId":"facilities","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Workplace support CSAT below target","summary":"Internal CSAT sampling for workplace support scored 3.8/5.0 against a 4.2 target across 146 responses, with recurring comments on turnaround time for access and device requests.","type":"Operational","signalType":"Operational","sentiment":"Negative","dimension":"P","confidence":79,"impact":5,"status":"pending","aiProvider":"rules","aiExplanation":"CSAT shortfall affects Performance and may require operational remediation.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5016,"vendorId":"facilities","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Application support backlog within tolerance","summary":"Capgemini India closed 428 support tickets this month with 93.4% within SLA against a 92.0% threshold; aged backlog older than 10 days fell from 31 to 18 tickets.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"P","confidence":84,"impact":5,"status":"pending","aiProvider":"rules","aiExplanation":"Ticket closure volume and SLA compliance support Performance.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5015,"vendorId":"cloud-engineering","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Cloud cost optimization opportunity identified","summary":"FinOps review indicates INR 42 lakh annualized savings potential from reserved capacity and idle-resource cleanup, with 63% of recommendations already technically approved.","type":"Financial","signalType":"Financial","sentiment":"Positive","dimension":"S","confidence":85,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"Quantified savings opportunity maps to Score & Value and should be tracked through realization.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5014,"vendorId":"cloud-engineering","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"API uptime remains above service threshold","summary":"Integration monitoring shows 99.72% API availability across 18 connected services versus a 99.50% threshold, with P1 incident count stable at zero for the month.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"I","confidence":90,"impact":7,"status":"pending","aiProvider":"rules","aiExplanation":"API availability and incident stability strengthen Integration.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5013,"vendorId":"cloud-engineering","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Cloud migration sprint behind by 6 days","summary":"Accenture India completed 22 of 28 planned cloud migration tasks this sprint; six tasks slipped by an average of 6.1 days, mainly in environment readiness and security sign-off.","type":"Operational","signalType":"Operational","sentiment":"Negative","dimension":"P","confidence":83,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"Task completion ratio and average delay reduce Performance until recovery is confirmed.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5012,"vendorId":"globex","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Remediation staffing recovery plan submitted","summary":"KPMG India proposed adding 5 FTEs for the remediation pod and reducing backlog aging below 30 days by 31 July 2026; plan requires validation by the vendor owner.","type":"People","signalType":"People","sentiment":"Positive","dimension":"M","confidence":72,"impact":4,"status":"pending","aiProvider":"rules","aiExplanation":"Recovery staffing plan may improve Market Fit, but confidence remains medium until execution is visible.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5011,"vendorId":"globex","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"SLA breach trend over two cycles","summary":"Managed compliance operations recorded 91.6% SLA attainment against a 95.0% target for two consecutive months, with 14 late cases and average breach aging of 3.2 business days.","type":"Operational","signalType":"Operational","sentiment":"Negative","dimension":"P","confidence":88,"impact":7,"status":"pending","aiProvider":"rules","aiExplanation":"Repeated SLA underperformance maps to Performance and should trigger owner action.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5010,"vendorId":"globex","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Compliance evidence aging beyond threshold","summary":"KPMG India has 7 of 19 compliance evidence items older than 45 days, exceeding the 20% aging threshold; two items relate to access-control review evidence.","type":"Risk","signalType":"Risk","sentiment":"Negative","dimension":"R","confidence":90,"impact":8,"status":"pending","aiProvider":"rules","aiExplanation":"Evidence aging and access-control items create a high-confidence Risk Profile signal.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5009,"vendorId":"sabrelink","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Change-request backlog needs governance","summary":"Project controls show 23 open change requests, 9 older than 21 days, with estimated commercial exposure of INR 24 lakh if scope decisions are delayed another cycle.","type":"Risk","signalType":"Risk","sentiment":"Negative","dimension":"R","confidence":81,"impact":5,"status":"pending","aiProvider":"rules","aiExplanation":"Aged change requests and unresolved exposure increase governance and commercial risk.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5008,"vendorId":"sabrelink","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Specialist architecture bench improves","summary":"LittleBig-style capacity signal shows 11 certified integration architects available within 14 days, compared with 7 last month, improving specialist capacity coverage from 72% to 91%.","type":"People","signalType":"People","sentiment":"Positive","dimension":"M","confidence":87,"impact":7,"status":"pending","aiProvider":"rules","aiExplanation":"Certified specialist availability improves Market Fit for specialist delivery.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5007,"vendorId":"sabrelink","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Integration sprint velocity exceeds plan","summary":"Deloitte India closed 31 integration user stories against a plan of 27, with API defect leakage at 1.9% versus the 3.0% threshold for the travel platform workstream.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"I","confidence":92,"impact":8,"status":"pending","aiProvider":"rules","aiExplanation":"Sprint velocity and API defect leakage are strong Integration indicators, especially for specialist technology work.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5006,"vendorId":"infosys","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Invoice first-pass match improves","summary":"Coupa-style invoice controls show first-pass match improved to 94.1% across 312 invoices, reducing manual finance touches by an estimated 37 cases this month.","type":"Financial","signalType":"Financial","sentiment":"Positive","dimension":"S","confidence":89,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"Invoice match rate and reduced manual effort improve Score & Value.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5005,"vendorId":"infosys","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Tax advisory dependency concentration rising","summary":"Internal demand data shows 62% of open tax advisory requests now routed to EY India, up from 48% last quarter, creating concentration exposure for quarter-close support.","type":"Risk","signalType":"Risk","sentiment":"Negative","dimension":"R","confidence":84,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"Concentration exposure affects Risk Profile even when service quality remains acceptable.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5004,"vendorId":"infosys","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Transformation milestone delivery slightly ahead","summary":"EY India completed 14 of 16 transformation milestones on or before planned date, with average slippage reduced to 1.8 days from 4.6 days in the prior quarter.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"P","confidence":86,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"Milestone completion rate and reduced slippage strengthen Performance.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5003,"vendorId":"tcs","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Rate-card variance requires commercial review","summary":"Coupa-style invoice sampling shows 3.4% blended rate-card variance across 186 billed line items, equal to an estimated INR 18.6 lakh quarterly exposure requiring validation before renewal.","type":"Financial","signalType":"Financial","sentiment":"Negative","dimension":"S","confidence":82,"impact":5,"status":"pending","aiProvider":"rules","aiExplanation":"Rate-card variance and estimated exposure map to Score & Value and require commercial validation.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5002,"vendorId":"tcs","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Audit remediation cycle improves","summary":"PwC India closed 18 of 22 open control remediation actions within the agreed 30-day window, improving closure rate to 81.8% versus 68.5% in the previous review cycle.","type":"Risk","signalType":"Risk","sentiment":"Positive","dimension":"R","confidence":88,"impact":6,"status":"pending","aiProvider":"rules","aiExplanation":"Control closure rate and remediation aging directly affect Risk Profile and audit confidence.","createdAt":"2026-06-14T09:30:00.000Z"},{"id":5001,"vendorId":"tcs","source":"GSIL demo evidence pack","sourceName":"GSIL demo evidence pack","title":"Managed services SLA remains above target","summary":"PwC India delivered 97.8% monthly SLA attainment against a 96.0% target across 42 tracked advisory and managed-risk work packages; critical overdue items reduced from 6 to 2 month over month.","type":"Operational","signalType":"Operational","sentiment":"Positive","dimension":"P","confidence":91,"impact":7,"status":"pending","aiProvider":"rules","aiExplanation":"SLA attainment, overdue-item reduction and work-package coverage map to PRISM Performance with high confidence.","createdAt":"2026-06-14T09:30:00.000Z"}],"internalInputs":[{"id":1186,"vendorId":"tcs","dimension":"P","weight":30,"period":"2026-06","evidence":"SLA breach","feedType":"Manual Input","status":"approved","createdAt":"2026-06-10T08:15:53.500Z","createdBy":"Demo Procurement Head","when":"Just now"},{"id":1006,"vendorId":"tcs","dimension":"P","weight":30,"period":"2026-06","evidence":"June CSAT improved to 4.8 and invoice variance closed below threshold.","when":"Just now","createdAt":"2026-06-04T17:29:53.465Z"},{"id":201,"vendorId":"globex","dimension":"P","weight":35,"period":"2026-05","evidence":"SLA breach records added by Operations PMO.","when":"Today 09:14","createdAt":"2026-06-04T17:28:39.499Z"}],"audit":[{"id":7001,"message":"Demo portfolio refreshed with real service-provider names and numeric evidence signals.","actor":"GSIL Demo Admin","metadata":{"scope":"demo-data-refresh"},"createdAt":"2026-06-14T09:35:00.000Z"},{"id":7002,"message":"KPMG India moved into Executive Attention due to repeated SLA and compliance evidence aging signals.","actor":"GSIL Risk Monitor","metadata":{"vendorId":"globex"},"createdAt":"2026-06-14T09:34:00.000Z"},{"id":7003,"message":"Deloitte India marked as Specialist Partner for integration-heavy delivery weighting.","actor":"Procurement Head Demo","metadata":{"vendorId":"sabrelink"},"createdAt":"2026-06-14T09:33:00.000Z"},{"id":7004,"message":"PwC India QBR snapshot generated from SLA, audit remediation, and rate-card variance evidence.","actor":"Procurement Head Demo","metadata":{"vendorId":"tcs"},"createdAt":"2026-06-14T09:32:00.000Z"}],"users":[]};

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
    let db;
    try {
      const response = await originalFetch("data/gsil-db.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Seed database file is not available");
      db = await response.json();
    } catch (error) {
      db = JSON.parse(JSON.stringify(bundledSeedDatabase));
    }
    db = normalizeDatabase(db);
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
