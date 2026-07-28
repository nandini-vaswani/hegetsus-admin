// Minimal hash-based router — no build step, no framework, works with a plain static server.

const routes = [];

export function route(pattern, handler) {
  // pattern like "/experiments/:id" -> regex with named group "id"
  const paramNames = [];
  const regexStr = pattern
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) {
        paramNames.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  routes.push({ regex: new RegExp("^" + regexStr + "$"), paramNames, handler });
}

function currentPath() {
  const hash = location.hash.slice(1);
  return hash === "" ? "/experiments" : hash;
}

export function navigate(path) {
  location.hash = path;
}

function resolve() {
  const path = currentPath();
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = {};
      r.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(m[i + 1])));
      r.handler(params);
      return;
    }
  }
  console.warn("No route matched:", path);
}

export function startRouter() {
  window.addEventListener("hashchange", resolve);
  resolve();
}
