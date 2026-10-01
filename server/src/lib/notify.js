const Notification = require("../models/Notification");

// Adds a notification to one or more members. With a `key`, an existing
// unread notification with the same key is refreshed instead of duplicated —
// ten edits to a saved page are one bell item, not ten.
async function notify(emails, { type, text, link = "", key = "" }) {
  const list = [...new Set((Array.isArray(emails) ? emails : [emails]).filter(Boolean).map((e) => e.toLowerCase()))];
  if (!list.length) return;
  try {
    if (key) {
      await Notification.bulkWrite(
        list.map((email) => ({
          updateOne: {
            filter: { email, key, read: false },
            update: { $set: { type, text, link, createdAt: new Date() }, $setOnInsert: { email, key, read: false } },
            upsert: true,
          },
        }))
      );
    } else {
      await Notification.insertMany(list.map((email) => ({ email, type, text, link })));
    }
  } catch (err) {
    console.error("notify failed:", err.message);
  }
}

module.exports = { notify };
