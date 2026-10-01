const Member = require("../models/Member");

// Notes a successful sign-in. Fire-and-forget: a failed write here should
// never stop someone signing in.
function recordLogin(email) {
  Member.updateOne({ collegeEmail: email }, { $set: { lastActiveAt: new Date() }, $inc: { loginCount: 1 } }).catch((err) =>
    console.error("recording sign-in failed:", err.message)
  );
}

module.exports = { recordLogin };
