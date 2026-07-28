import * as store from "../lib/store.js";
import { SYNC_LABEL, fmtTime, escapeHtml, qs, qsa } from "../lib/ui.js";
import { navigate } from "../lib/router.js";
import { setCrumbs, toast } from "../main.js";

function envChips(envs) {
  return Object.keys(envs).map((name) => {
    const on = envs[name];
    return `<span class="pill ${on ? "synced" : "not_synced"}" style="margin-right:4px;">${name.slice(0, 3)}</span>`;
  }).join("");
}

export function renderFlagsList(root) {
  setCrumbs("Feature Flags");
  const items = store.listFlags();

  root.innerHTML = `
    <div class="content">
      <div class="page-head">
        <h1>Feature Flags</h1>
        <button class="pill-btn primary" id="createBtn">Create New</button>
      </div>
      <div class="list-wrap">
        <div class="toolbar">
          <div class="search">🔍 <input type="text" id="searchInput" placeholder="Search by Key" /></div>
          <div class="filters"><button>Columns ▾</button><button>Filters ▾</button></div>
        </div>
        <table>
          <thead><tr><th>Key</th><th>Type</th><th>Environments</th><th>Default</th><th>Updated</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
        <div class="pager" id="pager"></div>
      </div>
    </div>
  `;

  function renderRows(filter) {
    const list = filter ? items.filter((f) => f.key.toLowerCase().includes(filter.toLowerCase())) : items;
    qs(root, "#rows").innerHTML = list.length
      ? list.map((f) => `
        <tr data-key="${escapeHtml(f.key)}">
          <td class="name"><a href="#/feature-flags/${encodeURIComponent(f.key)}" style="font-family:ui-monospace, monospace; font-size:0.84rem;">${escapeHtml(f.key)}</a></td>
          <td>${f.type}</td>
          <td>${envChips(f.environments)}</td>
          <td><code>${escapeHtml(f.defaultValue)}</code></td>
          <td>${fmtTime(f.updatedAt)}</td>
        </tr>`).join("")
      : `<tr><td colspan="5"><div class="empty-state">No feature flags match "${escapeHtml(filter)}"</div></td></tr>`;
    qsa(root, "#rows tr[data-key]").forEach((tr) => {
      tr.addEventListener("click", (ev) => {
        if (ev.target.tagName === "A") return;
        navigate("/feature-flags/" + encodeURIComponent(tr.getAttribute("data-key")));
      });
    });
    qs(root, "#pager").textContent = `1–${list.length} of ${items.length}   Per Page: 10 ▾`;
  }

  renderRows("");
  qs(root, "#searchInput").addEventListener("input", (e) => renderRows(e.target.value));
  qs(root, "#createBtn").addEventListener("click", () => {
    const flag = store.createFlag();
    toast("Feature flag created");
    navigate("/feature-flags/" + encodeURIComponent(flag.key));
  });
}

export function renderFlagDetail(root, key) {
  const flag = store.getFlag(key);
  if (!flag) {
    root.innerHTML = `<div class="content"><p class="empty-state">Feature flag not found. <a href="#/feature-flags">Back to list</a></p></div>`;
    return;
  }
  setCrumbs(`<a href="#/feature-flags">Feature Flags</a> / <b>${escapeHtml(flag.key)}</b>`);

  root.innerHTML = `
    <div class="content">
      <div class="doc-title-row">
        <div class="doc-title" style="font-family:ui-monospace, monospace; font-size:1.5rem;" id="keyDisplay" contenteditable="true" spellcheck="false">${escapeHtml(flag.key)}</div>
        <button class="pill-btn danger" id="deleteBtn">Delete</button>
      </div>
      <div class="status-bar">
        <div class="meta"><span>Type: <b>${flag.type}</b></span><span>Updated: <b>${fmtTime(flag.updatedAt)}</b></span></div>
        <div class="actions"><button class="pill-btn" disabled>Save Draft</button><button class="pill-btn primary" id="publishBtn">Publish changes</button></div>
      </div>

      <div class="editor-grid">
        <div>
          <div class="field"><label>Description</label><textarea id="f-description">${escapeHtml(flag.description)}</textarea></div>
          <div class="two-col-fields">
            <div class="field"><label>Value type</label>
              <select id="f-type"><option>Boolean</option><option>String</option><option>Number</option><option>JSON</option></select>
            </div>
            <div class="field"><label>Default value</label><input type="text" id="f-default" value="${escapeHtml(flag.defaultValue)}" /></div>
          </div>

          <hr class="section-divider" />
          <div class="section-heading">Environments</div>
          <div id="envRows"></div>
        </div>

        <div>
          <div class="side-block">
            <div class="section-heading">Linked experiment</div>
            <div id="linkedExpBlock"></div>
          </div>
          <div class="side-block">
            <div class="section-heading">GrowthBook Sync</div>
            <div class="sync-status-row"><span class="label">Status</span><span class="pill ${flag.syncStatus}">${SYNC_LABEL[flag.syncStatus]}</span></div>
            <div class="sync-meta">Key: <code>${escapeHtml(flag.key)}</code></div>
          </div>
        </div>
      </div>

      <p class="proto-note">Feature Flags are the runtime switches GrowthBook's SDK reads at request time. An experiment is usually served <em>through</em> a linked flag — but a flag can also stand alone, with no experiment attached at all.</p>
    </div>
  `;

  qs(root, "#keyDisplay").addEventListener("blur", (e) => {
    const newKey = e.target.textContent.trim();
    if (!newKey || newKey === flag.key) { e.target.textContent = flag.key; return; }
    if (!store.renameFlagKey(flag.key, newKey)) { toast("That key is already in use"); e.target.textContent = flag.key; return; }
    navigate("/feature-flags/" + encodeURIComponent(newKey));
  });

  qs(root, "#deleteBtn").addEventListener("click", () => {
    if (confirm(`Delete "${flag.key}"? This can't be undone.`)) {
      store.deleteFlag(flag.key);
      toast("Feature flag deleted");
      navigate("/feature-flags");
    }
  });

  qs(root, "#f-description").addEventListener("input", (e) => store.updateFlag(flag.key, { description: e.target.value }));
  qs(root, "#f-type").value = flag.type;
  qs(root, "#f-type").addEventListener("change", (e) => store.updateFlag(flag.key, { type: e.target.value }));
  qs(root, "#f-default").addEventListener("input", (e) => store.updateFlag(flag.key, { defaultValue: e.target.value }));
  qs(root, "#publishBtn").addEventListener("click", () => { store.updateFlag(flag.key, {}); toast("Published"); });

  function renderEnvRows() {
    qs(root, "#envRows").innerHTML = Object.keys(flag.environments).map((name) => {
      const on = flag.environments[name];
      return `<div class="env-row"><span class="ename">${name}</span>
        <button type="button" class="etoggle" data-env="${name}"><span class="env-switch${on ? " on" : ""}"></span>${on ? "Enabled" : "Disabled"}</button></div>`;
    }).join("");
    qsa(root, "#envRows .etoggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        store.toggleFlagEnvironment(flag.key, btn.getAttribute("data-env"));
        Object.assign(flag, store.getFlag(flag.key));
        renderEnvRows();
      });
    });
  }
  renderEnvRows();

  const linkedExp = flag.linkedExperimentId ? store.getExperiment(flag.linkedExperimentId) : null;
  qs(root, "#linkedExpBlock").innerHTML = linkedExp
    ? `<div class="rel-row"><span>${escapeHtml(linkedExp.name)}</span><a class="link-btn" href="#/experiments/${linkedExp.id}">View →</a></div>`
    : `<div class="hint" style="margin-top:0;">No experiment attached — this flag is a standalone rollout switch.</div>`;
}
