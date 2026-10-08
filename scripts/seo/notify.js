// Tell search engines about new or changed pages.
//   npm run seo:notify                      all URLs in the live sitemap
//   npm run seo:notify -- /blog/my-post/    only these paths (or full URLs)
//
// 1. IndexNow (Bing, Yandex and others). The key file sits in the repo root.
// 2. Re-submits sitemap.xml to Search Console.
// Run it only after the new build is live. It prints status codes only.

const g = require("./gsc");

(async () => {
  const given = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const urls = given.length
    ? given.map((u) => (u.startsWith("http") ? u : g.ORIGIN + (u.startsWith("/") ? u : "/" + u)))
    : await g.liveSitemapUrls();

  const { key } = g.indexNowKey();
  const keyLocation = `${g.ORIGIN}/${key}.txt`;
  const keyCheck = await fetch(keyLocation);
  if (!keyCheck.ok || (await keyCheck.text()).trim() !== key) {
    console.error("seo:notify: the IndexNow key file is not live at " + keyLocation + ". Deploy first.");
    process.exit(1);
  }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: "quaicu.org", key, keyLocation, urlList: urls }),
  });
  console.log(`IndexNow: ${urls.length} URL(s) -> HTTP ${res.status} (200 or 202 is accepted)`);

  try {
    await g.submitSitemap(g.ORIGIN + "/sitemap.xml");
    console.log("Search Console: sitemap.xml re-submitted (204 = ok)");
  } catch (e) {
    console.error("Search Console sitemap submit failed: " + e.message);
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error("seo:notify failed: " + e.message);
  process.exit(1);
});
