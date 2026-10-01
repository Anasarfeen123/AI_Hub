const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Page = require("../models/Page");
const Member = require("../models/Member");
const { rankOf } = require("../models/Member");
const { ensureMember } = require("../middleware/ensureMember");
const { isSlug } = require("../lib/validate");
const { audit } = require("../lib/audit");
const { notify } = require("../lib/notify");

const router = express.Router();
router.use(ensureMember);

const MAX_LENGTH = 5000;

function cleanBody(raw) {
  return typeof raw === "string" ? raw.replace(/\r\n/g, "\n").trim() : "";
}

// What the client sees. A deleted comment keeps its place in the thread but
// loses its text and author, so the replies under it still make sense.
function present(c, roles) {
  if (c.deleted) {
    return { _id: c._id, parentId: c.parentId, deleted: true, createdAt: c.createdAt };
  }
  return {
    _id: c._id,
    parentId: c.parentId,
    authorEmail: c.authorEmail,
    authorName: c.authorName,
    authorRole: roles.get(c.authorEmail) || null,
    body: c.body,
    createdAt: c.createdAt,
    editedAt: c.editedAt,
  };
}

async function roleMap(comments) {
  const emails = [...new Set(comments.map((c) => c.authorEmail))];
  const members = await Member.find({ collegeEmail: { $in: emails } }).select("collegeEmail role").lean();
  return new Map(members.map((m) => [m.collegeEmail, m.role]));
}

router.get("/comments", async (req, res, next) => {
  try {
    const { slug } = req.query;
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });

    const all = await Comment.find({ slug }).sort({ createdAt: 1 }).limit(1000).lean();
    // A deleted comment with no live replies is just noise; drop it.
    const liveParents = new Set(all.filter((c) => c.parentId && !c.deleted).map((c) => String(c.parentId)));
    const visible = all.filter((c) => !c.deleted || (!c.parentId && liveParents.has(String(c._id))));

    const roles = await roleMap(visible);
    res.json({ comments: visible.map((c) => present(c, roles)) });
  } catch (err) {
    next(err);
  }
});

router.post("/comments", async (req, res, next) => {
  try {
    const { slug } = req.body;
    const body = cleanBody(req.body.body);
    if (!isSlug(slug)) return res.status(400).json({ error: "A page slug is required." });
    if (!body) return res.status(400).json({ error: "Write something first." });
    if (body.length > MAX_LENGTH) {
      return res.status(400).json({ error: `Comments are limited to ${MAX_LENGTH} characters.` });
    }
    if (!(await Page.exists({ slug }))) return res.status(404).json({ error: "Page not found." });

    let parentId = null;
    let parentAuthor = null;
    if (req.body.parentId) {
      if (!mongoose.isValidObjectId(req.body.parentId)) return res.status(400).json({ error: "Malformed id." });
      const parent = await Comment.findById(req.body.parentId);
      if (!parent || parent.slug !== slug) return res.status(404).json({ error: "That comment no longer exists." });
      // Replies to a reply attach to its top-level comment, keeping one level.
      parentId = parent.parentId || parent._id;
      parentAuthor = parent.deleted ? null : parent.authorEmail;
    }

    const comment = await Comment.create({
      slug,
      parentId,
      body,
      authorEmail: req.user.email,
      authorName: req.user.name,
    });
    if (parentAuthor && parentAuthor !== req.user.email) {
      const page = await Page.findOne({ slug }).select("title").lean();
      await notify(parentAuthor, {
        type: "reply",
        text: `${req.user.name} replied to your comment on "${page?.title || slug}"`,
        link: `/${slug}#comment-${comment._id}`,
      });
    }
    const roles = new Map([[req.user.email, req.user.role]]);
    res.status(201).json({ comment: present(comment.toObject(), roles) });
  } catch (err) {
    next(err);
  }
});

// Only the author may change their words.
router.patch("/comments/:id", async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.deleted) return res.status(404).json({ error: "Comment not found." });
    if (comment.authorEmail !== req.user.email) {
      return res.status(403).json({ error: "You can only edit your own comments." });
    }

    const body = cleanBody(req.body.body);
    if (!body) return res.status(400).json({ error: "A comment can't be empty." });
    if (body.length > MAX_LENGTH) {
      return res.status(400).json({ error: `Comments are limited to ${MAX_LENGTH} characters.` });
    }

    comment.body = body;
    comment.editedAt = new Date();
    await comment.save();
    const roles = new Map([[req.user.email, req.user.role]]);
    res.json({ comment: present(comment.toObject(), roles) });
  } catch (err) {
    next(err);
  }
});

// The author can delete their own comment; admins and leads can remove any,
// which is the moderation path.
router.delete("/comments/:id", async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || comment.deleted) return res.status(404).json({ error: "Comment not found." });

    const isAuthor = comment.authorEmail === req.user.email;
    if (!isAuthor && rankOf(req.user.role) < rankOf("admin")) {
      return res.status(403).json({ error: "You can only delete your own comments." });
    }

    const original = comment.body;
    comment.deleted = true;
    comment.body = "[deleted]";
    await comment.save();
    // A member deleting their own comment is routine; a moderator removing
    // someone else's is worth a record.
    if (!isAuthor) {
      await audit(req, "Removed a comment", `by ${comment.authorName || comment.authorEmail} on /${comment.slug}`, original.slice(0, 200));
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
