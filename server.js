// Zero-dependency static file server + a couple of small API routes.
// No npm install required — just `node server.js`.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initEnv, isConnected, syncExperimentToGrowthBook, syncPersonalizationToGrowthBook } from "./growthbook-server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5173;

initEnv(__dirname);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.join(__dirname, urlPath);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found: " + urlPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split("?")[0];

  if (urlPath === "/api/growthbook/status" && req.method === "GET") {
    sendJson(res, 200, { connected: isConnected() });
    return;
  }

  if (urlPath === "/api/growthbook/sync" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const result = await syncExperimentToGrowthBook(body);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 400, { ok: false, message: "Bad request: " + err.message });
    }
    return;
  }

  if (urlPath === "/api/growthbook/sync-personalization" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const result = await syncPersonalizationToGrowthBook(body);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 400, { ok: false, message: "Bad request: " + err.message });
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  Admin running at http://localhost:${PORT}`);
  console.log(`  GrowthBook: ${isConnected() ? "connected (real API key found in .env)" : "demo mode (no .env / GROWTHBOOK_API_KEY set)"}\n`);
});
