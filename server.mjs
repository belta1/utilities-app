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

// ── index ─────────────────────────────────────────────────────────

// The "/" listing, in the RECOMP dashboard's look (tokens mirror pages/_lib/recomp/tokens.jsx).
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function indexPage(pages) {
  const items = pages
    .map((p) => {
      const name = escapeHtml(p);
      const dir = name.includes("/") ? name.slice(0, name.lastIndexOf("/") + 1) : "";
      return (
        `<a class="card" href="/${name}">` +
        `<div><div class="name">${dir ? `<span class="dir">${dir}</span>` : ""}${name.slice(dir.length)}</div>` +
        `<div class="path">GET /${name}</div></div><div class="go">▸</div></a>`
      );
    })
    .join("");
  const empty = `<div class="empty">SIN PAGINAS — pon un <b>.jsx</b> en pages/</div>`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>pages</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap');
  :root{--bg:#14110F;--surface:#1C1815;--raised:#242019;--line:#2E2822;--copper:#E0853C;--gold:#F2C14E;--bone:#EAE3D8;--ash:#8A8178;--faint:#544C42}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--bone);font-family:'JetBrains Mono',monospace;min-height:100vh}
  .wrap{max-width:520px;margin:0 auto;padding:0 0 26px}
  header{padding:18px 16px 14px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:flex-end}
  .label{font-size:8px;letter-spacing:3px;color:var(--faint);margin-bottom:3px}
  h1{font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:700;line-height:.95;letter-spacing:-.5px}
  h1 span{color:var(--copper)}
  .meta{text-align:right;font-size:9px;color:var(--ash);line-height:1.6}
  .meta b{color:var(--gold);font-weight:400}
  .meta .dim{color:var(--faint)}
  main{padding:14px 14px 0}
  .section{font-size:9px;letter-spacing:2px;color:var(--faint);margin-bottom:8px}
  .list{display:flex;flex-direction:column;gap:8px}
  .card{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--copper);border-radius:12px;padding:12px 13px;text-decoration:none;color:inherit;transition:all .2s}
  .card:hover{background:var(--raised);border-color:rgba(224,133,60,.4);border-left-color:var(--copper)}
  .card>div:first-child{flex:1;min-width:0}
  .name{font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:var(--bone);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dir{color:var(--ash);font-weight:500}
  .path{font-size:9px;color:var(--ash);margin-top:3px}
  .go{color:var(--copper);font-size:12px;flex-shrink:0}
  .empty{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:22px;text-align:center;font-size:10px;letter-spacing:1px;color:var(--faint)}
  .empty b{color:var(--gold);font-weight:400}
  .api{margin-top:16px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-size:10px;color:var(--ash);line-height:1.9}
  .api span{color:var(--copper)}
  footer{padding:18px 18px 0;text-align:center;font-size:8px;color:var(--faint);letter-spacing:2px}
  @media (prefers-reduced-motion: reduce){*{transition:none!important}}
</style></head>
<body><div class="wrap">
  <header>
    <div><div class="label">// JSX_RENDER</div><h1>PAGES<span>_</span></h1></div>
    <div class="meta"><div><b>${pages.length}</b> ${pages.length === 1 ? "pagina" : "paginas"}</div><div class="dim">${escapeHtml(path.basename(PAGES_DIR))}/</div></div>
  </header>
  <main>
    <div class="section">// PAGINAS</div>
    <div class="list">${items || empty}</div>
    <div class="api">
      <span>GET</span> /&lt;page&gt;?prop=valor &nbsp;·&nbsp; <span>POST</span> /render &nbsp;·&nbsp; <span>GET</span> /api/exercises &nbsp;·&nbsp; <span>GET|POST</span> /api/sets
    </div>
  </main>
  <footer>SSR + HIDRATACION · ESBUILD · POSTGRES</footer>
</div></body></html>`;
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
      return send(res, 200, indexPage(await listPages()), HTML);
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

// Outlive any browser or proxy idle timeout, so a request is never written into a
// socket we are closing at that same moment (the browser reports that as a bare
// "Failed to fetch"; POSTs are not retried).
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(PORT, () => {
  console.log(`jsx-render listening on http://localhost:${PORT}  (pages: ${PAGES_DIR})`);
});
