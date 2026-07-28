import * as store from "../lib/store.js";
import { SEGMENT_CATEGORIES, RULE_OPERATORS } from "../lib/store.js";
import { escapeHtml, highlightJSON, qs, qsa } from "../lib/ui.js";
import { navigate } from "../lib/router.js";
import { setCrumbs, toast } from "../main.js";

export function renderSegmentsList(root) {
  setCrumbs("Segments");
  const items = store.listSegments();

  root.innerHTML = `
    <div class="content">
      <div class="page-head">
        <h1>Segments</h1>
        <button class="pill-btn primary" id="createBtn">Create New</button>
      </div>
      <p class="proto-note" style="margin-top:0;">A segment defines <em>who</em> — geography, device, network, referral/campaign — not what they see. Reference a segment from a personalized content block's assignment policy to decide which variant that population gets.</p>
      <div class="list-wrap">
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Rule</th><th>Used by</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
        <div class="pager" id="pager"></div>
      </div>
    </div>
  `;

  function usageCount(segId) {
    let n = 0;
    store.listJourneys().forEach((j) => j.blocks.forEach((b) => {
      if (b.personalization?.rules.some((r) => r.segmentId === segId)) n++;
    }));
    return n;
  }

  function ruleSummary(seg) {
    return seg.rules.map((r) => `${r.attribute} ${RULE_OPERATORS[r.operator] || r.operator} "${r.value}"`).join(" and ");
  }

  qs(root, "#rows").innerHTML = items.map((s) => `
    <tr data-id="${s.id}">
      <td class="name"><a href="#/segments/${s.id}">${escapeHtml(s.name)}</a></td>
      <td><span class="pill draft">${SEGMENT_CATEGORIES[s.category] || s.category}</span></td>
      <td><code style="font-size:0.78rem;">${escapeHtml(ruleSummary(s))}</code></td>
      <td>${usageCount(s.id) ? `${usageCount(s.id)} block${usageCount(s.id) > 1 ? "s" : ""}` : `<span class="hint" style="margin:0;">Unused</span>`}</td>
    </tr>`).join("") || `<tr><td colspan="4"><div class="empty-state">No segments yet.</div></td></tr>`;
  qsa(root, "#rows tr[data-id]").forEach((tr) => {
    tr.addEventListener("click", (ev) => {
      if (ev.target.tagName === "A") return;
      navigate("/segments/" + tr.getAttribute("data-id"));
    });
  });
  qs(root, "#pager").textContent = `1–${items.length} of ${items.length}   Per Page: 10 ▾`;

  qs(root, "#createBtn").addEventListener("click", () => {
    const seg = store.createSegment();
    toast("Segment created");
    navigate("/segments/" + seg.id);
  });
}

export function renderSegmentDetail(root, id) {
  const seg = store.getSegment(id);
  if (!seg) {
    root.innerHTML = `<div class="content"><p class="empty-state">Segment not found. <a href="#/segments">Back to list</a></p></div>`;
    return;
  }
  setCrumbs(`<a href="#/segments">Segments</a> / <b>${escapeHtml(seg.name)}</b>`);

  root.innerHTML = `
    <div class="content">
      <div class="doc-title-row">
        <div class="doc-title" id="nameDisplay" contenteditable="true" spellcheck="false">${escapeHtml(seg.name)}</div>
        <button class="pill-btn danger" id="deleteBtn">Delete</button>
      </div>

      <div class="editor-grid">
        <div>
          <div class="field"><label>Description</label><textarea id="f-description" rows="2">${escapeHtml(seg.description || "")}</textarea></div>

          <hr class="section-divider" />
          <div class="section-heading">Rules <span style="font-weight:400;color:var(--ink-faint);font-size:0.8rem;">— a visitor matches this segment when all rules below are true</span></div>
          <div id="rulesList"></div>
          <button class="pill-btn" id="addRuleBtn" style="margin-top:4px;">+ Add rule</button>
        </div>

        <div>
          <div class="side-block">
            <div class="section-heading">Category</div>
            <select id="f-category">
              ${Object.keys(SEGMENT_CATEGORIES).map((k) => `<option value="${k}"${k === seg.category ? " selected" : ""}>${SEGMENT_CATEGORIES[k]}</option>`).join("")}
            </select>
          </div>
          <div class="side-block">
            <div class="section-heading">Targeting condition preview</div>
            <div class="hint" style="margin-top:0; margin-bottom:8px;">What a personalization policy sends GrowthBook to match this segment.</div>
            <div class="json-viewer" id="conditionJson"></div>
          </div>
        </div>
      </div>

      <p class="proto-note">Segments are reused across any number of personalized blocks — define the population once here, then reference it from a block's assignment policy on the Journeys page.</p>
    </div>
  `;

  qs(root, "#nameDisplay").addEventListener("blur", (e) => {
    const v = e.target.textContent.trim() || "Untitled segment";
    store.updateSegment(seg.id, { name: v });
    setCrumbs(`<a href="#/segments">Segments</a> / <b>${escapeHtml(v)}</b>`);
  });
  qs(root, "#f-description").addEventListener("input", (e) => store.updateSegment(seg.id, { description: e.target.value }));
  qs(root, "#f-category").addEventListener("change", (e) => store.updateSegment(seg.id, { category: e.target.value }));

  qs(root, "#deleteBtn").addEventListener("click", () => {
    if (confirm(`Delete "${seg.name}"? Any personalization rules referencing it will stop matching.`)) {
      store.deleteSegment(seg.id);
      toast("Segment deleted");
      navigate("/segments");
    }
  });

  function renderCondition() {
    qs(root, "#conditionJson").innerHTML = highlightJSON(store.segmentCondition(seg), 0);
  }

  function renderRules() {
    qs(root, "#rulesList").innerHTML = seg.rules.map((r, i) => `
      <div class="variant-row" data-i="${i}">
        <div class="vmain" style="display:flex; gap:8px;">
          <input type="text" data-field="attribute" value="${escapeHtml(r.attribute)}" placeholder="attribute (e.g. country)" style="flex:1;" />
          <select data-field="operator" style="flex:1;">
            ${Object.keys(RULE_OPERATORS).map((op) => `<option value="${op}"${op === r.operator ? " selected" : ""}>${RULE_OPERATORS[op]}</option>`).join("")}
          </select>
          <input type="text" data-field="value" value="${escapeHtml(r.value)}" placeholder="value" style="flex:1;" />
        </div>
        <span class="vremove" data-action="remove" title="Remove rule">×</span>
      </div>
    `).join("") || `<div class="hint" style="margin-top:0;">No rules — this segment matches everyone.</div>`;

    qsa(root, "#rulesList .variant-row").forEach((rowEl) => {
      const i = Number(rowEl.getAttribute("data-i"));
      qs(rowEl, '[data-field="attribute"]').addEventListener("input", (e) => { seg.rules[i].attribute = e.target.value; store.updateSegment(seg.id, { rules: seg.rules }); renderCondition(); });
      qs(rowEl, '[data-field="operator"]').addEventListener("change", (e) => { seg.rules[i].operator = e.target.value; store.updateSegment(seg.id, { rules: seg.rules }); renderCondition(); });
      qs(rowEl, '[data-field="value"]').addEventListener("input", (e) => { seg.rules[i].value = e.target.value; store.updateSegment(seg.id, { rules: seg.rules }); renderCondition(); });
      qs(rowEl, '[data-action="remove"]').addEventListener("click", () => {
        seg.rules.splice(i, 1);
        store.updateSegment(seg.id, { rules: seg.rules });
        renderRules(); renderCondition();
      });
    });
  }
  renderRules();
  renderCondition();

  qs(root, "#addRuleBtn").addEventListener("click", () => {
    seg.rules.push({ attribute: "country", operator: "equals", value: "" });
    store.updateSegment(seg.id, { rules: seg.rules });
    renderRules(); renderCondition();
  });
}
