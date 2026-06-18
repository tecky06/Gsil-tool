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
