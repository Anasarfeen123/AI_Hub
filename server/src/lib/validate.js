// Request values arrive as whatever the client sent, and the query string
// parser turns `?slug[$ne]=x` into an object. Passing that straight into a
// Mongo filter would become an operator query, so slugs are checked to be
// plain strings of the expected shape before any lookup.
function isSlug(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 200 && /^[a-z0-9/_-]+$/i.test(value);
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { isSlug, escapeRegex };
