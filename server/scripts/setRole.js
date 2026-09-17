// Grants or revokes a role from the terminal. This is the bootstrap path — the
// first lead has to be promoted here, because the in-app controls for changing
// a lead are themselves lead-only.
//
//   node scripts/setRole.js tarang.gupta2024@vitstudent.ac.in superadmin
//   node scripts/setRole.js someone@vitstudent.ac.in admin
//   node scripts/setRole.js someone@vitstudent.ac.in member
//
// Run with no arguments to list who currently holds what.

require("dotenv").config();
const mongoose = require("mongoose");
const Member = require("../src/models/Member");
const { ROLES } = require("../src/models/Member");

const [email, role] = process.argv.slice(2);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  if (!email) {
    const staff = await Member.find({ role: { $ne: "member" } }).sort({ role: -1, name: 1 });
    console.log(`${staff.length} member(s) hold a role above "member":\n`);
    for (const m of staff) {
      console.log(`  ${m.role.padEnd(11)} ${m.name.padEnd(30)} ${m.collegeEmail}${m.active ? "" : "  (inactive)"}`);
    }
    console.log(`\ntotal members: ${await Member.countDocuments()}`);
    console.log(`\nusage: node scripts/setRole.js <email> <${ROLES.join("|")}>`);
    await mongoose.disconnect();
    return;
  }

  if (!ROLES.includes(role)) {
    console.error(`Role must be one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  const member = await Member.findOne({ collegeEmail: email.toLowerCase() });
  if (!member) {
    console.error(`No member with the email ${email}. Add them to the allowlist first.`);
    process.exit(1);
  }

  // Refuse to remove the last lead here too, so the bootstrap path can't
  // create the lockout the API is careful to prevent.
  if (member.role === "superadmin" && role !== "superadmin") {
    const leads = await Member.countDocuments({ role: "superadmin", active: true });
    if (leads <= 1) {
      console.error("That's the last lead — promote someone else first.");
      process.exit(1);
    }
  }

  const before = member.role;
  member.role = role;
  await member.save();

  console.log(`${member.name} (${member.collegeEmail}): ${before} -> ${role}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
