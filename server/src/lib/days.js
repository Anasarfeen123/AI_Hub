// Calendar days in India time, since that's where every member is. A streak
// that broke at 11:30pm because the server runs in UTC would feel wrong.
const TZ = "Asia/Kolkata";

function dayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

// Monday of the week a day falls in, as YYYY-MM-DD — weeks are the unit for
// streaks, which is kinder than daily ones for students with exams.
function weekKey(day) {
  const d = new Date(`${day}T00:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

// Consecutive weeks with any activity, counting back from this week. This
// week not having activity yet doesn't break the streak until it's over.
function weeklyStreak(days) {
  if (!days?.length) return 0;
  const weeks = new Set(days.map(weekKey));
  const cursor = new Date(`${weekKey(dayKey())}T00:00:00Z`);
  if (!weeks.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 7);
  let streak = 0;
  while (weeks.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}

module.exports = { dayKey, weekKey, weeklyStreak };
