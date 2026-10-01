const express = require("express");
const mongoose = require("mongoose");
const Image = require("../models/Image");
const { ensureMember } = require("../middleware/ensureMember");
const { isSlug } = require("../lib/validate");

const router = express.Router();

// Atlas's free tier is 512 MB in total, so images stay small. Screenshots and
// diagrams fit easily; the editor tells people to compress anything bigger.
const MAX_BYTES = 1.5 * 1024 * 1024;

// The type is decided by the file's own first bytes, never by what the
// browser claims, so a renamed script can't be served as an "image". SVG is
// deliberately not accepted: it can carry script.
function sniff(buf) {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString("ascii"))) return "image/gif";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

// Raw bytes in the body; the client sends the file as-is.
router.post(
  "/images",
  ensureMember,
  express.raw({ type: () => true, limit: MAX_BYTES + 1 }),
  async (req, res, next) => {
    try {
      const buf = req.body;
      if (!Buffer.isBuffer(buf) || buf.length === 0) return res.status(400).json({ error: "No image received." });
      if (buf.length > MAX_BYTES) return res.status(413).json({ error: "Images must be under 1.5 MB — try a screenshot or compress it first." });
      const type = sniff(buf);
      if (!type) return res.status(400).json({ error: "Only PNG, JPEG, GIF or WebP images can be uploaded." });
      const slug = isSlug(req.query.slug) ? req.query.slug : "";
      const img = await Image.create({ data: buf, contentType: type, size: buf.length, uploadedBy: req.user.email, slug });
      res.status(201).json({ url: `/api/images/${img._id}` });
    } catch (err) {
      next(err);
    }
  }
);

// Images are part of members-only pages, so they're members-only too.
// They never change once uploaded, so browsers may cache them for a long time.
router.get("/images/:id", ensureMember, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
    const img = await Image.findById(req.params.id).lean();
    if (!img) return res.status(404).end();
    res.set("Content-Type", img.contentType);
    res.set("Cache-Control", "private, max-age=31536000, immutable");
    res.set("X-Content-Type-Options", "nosniff");
    res.send(img.data.buffer ? Buffer.from(img.data.buffer) : img.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
