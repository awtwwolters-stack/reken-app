# Reken App — Backlog

_Last updated: 2026-09-24 · Status: T-01 running; first real-use lessons applied (see T-01 feedback log). See Roadmap._

Size: **S** = small change · **M** = one focused build session · **L** = several sessions

---

## What we're building (the vision)

An adaptive maths tutor that answers one question for each child: **"Wat zijn de nuttigste 10–15 minuten rekenen voor dit kind op dit moment?"** It complements school (De Wereld in Getallen) and doesn't compete with it. The child never picks what to practise. The app works out their level quietly while they practise, gives scaffolded help when they make a mistake, and can always explain its choices to a parent.

It starts with one child (groep 6) and one domain (core arithmetic). Over time it grows to cover the rest of groep 6, then younger siblings, then the next school year's curriculum as they move up.

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
| D2 | **Session length:** time-based, about 10 minutes | Finishes after the current exercise once the time is up. No visible clock; a progress bar instead → R-06 |
| D3 | **Session shape:** focused, 4–6 skills | Several exercises per skill; weak skills get extra repetitions → R-05 |
| D4 | **Breuken:** built in parallel with the test period | Breuken work starts right after Phase 0 |
| D5 | **Hosting:** GitHub Pages, public repository (free) | No login needed on the iPad, so the child never uses a parent's account. The code is backed up online. Family details stay out of the repo |
| D6 | **Winter focus (2026-09-23):** complete groep 6 before bringing a second child on board | Phase 3 before Phase 5; siblings from spring 2027 |
| D7 | **Motivation + profiles before the test (2026-09-23):** name picker; groep from birth date (parent confirms); a younger sibling may practise groep-6 content for now with a banner, an easier start and separate progress; stars for every sum finished correctly (also with a hint) + bonuses; **weekdoel (default 4 days) instead of a daily streak** (research: streak loss causes anxiety in children) | M-01 and S-01 done early; T-01 now also tests the motivation, so we can't separate 'comes back for the maths' from 'comes back for the stars' |
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
| Spring 2027 | Phase 5: profile picker + second child's curriculum (S-01, S-02) | Groep 6 solid |
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
| 2026-09-24 | Session overall | 27 sums in ~11 min, finished; **81% right first time (target 75–85%)**; the 5 slowest sums were exactly the 5 mistakes; rounding the weak spot | No action: calibration working as designed |

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
| ~~R-08~~ ✅ | Dutch wording and curriculum fixes: "tientallen/duizendtallen" instead of "10tallen"; ~~tafels to × 10 only~~ (done with R-03); compare numbers of equal length (45.230 vs 45.320); summary grouped as Tafels / Optellen / … | Terminology has to match school | S |
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
| B-03b | Breuken step 2, **when B-04 confirms the class has reached it**: vergelijken (3/8 vs 5/8), gelijkwaardig (1/3 = 2/6), niet-stambreuken (¾ van 20), zesden/tienden, getallenlijn. Reuses step 1's strook, stacked input and equivalence check | Don't run ahead of school | M |
| B-04 | Find out when the class starts breuken this year (ask the teacher or check the weektaak) | Don't run ahead of school | — |
| B-05 | Kommagetallen (after B-01 to B-03; needs R-02) | Completes the breuken domain | M |

## LATER — Phase 2: deepen quality (driven by what T-01 shows)

| ID | Item | Why it matters | Size |
|---|---|---|---|
| Q-01 | Measure fluency by answer speed for tafels, with **no** visible timer | "Automatised" means fast recall, not counting up | S–M |
| Q-02 | Automatic correctness check: run every exercise generator thousands of times and verify answers and hints | Safety net before adding more domains | S–M |
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
| M-02 ◐ | Story/character progression (your stated preference) — **started:** the character collection (D8). Next: characters in a story, stars becoming spendable | L |

## LATER — Phase 5: siblings and moving up a year

| ID | Item | Size |
|---|---|---|
| ~~S-01~~ ✅ | Profile picker + parent setup (name, birth date → groep, weekdoel), done early with D7 | S–M |
| S-02 | Curricula for groep 3–5. Mostly new data and lower levels; the exercise generators are largely reusable | M per group |
| S-03 | **Groep 7 curriculum, needed by the start of the next school year** (the only real deadline) | L |
| S-04 | **Kleuters (groep 1–2):** can't read yet, so this needs spoken instructions, counting with pictures, and tapping instead of typing. That makes it a different experience, not "just another profile" | L |

## Parking lot (only with evidence)

- AI-generated word problems, only if the templates start to feel repetitive
- Cloud sync / accounts, only if multiple devices become a real problem (Q-03 covers the basics)
- Installing as an app icon on the home screen
- Explicitly out: teacher dashboards, social features, payments, AI chat
