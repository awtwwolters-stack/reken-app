// Encouragement that only ever gives: stars are never lost, and the weekly goal replaces a
// daily streak (research: losing a streak hurts children more than extending it motivates).

const WEEKDAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const STAR_BONUS = { sessionDone: 5, levelUp: 3, weekGoal: 10 };
const STAR_MILESTONES = [25, 50, 100, 250, 500, 1000];

function dateKey(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The 7 date keys of the week (Monday-Sunday) containing `date`.
function weekDateKeys(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return WEEKDAY_LABELS.map((_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return dateKey(day);
  });
}

function daysPractisedInWeek(profile, date) {
  const days = new Set(profile.practiceDays || []);
  return weekDateKeys(date).filter((key) => days.has(key)).length;
}

function weekDots(profile, today = new Date()) {
  const days = new Set(profile.practiceDays || []);
  const todayKey = dateKey(today);
  return weekDateKeys(today).map((key, i) => ({ label: WEEKDAY_LABELS[i], done: days.has(key), today: key === todayKey }));
}

function weekGoalMessage(profile, today = new Date()) {
  const remaining = (profile.weekGoal || DEFAULT_WEEK_GOAL) - daysPractisedInWeek(profile, today);
  if (remaining <= 0) return 'Weekdoel gehaald! Knap gedaan!';
  return `Nog ${remaining} ${remaining === 1 ? 'dag' : 'dagen'} voor je weekdoel`;
}

// Weeks in a row with the weekdoel reached, counting this week only once it's reached.
// A missed week simply starts the count over; the app never mentions it.
function weeksInARow(profile, today = new Date()) {
  const goal = profile.weekGoal || DEFAULT_WEEK_GOAL;
  const week = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (daysPractisedInWeek(profile, week) < goal) week.setDate(week.getDate() - 7);
  let count = 0;
  while (daysPractisedInWeek(profile, week) >= goal) {
    count += 1;
    week.setDate(week.getDate() - 7);
  }
  return count;
}

// Records a finished session today. Returns true when this made the weekdoel reached.
function recordPracticeDay(profile, today = new Date()) {
  const goal = profile.weekGoal || DEFAULT_WEEK_GOAL;
  const before = daysPractisedInWeek(profile, today);
  const key = dateKey(today);
  profile.practiceDays = profile.practiceDays || [];
  if (!profile.practiceDays.includes(key)) profile.practiceDays.push(key);
  return before < goal && daysPractisedInWeek(profile, today) >= goal;
}

// The highest milestone passed going from `before` to `after` stars, or null.
function milestoneReached(before, after) {
  const passed = STAR_MILESTONES.filter((m) => before < m && after >= m);
  return passed.length ? passed[passed.length - 1] : null;
}
