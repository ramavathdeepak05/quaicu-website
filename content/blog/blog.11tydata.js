// Directory data for content/blog. Every .md here inherits these defaults.
// Drafts (draft: true in front-matter) emit no output and are excluded from
// collections unless ELEVENTY_INCLUDE_DRAFTS=1 is set in the shell.
const includeDrafts = process.env.ELEVENTY_INCLUDE_DRAFTS === "1";

module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) => {
      if (data.draft && !includeDrafts) return false;
      return `/blog/${data.page.fileSlug}/`;
    },
    eleventyExcludeFromCollections: (data) =>
      data.draft === true && !includeDrafts,
  },
};
