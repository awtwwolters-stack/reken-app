# Reken App — Backlog

_Last updated: 2026-10-10 · Status: three children practising on synced iPads (D12); next: klokkijken, then motivation (D13). See Roadmap._

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
| D9 | **Siblings now, not spring 2027 (2026-09-28):** the groep-3 and groep-5 siblings wanted to practise. Every skill carries the groepen it is for (`groepen: [from, to]`); a child only sees skills for their own groep and starts at the beginning-of-year level of that groep. Groep 3 gets 5 new skills (tellen, rijtjes, splitsen, + and − tot 20) with dot pictures, **5-minute sessions** and a **🔊 read-aloud button** (device's own Dutch voice, only on a tap). Groep 5 keeps the existing skills at groep-5 starting levels; the "groep 6" banner and the parent checkbox are gone. No new groep-5 topics yet | Moves part of Phase 5 (S-02) forward; the rest of groep 6 (Phase 3) moves back correspondingly. Klokkijken and geld are the next groep-5 candidates: each needs a new picture and a new answer format, so each is its own build |
| D10 | **Even difficulty and a confident start (2026-09-29):** keersom levels by *kind* of sum instead of a maximum (× tientallen → 3 × 24 → 7 × 48 → 6 × 78); every new skill starts **one level below** the groep estimate; a child can climb to at most **one groep above** their own; sums written the school way (`5 × 6`, `6 × 78`, `×`), tafel hints via steunsommen, keersom hints via splitsen; a **pause** button (and automatic pause when the app goes to the background) | Simulation: a child who finds it hard scores 74% instead of 56% in their first session; later sessions barely change (67–69%), which the child's real data should confirm. Side effect, accepted: relabelling plus/min/delen level 3 to groep 6 makes an existing groep-6 child's settled levels count as one below the estimate, so her remaining new skills start a little lower still. See "Aansluiting lesmethode" |
| D11 | **Lessons from the logs of 2026-09-29:** a new plus/min level 3 with *handy* numbers (560 − 240, 4.500 − 1.200, 473 − 298; groep 6), random 4-digit sums with inwisselen back to groep 7; hints "met de kleine som" for round numbers (42 − 20, then 00 back), as in the rekenboek; splitsen shown as a **split picture** (whole on top, two boxes below) instead of `10 = 7 + ?`; a right answer after more than 90 s (pauses excluded) counts as right but **not towards a level up** | Stored plus/min levels 3–4 move up one (one-time conversion); a groep-5 child then comes back to the new level 3 via the ceiling |
| D12 | **Cloud sync between iPads (2026-09-30):** the children take whichever iPad is free. Firebase (free Spark plan, EU `europe-west4`; Supabase pauses free projects after 7 idle days); the parent signs in once per iPad with Google (an e-mail link would open in Safari, not Chrome). One cloud document per child, so children on different iPads never conflict; the same child on two iPads at once: last save wins. Offline-first: localStorage stays the working copy. **Privacy:** only name, groep, stars and results; **no birth date** any more - the groep moves up by itself every 1 August (`groep` + `groepSchoolYear`). Access is limited by `firestore.rules`; the app warns if the rule is open | The parent creates the Firebase project; the config goes in `js/cloud-config.js` (not secret). Until then sync is off and nothing changes |
| D13 | **Order of the next steps (2026-10-10):** rest of groep 6 (small part) → klokkijken → motivation (story, spending stars); kommagetallen and "reken onder elkaar" wait for the class and for the groep-6 child's data. **¾ van 12 is built as a higher level** instead of waiting for the class (replaces "wait for B-04" for this item): a child only reaches it by climbing, and the hint explains it with the strook. **Self-check with every new kind of sum** (`js/selftest.js`, button in the Ouder overzicht): three faults had only shown up on the real iPads (iOS 15 start-up, landscape layout never switching on, stale page copy) | Run the self-check before every release; ask the parent to tap it on the old iPad after bigger changes |
| D14 | **Klokkijken (2026-10-10):** three skills in the category Klok: hele uren for groep 3 (one answer box), the wijzerklok in five levels (hele/halve uren → kwartieren → 5 minuten → to the minute → with dagdeel) and tijd in woorden (kwart voor 4, 10 voor half 4). Answers as uur : minuten. At a wijzerklok 3:15 and 15:15 both count; **with a dagdeel only the 24-hour time counts** (the parent asked for 24-hour where it becomes digital). Tijdsduur follows later | The landscape layout now puts the hint in the right column so a clock keeps its size (170 px instead of 120) |
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
| Not in the app yet | Groep 5–6: geld, tijdsduur, meten, verhoudingstabel, kalender/tijdbalk | — | Backlog (Phase 3 / S-02) |

Sources: bsalbatros.nl/wp-content/uploads/2019/10/doelen-groep-5.pdf and doelen-groep-6.pdf; heutinkvoorthuis.nl (corona materials, De Wereld in Getallen groep 6 werkboek blok 7).

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
| B-03b ◐ | Breuken step 2, **when B-04 confirms the class has reached it**: vergelijken (3/8 vs 5/8), gelijkwaardig (1/3 = 2/6), ~~niet-stambreuken (¾ van 20)~~ ✅ done as a higher level (D13), zesden/tienden, getallenlijn. Reuses step 1's strook, stacked input and equivalence check | Don't run ahead of school | M |
| B-04 | Find out when the class starts breuken this year (ask the teacher or check the weektaak) | Don't run ahead of school | — |
| B-05 | Kommagetallen (after B-01 to B-03; needs R-02) | Completes the breuken domain | M |

## LATER — Phase 2: deepen quality (driven by what T-01 shows)

| ID | Item | Why it matters | Size |
|---|---|---|---|
| Q-01 | Measure fluency by answer speed for tafels, with **no** visible timer | "Automatised" means fast recall, not counting up | S–M |
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
| M-02 ◐ | Story/character progression (your stated preference) — **started:** the character collection (D8). Next: characters in a story, stars becoming spendable | L |

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
