# Reken App — working notes for Claude

An adaptive Dutch maths practice app for one family's children (groep 3, 5 and 6), used on shared iPads. `BACKLOG.md` is the source of truth for decisions (D1…), the order of next steps, the feedback log and how the app matches the school method. Read its "Now" section first.

## The person you work with
- A product person, not a developer; this is their first app. Explain in plain language, give a recommendation, and ask only about choices that change what the children or the parent experience.
- They often write in Dutch: answer in the language they use. Everything the children see is Dutch.
- They want pushback and evidence: say when something contradicts an earlier decision, and check claims about the school method against sources.
- Child-facing work comes before parent tooling.

## Privacy (the repository is public)
- Never put children's names, birth dates or pasted backups in the repository, commits or `BACKLOG.md`. Write "the groep-6 child".
- Backups pasted in chat are read only, never saved to the project.
- Cloud data holds only first name, groep, stars and results. Access is limited by `firestore.rules`.

## How the app is built
- Plain HTML/CSS/JS with global scripts, no build step, hosted on GitHub Pages. `js/cloud.js` is the one ES module (Firebase from Google's CDN).
- **Curriculum is data:** `curriculum/*.js` define skills with `groepen: [from, to]` and `tiers` labelled with the groep they fit at the start of the school year. Generators live in `js/exercises/`, hints in `js/hints.js`, level rules in `js/mastery.js`.
- **Level rules** (see `js/mastery.js`): a new skill starts one level below the groep estimate; a child climbs at most one groep above their own; a slow right answer doesn't count towards moving up.
- **Offline-first:** localStorage is the working copy; `js/cloud.js` syncs changed children and sessions.

## Rules learned the hard way
- **Old iPad (iOS 15):** feature-check anything newer before using it, and set up extras through `optionalFeature()` in `js/app.js` so a failure can't stop start-up. No regex lookbehind.
- **Keyboard on a real iPad:** the keyboard covers the page; the page does not get shorter. Test with the page at 1024×768 and a fake `visualViewport` of about 330 px high, not by shrinking the window. Height media queries don't work for this; layout follows the `wide-short` class set by `fitSessionToScreen()`.
- **iPad keyboard focus:** the answer boxes are created once and stay focused; buttons must not take focus.
- **Sign-in:** Google sign-in only works in a browser tab, not in a full-screen home-screen app. Don't add `apple-mobile-web-app-capable` or a standalone manifest.
- **Stale copies:** every page carries `<html data-version>`; keep it equal to `APP_VERSION`.
- **Debugging an iPad:** ask for a photo of the grey diagnostics line under the app, or of "Controleer de app op dit apparaat" in the Ouder overzicht. Photos arrive as HEIC paths; convert with `sips`.

## Before every release
1. Bump the version everywhere at once: `APP_VERSION` in `js/utils.js`, every `?v=` and `data-version` in `index.html` and `parent.html` (one `sed` over the three files).
2. Run the self-check (`runSelfTest()` on `parent.html`, or the button) and see it pass. For a new kind of sum, extend `js/selftest.js` and prove the check fails on a deliberately broken case.
3. Check the screen in the real-iPad setup above, portrait and landscape, with the worst cases (picture + two-line hint).
4. `/code-review`, fix what matters, say what was skipped.
5. Commit, push, and confirm the new version is live on GitHub Pages.
6. Add the decision and any real-use lesson to `BACKLOG.md`.

## Working method
- Bigger changes: plan mode first, with the choices put to the parent. Small fixes: just do them and report.
- Run the local server through the preview tool (config `reken-app`), not through the shell.
- Report honestly what was tested and what could not be (a real iPad never can be, from here).
