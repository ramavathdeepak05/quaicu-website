// Shared helpers for the weekly SEO pipeline.
//
// Search Console is called with the Application Default Credentials that
// `gcloud auth application-default login` saved on this machine. The token is
// fetched on demand and kept in memory only: it is never printed or written.
//
// One-time login (as the Search Console owner):
//   gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters,https://www.googleapis.com/auth/siteverification,https://www.googleapis.com/auth/cloud-platform

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const ORIGIN = "https://quaicu.org";
const SITE = "sc-domain:quaicu.org"; // Search Console property
const QUOTA_PROJECT = "quaicu-website"; // Google Cloud project that owns the API quota

const LOGIN_HELP =
  "Run this once in the prompt, signing in as the Search Console owner:\n" +
  "  ! gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters,https://www.googleapis.com/auth/siteverification,https://www.googleapis.com/auth/cloud-platform";

let cached = { value: null, at: 0 };

function token() {
  // Kept in memory for the life of the process only (access tokens last about an hour).
  if (cached.value && Date.now() - cached.at < 45 * 60 * 1000) return cached.value;
  try {
    const t = execSync("gcloud auth application-default print-access-token", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (!t) throw new Error("empty token");
    cached = { value: t, at: Date.now() };
    return t;
  } catch (e) {
    throw new Error("No usable Google credentials.\n" + LOGIN_HELP);
  }
}

async function gapi(url, { method = "GET", body } = {}) {
  const headers = {
    Authorization: "Bearer " + token(),
    "x-goog-user-project": QUOTA_PROJECT,
  };
  if (body) headers["Content-Type"] = "application/json";
  else if (method !== "GET") headers["Content-Length"] = "0";
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {}
  if (!res.ok) {
    const msg = (json && json.error && json.error.message) || text.slice(0, 200);
    const err = new Error(`${method} ${url.split("?")[0]} -> ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

const enc = encodeURIComponent;

function searchAnalytics(body) {
  return gapi(`https://www.googleapis.com/webmasters/v3/sites/${enc(SITE)}/searchAnalytics/query`, {
    method: "POST",
    body,
  });
}

function listSitemaps() {
  return gapi(`https://www.googleapis.com/webmasters/v3/sites/${enc(SITE)}/sitemaps`);
}

function submitSitemap(url) {
  return gapi(`https://www.googleapis.com/webmasters/v3/sites/${enc(SITE)}/sitemaps/${enc(url)}`, {
    method: "PUT",
  });
}

function inspectUrl(url) {
  return gapi("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    body: { inspectionUrl: url, siteUrl: SITE },
  });
}

async function liveSitemapUrls() {
  const res = await fetch(ORIGIN + "/sitemap.xml");
  if (!res.ok) throw new Error("sitemap.xml returned " + res.status);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function indexNowKey() {
  const f = fs.readdirSync(ROOT).find((n) => /^[0-9a-f]{32}\.txt$/.test(n));
  if (!f) throw new Error("IndexNow key file not found in the repo root");
  return { key: f.replace(/\.txt$/, ""), file: f };
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

module.exports = {
  ROOT,
  ORIGIN,
  SITE,
  LOGIN_HELP,
  gapi,
  searchAnalytics,
  listSitemaps,
  submitSitemap,
  inspectUrl,
  liveSitemapUrls,
  indexNowKey,
  isoDate,
};
