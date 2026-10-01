const express = require("express");
const passport = require("passport");

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL;

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login?error=not_allowed`,
  }),
  (req, res) => {
    res.redirect(CLIENT_URL);
  }
);

// Local development only: signs in as any active member without Google, so the
// app can be run against a local database with no OAuth client. It needs BOTH
// NODE_ENV=development and DEV_LOGIN=1, so a production deploy that forgets to
// set NODE_ENV still can't expose it.
if (process.env.NODE_ENV === "development" && process.env.DEV_LOGIN === "1") {
  const Member = require("../models/Member");

  router.get("/dev-login", async (req, res, next) => {
    try {
      const email = String(req.query.email || "").toLowerCase();
      const member = await Member.findOne({ collegeEmail: email, active: true });
      if (!member) return res.redirect(`${CLIENT_URL}/login?error=not_allowed`);
      req.login({ email: member.collegeEmail, name: member.name, role: member.role }, (err) => {
        if (err) return next(err);
        require("../lib/recordLogin").recordLogin(member.collegeEmail);
        res.redirect(CLIENT_URL);
      });
    } catch (err) {
      next(err);
    }
  });

  console.warn("DEV_LOGIN is on: /auth/dev-login?email=… signs in without Google.");
}

router.get("/me", (req, res) => {
  // Signed out is a normal answer here, not an error, so it isn't a 401.
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
});

module.exports = router;
