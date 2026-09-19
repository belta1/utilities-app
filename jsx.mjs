// JSX compilation: expression strings, inline module sources, module files on disk,
// and browser bundles. esbuild does all transforms; React stays the server's instance.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, transform } from "esbuild";
import React from "react";

const require = createRequire(import.meta.url);
const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
// Pages may live outside the app tree (a bind mount in Docker), so bare imports
// like "react" must still resolve against the app's node_modules.
const NODE_PATHS = [path.join(APP_DIR, "node_modules")];
export const DEV = (process.env.NODE_ENV ?? "development") !== "production";

export const isModuleSource = (src) => /^\s*(import|export)\s/m.test(src);

// Bare JSX expression -> (props) => element. `props` and `React` are in scope.
export async function compileExpression(src, sourcefile = "<stdin>") {
  const { code } = await transform(`(${src}\n)`, {
    loader: "jsx",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    sourcefile,
  });
  return (props) => new Function("React", "props", `return ${code}`)(React, props);
}

// Inline module source (no file, so no relative imports) -> (props) => element.
export async function compileModuleSource(src, sourcefile = "<stdin>") {
  const { code } = await transform(src, { loader: "jsx", jsx: "automatic", format: "cjs", sourcefile });
  return toRenderer(evalCjs(code));
}

// Module file on disk -> its exports. Bundled, so relative imports work; react is
// kept external so hooks and elements use the same React the server renders with.
export async function loadModuleFile(file) {
  const { outputFiles } = await build({
    entryPoints: [file],
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react-dom", "react/*", "react-dom/*"],
    nodePaths: NODE_PATHS,
    write: false,
    logLevel: "silent",
  });
  return evalCjs(outputFiles[0].text);
}

export async function compileModuleFile(file) {
  return toRenderer(await loadModuleFile(file));
}

function evalCjs(code) {
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}

function toRenderer(exports) {
  const def = exports.default ?? exports;
  return (props) => (typeof def === "function" ? React.createElement(def, props) : def);
}

// Browser bundle for a module page: react + react-dom + the page, hydrating #root.
export async function bundleClient(name, pagesDir) {
  const entry = `
    import React from "react";
    import { hydrateRoot } from "react-dom/client";
    import Page from "./${name}.jsx";
    const props = JSON.parse(document.getElementById("__props").textContent);
    hydrateRoot(document.getElementById("root"), React.createElement(Page, props));
  `;
  const { outputFiles } = await build({
    stdin: { contents: entry, resolveDir: pagesDir, loader: "js", sourcefile: `${name}.entry.js` },
    bundle: true,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": JSON.stringify(DEV ? "development" : "production") },
    minify: !DEV,
    nodePaths: NODE_PATHS,
    write: false,
    logLevel: "silent",
  });
  return outputFiles[0].text;
}
