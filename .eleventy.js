// QUAICU site build
// =================
// Hand-authored HTML pages (index.html, products.html, etc.) are passed
// through untouched. Eleventy only processes the blog (Markdown + Nunjucks
// templates) and the auto-generated sitemap/RSS feed.

const { DateTime } = require("luxon");
const rssPlugin = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);

  // ---- passthrough: ship the existing static site untouched ----
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("uploads");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("og-card.png");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy({ "admin": "admin" });
  eleventyConfig.addPassthroughCopy("*.html");
  // Cloudflare Pages reads _headers and _redirects from the build output root.
  eleventyConfig.addPassthroughCopy("_headers");
  eleventyConfig.addPassthroughCopy("_redirects");

  // ---- markdown engine inside posts can use njk filters/shortcodes ----
  eleventyConfig.setLibrary("md", require("markdown-it")({
    html: true,
    linkify: true,
    typographer: true,
  }));

  // ---- collections ----
  // Drafts are skipped in production. Set ELEVENTY_INCLUDE_DRAFTS=1 in
  // the local dev shell to preview them.
  const includeDrafts = process.env.ELEVENTY_INCLUDE_DRAFTS === "1";
  const isPublished = (item) => includeDrafts || item.data.draft !== true;

  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("content/blog/*.md")
      .filter(isPublished)
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("tagList", (api) => {
    const tagSet = new Set();
    api
      .getFilteredByGlob("content/blog/*.md")
      .filter(isPublished)
      .forEach((item) => {
        (item.data.tags || []).forEach((t) => tagSet.add(t));
      });
    return [...tagSet].sort();
  });

  // ---- filters used in templates ----
  eleventyConfig.addFilter("readableDate", (d) =>
    DateTime.fromJSDate(d, { zone: "utc" }).toFormat("LLLL d, yyyy")
  );
  eleventyConfig.addFilter("isoDate", (d) =>
    DateTime.fromJSDate(d, { zone: "utc" }).toISO()
  );
  eleventyConfig.addFilter("ymdDate", (d) =>
    DateTime.fromJSDate(d, { zone: "utc" }).toFormat("yyyy-LL-dd")
  );
  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    try {
      return new URL(path, base).toString();
    } catch (e) {
      return path;
    }
  });
  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("readingTime", (text) => {
    const words = (text || "").split(/\s+/).length;
    return Math.max(1, Math.round(words / 220));
  });

  // ---- dev server settings ----
  eleventyConfig.setServerOptions({
    port: 8080,
    showAllHosts: false,
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
