import * as store from "../lib/store.js";
import { escapeHtml, qs } from "../lib/ui.js";
import { setCrumbs } from "../main.js";

const TS_DATA = [820, 910, 875, 1040, 1190, 1350, 1280, 1420, 1510, 1390, 1600, 1720, 1650, 1840];
const FUNNEL_DATA = [
  { name: "Homepage view", value: 42180 },
  { name: "Journey started", value: 18940 },
  { name: "Journey completed", value: 11362 },
];
const EVENTS = [
  { name: "homepage_view", count: "42,180", trend: "up" },
  { name: "journey_started", count: "18,940", trend: "up" },
  { name: "journey_block_viewed", count: "312,450", trend: "flat" },
  { name: "journey_completed", count: "11,362", trend: "up" },
  { name: "feedback_submitted", count: "1,204", trend: "down" },
];
const TREND_ARROW = {
  up: '<span class="stat-trend up">↑</span>',
  down: '<span class="stat-trend down">↓</span>',
  flat: '<span class="stat-trend flat">→</span>',
};

export function renderAnalytics(root) {
  setCrumbs("Analytics");

  const experiments = store.listExperiments();
  const activeCount = experiments.filter((e) => e.status === "live").length;
  const otherCount = experiments.length - activeCount;

  root.innerHTML = `
    <div class="content">
      <div class="page-head"><h1>Product Analytics</h1></div>
      <p class="hint" style="margin:-14px 0 26px;">Read-only — sourced from GrowthBook's analytics, not editable here. Nothing on this page is a Payload field.</p>

      <div class="stat-tiles">
        <div class="stat-tile"><div class="stat-label">Visitors (30d)</div><div class="stat-value">42,180</div><div class="stat-trend up">↑ 8.4% vs. prior 30d</div></div>
        <div class="stat-tile"><div class="stat-label">Journeys started</div><div class="stat-value">18,940</div><div class="stat-trend up">↑ 12.1% vs. prior 30d</div></div>
        <div class="stat-tile"><div class="stat-label">Journeys completed</div><div class="stat-value">11,362</div><div class="stat-trend up">↑ 6.7% vs. prior 30d</div></div>
        <div class="stat-tile"><div class="stat-label">Active experiments</div><div class="stat-value">${activeCount}</div><div class="stat-trend flat">${otherCount} draft/paused</div></div>
      </div>

      <div class="analytics-grid">
        <div class="card-block">
          <div class="section-heading" style="font-size:0.95rem;">Visitors, last 14 days</div>
          <div class="ts-chart" id="tsChart"></div>
        </div>
        <div class="card-block">
          <div class="section-heading" style="font-size:0.95rem;">Homepage → Journey funnel</div>
          <div class="funnel" id="funnelChart"></div>
        </div>
      </div>

      <div class="card-block" style="margin-top:22px;">
        <div class="section-heading" style="font-size:0.95rem;">Top events, last 30 days</div>
        <table class="results-table">
          <thead><tr><th>Event</th><th>Count</th><th>Trend</th></tr></thead>
          <tbody>
            ${EVENTS.map((e) => `<tr><td class="var-name" style="font-family:ui-monospace, monospace; font-size:0.82rem;">${escapeHtml(e.name)}</td><td class="metric">${e.count}</td><td>${TREND_ARROW[e.trend]}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>

      <p class="proto-note">In the real build, this view would embed GrowthBook's own analytics (or a lightweight summary of it) rather than reimplementing charting — Payload's role here is purely to host the page, not to compute any of these numbers.</p>
    </div>
  `;

  const maxTs = Math.max(...TS_DATA);
  qs(root, "#tsChart").innerHTML = TS_DATA.map((v, i) => {
    const h = Math.round((v / maxTs) * 100);
    const isEnd = i === TS_DATA.length - 1;
    return `<div class="ts-bar-col${isEnd ? " endpoint" : ""}">
      <span class="ts-val">${v.toLocaleString()}</span>
      <div class="ts-bar" style="height:${h}%"></div>
      <span class="ts-day">${i % 3 === 0 || isEnd ? "D" + (i + 1) : ""}</span>
    </div>`;
  }).join("");

  const maxF = FUNNEL_DATA[0].value;
  qs(root, "#funnelChart").innerHTML = FUNNEL_DATA.map((step, i) => {
    const w = Math.round((step.value / maxF) * 100);
    const drop = i > 0 ? `<div class="funnel-drop">${Math.round((step.value / FUNNEL_DATA[i - 1].value) * 100)}% continued from previous step</div>` : "";
    return `${drop}<div class="funnel-step">
      <div class="funnel-label"><span class="n">${step.name}</span><span class="v">${step.value.toLocaleString()}</span></div>
      <div class="funnel-bar-track"><div class="funnel-bar" style="width:${w}%"></div></div>
    </div>`;
  }).join("");
}
