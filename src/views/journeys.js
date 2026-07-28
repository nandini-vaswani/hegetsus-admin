import * as store from "../lib/store.js";
import { BLOCK_TYPES } from "../lib/store.js";
import { STATUS_LABEL, SYNC_LABEL, fmtTime, escapeHtml, highlightJSON, qs, qsa } from "../lib/ui.js";
import { setCrumbs, toast } from "../main.js";

export function renderJourneysList(root) {
  setCrumbs("Journeys");
  const items = store.listJourneys();
  root.innerHTML = `
    <div class="content">
      <div class="page-head"><h1>Journeys</h1></div>
      <div class="list-wrap">
        <table>
          <thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Blocks</th><th>Updated</th></tr></thead>
          <tbody>
            ${items.map((j) => `
              <tr data-id="${j.id}">
                <td class="name"><a href="#/journeys/${j.id}">${escapeHtml(j.title)}</a></td>
                <td><code>${escapeHtml(j.slug)}</code></td>
                <td><span class="pill ${j.status}">${STATUS_LABEL[j.status]}</span></td>
                <td>${j.blocks.length}${j.blocks.some((b) => b.personalization?.enabled) ? ` <span class="pill simulated">personalized</span>` : ""}</td>
                <td>${fmtTime(j.updatedAt)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div class="pager">1–${items.length} of ${items.length}   Per Page: 10 ▾</div>
      </div>
      <p class="proto-note">Journeys are read-only at the top level (title/intro/slug) — this view exists so content-block personalization and the Experiments panel have real content to point at. Click one to see it.</p>
    </div>
  `;
  qsa(root, "tr[data-id]").forEach((tr) => {
    tr.addEventListener("click", (ev) => {
      if (ev.target.tagName === "A") return;
      location.hash = "/journeys/" + tr.getAttribute("data-id");
    });
  });
}

// ---- generic content-field rendering, shared by a block's base content and
// every personalization-rule's content override ----

function contentFieldsHtml(type, content) {
  if (type === "hero") {
    return `
      <div class="field"><label>Headline</label><input type="text" data-field="headline" value="${escapeHtml(content.headline || "")}" /></div>
      <div class="field"><label>Subhead</label><input type="text" data-field="subhead" value="${escapeHtml(content.subhead || "")}" /></div>
      <div class="field"><label>Media</label><input type="text" data-field="media" value="${escapeHtml(content.media || "")}" placeholder="Video / image description" /></div>
    `;
  }
  if (type === "video") {
    return `
      <div class="field"><label>Title</label><input type="text" data-field="title" value="${escapeHtml(content.title || "")}" /></div>
      <div class="field"><label>Video</label><input type="text" data-field="videoLabel" value="${escapeHtml(content.videoLabel || "")}" placeholder="Video asset description" /></div>
      <div class="field"><label>Caption</label><input type="text" data-field="caption" value="${escapeHtml(content.caption || "")}" /></div>
    `;
  }
  if (type === "text") {
    return `<div class="field"><label>Body</label><textarea data-field="body" rows="3">${escapeHtml(content.body || "")}</textarea></div>`;
  }
  if (type === "next_step") {
    return `<div class="hint" style="margin-top:0;">${content.options.map((o) => `→ ${escapeHtml(o.label)}`).join("<br/>") || "No options yet."}</div>`;
  }
  return `<div class="hint" style="margin-top:0;">${escapeHtml(content.note || "")}</div>`;
}

function wireContentFields(container, onChange) {
  qsa(container, "[data-field]").forEach((el) => {
    el.addEventListener("input", () => onChange({ [el.getAttribute("data-field")]: el.value }));
  });
}

const BLOCK_ICON = { hero: "◆", video: "▶", text: "¶", prayer_rotator: "↻", next_step: "→" };

export function renderJourneyDetail(root, id) {
  const journey = store.getJourney(id);
  if (!journey) {
    root.innerHTML = `<div class="content"><p class="empty-state">Journey not found. <a href="#/journeys">Back to list</a></p></div>`;
    return;
  }
  setCrumbs(`<a href="#/journeys">Journeys</a> / <b>${escapeHtml(journey.title)}</b>`);

  const linkedExperiments = store.experimentsForJourney(journey.id);
  const segments = store.listSegments();

  root.innerHTML = `
    <div class="content">
      <div class="doc-title">${escapeHtml(journey.title)}</div>
      <div class="doc-tabs"><button class="active">Edit</button></div>
      <div class="status-bar">
        <div class="meta">
          <span>Status: <b>${STATUS_LABEL[journey.status]}</b></span>
          <span>Last Modified: <b>${fmtTime(journey.updatedAt)}</b></span>
          <span>Created: <b>${fmtTime(journey.createdAt)}</b></span>
        </div>
        <div class="actions"><button class="pill-btn" disabled>Save Draft</button><button class="pill-btn primary" disabled>Publish changes</button></div>
      </div>

      <div class="editor-grid">
        <div>
          <div class="field"><label>Title<span class="req">*</span></label><input type="text" value="${escapeHtml(journey.title)}" readonly /></div>
          <div class="field"><label>Intro<span class="req">*</span></label><textarea readonly>${escapeHtml(journey.intro)}</textarea></div>

          <hr class="section-divider" />
          <div class="section-heading">Content Blocks <span style="font-weight:400;color:var(--ink-faint);font-size:0.8rem;">— toggle "Personalize" on a block to serve different content by segment</span></div>
          <div id="blocksList"></div>
          <select class="add-select" id="addBlockType" style="margin-top:6px;">
            <option value="">+ Add block…</option>
            ${Object.keys(BLOCK_TYPES).map((t) => `<option value="${t}">${BLOCK_TYPES[t]}</option>`).join("")}
          </select>
        </div>

        <div>
          <div class="side-block">
            <label style="font-size:0.86rem; display:block; margin-bottom:8px;">Slug<span class="req">*</span></label>
            <input type="text" value="${escapeHtml(journey.slug)}" readonly />
          </div>

          <div class="side-block">
            <div class="section-heading">SEO</div>
            <label style="font-size:0.86rem; display:block; margin-bottom:8px;">Title</label>
            <input type="text" placeholder="Defaults to journey title if empty" readonly />
          </div>

          <div class="side-block">
            <div class="section-heading">Topics <span style="font-weight:400;color:var(--ink-faint);font-size:0.76rem;">— content taxonomy, cross-pillar</span></div>
            <div class="chip-row" id="topicChips"></div>
            <div class="hint" style="margin-top:8px;">Independent of Segments — a topic says what this content is <em>about</em>, not who sees it. Shared with any future Stories/Connect pillar. Manage the full list on <a href="#/topics">Topics</a>.</div>
          </div>

          <div class="side-block">
            <div class="section-heading">Related content <span style="font-weight:400;color:var(--ink-faint);font-size:0.76rem;">— by shared topic</span></div>
            <div id="relatedContent"></div>
          </div>

          <div class="side-block">
            <div class="section-heading">Experiments <span style="font-weight:400;color:var(--ink-faint);font-size:0.76rem;">— random split (A/B/n)</span></div>
            <div class="hint" style="margin-top:0; margin-bottom:12px;">
              ${linkedExperiments.length
                ? `This journey is referenced by ${linkedExperiments.length} experiment${linkedExperiments.length > 1 ? "s" : ""} in the Experiments collection.`
                : "Not referenced by any experiment right now."}
            </div>
            ${linkedExperiments.map((e) => `
              <div class="rel-row">
                <span>${escapeHtml(e.name)}</span>
                <a class="link-btn" href="#/experiments/${e.id}" style="padding:0;">
                  <span class="pill ${e.status}">${STATUS_LABEL[e.status]}</span>
                </a>
              </div>`).join("")}
            <a class="link-btn" href="#/experiments">→ View all experiments</a>
            <div class="hint" style="margin-top:12px;">Random assignment — every visitor has an equal (or weighted) chance of any variant, used to measure which one performs better.</div>
          </div>

          <div class="side-block">
            <div class="section-heading">Personalization <span style="font-weight:400;color:var(--ink-faint);font-size:0.76rem;">— rules-based, deliberate</span></div>
            <div class="hint" style="margin-top:0;">Not random — a visitor's segment (geo, device, referral…) deliberately decides which variant of a block they see, via the assignment policy on that block above. Manage reusable segments on the <a href="#/segments">Segments</a> page.</div>
          </div>
        </div>
      </div>

      <p class="proto-note">Personalization and Experiments both deliver through GrowthBook Features, but they're distinct mechanisms: a personalization policy is a string-valued feature whose <code>rules</code> are deterministic <code>force</code> rules keyed on a segment's condition, with a default/fallback; an experiment is a feature whose value is randomly split across variants. Same delivery pipe, different assignment logic.</p>
    </div>
  `;

  function renderBlocks() {
    const listEl = qs(root, "#blocksList");
    listEl.innerHTML = journey.blocks.map((b, i) => `
      <div class="block-card" data-id="${b.id}">
        <div class="block-card-head">
          <span class="block-type-badge">${BLOCK_ICON[b.type] || "◆"} ${BLOCK_TYPES[b.type] || b.type}</span>
          ${b.personalization?.enabled ? `<span class="pill simulated">personalized</span>` : ""}
          <div class="block-card-actions">
            <button type="button" data-action="up" title="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" data-action="down" title="Move down" ${i === journey.blocks.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="rm-block" data-action="remove" title="Remove block">Remove</button>
          </div>
        </div>
        <div class="block-card-body">
          <div class="block-base-content">${contentFieldsHtml(b.type, b.content)}</div>
          ${b.personalization === null
            ? `<div class="hint" style="margin-top:2px;">Dynamic block — resolved at request time from a rotating pool, not personalizable by segment.</div>`
            : `
              <button type="button" class="etoggle personalize-toggle" data-action="toggle-personalize">
                <span class="env-switch${b.personalization.enabled ? " on" : ""}"></span>
                Personalize this block
              </button>
              <div class="assignment-policy" style="display:${b.personalization.enabled ? "block" : "none"};"></div>
            `}
        </div>
      </div>
    `).join("") || `<div class="hint" style="margin-top:0;">No content blocks yet — add one below.</div>`;

    journey.blocks.forEach((b) => {
      const card = qs(listEl, `.block-card[data-id="${b.id}"]`);
      wireContentFields(qs(card, ".block-base-content"), (patch) => {
        store.updateBlockContent(journey.id, b.id, patch);
      });

      const upBtn = qs(card, '[data-action="up"]');
      const downBtn = qs(card, '[data-action="down"]');
      if (upBtn) upBtn.addEventListener("click", () => { store.moveBlock(journey.id, b.id, -1); Object.assign(journey, store.getJourney(journey.id)); renderBlocks(); });
      if (downBtn) downBtn.addEventListener("click", () => { store.moveBlock(journey.id, b.id, 1); Object.assign(journey, store.getJourney(journey.id)); renderBlocks(); });
      qs(card, '[data-action="remove"]').addEventListener("click", () => {
        if (confirm("Remove this block?")) { store.removeBlock(journey.id, b.id); Object.assign(journey, store.getJourney(journey.id)); renderBlocks(); }
      });

      if (b.personalization !== null) {
        const toggleBtn = qs(card, '[data-action="toggle-personalize"]');
        const policyEl = qs(card, ".assignment-policy");
        toggleBtn.addEventListener("click", () => {
          const next = !b.personalization.enabled;
          store.setBlockPersonalizationEnabled(journey.id, b.id, next);
          b.personalization.enabled = next;
          renderBlocks();
        });
        if (b.personalization.enabled) renderPolicy(b, policyEl);
      }
    });
  }

  function renderPolicy(block, policyEl) {
    const p = block.personalization;
    policyEl.innerHTML = `
      <div class="section-heading" style="font-size:0.86rem; margin-top:16px;">Assignment policy</div>
      <div class="hint" style="margin-top:0;">Ordered — the first matching segment wins. Anyone matching none of these sees the default below.</div>
      <div class="policy-rules"></div>
      <select class="add-select" data-action="add-rule">
        <option value="">+ Add segment…</option>
        ${segments.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
      </select>

      <div class="policy-fallback">
        <div class="policy-fallback-label">Default / fallback <span class="hint-inline">— shown when no rule matches</span></div>
        <div class="policy-fallback-content"></div>
      </div>

      <div class="side-block" style="margin-top:18px; margin-bottom:0;">
        <div class="section-heading">GrowthBook Sync</div>
        <div class="sync-status-row"><span class="label">Status</span><span class="pill" data-el="syncPill"></span></div>
        <div class="sync-meta">Key: <code data-el="syncKey"></code></div>
        <div class="sync-meta">Last synced: <span data-el="syncTime"></span></div>
        <div class="sync-message" data-el="syncMessage"></div>
        <button class="pill-btn primary sync-btn" type="button" data-action="sync">Sync to GrowthBook</button>
      </div>

      <details class="rules-preview-details">
        <summary>Rules preview (GrowthBook payload)</summary>
        <div class="json-viewer" data-el="rulesJson"></div>
      </details>
    `;

    qs(policyEl, ".policy-fallback-content").innerHTML = contentFieldsHtml(block.type, block.content);
    wireContentFields(qs(policyEl, ".policy-fallback-content"), (patch) => {
      store.updateBlockContent(journey.id, block.id, patch);
    });

    function renderRules() {
      const wrap = qs(policyEl, ".policy-rules");
      wrap.innerHTML = p.rules.map((r, i) => `
        <div class="policy-rule" data-id="${r.id}">
          <div class="policy-rule-head">
            <select data-field="segment">
              ${segments.map((s) => `<option value="${s.id}"${s.id === r.segmentId ? " selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}
            </select>
            <span class="arrow-key">→</span>
            <input type="text" class="variant-key-input" data-field="value" value="${escapeHtml(r.value)}" />
            <button type="button" data-action="up" title="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" data-action="down" title="Move down" ${i === p.rules.length - 1 ? "disabled" : ""}>↓</button>
            <span class="vremove" data-action="remove" title="Remove rule">×</span>
          </div>
          <div class="policy-rule-content"></div>
        </div>
      `).join("") || `<div class="hint" style="margin-top:0;">No rules yet — everyone sees the default.</div>`;

      p.rules.forEach((r) => {
        const rowEl = qs(wrap, `.policy-rule[data-id="${r.id}"]`);
        qs(rowEl, ".policy-rule-content").innerHTML = contentFieldsHtml(block.type, r.content);
        wireContentFields(qs(rowEl, ".policy-rule-content"), (patch) => {
          store.updatePersonalizationRule(journey.id, block.id, r.id, { content: patch });
          renderRulesPreview();
        });
        qs(rowEl, '[data-field="segment"]').addEventListener("change", (e) => {
          store.updatePersonalizationRule(journey.id, block.id, r.id, { segmentId: e.target.value });
          renderRulesPreview();
        });
        qs(rowEl, '[data-field="value"]').addEventListener("input", (e) => {
          store.updatePersonalizationRule(journey.id, block.id, r.id, { value: e.target.value });
          renderRulesPreview();
        });
        const upBtn = qs(rowEl, '[data-action="up"]');
        const downBtn = qs(rowEl, '[data-action="down"]');
        if (upBtn) upBtn.addEventListener("click", () => { store.movePersonalizationRule(journey.id, block.id, r.id, -1); refreshBlock(); });
        if (downBtn) downBtn.addEventListener("click", () => { store.movePersonalizationRule(journey.id, block.id, r.id, 1); refreshBlock(); });
        qs(rowEl, '[data-action="remove"]').addEventListener("click", () => {
          store.removePersonalizationRule(journey.id, block.id, r.id);
          refreshBlock();
        });
      });
    }

    function refreshBlock() {
      Object.assign(journey, store.getJourney(journey.id));
      renderBlocks();
    }

    renderRules();

    qs(policyEl, '[data-action="add-rule"]').addEventListener("change", (e) => {
      if (!e.target.value) return;
      store.addPersonalizationRule(journey.id, block.id, e.target.value);
      refreshBlock();
    });

    function renderRulesPreview() {
      const rules = p.rules.map((r) => {
        const segment = store.getSegment(r.segmentId);
        return { type: "force", value: r.value, condition: segment ? store.segmentCondition(segment) : {}, description: segment ? segment.name : "(deleted segment)", allEnvironments: true };
      });
      const doc = { id: p.sync.key || `journey-${journey.slug}-${block.id.replace(/^blk-/, "")}`, valueType: "string", defaultValue: p.defaultValue, description: `Personalization policy for "${block.label}" on ${journey.title}`, tags: ["personalization"], rules };
      const el = qs(policyEl, '[data-el="rulesJson"]');
      if (el) el.innerHTML = highlightJSON(doc, 0);
    }
    renderRulesPreview();

    function renderSync() {
      qs(policyEl, '[data-el="syncPill"]').className = "pill " + p.sync.status;
      qs(policyEl, '[data-el="syncPill"]').textContent = SYNC_LABEL[p.sync.status];
      qs(policyEl, '[data-el="syncKey"]').textContent = p.sync.key || "—";
      qs(policyEl, '[data-el="syncTime"]').textContent = fmtTime(p.sync.lastSyncedAt);
      qs(policyEl, '[data-el="syncMessage"]').textContent = p.sync.message;
    }
    renderSync();

    qs(policyEl, '[data-action="sync"]').addEventListener("click", async () => {
      const btn = qs(policyEl, '[data-action="sync"]');
      btn.disabled = true; btn.textContent = "Syncing...";
      p.sync = { status: "syncing", key: p.sync.key, lastSyncedAt: p.sync.lastSyncedAt, message: "Contacting GrowthBook..." };
      renderSync();
      const result = await store.syncBlockPersonalization(journey.id, block.id);
      Object.assign(journey, store.getJourney(journey.id));
      const freshBlock = journey.blocks.find((b) => b.id === block.id);
      Object.assign(p, freshBlock.personalization);
      renderSync(); renderRulesPreview();
      btn.disabled = false; btn.textContent = "Sync to GrowthBook";
      toast(result.status === "synced" ? "Synced to GrowthBook" : result.status === "error" ? "Sync failed — see message below" : "Synced (demo mode)");
    });
  }

  renderBlocks();

  qs(root, "#addBlockType").addEventListener("change", (e) => {
    if (!e.target.value) return;
    store.addBlock(journey.id, e.target.value);
    Object.assign(journey, store.getJourney(journey.id));
    e.target.value = "";
    renderBlocks();
  });

  function renderTopics() {
    const allTopics = store.listTopics();
    const tagged = journey.topics.map((id) => store.getTopic(id)).filter(Boolean);
    qs(root, "#topicChips").innerHTML =
      tagged.map((t) => `<span class="chip" data-id="${t.id}"><a href="#/topics/${t.id}" style="color:inherit; text-decoration:none;">${escapeHtml(t.name)}</a> <span class="rm" data-action="remove-topic">×</span></span>`).join("") +
      `<select class="add-select" id="addTopicSelect"><option value="">+ Tag topic…</option>${allTopics.filter((t) => !journey.topics.includes(t.id)).map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}</select>`;

    qsa(root, "#topicChips .chip .rm").forEach((rm) => {
      rm.addEventListener("click", () => {
        const chip = rm.closest(".chip");
        store.removeJourneyTopic(journey.id, chip.getAttribute("data-id"));
        Object.assign(journey, store.getJourney(journey.id));
        renderTopics();
        renderRelated();
      });
    });
    const addSel = qs(root, "#addTopicSelect");
    addSel.onchange = () => {
      if (!addSel.value) return;
      store.addJourneyTopic(journey.id, addSel.value);
      Object.assign(journey, store.getJourney(journey.id));
      renderTopics();
      renderRelated();
    };
  }

  function renderRelated() {
    const related = store.relatedJourneys(journey.id);
    qs(root, "#relatedContent").innerHTML = related.length
      ? related.map((j) => `
        <div class="rel-row">
          <span><span class="kind">journey</span>${escapeHtml(j.title)}</span>
          <a class="link-btn" href="#/journeys/${j.id}" style="padding:0;">View →</a>
        </div>`).join("") + `<div class="hint" style="margin-top:8px;">Matched by shared Topic tags. A Stories or Connect pillar would appear here too, once those collections exist.</div>`
      : `<div class="hint" style="margin-top:0;">No related content — tag a Topic above shared with another journey to surface it here.</div>`;
  }

  renderTopics();
  renderRelated();
}
