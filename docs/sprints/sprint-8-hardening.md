# Sprint 8: Hardening and demo preparation

**Status:** Implemented (awaiting manual test)
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

- [x] All unit tests pass
- [ ] The manual checklist passes in all three browsers
- [ ] A 50-object scene stays above 30 fps on the demo laptop
- [x] A fresh setup works using only the README
- [ ] The demo walkthrough has been rehearsed end to end

## Tests

All unit tests pass, plus the results of the manual and usability tests.

## Deliverables for the thesis

- Testing chapter material: test results, usability findings and fps measurements
- Final screenshots
- List of known limitations and future work

## Notes / decisions

- **Demo data.** The seed now also creates the demo account `demo@example.com` / `demo1234` with three example projects built from the built-in models (`prisma/demo-scenes.ts`): "Living room" (6 × 5 m, 9 objects), "Garden" (14 × 10 m, 34 objects incl. a stepping-stone path and fence) and "Performance test (50 objects)". The seed stays idempotent: the demo password is reset on every run, missing example projects are re-created, and existing ones are never overwritten, so a rehearsal's edits survive. The demo scenes are validated with `sceneSchema` while seeding and checked by unit tests (valid, only built-in models, every object on its floor, exactly 50 objects in the performance scene).
- **Performance check (NFR2).** `?fps` in an editor or viewer URL shows drei's `Stats` counter, so the 50-object scene can be measured on the demo laptop without dev tools. Measures already in place: models are loaded once per URL and cloned per placed object (geometry and materials shared); the device pixel ratio is capped at 2; lighting is one ambient plus one directional light with no shadows; the built-in models are low-poly (2–57 KB). _Measured fps: to be filled in by the user._
- **Clean setup check.** The files git would commit (tracked and new, no ignored files: no `node_modules`, `.env`, database, uploads or Draco copy) were copied into an empty folder, and the README's first-time setup was followed exactly: `npm install`, copy `.env.example` to `.env`, `npm run db:migrate`, `npm run db:seed`, then `npm test` and `npm run build`. **Result: passed with no extra steps.** The Prisma client was generated, the Draco decoder was copied, the seed created 27 built-in models and the demo account with 3 projects, all unit tests passed and the build succeeded. In demo mode (`npm start`), the fresh copy served the app, the SPA routes (`/view/...`), the Draco decoder and the model files, and the demo login worked. The only output beyond that was the known `npm audit` notice about the Prisma CLI's dev-only dependencies (see README).
- **Manual checklist.** `docs/manual-test-checklist.md` groups every manual test by sprint (FR1–FR9), with regression checks for Sprints 0–4 and full checks for Sprints 5–8. It is meant to be run once in each browser.
- **Demo script.** `docs/demo-script.md` is a 5–10 minute walkthrough in the order of the requirements, plus five timed tasks for the usability test (NFR5: placing and sizing a model in under 2 minutes).
- **Known limitations** were added to `plan.md` §7 (no undo, overlaps allowed, the share link shows the last saved version, last save wins across tabs, seeded projects have no thumbnail until saved once).
