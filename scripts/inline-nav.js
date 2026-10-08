// Post-build step: bake the shared nav and footer into the built HTML.
//
// assets/nav.js injects the nav and footer in the browser, so the raw HTML
// of every page has no site-wide links. Crawlers that do not run JavaScript
// (and Googlebot's first pass) would see an orphaned page. This copies the
// NAV and FOOT templates out of nav.js into each page's slot at build time.
// nav.js still runs in the browser: with the slots gone it only wires up the
// mobile menu, scroll progress and the active link.

const fs = require("fs");
const path = require("path");

const SITE = path.join(__dirname, "..", "_site");
const navSrc = fs.readFileSync(path.join(__dirname, "..", "assets", "nav.js"), "utf8");

function template(name) {
  const m = navSrc.match(new RegExp("const " + name + " = `([\\s\\S]*?)`;"));
  if (!m) throw new Error("inline-nav: could not find " + name + " in assets/nav.js");
  return m[1];
}

const NAV = template("NAV");
const FOOT = template("FOOT").replace(
  "<span data-year></span>",
  `<span data-year>${new Date().getFullYear()}</span>`
);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "admin" ? [] : htmlFiles(p);
    return e.name.endsWith(".html") ? [p] : [];
  });
}

let changed = 0;
for (const file of htmlFiles(SITE)) {
  const src = fs.readFileSync(file, "utf8");
  const out = src
    .replace("<div data-nav-slot></div>", () => NAV)
    .replace("<div data-foot-slot></div>", () => FOOT);
  if (out !== src) {
    fs.writeFileSync(file, out);
    changed++;
  }
}
console.log(`inline-nav: baked nav and footer into ${changed} pages`);
