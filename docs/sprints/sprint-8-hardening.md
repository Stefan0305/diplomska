# Sprint 8: Hardening and demo preparation

**Status:** Planned
**Depends on:** Sprint 7
**Requirements covered:** NFR1, NFR2, NFR5. This completes **milestone M3**.

## Goal

The app is stable, tested and ready to present: it starts from a clean setup with demo data, and a rehearsed walkthrough covers the key features.

## Scope

- **In:** bug fixing, performance check, full manual test pass, usability test, seed data, documentation
- **Out:** new features

## Tasks (high level)

- **Testing:**
  - Full manual walkthrough: register, create a project, set up the environment, upload and place a model, resize it, save, reload and check, then open the share link
  - Make sure all unit tests pass
  - Manual checklist for FR1–FR9 and a cross-browser smoke test (Chrome, Firefox, Edge)
- **Performance:** measure fps with about 50 objects; if needed, reuse loaded models, simplify lighting or limit the pixel ratio
- **Usability test:** 3–5 participants do scripted tasks; record their completion times and any problems; fix the most important issues
- **Demo data:** extend the seed script with a demo user, one example interior (living room) and one example exterior (garden)
- **Clean setup check:** clone the project to a fresh folder, then `npm install`, migrate, seed, run. Everything should work with no manual steps beyond `.env`.
- **Docs:** a README with setup and run instructions; update `CLAUDE.md` with the real commands
- **Demo script:** a 5–10 minute walkthrough for the thesis defence

## Acceptance criteria

- [ ] All unit tests pass
- [ ] The manual checklist passes in all three browsers
- [ ] A 50-object scene stays above 30 fps on the demo laptop
- [ ] A fresh setup works using only the README
- [ ] The demo walkthrough has been rehearsed end to end

## Tests

All unit tests pass, plus the results of the manual and usability tests.

## Deliverables for the thesis

- Testing chapter material: test results, usability findings and fps measurements
- Final screenshots
- List of known limitations and future work

## Notes / decisions

_Filled in during the sprint._
