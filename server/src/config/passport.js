const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const Member = require("../models/Member");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value.toLowerCase();
        if (!email) {
          return done(null, false, { message: "Google account has no verified email." });
        }

        // The member allowlist is the only gate: the signed-in Google account's
        // verified email must match an active member. Any domain is fine, so a
        // personal address can be added to the list when someone needs it.
        const member = await Member.findOne({ collegeEmail: email, active: true });
        if (!member) {
          return done(null, false, { message: "This email isn't on the MIC member list." });
        }

        return done(null, { email: member.collegeEmail, name: member.name, role: member.role });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Keep the session tiny (just the email) and re-check the allowlist on every
// deserialize — so revoking a member's access takes effect on their very
// next request, not only after their session cookie expires.
passport.serializeUser((user, done) => done(null, user.email));

passport.deserializeUser(async (email, done) => {
  try {
    const member = await Member.findOne({ collegeEmail: email, active: true });
    if (!member) return done(null, false);
    return done(null, { email: member.collegeEmail, name: member.name, role: member.role });
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
