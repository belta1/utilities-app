import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { bundleClient, compileExpression, compileModuleFile, compileModuleSource, isModuleSource } from "./jsx.mjs";
import { handleApi } from "./api.mjs";
import { migrate, seed } from "./db.mjs";

const PORT = Number(process.env.PORT ?? 3000);
const PAGES_DIR = path.resolve(process.env.PAGES_DIR ?? "pages");
const MAX_BODY = 1024 * 1024;

// ── pages ─────────────────────────────────────────────────────────

// Any path segment starting with "_" is a private module (pages/_lib/...), importable
// by pages but never served as one.
const isPrivate = (name) => name.split("/").some((seg) => seg.startsWith("_"));

async function listPages() {
  const entries = await readdir(PAGES_DIR, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".jsx"))
    .map((e) => path.relative(PAGES_DIR, path.join(e.parentPath, e.name)).split(path.sep).join("/").slice(0, -4))
    .filter((name) => !isPrivate(name))
    .sort();
}

// "/blog/post" -> pages/blog/post.jsx, refusing anything that escapes PAGES_DIR
function pageFile(urlPath) {
  const name = decodeURIComponent(urlPath).replace(/^\/+|\/+$/g, "");
  if (!name || name.includes("\0") || isPrivate(name)) return null;
  const file = path.resolve(PAGES_DIR, `${name}.jsx`);
  return file.startsWith(PAGES_DIR + path.sep) ? { name, file } : null;
}

// Newest mtime under PAGES_DIR. Compiled pages and bundles are cached against it, so
// editing any file (a page or something it imports) invalidates everything.
async function pagesStamp() {
  const entries = await readdir(PAGES_DIR, { recursive: true, withFileTypes: true });
  let newest = 0;
  for (const e of entries) {
    if (!e.isFile()) continue;
    const { mtimeMs } = await stat(path.join(e.parentPath, e.name));
    if (mtimeMs > newest) newest = mtimeMs;
  }
  return newest;
}

const cache = new Map();
async function cached(key, stamp, produce) {
  const hit = cache.get(key);
  if (hit && hit.stamp === stamp) return hit.value;
  const value = await produce();
  cache.set(key, { stamp, value });
  return value;
}

// Module pages get renderToString (hydratable) plus a client bundle that hydrates
// them, so state and event handlers work in the browser. Expression pages have no
// component to hydrate and stay static.
async function renderPage(page, src, props) {
  if (!isModuleSource(src)) {
    const render = await compileExpression(src, `${page.name}.jsx`);
    return toDocument(renderToStaticMarkup(render(props)), page.name);
  }
  const render = await cached(`ssr:${page.name}`, await pagesStamp(), () => compileModuleFile(page.file));
  const html = renderToString(render(props));
  if (/^<html[\s>]/i.test(html)) return `<!doctype html>\n${html}`;
  const propsJson = JSON.stringify(props).replaceAll("<", "\\u003c");
  return toDocument(
    `<div id="root">${html}</div>` +
      `<script id="__props" type="application/json">${propsJson}</script>` +
      `<script type="module" src="/${page.name}.js"></script>`,
    page.name,
  );
}

// Wrap a fragment in a document unless the page rendered its own <html>.
function toDocument(html, title) {
  if (/^<html[\s>]/i.test(html)) return `<!doctype html>\n${html}`;
  return (
    `<!doctype html>\n<html><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${title}</title></head><body>${html}</body></html>`
  );
}

// ── http ──────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(httpError(413, "body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function send(res, status, body, type) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

const HTML = "text/html; charset=utf-8";
const TEXT = "text/plain; charset=utf-8";
const JS = "text/javascript; charset=utf-8";

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (await handleApi(req, res, url, readBody)) return;

    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, "ok", TEXT);
    }

    if (req.method === "POST" && url.pathname === "/render") {
      const body = await readBody(req);
      const isJson = (req.headers["content-type"] ?? "").includes("application/json");
      const { jsx, props } = isJson ? JSON.parse(body) : { jsx: body, props: {} };
      if (typeof jsx !== "string" || !jsx.trim()) {
        throw httpError(400, '"jsx" must be a non-empty string');
      }
      const render = await (isModuleSource(jsx) ? compileModuleSource(jsx) : compileExpression(jsx));
      return send(res, 200, renderToStaticMarkup(render(props ?? {})), HTML);
    }

    if (req.method === "GET" && url.pathname === "/") {
      const pages = await listPages();
      const items = pages.map((p) => `<li><a href="/${p}">${p}</a></li>`).join("");
      return send(res, 200, toDocument(`<h1>pages/</h1><ul>${items}</ul>`, "pages"), HTML);
    }

    if (req.method === "GET") {
      const wantsBundle = url.pathname.endsWith(".js");
      const page = pageFile(wantsBundle ? url.pathname.slice(0, -3) : url.pathname);
      if (!page) return send(res, 404, "not found", TEXT);
      let src;
      try {
        src = await readFile(page.file, "utf8");
      } catch (err) {
        if (err.code === "ENOENT") return send(res, 404, `no page ${page.name}.jsx`, TEXT);
        throw err;
      }
      if (wantsBundle) {
        if (!isModuleSource(src)) return send(res, 404, `${page.name}.jsx is not a module page`, TEXT);
        const js = await cached(`js:${page.name}`, await pagesStamp(), () => bundleClient(page.name, PAGES_DIR));
        return send(res, 200, js, JS);
      }
      const props = Object.fromEntries(url.searchParams);
      return send(res, 200, await renderPage(page, src, props), HTML);
    }

    send(res, 404, "not found", TEXT);
  } catch (err) {
    send(res, err.status ?? 500, err.message, TEXT);
  }
});

await migrate();
const seeded = await seed();
console.log(`db ready: ${seeded.images} images, ${seeded.exercisesInserted} new exercises`);

server.listen(PORT, () => {
  console.log(`jsx-render listening on http://localhost:${PORT}  (pages: ${PAGES_DIR})`);
});
