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
    setActiveView("signals");
    toast("Demo task flow starts from a signal or connector card");
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
  on("#simulateFailureBtn", "click", () => toast("Demo failure already visible in Failed Feed Queue"));
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
    action("Low confidence signals rejected", () => api.bulkSignals("reject-low"));
  });
  $("#vendorForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireUiPermission("vendor:write", "Only Admin and Procurement Head can add vendors.")) return;
    const vendor = {
      name: $("#vendorName").value.trim(),
      category: $("#vendorCategory").value.trim(),
      tier: $("#vendorTier").value,
      schedule: $("#vendorSchedule").value,
      specialist: $("#vendorSpecialist").checked
    };
    action("New vendor added", () => api.addVendor(vendor)).then(async (result) => {
      event.target.reset();
      if (result?.state) return;
      if (result?.vendor) {
        state.vendors = [
          result.vendor,
          ...state.vendors.filter((item) => item.id !== result.vendor.id)
        ];
        renderSelects();
        renderAll();
        setActiveView("vendors");
        toast(`${result.vendor.name} is now visible in Vendors`);
        return;
      }
      await refresh();
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
  $("#internalForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireUiPermission("internal:write", "Only Admin, Analyst, and Finance Controller can add internal evidence.")) return;
    const input = {
      vendorId: $("#internalVendor").value,
      dimension: $("#internalDimension").value,
      weight: Number($("#internalWeight").value),
      period: $("#internalPeriod").value,
      evidence: $("#internalEvidence").value.trim()
    };
    action("Internal input saved and score recalculated", () => api.addInternalInput(input)).then(() => {
      $("#internalEvidence").value = "";
    });
  });
  on("#qbrBtn", "click", async () => {
    if (!requireUiPermission("qbr:write", "This role cannot generate QBR snapshots in the demo.")) return;
    const selectedVendor = $("#qbrVendor")?.value || $("#historyVendor").value || $("#historyVendor").selectedOptions?.[0]?.value || state.vendors[0]?.id || "";
    const vendorId = selectedVendor || null;
    const result = await action("", () => api.qbr(vendorId));
    renderQbrSnapshot(result.snapshot);
    toast(`QBR snapshot ready for ${result.snapshot.vendor} at ${result.snapshot.score.toFixed(1)}`);
