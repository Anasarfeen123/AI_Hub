const Revision = require("../models/Revision");
const Bookmark = require("../models/Bookmark");
const { computeStats } = require("./diffStats");
const { notify } = require("./notify");

// Publishes new text for a page: measures the change, saves the page, records
// a revision, and lets anyone who saved the page know it changed. Used by
// direct edits and by approved suggestions, so both behave identically.
async function publishEdit({ page, body, summary = "", author, publisherEmail }) {
  const stats = computeStats(page.body, body);

  page.body = body;
  page.updatedBy = author.email;
  await page.save();

  const revision = await Revision.create({
    slug: page.slug,
    body,
    authorEmail: author.email,
    authorName: author.name,
    publishedBy: publisherEmail || author.email,
    note: String(summary || "").slice(0, 300),
    ...stats,
  });

  const savers = await Bookmark.find({ slug: page.slug, email: { $ne: author.email } }).select("email").lean();
  await notify(
    savers.map((b) => b.email),
    {
      type: "page-updated",
      text: `${author.name || "Someone"} updated "${page.title}", a page you saved`,
      link: `/${page.slug}`,
      key: `page-updated:${page.slug}`,
    }
  );

  return revision;
}

module.exports = { publishEdit };
