import * as store from "../lib/store.js";
import { STATUS_LABEL, SYNC_LABEL, fmtTime, highlightJSON, escapeHtml, qs, qsa } from "../lib/ui.js";
import { navigate } from "../lib/router.js";
import { setCrumbs, toast } from "../main.js";

const ALL_METRICS = [
  "Journey Start Rate", "Journey Completion Rate", "Time on Homepage",
  "Homepage-to-Journey Click-Through Rate", "Bounce Rate", "Average Session Duration",
];

export function renderExperimentsList(root) {
  setCrumbs("Experiments");
  const items = store.listExperiments();

  root.innerHTML = `
    <div class="content">
      <div class="page-head">
        <h1>Experiments</h1>
        <button class="pill-btn primary" id="createBtn">Create New</button>
      </div>

      <div class="list-wrap">
        <div class="toolbar">
          <div class="search">🔍 <input type="text" id="searchInput" placeholder="Search by Name" /></div>
          <div class="filters"><button>Columns ▾</button><button>Filters ▾</button></div>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>GrowthBook Sync</th><th>Updated</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
        <div class="pager" id="pager"></div>
      </div>
    </div>
  `;

  function renderRows(filter) {
    const list = filter
      ? items.filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()))
      : items;
    const body = qs(root, "#rows");
    if (list.length === 0) {
      body.innerHTML = `<tr><td colspan="4"><div class="empty-state">No experiments match "${escapeHtml(filter)}"</div></td></tr>`;
    } else {
      body.innerHTML = list.map((e) => `
        <tr data-id="${e.id}">
          <td class="name"><a href="#/experiments/${e.id}">${escapeHtml(e.name)}</a><span class="sub">${e.variants.length} variants</span></td>
          <td><span class="pill ${e.status}">${STATUS_LABEL[e.status]}</span></td>
          <td><span class="pill ${e.sync.status}">${SYNC_LABEL[e.sync.status]}</span></td>
          <td>${fmtTime(e.sync.lastSyncedAt || e.createdAt)}</td>
        </tr>
      `).join("");
    }
    qsa(root, "#rows tr[data-id]").forEach((tr) => {
      tr.addEventListener("click", (ev) => {
        if (ev.target.tagName === "A") return;
        navigate("/experiments/" + tr.getAttribute("data-id"));
      });
    });
    qs(root, "#pager").textContent = `1–${list.length} of ${items.length}   Per Page: 10 ▾`;
  }

  renderRows("");
  qs(root, "#searchInput").addEventListener("input", (e) => renderRows(e.target.value));
  qs(root, "#createBtn").addEventListener("click", () => {
    const exp = store.createExperiment();
    toast("Experiment created");
    navigate("/experiments/" + exp.id);
  });
}

export function renderExperimentDetail(root, id) {
  const exp = store.getExperiment(id);
  if (!exp) {
    root.innerHTML = `<div class="content"><p class="empty-state">Experiment not found. <a href="#/experiments">Back to list</a></p></div>`;
    return;
  }
  setCrumbs(`<a href="#/experiments">Experiments</a> / <b>${escapeHtml(exp.name)}</b>`);

  root.innerHTML = `
    <div class="content">
      <div class="doc-title-row">
        <div class="doc-title" id="titleDisplay" contenteditable="true" spellcheck="false">${escapeHtml(exp.name)}</div>
        <button class="pill-btn danger" id="deleteBtn">Delete</button>
      </div>
      <div class="doc-tabs" id="docTabs">
        <button class="doc-tab-btn active" data-tab="edit">Edit</button>
        <button class="doc-tab-btn" data-tab="versions">Versions<span class="count">${exp.versions.length}</span></button>
        <button class="doc-tab-btn" data-tab="api">API</button>
      </div>

      <div class="subpanel active" id="panel-edit">
        <div class="status-bar">
          <div class="meta" id="statusMeta"></div>
          <div class="actions">
            <button class="pill-btn" id="saveDraftBtn">Save Draft</button>
            <button class="pill-btn primary" id="publishBtn">Publish changes</button>
          </div>
        </div>

        <div class="editor-grid">
          <div>
            <div class="field">
              <label>Hypothesis</label>
              <textarea id="f-hypothesis">${escapeHtml(exp.hypothesis)}</textarea>
              <div class="hint">What are we testing, and what do we expect to happen?</div>
            </div>

            <hr class="section-divider" />
            <div class="section-heading">Variants <span style="font-weight:400;color:var(--ink-faint);font-size:0.8rem;">— name, traffic split, and description are all editable</span></div>
            <div id="variantsList"></div>
            <button class="pill-btn" id="addVariantBtn" style="margin-top:4px;">+ Add variant</button>

            <hr class="section-divider" />
            <div class="section-heading">Metrics</div>
            <div class="field">
              <label>Primary goal metric</label>
              <select id="f-primary-metric"></select>
            </div>
            <div class="field">
              <label>Secondary metrics</label>
              <div class="chip-row" id="secondaryMetrics"></div>
            </div>

            <hr class="section-divider" />
            <div class="section-heading">Analysis settings</div>
            <div class="two-col-fields">
              <div class="field">
                <label>Difference type</label>
                <select id="f-difftype"><option>Relative</option><option>Absolute</option></select>
              </div>
              <div class="field">
                <label>Dimension</label>
                <select id="f-dimension"><option>None</option><option>Device Type</option><option>Geography</option><option>New vs. Returning</option></select>
              </div>
            </div>

            <hr class="section-divider" />
            <div class="section-heading">Content this applies to</div>
            <div id="appliesToRows"></div>
            <select class="add-select" id="addAppliesTo" style="margin-top:4px;"></select>

            <hr class="section-divider" />
            <div class="section-heading">Results <span style="font-weight:400;color:var(--ink-faint);font-size:0.8rem;">— pulled from GrowthBook, read-only</span></div>
            <div id="resultsPanel"></div>
          </div>

          <div>
            <div class="side-block">
              <div class="section-heading">Status</div>
              <select id="f-status">
                ${Object.keys(STATUS_LABEL).filter((k) => k !== "published").map((k) => `<option value="${k}"${k === exp.status ? " selected" : ""}>${STATUS_LABEL[k]}</option>`).join("")}
              </select>
            </div>

            <div class="side-block">
              <label style="font-size:0.86rem; display:block; margin-bottom:8px;">Linked feature flag</label>
              <input type="text" id="f-linked-feature" value="${escapeHtml(exp.linkedFeature || "")}" />
              <div class="hint">Which Feature Flag this experiment's traffic is served through</div>
            </div>

            <div class="side-block">
              <div class="section-heading">GrowthBook Sync</div>
              <div class="sync-status-row"><span class="label">Status</span><span class="pill" id="syncPill"></span></div>
              <div class="sync-meta">Key: <code id="syncKey"></code></div>
              <div class="sync-meta">Last synced: <span id="syncTime"></span></div>
              <div class="sync-message" id="syncMessage"></div>
              <button class="pill-btn primary sync-btn" type="button" id="syncBtn">Sync to GrowthBook</button>
            </div>
          </div>
        </div>
      </div>

      <div class="subpanel" id="panel-versions">
        <table class="versions-table">
          <thead><tr><th>Modified</th><th>Modified by</th><th>Status</th></tr></thead>
          <tbody id="versionsBody"></tbody>
        </table>
      </div>

      <div class="subpanel" id="panel-api">
        <div class="api-url-bar"><span class="verb">GET</span><code>/admin-api/experiments/${exp.id}</code></div>
        <div class="json-viewer" id="apiJson"></div>
      </div>

      <p class="proto-note">Fields, list, and status chrome are styled to match this project's actual Payload admin (captured directly from the running instance). Changes here really do persist — in your browser's local storage — so edits, new experiments, and deletions all survive a page reload.</p>
    </div>
  `;

  // ---- title (contenteditable) ----
  qs(root, "#titleDisplay").addEventListener("blur", (e) => {
    const v = e.target.textContent.trim() || "Untitled experiment";
    store.updateExperiment(exp.id, { name: v });
    setCrumbs(`<a href="#/experiments">Experiments</a> / <b>${escapeHtml(v)}</b>`);
  });

  qs(root, "#deleteBtn").addEventListener("click", () => {
    if (confirm(`Delete "${exp.name}"? This can't be undone.`)) {
      store.deleteExperiment(exp.id);
      toast("Experiment deleted");
      navigate("/experiments");
    }
  });

  function renderStatusMeta() {
    qs(root, "#statusMeta").innerHTML =
      `<span>Status: <b>${STATUS_LABEL[exp.status]}</b></span>` +
      `<span>Last Modified: <b>${exp.versions[0] ? escapeHtml(exp.versions[0].date) : "—"}</b></span>` +
      `<span>Created: <b>${fmtTime(exp.createdAt)}</b></span>`;
  }
  renderStatusMeta();

  qs(root, "#f-hypothesis").addEventListener("input", (e) => store.updateExperiment(exp.id, { hypothesis: e.target.value }));
  qs(root, "#f-linked-feature").addEventListener("input", (e) => store.updateExperiment(exp.id, { linkedFeature: e.target.value }));
  qs(root, "#f-status").addEventListener("change", (e) => { exp.status = e.target.value; store.updateExperiment(exp.id, { status: e.target.value }); renderStatusMeta(); });

  // ---- variants ----
  function renderVariants() {
    qs(root, "#variantsList").innerHTML = exp.variants.map((v, i) => `
      <div class="variant-row" data-i="${i}">
        <div class="vmain">
          <input class="vname" type="text" value="${escapeHtml(v.name)}" data-field="name" />
          <textarea class="vdesc" rows="1" data-field="description" placeholder="Description (optional)">${escapeHtml(v.description || "")}</textarea>
        </div>
        <button class="control-chip" data-action="control" title="Mark as control">${v.isControl ? "CONTROL" : "Make control"}</button>
        <span class="vweight"><input type="text" value="${v.weight}" data-field="weight" size="2" />%</span>
        <span class="vremove" data-action="remove" title="Remove variant">×</span>
      </div>
    `).join("");

    qsa(root, "#variantsList .variant-row").forEach((rowEl) => {
      const i = Number(rowEl.getAttribute("data-i"));
      qs(rowEl, '[data-field="name"]').addEventListener("input", (e) => { exp.variants[i].name = e.target.value; store.updateExperiment(exp.id, { variants: exp.variants }); });
      qs(rowEl, '[data-field="description"]').addEventListener("input", (e) => { exp.variants[i].description = e.target.value; store.updateExperiment(exp.id, { variants: exp.variants }); });
      qs(rowEl, '[data-field="weight"]').addEventListener("input", (e) => { exp.variants[i].weight = Number(e.target.value) || 0; store.updateExperiment(exp.id, { variants: exp.variants }); });
      qs(rowEl, '[data-action="control"]').addEventListener("click", () => {
        exp.variants.forEach((v, j) => (v.isControl = j === i));
        store.updateExperiment(exp.id, { variants: exp.variants });
        renderVariants();
      });
      qs(rowEl, '[data-action="remove"]').addEventListener("click", () => {
        if (exp.variants.length <= 2) { toast("An experiment needs at least 2 variants"); return; }
        exp.variants.splice(i, 1);
        store.updateExperiment(exp.id, { variants: exp.variants });
        renderVariants();
      });
    });
  }
  renderVariants();
  qs(root, "#addVariantBtn").addEventListener("click", () => {
    exp.variants.push({ name: "New variant", isControl: false, weight: 0, description: "" });
    store.updateExperiment(exp.id, { variants: exp.variants });
    renderVariants();
  });

  // ---- metrics ----
  const primarySel = qs(root, "#f-primary-metric");
  primarySel.innerHTML = ALL_METRICS.map((m) => `<option${m === exp.metrics.primary ? " selected" : ""}>${escapeHtml(m)}</option>`).join("");
  primarySel.addEventListener("change", (e) => { exp.metrics.primary = e.target.value; store.updateExperiment(exp.id, { metrics: exp.metrics }); });

  function renderSecondary() {
    qs(root, "#secondaryMetrics").innerHTML =
      exp.metrics.secondary.map((m, i) => `<span class="chip" data-i="${i}">${escapeHtml(m)} <span class="rm">×</span></span>`).join("") +
      `<span class="chip add" id="addMetricChip">+ Add metric</span>`;
    qsa(root, "#secondaryMetrics .chip[data-i] .rm").forEach((rm, i) => {
      rm.addEventListener("click", () => { exp.metrics.secondary.splice(i, 1); store.updateExperiment(exp.id, { metrics: exp.metrics }); renderSecondary(); });
    });
    qs(root, "#addMetricChip").addEventListener("click", () => {
      const choice = ALL_METRICS.find((m) => !exp.metrics.secondary.includes(m) && m !== exp.metrics.primary);
      if (!choice) { toast("No more metrics to add"); return; }
      exp.metrics.secondary.push(choice);
      store.updateExperiment(exp.id, { metrics: exp.metrics });
      renderSecondary();
    });
  }
  renderSecondary();

  qs(root, "#f-difftype").value = exp.analysis.differenceType;
  qs(root, "#f-dimension").value = exp.analysis.dimension;
  qs(root, "#f-difftype").addEventListener("change", (e) => { exp.analysis.differenceType = e.target.value; store.updateExperiment(exp.id, { analysis: exp.analysis }); });
  qs(root, "#f-dimension").addEventListener("change", (e) => { exp.analysis.dimension = e.target.value; store.updateExperiment(exp.id, { analysis: exp.analysis }); });

  // ---- appliesTo (relationship to journeys) ----
  function renderAppliesTo() {
    qs(root, "#appliesToRows").innerHTML = exp.appliesTo.length
      ? exp.appliesTo.map((a, i) => `
        <div class="rel-row" data-i="${i}">
          <span><span class="kind">${escapeHtml(a.kind)}</span>${escapeHtml(a.name)}</span>
          <span class="rm" data-action="remove">×</span>
        </div>`).join("")
      : `<div class="hint" style="margin-top:0;">Not linked to any content yet.</div>`;
    qsa(root, "#appliesToRows .rm").forEach((rm, i) => {
      rm.addEventListener("click", () => { exp.appliesTo.splice(i, 1); store.updateExperiment(exp.id, { appliesTo: exp.appliesTo }); renderAppliesTo(); });
    });

    const journeys = store.listJourneys().filter((j) => !exp.appliesTo.some((a) => a.kind === "journey" && a.id === j.id));
    const addSel = qs(root, "#addAppliesTo");
    addSel.innerHTML = `<option value="">+ Link a journey…</option>` + journeys.map((j) => `<option value="${j.id}">${escapeHtml(j.title)}</option>`).join("");
    addSel.onchange = () => {
      if (!addSel.value) return;
      const j = store.getJourney(addSel.value);
      exp.appliesTo.push({ kind: "journey", id: j.id, name: j.title });
      store.updateExperiment(exp.id, { appliesTo: exp.appliesTo });
      renderAppliesTo();
    };
  }
  renderAppliesTo();

  // ---- results ----
  function renderResults() {
    const el = qs(root, "#resultsPanel");
    const results = exp.results;
    if (!results.available) {
      el.innerHTML = `<div class="hint" style="margin-top:0;">${escapeHtml(results.reason)}</div>`;
      return;
    }
    const maxRate = Math.max(...results.rows.map((r) => r.rateNum));
    const chartRows = results.rows.map((r) => {
      const pct = Math.round((r.rateNum / maxRate) * 100);
      const fillClass = r.winner ? "winner" : r.isControl ? "control" : "";
      return `<div class="gb-chart-row">
        <div class="gb-chart-label"><span class="n">${escapeHtml(r.name)}${r.winner ? ' <span class="pill winner">Winner</span>' : ""}</span><span class="v">${r.rateNum}%</span></div>
        <div class="gb-chart-track"><div class="gb-chart-fill ${fillClass}" style="width:${pct}%"></div></div>
      </div>`;
    }).join("");
    const tableRows = results.rows.map((r) => `
      <tr><td class="var-name">${escapeHtml(r.name)}${r.winner ? ' <span class="pill winner">Winner</span>' : ""}</td>
      <td class="metric">${r.visitors.toLocaleString()}</td><td class="metric">${r.rateNum}%</td><td class="metric">${r.lift}</td></tr>`).join("");
    el.innerHTML = `
      <div class="gb-chart"><div class="gb-chart-title">Conversion rate by variant</div>${chartRows}</div>
      <table class="results-table"><thead><tr><th>Variant</th><th>Visitors</th><th>Conv. rate</th><th>Lift vs. control</th></tr></thead><tbody>${tableRows}</tbody></table>
      <div class="results-source"><span>${results.visitors.toLocaleString()} total visitors assigned · ${escapeHtml(results.confidence)}</span>
      <button class="refresh-btn" type="button" id="refreshResultsBtn">Refresh from GrowthBook</button></div>
    `;
    const btn = document.getElementById("refreshResultsBtn");
    if (btn) btn.addEventListener("click", () => toast("Demo mode — results would re-fetch from GrowthBook here"));
  }
  renderResults();

  // ---- sync panel ----
  function renderSync() {
    qs(root, "#syncPill").className = "pill " + exp.sync.status;
    qs(root, "#syncPill").textContent = SYNC_LABEL[exp.sync.status];
    qs(root, "#syncKey").textContent = exp.sync.key || "—";
    qs(root, "#syncTime").textContent = fmtTime(exp.sync.lastSyncedAt);
    qs(root, "#syncMessage").textContent = exp.sync.message;
  }
  renderSync();
  qs(root, "#syncBtn").addEventListener("click", async () => {
    const btn = qs(root, "#syncBtn");
    btn.disabled = true; btn.textContent = "Syncing...";
    exp.sync = { status: "syncing", key: exp.sync.key, lastSyncedAt: exp.sync.lastSyncedAt, message: "Contacting GrowthBook..." };
    renderSync();

    const result = await store.syncExperimentToGrowthBook(exp.id);
    Object.assign(exp, store.getExperiment(exp.id));
    renderSync();
    btn.disabled = false; btn.textContent = "Sync to GrowthBook";
    toast(result.status === "synced" ? "Synced to GrowthBook" : result.status === "error" ? "Sync failed — see message below" : "Synced (demo mode)");
  });

  // ---- save draft / publish ----
  qs(root, "#saveDraftBtn").addEventListener("click", () => {
    store.addExperimentVersion(exp.id, "draft");
    Object.assign(exp, store.getExperiment(exp.id));
    renderStatusMeta(); renderVersions();
    toast("Draft saved");
  });
  qs(root, "#publishBtn").addEventListener("click", () => {
    store.updateExperiment(exp.id, { status: exp.status === "draft" ? "live" : exp.status });
    store.addExperimentVersion(exp.id, exp.status, "You");
    Object.assign(exp, store.getExperiment(exp.id));
    qs(root, "#f-status").value = exp.status;
    renderStatusMeta(); renderVersions();
    toast("Published");
  });

  // ---- versions tab ----
  function renderVersions() {
    qs(root, "#versionsBody").innerHTML = exp.versions.map((v) => `
      <tr><td>${escapeHtml(v.date)}${v.current ? ' <span class="current-tag">CURRENT</span>' : ""}</td>
      <td>${escapeHtml(v.by)}</td><td><span class="pill ${v.status}">${STATUS_LABEL[v.status]}</span></td></tr>`).join("");
    const countEl = qs(root, "#docTabs button[data-tab=versions] .count");
    if (countEl) countEl.textContent = exp.versions.length;
  }
  renderVersions();

  // ---- API tab ----
  function renderApi() {
    const doc = {
      id: exp.id, name: exp.name, status: exp.status, hypothesis: exp.hypothesis, linkedFeature: exp.linkedFeature,
      variants: exp.variants.map((v) => ({ name: v.name, isControl: !!v.isControl, weight: v.weight })),
      metrics: exp.metrics, analysis: exp.analysis,
      appliesTo: exp.appliesTo.map((a) => `${a.kind}:${a.name}`),
      growthbook: { syncStatus: exp.sync.status, key: exp.sync.key, lastSyncedAt: exp.sync.lastSyncedAt, lastMessage: exp.sync.message },
      updatedAt: exp.versions[0]?.date, createdAt: exp.createdAt,
    };
    qs(root, "#apiJson").innerHTML = highlightJSON(doc, 0);
  }
  renderApi();

  // ---- doc tabs ----
  qsa(root, "#docTabs .doc-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa(root, "#docTabs .doc-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      ["edit", "versions", "api"].forEach((t) => qs(root, "#panel-" + t).classList.toggle("active", t === btn.getAttribute("data-tab")));
      if (btn.getAttribute("data-tab") === "api") renderApi();
    });
  });
}
