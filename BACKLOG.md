# Reken App — Backlog

_Last updated: 2026-10-25 · Status: see "Now" below._

Size: **S** = small change · **M** = one focused build session · **L** = several sessions

---

## Now (2026-10-25)

**Version 2026-10-25.36 (tafels van 11 en 12, D21; safe sync between iPads, D20).** Children in groep 3, 5 and 6 practise on shared iPads, synced through the family's own Firebase project (D12); the backup also holds a groep-8 profile with two practice days.

**What the backup of 2026-10-25 showed** (two weeks of D15–D19):
- Sessions get finished again: the groep-6 child 8 of 11 since 11 October (2 of 10 before), stops right after a worked solution 1 (was 5). Groep-3 child 11 of 17, groep-5 child 3 of 4 (but practised less).
- Tempo-rondes are played: groep-5 child 4 rounds (best 35, passed twice), groep-6 child 3. Park: used by every child, no sign it keeps them from practising; the groep-3 child has earned 1.127 ★ and spent 751 (376 in the spaarpot), so they spend most of what they earn.
- **Two sync bugs** changed progress without anyone noticing → fixed in D20, with a one-time repair (groep-6 child +39 ★ and the 21 October practice day back; groep-8 child's minus level 5 → 4).
- **The groep-3 child's minus level 2 (only the starting dots, D16) doesn't work:** 18% right first time; in 46 of 75 wrong answers the child typed the first number of the sum (9 − 2 → "9"): they count the dots. The level went 1 ↔ 2 nineteen times. Splitsen with starting dots works (no counting).
- Drops of more than one level in one session: 5 times since 11 October, worst 3 levels in klokkijken (groep-6 child).

**Next, child-facing first:**
1. **Groep-3 child, minus level 2** (plan mode, choices to the parent): how should the in-between level make the child take away instead of count? For example the child taps dots to cross them out, as on paper.
2. **Open choice for the parent:** at most one level drop per skill per session (D15). The backup supports it (above).
3. **Name buttons for children who can't read yet** (from the backup: wrong name tapped and left again): an animal or colour per child. Choices to the parent.
4. Small leftovers from the D20 review (only if real use shows them): the spaarpot can go below zero when the same stars are spent on two iPads before they sync; the lost-session repair repeats the star rules of js/app.js; `js/cloud.js` keeps each child's base and signature, the same content twice.

**Open checks (need a real iPad or real use):**
- **D20 on two iPads:** on iPad A practise a few sums with one child; sign out iPad B (the child-picker shows "Deze iPad deelt de voortgang nu niet"), practise there with the same child; sign B in again. Both sessions' stars, practice days and levels should be on both iPads. And: the groep-6 child has 39 ★ more, the groep-8 child's minus level is 4.
- **Tempo-ronde (D19):** one round on the old iPad (iOS 15): does the keyboard come up on "Start!" and stay up between the sums, in portrait and landscape? Is 30 right in 2 minutes a sensible threshold for typing on an iPad (the method's 40 is on paper)? Which edition of the method does the school use (the weektaak says "Speed"/"Power" in edition 5)?
- Tap "Controleer de app op dit apparaat" (Ouder overzicht) on the old iPad (iOS 15) and send a photo of the result.
- One clock sum in landscape with the keyboard up: clock on the left, answer boxes and hint on the right, no scrolling.
- **Mijn park:** has the parent read the 15 story chapters? Does the groep-3 child understand the spaarpot?

**Next steps, in the agreed order (D13):**
1. ~~Rest of groep 6, small part~~ ✅ (320 : 4, ¾ van 12, self-check)
2. ~~Klokkijken~~ ✅ (D14)
3. **From the backup of 2026-10-11 (before motivation, the parent's order):**
   - ~~Groep-6 child: levels and confidence~~ ✅ (D15)
   - ~~Groep-3 child: in-between level with only the starting dots; keyboard-mashing isn't a mistake~~ ✅ (D16)
   - ~~Groep-5 child: a mastered skill once per session~~ ✅ (D16)
   - ~~A topic opens with a worked example~~ ✅ (D17)
4. ~~Motivation: the animals in a story, spending stars (M-02)~~ ✅ Mijn park (D18)
5. Small leftovers from the code review of 2026-10-11 (only if the data shows they matter): the quick-start correction only looks at the last level change, so an older quick-start climb followed by a ceiling change is never corrected; keyboard-mashing isn't written in the session log; "Gemiddeld niveau nu" in the overview averages level numbers of skills with different numbers of levels.
6. Later, when the class and the data say so: tijdsduur (groep 6), kommagetallen (B-05), a hint "reken onder elkaar" for big plus/min sums, the rest of breuken step 2 (B-03b), geld, the youngest child (S-04).

The sections "Where we are: V1" and "Roadmap (confirmed 2026-09-23)" below are history; decisions D9–D19 replaced that order.

---

## What we're building: goal and principles

**The goal.** A playful maths practice app for the family's own children, in the spirit of commercial apps like Squla but made for these children and their school. For each child it answers one question: **"Wat zijn de nuttigste 10–15 minuten rekenen voor dit kind op dit moment?"**

**Who it is for.**
- Four children, from groep 1 to groep 6 in 2026–27; three practise now (groep 3, 5 and 6).
- They share several iPads and take whichever is free, so every child continues where they were on any iPad (D12).
- The parent is not a developer: the app must stay simple enough to understand, explain and maintain.

**What a child experiences.**
- They pick their name and practise for 5–10 minutes. They never choose what to practise; the app does.
- The sums fit their level: the app finds it quietly while they practise and aims for about 75–85% right the first time.
- A mistake is never punished: hint → hint → worked solution → later a similar sum.
- It is in Dutch, with the notation and strategies of their school (De Wereld in Getallen). The app complements school and never teaches a competing method.
- Practising is rewarding: earned stars that are never lost, a week goal instead of a daily streak, an optional family reward (D7, D8), and their own animal park: the animals move in with a running story, and stars from the spaarpot buy things for the park (D18).

**Principles behind every choice.**
- **Simple over sophisticated:** explainable rules, no machine learning. The app can always say why it chose a sum (Ouder overzicht).
- **Curriculum as data:** adding a groep or a topic is mostly adding data.
- **Child-facing first:** what the child sees comes before parent tooling.
- **Privacy:** only first name, groep, stars, results and the child's park are kept; nothing about the children in the public repository.
- **Real use steers:** build small, let the children use it, read the logs, then decide.

**Success looks like:** a child starts on their own, finishes a session, gets sums that feel right for their groep, gets help that actually helps, and the next session is a little better targeted. For the groep-6 child the first aim is confidence.

## Where we are: V1 compared with the spec

| Spec item | Status | Note |
|---|---|---|
| Curriculum as data | ✅ | `curriculum/group-6.js`, so it runs without a server |
| Exercise generation (core arithmetic) | ✅ | 12 skills; Dutch wording (tientallen/honderdtallen), same-length comparisons, ~20% aanvullen/te-veel practice (R-08, R-09) |
| Answer checking | ✅ | Dutch notation accepted (`45.230`); `45.23` or letters get a friendly message and don't count as a mistake (R-02) |
| Hint ladder + later re-check | ✅ | Hints use the class's strategies: rijgen, aanvullen, rijgen met te veel (De Wereld in Getallen); every step machine-checked (R-09) |
| Mastery per skill | ✅ | Starts at early-groep-6 level; right level reached within 2 practised sessions for 92–96% of skills in simulation (R-03, R-04) |
| Adaptive selection | ✅ | Focused sessions of 4–6 skills; weak skills get ~1.7–1.9× the practice of review skills (R-05) |
| 10–15 minute session | ✅ | ~10 min of active practice (~25 exercises), progress bar, no clock (R-06) |
| Session summary | ✅ | Grouped by category: Sterk / Nog even oefenen (R-08) |
| Local progress | ✅ | Backup/restore file from the parent view (Q-03); pick one browser on the iPad (Safari and Chrome keep separate progress) |
| Parent/debug view | ✅ | Session history: every answer, hints, time, why picked, level changes; stopped-early sessions visible (R-07) |
| **Success criterion:** "next session slightly better targeted" | ✅ in simulation | To be confirmed with real use (T-01) |

**Bottom line (2026-09-23):** the adaptive core now delivers in simulation: it starts at the right level, adapts within 1–2 sessions, and sessions last ~10 minutes. What's left before daily use: a check on the real iPad (R-01). Cijferend rekenen hints are not built yet: the class introduces it later in groep 6 — add when the rekenschrift shows it.

---

## Decisions

| | Decision | Consequence |
|---|---|---|
| D1 | **Device:** iPad only | The app must be hosted as a web page (R-01). No syncing between devices needed. A progress backup still matters earlier, because Safari can clear stored data → Q-03 moved up |
| D2 | **Session length:** time-based, about 10 minutes (**8 minutes since 2026-10-11**, the parent's call; groep 3 keeps 5) | Finishes after the current exercise once the time is up. No visible clock; a progress bar instead → R-06 |
| D3 | **Session shape:** focused, 4–6 skills | Several exercises per skill; weak skills get extra repetitions → R-05 |
| D4 | **Breuken:** built in parallel with the test period | Breuken work starts right after Phase 0 |
| D5 | **Hosting:** GitHub Pages, public repository (free) | No login needed on the iPad, so the child never uses a parent's account. The code is backed up online. Family details stay out of the repo |
| D6 | **Winter focus (2026-09-23):** complete groep 6 before bringing a second child on board | Phase 3 before Phase 5; siblings from spring 2027 |
| D7 | **Motivation + profiles before the test (2026-09-23):** name picker; groep from birth date (parent confirms); a younger sibling may practise groep-6 content for now with a banner, an easier start and separate progress; stars for every sum finished correctly (also with a hint) + bonuses; **weekdoel (default 4 days) instead of a daily streak** (research: streak loss causes anxiety in children) | M-01 and S-01 done early; T-01 now also tests the motivation, so we can't separate 'comes back for the maths' from 'comes back for the stars' |
| D9 | **Siblings now, not spring 2027 (2026-09-28):** the groep-3 and groep-5 siblings wanted to practise. Every skill carries the groepen it is for (`groepen: [from, to]`); a child only sees skills for their own groep and starts at the beginning-of-year level of that groep. Groep 3 gets 5 new skills (tellen, rijtjes, splitsen, + and − tot 20) with dot pictures, **5-minute sessions** and a **🔊 read-aloud button** (device's own Dutch voice, only on a tap). Groep 5 keeps the existing skills at groep-5 starting levels; the "groep 6" banner and the parent checkbox are gone. No new groep-5 topics yet | Moves part of Phase 5 (S-02) forward; the rest of groep 6 (Phase 3) moves back correspondingly. Klokkijken and geld are the next groep-5 candidates: each needs a new picture and a new answer format, so each is its own build |
| D10 | **Even difficulty and a confident start (2026-09-29):** keersom levels by *kind* of sum instead of a maximum (× tientallen → 3 × 24 → 7 × 48 → 6 × 78); every new skill starts **one level below** the groep estimate; a child can climb to at most **one groep above** their own; sums written the school way (`5 × 6`, `6 × 78`, `×`), tafel hints via steunsommen, keersom hints via splitsen; a **pause** button (and automatic pause when the app goes to the background) | Simulation: a child who finds it hard scores 74% instead of 56% in their first session; later sessions barely change (67–69%), which the child's real data should confirm. Side effect, accepted: relabelling plus/min/delen level 3 to groep 6 makes an existing groep-6 child's settled levels count as one below the estimate, so her remaining new skills start a little lower still. See "Aansluiting lesmethode" |
| D11 | **Lessons from the logs of 2026-09-29:** a new plus/min level 3 with *handy* numbers (560 − 240, 4.500 − 1.200, 473 − 298; groep 6), random 4-digit sums with inwisselen back to groep 7; hints "met de kleine som" for round numbers (42 − 20, then 00 back), as in the rekenboek; splitsen shown as a **split picture** (whole on top, two boxes below) instead of `10 = 7 + ?`; a right answer after more than 90 s (pauses excluded) counts as right but **not towards a level up** | Stored plus/min levels 3–4 move up one (one-time conversion); a groep-5 child then comes back to the new level 3 via the ceiling |
| D12 | **Cloud sync between iPads (2026-09-30):** the children take whichever iPad is free. Firebase (free Spark plan, EU `europe-west4`; Supabase pauses free projects after 7 idle days); the parent signs in once per iPad with Google (an e-mail link would open in Safari, not Chrome). One cloud document per child, so children on different iPads never conflict; the same child on two iPads at once: last save wins. Offline-first: localStorage stays the working copy. **Privacy:** only name, groep, stars and results; **no birth date** any more - the groep moves up by itself every 1 August (`groep` + `groepSchoolYear`). Access is limited by `firestore.rules`; the app warns if the rule is open | The parent creates the Firebase project; the config goes in `js/cloud-config.js` (not secret). Until then sync is off and nothing changes |
| D13 | **Order of the next steps (2026-10-10):** rest of groep 6 (small part) → klokkijken → motivation (story, spending stars); kommagetallen and "reken onder elkaar" wait for the class and for the groep-6 child's data. **¾ van 12 is built as a higher level** instead of waiting for the class (replaces "wait for B-04" for this item): a child only reaches it by climbing, and the hint explains it with the strook. **Self-check with every new kind of sum** (`js/selftest.js`, button in the Ouder overzicht): three faults had only shown up on the real iPads (iOS 15 start-up, landscape layout never switching on, stale page copy) | Run the self-check before every release; ask the parent to tap it on the old iPad after bigger changes |
| D14 | **Klokkijken (2026-10-10):** three skills in the category Klok: hele uren for groep 3 (one answer box), the wijzerklok in five levels (hele/halve uren → kwartieren → 5 minuten → to the minute → with dagdeel) and tijd in woorden (kwart voor 4, 10 voor half 4). Answers as uur : minuten. At a wijzerklok 3:15 and 15:15 both count; **with a dagdeel only the 24-hour time counts** (the parent asked for 24-hour where it becomes digital). Tijdsduur follows later | The landscape layout now puts the hint in the right column so a clock keeps its size (170 px instead of 120) |
| D15 | **Confidence before climbing (2026-10-11):** (1) the quick start rule (3 right in a row) lifts a child no higher than the level of their own groep; above it only the steady rule (8 answers, 90% right and fast) moves up. (2) Levels the quick start already put above the own groep, without 5 fast right answers there, go back to the own-groep level the next time that skill comes up. (3) A worked solution lowers the level by one at once. (4) A session opens with 2 sums from skills the child does well, and the sum after a worked solution is one too | Costs: a strong child reaches the level above their groep later (after 8 good answers instead of 3). Also: Ouder overzicht shows all children together, the name in every session row, and a table per child for the last 7 days |
| D16 | **Smaller steps and less of the same (2026-10-11):** (1) splitsen and min tot 20 get a level in between that shows only the starting number as dots (`"dots": "start"`): the child takes away or splits in their head, and the full picture is the first hint. (First built as "half of the sums keep the picture", which was not what the parent had chosen; corrected the same day). (2) An answer at least two digits longer than the right one (a hand on the keyboard) is not counted as a mistake: a friendly line, and the child tries again. (3) A mastered skill (at the highest level the child can reach, 8 answers 90% right and fast) comes up once per session, and a session holds at most one such skill | Levels are stored by number, so the new level shifted the higher levels of those two skills up by one; only the groep-3 child had progress there, and for him level 2 now means the starting dots (intended). Plussommen kept its levels |
| D17 | **A worked example before the sum (2026-10-11):** the same kind of sum with its worked solution and picture, to look at ("Nu ik!"), not to answer. Shown once for every skill that doesn't go well yet (new, or under 80% right), and once per session for a skill that clearly goes badly (under 60% of 5 answers). It doesn't count as a sum: no time, star or level. The strook solution now names both places (onder de streep, boven de streep) | Existing children get these examples spread over their next sessions, once per skill that isn't going well. Skills that go well never show one. A child who can't read gets the picture and the 🔊 button |
| D18 | **Mijn park (2026-10-11), M-02:** every child gets their **own park** (a 6-wide grid that grows a row with every animal, up to 10). **Stars are really spent** (the parent's choice: learning to handle money), which replaces "stars are never spent" from D7/D8. To keep "nothing earned is lost": `stars` stays the earned total, and the animals, story chapters and family goal follow it; buying only empties the **spaarpot** (earned minus the prices of everything bought; the price paid is stored per item). **Looking is always possible, buying only on a day the child finished a session.** A **spaardoel** ("Ik spaar voor de fontein") shows on the start screen. A **running story**, "Het vergeten park" (15 short chapters, one per animal, each ending with a hint about the next; 🔊 for everyone), with the children's own grandparents: Opa Kip and Opa Haan built the park and hid the treasure hunt, opa Peter and oma Elly keep the shop, and all four visit in the last chapter. They are alive and well in the story (the park "slept"); first names allowed by the parent. 38 shop items, 3–250 ★, two or three new ones per chapter; buying shows the sum ("165 − 90 = 75"). The park (items, tiles, chapters read) is kept in the child's cloud document too: nothing personal | Existing stars all go into the spaarpot at launch. The story ends at 2000 ★ (about 4 months at the weekdoel): a season 2 is needed then (M-03). Park time isn't in the log yet; the parent watches whether it competes with practising |
| D19 | **Tempo-ronde (2026-10-11):** the tafels against the clock, as a separate button on the start screen (from groep 5), never inside the normal session. The form is the method's tempotoets: **2 rounds of 1 minute, the score is the total right**. Four kinds: tafels (`7 × 6 = ?`), omgekeerd (`? × 6 = 42`), deeltafels (`42 : 6 = ?`) and door elkaar, from the tafels of 2–10 times 2–10. **One approach for every child** (the parent: at school everyone gets the same test), each at their own level: groep 5 starts with the tafels and opens the next kind after 30 right, twice; from groep 6 all four are open. The child plays against their **own record**: no pass mark, no right/wrong and no hints during the round, afterwards at most three sums "die je nog tijd kosten" (wrong first, then slower than 5 s). ✕ or leaving the app drops the round. **Stars: 3 per finished round plus 5 for a new record; a round is not a practice day for the weekdoel** (the parent's choices). **A visible time bar is allowed here only**, which replaces Q-01's "no visible timer" for this round; the normal session stays without a clock. Records live on the child's profile, so they sync. Not yet: the slow sums coming back in the normal session, tempo for plus/min (the method's signaleringstoetsen, 2 × 2 minutes), tempo results counting for levels | The groep-5 child answers the tafels 95–100% right in 3–5 s and stopped finishing sessions: speed is the challenge that was missing. Source: De Wereld in Getallen 4, Tempo- en signaleringstoetsen groep 5–8 (Malmberg): tempotoets = 2 opgaven of 1 minute, "tussen de 3 en 5 seconden" per sum, deeltafels end of groep 5 about 40 right in 2 minutes (a proposal to spot who falls behind, not a pass mark); tafel tempotoetsen in 5a blok 2 and 4 and 5b blok 4. The threshold of 30 is an estimate for typing and must be tuned |
| D20 | **Safe sync between iPads (2026-10-25):** (1) a new iPad starts with every one-time conversion marked done (`MIGRATIONS` in `js/storage.js`), so children from the cloud are never converted twice. (2) A child is written in one server step (Firestore transaction) that first **combines** this iPad's copy with the cloud's (`mergeProfile`): from the version both started from, stars and sums add up, per skill the latest practice wins, practice days, tempo rounds and park purchases from both sides are kept (bought on two iPads = there twice, paid twice: the parent's choice), a restored backup wins whole. Offline the step fails instead of queueing an overwrite; it is retried. Signing out no longer forgets the account, so signing in again combines from where the iPad left off. (3) The child-picker says "⚠️ Deze iPad deelt de voortgang nu niet" when an iPad is signed out (the parent's choice). (4) A one-time repair on the cloud's copy (once for the family): a finished session from before D20 that a child's progress lost gets its day, stars and sums back; a plus/min level converted twice goes one down (the parent's choice: repair both) | Backup of 2026-10-25: a fresh iPad converted the groep-8 child's minus level a second time (3 → 5 without practice); an iPad that had been signed out sent its old copy of the groep-6 child over the 21 October session (31 sums, 39 ★). Both changed progress without anyone noticing |
| D21 | **Tafels van 11 en 12 (2026-10-25), the parent's choice:** two extra skills, 1 × 11 … 12 × 11 and 1 × 12 … 12 × 12 (levels: × 1–5, × 1–10, × 1–12, then half reversed), for groep 5 and up. **Beyond the method** (De Wereld in Getallen automates t/m 10), so this partly reverses R-08 on purpose. They come **only while the tafels 6–9 go well** (practised, recent answers at least 75% right; `onlyWhenPrerequisitesGoWell`), also after they have started, so they never push those out. In the **Tempo-ronde** a tafel of 11 or 12 joins once the child practises it up to × 12 in the session (level 3); records are kept, rounds get a bit harder | Parent's request. Sources disagree: some practice sites put 11 and 12 in groep 5, no method source found. Backup of 2026-10-25: the tafels 6–9 go well for the groep-5 and groep-6 children (88–100%) |
| D8 | **Stars get a direction (2026-09-24):** visible next goal, a character collection (one animal per milestone, the seed of M-02), and an optional family reward set by the parent. Auto-continue 1.5 s after a correct answer | Stars stay never-spent; spending comes with M-02 |

## Roadmap (confirmed 2026-09-23)

Driven by **triggers, not dates**: several steps depend on what the test shows or on when school reaches a topic.

| When | What | Trigger |
|---|---|---|
| **Now, ~2 weeks** | **T-01 test.** No new features; only fix what the test reveals | Child uses the app on the iPad (Chrome) |
| After T-01 | Decision moment: tune difficulty / light progress feeling (M-01) / move on | What was observed |
| When school reaches it | Breuken step 2 (B-03b), then kommagetallen (B-05); cijferend hints | Teacher, weektaak or rekenschrift (B-04) |
| Before any new domain | **Q-02** permanent automatic correctness checks (pulled forward) | Start of Phase 3 |
| Winter 2026–27 | **Phase 3:** rest of groep 6, in the school's order (D6) | After T-01 + quality |
| Only with evidence | Phase 4 motivation (story/character) | T-01 shows motivation is the bottleneck |
| ~~Spring 2027~~ Pulled forward (D9) | Phase 5: profile picker + siblings' curricula (S-01 ✅, S-02 ◐ groep 3 done, groep 5 on existing skills) | Siblings asked to practise |
| **By summer 2027** | Groep 7 curriculum (S-03) | New school year: the one real deadline |

---

## T-01 feedback log

| Date | Observation (real use) | Evidence | What we did |
|---|---|---|---|
| 2026-09-24 | Groep-5 sibling, first session: "Rond 730 af op tientallen" made no sense | 5% of rounding exercises were already round | Never pick an already-round number |
| 2026-09-24 | Same exercises came back within a session | 11.8% exact repeats (tafels ×1–5: 5 facts; halves/quarters: 4) — and 6 × 5 asked 3× in one session | Session memory → 2.3% (only when a skill's variations are used up) |
| 2026-09-24 | Difficulty varied a lot between exercise types | "Level 1" meant groep 3–4 for optellen but groep 5 for getalbegrip; 4 of 6 skills moved up within the session | Every level labelled with its groep; new skills start at the child's own groep |
| 2026-09-24 | Tafels ×1–5 too easy; tafels t/m 10 are known | De Wereld in Getallen: 0–5 + 10 by end groep 4, all 0–10 by mid groep 5; tafels answered in 5–6 s | Groep 5 starts at ×1–10, groep 6 at the reversed form (6 × ? = 42) |
| 2026-09-24 | Tapping Volgende after every correct answer | — | Auto-continue after 1.5 s; mistakes still wait for a tap |
| 2026-09-24 | Child curious where 48 ★ leads (good signal) | — | D8: next goal, collection, family reward |
| 2026-09-24 | Parent testing: keyboard didn't come up for the next sum; question should stay visible with the keyboard up; option to remove a child | The auto-continue has no tap, and iPads only open the keyboard on a tap; in landscape the worst case (fraction + picture + hint) ended 127 px below the keyboard | The answer box is reused and stays focused, so the keyboard stays up; hints moved above the box; card at the top during practice; landscape splits question and answer side by side; 'verwijderen' in child setup |
| 2026-09-24 | Session overall | 27 sums in ~11 min, finished; **81% right first time (target 75–85%)**; the 5 slowest sums were exactly the 5 mistakes; rounding the weak spot | No action: calibration working as designed |
| 2026-09-28 | Landscape with keyboard: text sometimes too big to see the whole sum without scrolling | Long word problems and worked solutions made the card taller than the space above the keyboard | Word problems start in a smaller font; the whole practice screen shrinks step by step (to at most 60%) until it fits, and grows back when the keyboard goes down; answer boxes never below 16px (iPad zooms in below that) |
| 2026-09-29 | Multiplication felt uneven: from 6 × 5 to 78 × 6 (groep-5 child) | 78 × 6 only existed at keersom level 3, labelled groep 7; the child had climbed two levels in calibration. Within that level answers ranged 20–891 | D10: levels by kind of sum (level 4 now 306–891, level 2 22–145), ceiling one groep above own groep |
| 2026-09-29 | Parent: the groep-6 child finds it hard; wants her to gain confidence | Tuning notes (R-04): a child one level below the estimate scored ~50% in session 1 | D10: gentle start (one level lower); simulated 56% → 74% in session 1. Her real data still to be checked (backup, never stored in the repo) |
| 2026-09-29 | Children sometimes need to stop for a moment | — | Pause button; pause also when the app goes to the background; paused time isn't counted |
| 2026-09-30 | Children enthusiastic; they take whichever iPad is free | Progress lived per iPad | D12: cloud sync |
| 2026-09-29 | Logs, groep-6 child | No sessions yet: "finds it hard" is about school, not the app | First session will start at groep-5-ish levels (gentle start); check her data after a few sessions |
| 2026-09-29 | Logs, groep-5 child: 3 sessions, 81% / 85% / 86% right first time | 4-digit subtraction with inwisselen (4.850 − 3.966, 4.121 − 2.756): 162–239 s, worked solution shown twice. School teaches this mid groep 6, written out | D11: handy-numbers level in between; random 4-digit sums groep 7 |
| 2026-09-29 | Same child: delen met rest right every time, but 116–193 s per sum | Correct answers moved the level up regardless of time | D11: slow right answers don't count towards a level up (watch whether the pause button already explains the slowness) |
| 2026-09-29 | Logs, groep-3 child: 20 of 21 right first time, levels climbing | The one miss: `10 = 7 + ?` answered "10" first, i.e. read left to right as "the answer is 10" | D11: split picture instead of the formula |
| 2026-10-11 | Backup, groep-6 child: two full sessions at 89% and 86%, then seven stopped ones | The quick start lifted seven skills in ten minutes, three to groep-7 levels (optellen to 50.000, aftrekken with inwisselen). Six of the seven stops came right after a failed or very slow sum, one of them the first sum of the session | D15 |
| 2026-10-11 | Backup, groep-3 child: practises daily | Min tot 20: 90% with dots, 12% without; five level changes up and down. Splitsen went from 5/17 to 6/6 after the split picture | Next: an in-between level (see Now) |
| 2026-10-11 | Backup, groep-5 child: no finished session since 3 October | Tafels 95–100% in 3–5 s; one session of 85 sums was 80% tafels | Next: mastered skills at most once per session (see Now) |
| 2026-10-25 | Backup: the groep-6 child's 21 October session (31 sums) is in the log but not in their progress | An iPad that had been signed out kept an old copy of the child and sent it over the newer one when it signed in again; the progress of that day (39 ★, the practice day, five skills) was gone | D20: combine instead of overwrite; one-time repair |
| 2026-10-25 | Backup: the groep-8 child's minus level is 5, its last recorded change put it at 3 | A fresh iPad (Safari empties a site's storage after about 7 days without a visit) ran the one-time conversion of 29 September again on children that came from the cloud already converted | D20: a new iPad starts with all conversions done; one-time repair |
| 2026-10-25 | Backup, groep-3 child: minus level 2 (starting dots only) 18% right first time | 46 of 75 wrong first answers were the first number of the sum: the child counts the dots. Level 1 ↔ 2 nineteen times in two weeks | Next (see Now): a different in-between level, choices to the parent |
| 2026-10-25 | Parent: do children sometimes practise under each other's name? | No sums that look like another child's (speed and score per child are steady). But the wrong name is tapped and left again: five times a session on the groep-8 profile without a sum, then within a minute the groep-3 child, whose button is right below it | Proposal: an animal or colour per child on the name buttons (a child who can't read yet) |
| 2026-10-11 | Parent: hard to scan who did what in Ouder overzicht | Sessions were listed per chosen child only | All children in one list with the name first; a 7-day table per child |
| 2026-09-28 | Groep-3 and groep-5 siblings excited and want to practise | Groep-3 goals (De Wereld in Getallen and SLO sources): counting to 20 with the five-structure, splitsen incl. vriendjes van 10, + and − to 10 then 20 | D9: groep-3 skills with dot pictures, 5-minute sessions, 🔊; simulated groep-3 child: levels settle at the child's real level, 0 repeats in 100 sums |

## Aansluiting lesmethode (checked 2026-09-29)

Checked against a De Wereld in Getallen groep-6 werkboek (blok 7) that a school published online, the groep-5/6 doelen of a school using the method, and earlier groep-3 sources (see D9). The method books themselves aren't public; **the strongest check stays a photo of the child's rekenschrift or weektaak.**

| Topic | School (source) | App | Status |
|---|---|---|---|
| Keersom notation | `6 × 284`, `3 × 70`: small number first, `×` (werkboek) | Was `78 x 6` | ✅ adjusted (D10) |
| Tafel notation | `4 × … = 24`; tafel van 6 = 1 × 6 … 10 × 6 | Was `6 x 5` for the tafel van 6 | ✅ adjusted |
| Keersom strategy | Splitsen: 6 × 200 = 1200, 6 × 80 = 480, 6 × 4 = 24 (werkboek) | Was brackets `(70 x 6) + (8 x 6)` | ✅ adjusted |
| Keersommen per groep | Groep 5: "na de tafels × tientallen en samengestelde getallen"; groep 6: 7 × 49, 4 × 180 (doelen) | Levels 1–2 groep 5, level 3 groep 6 | ✅ |
| Plus/min range | Groep 5 tot 1000, groep 6 tot 10.000 (doelen); inwisselen with 4-digit numbers mid groep 6, written out (werkboek blok 7) | Level 3 = handy numbers (groep 6); random 4-digit sums groep 7 | ✅ adjusted twice (D10, D11: real use showed the first relabel was too steep) |
| Plus/min strategies | Hoofdrekenen: rijgen, aanvullen, handig (350 + 200); groep 6 also **cijferen and kolomsgewijs** (werkboek) | Hints teach hoofdrekenen only | ⚠️ gap: for big numbers the school writes it out; a hint "schrijf onder elkaar" could follow later |
| Delen | Groep 5 deeltafels t/m 10 and with rest; groep 6 splitsen (129 : 2 = 120 : 2 + 9 : 2) and 320 : 4 (doelen, werkboek) | Deeltafels, with rest, quotient ≤ 20 | ✅ 320 : 4 added as level 4 with the "kleine som" hint (D13); splitsen (129 : 2) not yet |
| Symbols | `×`, `:` for delen, "rest" | Same | ✅ |
| Breuken | Groep 6 introduction with strook, ¾ van 12 euro (doelen, werkboek) | Strook, stambreuk van, and ¾ van as the highest level (D13) | ✅ |
| Afronden | Groep 6 op honderdtallen en duizendtallen (doelen) | Tientallen/honderdtallen/duizendtallen | ✅ |
| Groep 3 | Rekenrek/five-structure, splitsen, vriendjes van 10, + and − to 20 | Same (D9) | ✅ |
| Klokkijken | Hele uren → halve uren → kwartieren → 5 minuten → minuut; analoog, daarna digitaal; groep 5 tot op de minuut, groep 6 herhaling (doelen; rekenen.nl per groep) | Wijzerklok in 5 levels, tijd in woorden, 24-uursklok met dagdeel (D14) | ✅ (tijdsduur not yet) |
| Tempotoetsen | Tempotoets (automatised): 2 opgaven of 1 minute, score = total right, 3–5 s per sum; tafels in groep 5 (5a blok 2 and 4, 5b blok 4), deeltafels t/m 10 end of groep 5 (about 40 in 2 minutes). Signaleringstoets (worked out quickly): 2 × 2 minutes, e.g. grote tafels 80 × 70 end of groep 6 | Tempo-ronde: 2 × 1 minute for tafels, omgekeerd, deeltafels and door elkaar (D19) | ✅ form; the tafel tempotoets itself is in the teacher's handleiding (not public), edition 5 calls this work "Speed": a photo of a test from school would confirm |
| Not in the app yet | Groep 5–6: geld, tijdsduur, meten, verhoudingstabel, kalender/tijdbalk | — | Backlog (Phase 3 / S-02) |

Sources: bsalbatros.nl/wp-content/uploads/2019/10/doelen-groep-5.pdf and doelen-groep-6.pdf; heutinkvoorthuis.nl (corona materials, De Wereld in Getallen groep 6 werkboek blok 7); onderwijsvanmorgen.nl (Malmberg): De wereld in getallen 4, Tempo- en signaleringstoetsen groep 5–8.

## NOW — Phase 0: make the first real test meaningful

**How the level rules were tuned (R-04, 2026-09-23):** simulated children (typical, one level stronger, one level weaker than the start estimate), 300 runs each. Key lessons: a symmetric rule ("2 right → up, 2 wrong → down") settles at ~50% success, so the rules are asymmetric (calibration: 3 right in a row → up, 2 of last 3 wrong → down; afterwards: ≥90% of 8 → up, <50% of 6 → down). Result: success ~75–85% for typical/stronger children; a weaker child's first session is still hard (~47–54%) and settles around 65–70%, which is the first thing to watch in T-01. New skills only start lower/higher than the estimate once ≥3 skills have settled (one noisy skill must not shift everything, found in real play-testing). The simulation's child model is an assumption; real use decides.

These must be done before daily use. Without them the test won't tell us whether the idea works.

| ID | Item | Why it matters | Size |
|---|---|---|---|
| R-01 | Hosted so it runs on the iPad, and still works on the MacBook (D1, D5). Check it on a real iPad: touch keyboard, screen rotation, Safari | No device, no test | S–M |
| ~~R-02~~ ✅ | Accept Dutch number notation (`45.230` and `45230`); prepare for the decimal comma | Correct answers must never be marked wrong. Also needed later for kommagetallen | S |
| ~~R-03~~ ✅ | Start at early-groep-6 level, not the bottom (corrected 2026-09-23: optellen/aftrekken start at numbers to 1.000, because groep 6 opens by revisiting t/m 1.000; full tafels 1–10) | Today's first session asks things like "8 of 356?" and "6 × 1", which are too easy and risk boredom | S |
| ~~R-04~~ ✅ | Adapt within 1–2 sessions (quicker level changes while the app is still learning a skill) | This is the success criterion: the next session should be better targeted | S–M |
| ~~R-05~~ ✅ | Focused sessions of 4–6 skills, where weak skills get extra repetitions (D3) | Makes "practise what you're weak at" actually happen | M |
| ~~R-06~~ ✅ | Time-based session of about 10 minutes that ends after the current exercise, with a progress bar and no clock (D2) | Spec requirement; sessions are currently about a third of that | S |
| ~~R-07~~ ✅ | Log every exercise (question, answer given, hints used, time taken). Parent view shows the last session, level changes, and why each skill was picked | V1's purpose is learning from real use. Without a log you can only learn by watching over your child's shoulder | M |
| ~~R-08~~ ✅ | Dutch wording and curriculum fixes: "tientallen/duizendtallen" instead of "10tallen"; ~~tafels to × 10 only~~ (done with R-03; the extra tafels of 11 and 12 came back on purpose in D21); compare numbers of equal length (45.230 vs 45.320); summary grouped as Tafels / Optellen / … | Terminology has to match school | S |
| ~~R-09~~ ✅ | Hints that suit large numbers (kolomsgewijs/cijferend framing, as taught at school) | Today's "split into tens and units" hint makes sense for 45 + 23 but not for 45.678 + 23.456 | M |
| R-10 ⏸ deferred | Content preview page: every skill × level on one page, with sample exercises and hints | Lets you check wording and didactics in 10 minutes instead of playing through sessions | S |

## NEXT — Phase 1: test with your child and build breuken (in parallel, D4)

| ID | Item | Why it matters | Size |
|---|---|---|---|
| T-01 | **Test period:** 1–2 weeks of real use on the iPad (this is not a build task). Watch for: does your child start on their own? Is the success rate 75–85%? Which hints don't help? Is the session length right? | Reprioritise everything after this based on what we see | — |
| ~~Q-03~~ ✅ | Progress backup: export/import from the parent view. _Moved up from Phase 2 because of D1_ | Safari can clear stored data for pages that haven't been opened for a while. An export file also lets you share real usage data with Claude for analysis | S |
| ~~B-01~~ ✅ | Fraction answers: stacked teller/noemer input; equivalent fractions accepted (2/4 = ½); "5/8" typed in one box understood | Checking answers is the tricky part of fractions | M |
| B-02 ◐ | Fraction pictures: **strook done** (the classroom breukenkast model); getallenlijn later with B-03b | This is the first time the app needs visuals, and the biggest new capability breuken requires | M–L |
| B-03a ✅ | Breuken step 1 (groep-5 revision only, class hasn't started breuken): herkennen (halven/kwarten → derden/vijfden/achtsten) and deel van een hoeveelheid (½, ¼ → ⅓, ⅕, ⅒) | The agreed next priority | M |
| B-03b ◐ | Breuken step 2, **when B-04 confirms the class has reached it**: vergelijken (3/8 vs 5/8), gelijkwaardig (1/3 = 2/6), ~~niet-stambreuken (¾ van 20)~~ ✅ done as a higher level (D13), zesden/tienden, getallenlijn. Reuses step 1's strook, stacked input and equivalence check | Don't run ahead of school | M |
| B-04 | Find out when the class starts breuken this year (ask the teacher or check the weektaak) | Don't run ahead of school | — |
| B-05 | Kommagetallen (after B-01 to B-03; needs R-02) | Completes the breuken domain | M |

## LATER — Phase 2: deepen quality (driven by what T-01 shows)

| ID | Item | Why it matters | Size |
|---|---|---|---|
| Q-01 ◐ | Measure fluency by answer speed for tafels, with **no** visible timer in the normal session (the separate Tempo-ronde, D19, does show a time bar) | "Automatised" means fast recall, not counting up | S–M |
| ~~Q-02~~ ✅ | Automatic correctness check (`js/selftest.js`, also runnable on each iPad from the Ouder overzicht): run every exercise generator thousands of times and verify answers and hints | Safety net before adding more domains | S–M |
| Q-04 | Better verhaalsommen: realistic amounts (not "8.734 appels"), two-step problems, geld/tijd as context | Word problems should feel real | M |
| Q-05 | Richer getalbegrip: getallenlijn, place value, schatten | Groep-6 number sense is more than comparing and rounding | M |
| Q-06 | Tafels 1–5 and mixed tables as maintenance review | Keep automatised facts fresh | S |

## LATER — Phase 3: the rest of groep 6

| ID | Item | Size |
|---|---|---|
| G-01 | Meten: lengte, gewicht, inhoud, omrekenen | M |
| G-02 | Verhoudingen: verhoudingstabel | M |
| G-03 | Oppervlakte & omtrek (reuses visuals from B-02) | M |
| G-04 | Meetkunde (hardest to generate and check automatically; may stay out) | L |

## LATER — Phase 4: motivation

| ID | Item | Size |
|---|---|---|
| ~~M-01~~ ✅ | Light motivation (D7): stars (never lost), level-up celebrations, milestones, weekdoel week dots, weeks-in-a-row shown only as good news, effort praise | S |
| ~~M-02~~ ✅ | Story/character progression: Mijn park with a running story and a spaarpot (D18) | L |
| M-03 | Season 2 of the story, before the first child reaches 2000 ★ (about February 2027): new chapters, new animals or a new place, new shop items. Decide with what the children liked in season 1 | M |

## LATER — Phase 5: siblings and moving up a year

| ID | Item | Size |
|---|---|---|
| ~~S-01~~ ✅ | Profile picker + parent setup (name, birth date → groep, weekdoel), done early with D7 | S–M |
| S-02 ◐ | Curricula for groep 3–5. **Groep 3 done (D9):** tellen, rijtjes, splitsen, + and − tot 20 with dot pictures. Groep 4–5 use the existing skills from their own starting level. Next candidates for groep 4–5: klokkijken, geld, tafels 1–5 | M per group |
| S-03 | **Groep 7 curriculum, needed by the start of the next school year** (the only real deadline) | L |
| S-04 | **Kleuters (groep 1–2):** can't read yet, so this needs spoken instructions, counting with pictures, and tapping instead of typing. That makes it a different experience, not "just another profile" | L |

## Parking lot (only with evidence)

- AI-generated word problems, only if the templates start to feel repetitive
- Cloud sync / accounts, only if multiple devices become a real problem (Q-03 covers the basics)
- Installing as an app icon on the home screen
- Explicitly out: teacher dashboards, social features, payments, AI chat
