// Encouragement that only ever gives: stars are never lost, and the weekly goal replaces a
// daily streak (research: losing a streak hurts children more than extending it motivates).

const WEEKDAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const STAR_BONUS = { sessionDone: 5, levelUp: 3, weekGoal: 10 };
// Close together at first so the first characters come quickly (~30 stars per session), slower later.
const STAR_MILESTONES = [25, 50, 100, 150, 200, 300, 400, 500, 650, 800, 1000, 1250, 1500, 2000];
// One character per milestone; the seed of the later story/character idea.
const COLLECTION = [
  { emoji: '\u{1F98A}', name: 'Vos Fien' }, { emoji: '\u{1F989}', name: 'Uil Otto' },
  { emoji: '\u{1F422}', name: 'Schildpad Tuur' }, { emoji: '\u{1F419}', name: 'Octopus Olly' },
  { emoji: '\u{1F981}', name: 'Leeuw Leo' }, { emoji: '\u{1F43C}', name: 'Panda Pim' },
  { emoji: '\u{1F992}', name: 'Giraf Gijs' }, { emoji: '\u{1F42C}', name: 'Dolfijn Dex' },
  { emoji: '\u{1F994}', name: 'Egel Eef' }, { emoji: '\u{1F438}', name: 'Kikker Koos' },
  { emoji: '\u{1F984}', name: 'Eenhoorn Elin' }, { emoji: '\u{1F432}', name: 'Draak Doris' },
  { emoji: '\u{1F98B}', name: 'Vlinder Vera' }, { emoji: '\u{1F433}', name: 'Walvis Wim' }
];

// Unlocked characters follow from the star total, so nothing extra needs storing.
function unlockedCharacters(stars) {
  return COLLECTION.slice(0, STAR_MILESTONES.filter((m) => stars >= m).length);
}

function charactersUnlockedBetween(before, after) {
  return unlockedCharacters(after).slice(unlockedCharacters(before).length);
}

// { previous, next, progress 0..1 } towards the next milestone; next is null when all are reached.
function starGoal(stars) {
  const next = STAR_MILESTONES.find((m) => m > stars) || null;
  const previous = STAR_MILESTONES.filter((m) => m <= stars).pop() || 0;
  return { previous, next, progress: next ? (stars - previous) / (next - previous) : 1 };
}

// The parent's family reward, e.g. { stars: 200, text: 'samen pannenkoeken bakken' }.
function familyGoalReachedBetween(goal, before, after) {
  return !!goal && before < goal.stars && after >= goal.stars;
}

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
