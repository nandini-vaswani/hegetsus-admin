import * as store from "../lib/store.js";
import { escapeHtml, slugify, qs, qsa } from "../lib/ui.js";
import { navigate } from "../lib/router.js";
import { setCrumbs, toast } from "../main.js";

export function renderTopicsList(root) {
  setCrumbs("Topics");
  const items = store.listTopics();

  root.innerHTML = `
    <div class="content">
      <div class="page-head">
        <h1>Topics</h1>
        <button class="pill-btn primary" id="createBtn">Create New</button>
      </div>
      <p class="proto-note" style="margin-top:0;">A shared taxonomy across content pillars — a topic classifies content ("this journey is about grief"), independent of Segments (which classify visitors). Today only Journeys carry topics; Stories and Connect would tag into this same list once those pillars exist, which is what makes cross-pillar related-content lookups work.</p>
      <div class="list-wrap">
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Tagged content</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
        <div class="pager" id="pager"></div>
      </div>
    </div>
  `;

  qs(root, "#rows").innerHTML = items.map((t) => {
    const journeys = store.journeysForTopic(t.id);
    return `
      <tr data-id="${t.id}">
        <td class="name"><a href="#/topics/${t.id}">${escapeHtml(t.name)}</a></td>
        <td><code>${escapeHtml(t.slug)}</code></td>
        <td>${journeys.length ? journeys.map((j) => escapeHtml(j.title)).join(", ") : `<span class="hint" style="margin:0;">Unused</span>`}</td>
      </tr>`;
  }).join("") || `<tr><td colspan="3"><div class="empty-state">No topics yet.</div></td></tr>`;
  qsa(root, "#rows tr[data-id]").forEach((tr) => {
    tr.addEventListener("click", (ev) => {
      if (ev.target.tagName === "A") return;
      navigate("/topics/" + tr.getAttribute("data-id"));
    });
  });
  qs(root, "#pager").textContent = `1–${items.length} of ${items.length}   Per Page: 10 ▾`;

  qs(root, "#createBtn").addEventListener("click", () => {
    const topic = store.createTopic();
    toast("Topic created");
    navigate("/topics/" + topic.id);
  });
}

export function renderTopicDetail(root, id) {
  const topic = store.getTopic(id);
  if (!topic) {
    root.innerHTML = `<div class="content"><p class="empty-state">Topic not found. <a href="#/topics">Back to list</a></p></div>`;
    return;
  }
  setCrumbs(`<a href="#/topics">Topics</a> / <b>${escapeHtml(topic.name)}</b>`);
  const journeys = store.journeysForTopic(topic.id);

  root.innerHTML = `
    <div class="content">
      <div class="doc-title-row">
        <div class="doc-title" id="nameDisplay" contenteditable="true" spellcheck="false">${escapeHtml(topic.name)}</div>
        <button class="pill-btn danger" id="deleteBtn">Delete</button>
      </div>

      <div class="editor-grid">
        <div>
          <div class="field"><label>Slug</label><input type="text" id="f-slug" value="${escapeHtml(topic.slug)}" /></div>
          <div class="field"><label>Description</label><textarea id="f-description" rows="2">${escapeHtml(topic.description || "")}</textarea></div>
        </div>
        <div>
          <div class="side-block">
            <div class="section-heading">Tagged content</div>
            <div class="hint" style="margin-top:0; margin-bottom:12px;">${journeys.length ? `${journeys.length} journey${journeys.length > 1 ? "s" : ""} tagged with this topic.` : "Not tagged on any content yet."}</div>
            ${journeys.map((j) => `
              <div class="rel-row">
                <span><span class="kind">journey</span>${escapeHtml(j.title)}</span>
                <a class="link-btn" href="#/journeys/${j.id}" style="padding:0;">View →</a>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <p class="proto-note">Tag journeys with this topic from the Journeys page — each journey has a Topics chip-row in its side panel.</p>
    </div>
  `;

  qs(root, "#nameDisplay").addEventListener("blur", (e) => {
    const v = e.target.textContent.trim() || "Untitled topic";
    store.updateTopic(topic.id, { name: v });
    setCrumbs(`<a href="#/topics">Topics</a> / <b>${escapeHtml(v)}</b>`);
  });
  qs(root, "#f-slug").addEventListener("input", (e) => store.updateTopic(topic.id, { slug: slugify(e.target.value) }));
  qs(root, "#f-description").addEventListener("input", (e) => store.updateTopic(topic.id, { description: e.target.value }));

  qs(root, "#deleteBtn").addEventListener("click", () => {
    if (confirm(`Delete "${topic.name}"? It will be untagged from any content that uses it.`)) {
      store.deleteTopic(topic.id);
      toast("Topic deleted");
      navigate("/topics");
    }
  });
}
