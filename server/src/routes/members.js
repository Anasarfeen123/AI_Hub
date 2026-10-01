const express = require("express");
const Member = require("../models/Member");
const { ROLES, outranks, rankOf } = require("../models/Member");
const { ensureAdmin, ensureSuperAdmin } = require("../middleware/ensureMember");
const { audit } = require("../lib/audit");

const ROLE_LABEL = { member: "member", admin: "admin", superadmin: "lead" };

const router = express.Router();

// Member management is admin-only. This router is mounted at /api/members,
// so the bare router.use() below cannot leak onto unrelated /api routes.
router.use(ensureAdmin);

router.get("/", async (req, res, next) => {
  try {
    const members = await Member.find()
      .sort({ name: 1 })
      .limit(2000)
      .select("name collegeEmail active role department createdAt lastActiveAt loginCount");
    res.json({ members, viewerRole: req.user.role });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const department = (req.body.department || "").trim();

    if (!name || !email) return res.status(400).json({ error: "Name and email are both required." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "That doesn't look like an email address." });

    const existing = await Member.findOne({ collegeEmail: email });
    if (existing) return res.status(409).json({ error: `${email} is already on the list.` });

    const member = await Member.create({ name, collegeEmail: email, department });
    await audit(req, "Added member", `${name} <${email}>`);
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

// Paste-in bulk add, so onboarding a whole recruitment intake doesn't mean
// typing 250 rows one at a time. Accepts "Name,email" per line — and
// optionally a third "department" column — with or without a header row.
router.post("/bulk", async (req, res, next) => {
  try {
    const text = typeof req.body.text === "string" ? req.body.text : "";
    const fallbackDept = (req.body.department || "").trim();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const added = [];
    const skipped = [];
    const invalid = [];

    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 2) {
        invalid.push(line);
        continue;
      }
      const name = parts[0].trim();
      const email = parts[1].trim().toLowerCase();
      const department = (parts[2] || "").trim() || fallbackDept;

      // Tolerate a header row without reporting it as an error.
      if (name.toLowerCase() === "name" && email === "email") continue;

      if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
        invalid.push(line);
        continue;
      }

      const existing = await Member.findOne({ collegeEmail: email });
      if (existing) {
        skipped.push(email);
        continue;
      }

      await Member.create({ name, collegeEmail: email, department });
      added.push(email);
    }

    if (added.length) await audit(req, "Bulk-added members", `${added.length} member(s)`, added.slice(0, 20).join(", "));
    res.json({ added: added.length, skipped: skipped.length, invalid });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found." });

    const actorRole = req.user.role;
    const isSelf = member.collegeEmail === req.user.email;
    const wantsRole = ROLES.includes(req.body.role) ? req.body.role : null;
    const wantsActive = typeof req.body.active === "boolean" ? req.body.active : null;

    // Guard against an admin locking themselves out of the tools they run.
    if (isSelf && (wantsRole === "member" || wantsActive === false)) {
      return res.status(400).json({
        error: "You can't demote or deactivate your own account. Ask another lead to do it.",
      });
    }

    // You may act on someone you outrank — so one admin cannot demote another,
    // and no admin can touch a lead.
    //
    // Leads are the exception: they may act on each other. Without that, making
    // someone a lead would be irreversible from the app, and a board handover
    // would need database access to undo. The last-lead guard below still
    // stops the club from ending up with none.
    const canAct = outranks(actorRole, member.role) || actorRole === "superadmin";
    if (!isSelf && !canAct) {
      return res.status(403).json({
        error:
          member.role === "superadmin"
            ? "Only a lead can change another lead's account."
            : "You can only manage accounts below your own role.",
      });
    }

    if (wantsRole) {
      // Handing out power is lead-only. A lead may appoint another lead — each
      // tenure brings in a new board — but an admin can create neither an admin
      // (a peer they then couldn't manage) nor a lead (their own superior).
      if (rankOf(wantsRole) >= rankOf("admin") && actorRole !== "superadmin") {
        return res.status(403).json({
          error: "Only a lead can grant the admin or lead role.",
        });
      }

      // Never let the last lead disappear; the club would lose the only
      // account that can appoint admins.
      if (member.role === "superadmin" && wantsRole !== "superadmin") {
        const leads = await Member.countDocuments({ role: "superadmin", active: true });
        if (leads <= 1) {
          return res.status(400).json({ error: "That's the last lead — promote someone else first." });
        }
      }

      member.role = wantsRole;
    }

    if (wantsActive !== null) {
      if (member.role === "superadmin" && wantsActive === false) {
        const leads = await Member.countDocuments({ role: "superadmin", active: true });
        if (leads <= 1) {
          return res.status(400).json({ error: "That's the last lead — promote someone else first." });
        }
      }
      member.active = wantsActive;
    }

    if (typeof req.body.department === "string") {
      member.department = req.body.department.trim();
    }

    const roleChanged = member.isModified("role");
    const activeChanged = member.isModified("active");
    const label = `${member.name} <${member.collegeEmail}>`;
    await member.save();

    if (roleChanged) await audit(req, "Changed role", label, `now ${ROLE_LABEL[member.role] || member.role}`);
    if (activeChanged) await audit(req, member.active ? "Reactivated member" : "Deactivated member", label);
    res.json({ member });
  } catch (err) {
    next(err);
  }
});


// The roster as a spreadsheet, for attendance sheets and follow-ups.
router.get("/export.csv", async (req, res, next) => {
  try {
    const members = await Member.find().sort({ name: 1 }).lean();
    const cell = (v) => {
      const text = v == null ? "" : String(v);
      // Quote anything with a comma, quote or newline; neutralise leading
      // =+-@ so a spreadsheet never runs a member-supplied name as a formula.
      const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const rows = [["name", "email", "role", "active", "department", "last_active", "sign_ins", "added"]];
    for (const m of members) {
      rows.push([
        m.name,
        m.collegeEmail,
        ROLE_LABEL[m.role] || m.role,
        m.active ? "yes" : "no",
        m.department || "",
        m.lastActiveAt ? new Date(m.lastActiveAt).toISOString() : "",
        m.loginCount || 0,
        m.createdAt ? new Date(m.createdAt).toISOString().slice(0, 10) : "",
      ]);
    }
    await audit(req, "Exported member list", `${members.length} member(s)`);
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="mic-ai-hub-members-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(rows.map((r) => r.map(cell).join(",")).join("\n") + "\n");
  } catch (err) {
    next(err);
  }
});

// Permanent removal. Lead-only: deactivating is the everyday tool and is
// reversible; this is for entries that should never have been added (a typo,
// the wrong address). Their past edits and comments keep the name they were
// written under.
router.delete("/:id", ensureSuperAdmin, async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found." });
    if (member.collegeEmail === req.user.email) {
      return res.status(400).json({ error: "You can't remove your own account." });
    }
    if (member.role === "superadmin") {
      const leads = await Member.countDocuments({ role: "superadmin", active: true });
      if (leads <= 1 && member.active) {
        return res.status(400).json({ error: "That's the last lead — promote someone else first." });
      }
    }
    await member.deleteOne();
    await audit(req, "Removed member", `${member.name} <${member.collegeEmail}>`);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
