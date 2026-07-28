import { route, startRouter, navigate } from "./lib/router.js";
import { renderExperimentsList, renderExperimentDetail } from "./views/experiments.js";
import { renderFlagsList, renderFlagDetail } from "./views/featureFlags.js";
import { renderJourneysList, renderJourneyDetail } from "./views/journeys.js";
import { renderSegmentsList, renderSegmentDetail } from "./views/segments.js";
import { renderTopicsList, renderTopicDetail } from "./views/topics.js";
import { renderAnalytics } from "./views/analytics.js";
import * as store from "./lib/store.js";

const app = document.getElementById("app");
const crumbsEl = document.getElementById("crumbs");
const toastEl = document.getElementById("toast");

export function setCrumbs(html) {
  crumbsEl.innerHTML = html.startsWith("<") || html.includes("<b>") ? html : `<b>${html}</b>`;
}

let toastTimer = null;
export function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function setActiveNav(section) {
  document.querySelectorAll(".sidebar nav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-route") === section);
  });
}

route("/experiments", () => { setActiveNav("experiments"); renderExperimentsList(app); window.scrollTo(0, 0); });
route("/experiments/:id", ({ id }) => { setActiveNav("experiments"); renderExperimentDetail(app, id); window.scrollTo(0, 0); });

route("/feature-flags", () => { setActiveNav("feature-flags"); renderFlagsList(app); window.scrollTo(0, 0); });
route("/feature-flags/:key", ({ key }) => { setActiveNav("feature-flags"); renderFlagDetail(app, key); window.scrollTo(0, 0); });

route("/journeys", () => { setActiveNav("journeys"); renderJourneysList(app); window.scrollTo(0, 0); });
route("/journeys/:id", ({ id }) => { setActiveNav("journeys"); renderJourneyDetail(app, id); window.scrollTo(0, 0); });

route("/topics", () => { setActiveNav("topics"); renderTopicsList(app); window.scrollTo(0, 0); });
route("/topics/:id", ({ id }) => { setActiveNav("topics"); renderTopicDetail(app, id); window.scrollTo(0, 0); });

route("/segments", () => { setActiveNav("segments"); renderSegmentsList(app); window.scrollTo(0, 0); });
route("/segments/:id", ({ id }) => { setActiveNav("segments"); renderSegmentDetail(app, id); window.scrollTo(0, 0); });

route("/analytics", () => { setActiveNav("analytics"); renderAnalytics(app); window.scrollTo(0, 0); });

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Reset all sample data back to the original seed? Any edits you've made will be lost.")) {
    store.resetToSeed();
    toast("Sample data reset");
    navigate("/experiments");
    location.reload();
  }
});

startRouter();

const gbStatusEl = document.getElementById("gbStatus");
fetch("/api/growthbook/status")
  .then((r) => r.json())
  .then(({ connected }) => {
    gbStatusEl.classList.toggle("connected", connected);
    gbStatusEl.innerHTML = `<span class="dot"></span>${connected ? "Connected to GrowthBook" : "GrowthBook: demo mode"}`;
  })
  .catch(() => {
    gbStatusEl.innerHTML = `<span class="dot"></span>GrowthBook: demo mode`;
  });
