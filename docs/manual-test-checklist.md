# Manual test checklist

The app is tested by hand against each sprint's acceptance criteria (there are no end-to-end tests by design; see `plan.md` §5). Run the whole list once per browser for the cross-browser check (NFR1): Chrome, Firefox, Edge.

**Setup:** `npm run db:migrate`, `npm run db:seed`, `npm run dev`, then open <http://localhost:5173>. Demo login: `demo@example.com` / `demo1234` (projects "Living room", "Garden" and "Performance test (50 objects)").

Sprints 0–4 already passed their manual tests, so a quick regression pass is enough there. Sprints 5–8 are new.

## Sprint 0: setup (regression)

- [ ] `npm run dev` starts the API (:3001) and the web app (:5173) without errors
- [ ] The home page shows the API health card ("ok", database "ok")

## Sprint 1: authentication (FR1, NFR3) (regression)

- [ ] Register a new account → logged in automatically and sent to the projects page
- [ ] Log out → opening `/projects` redirects to the login page
- [ ] A wrong password and an unknown email both show an error message
- [ ] After refreshing the page, you stay logged in

## Sprint 2: projects and the editor (FR2, FR8) (regression)

- [ ] Create, rename, duplicate and delete a project from the dashboard
- [ ] Copy a project's URL, log in as another user, open it → "does not exist or is not yours"
- [ ] The editor shows the 3D view with a grid; left-drag orbits, right-drag pans, wheel zooms

## Sprint 3: environment (FR3) (regression)

- [ ] Change width/depth → the floor (and the perimeter walls) resize immediately, in metres
- [ ] Switch floor materials; switch Interior ↔ Exterior presets (exterior: grass, no walls, blue sky)
- [ ] Add, edit (start/end, height, thickness) and remove walls; click a wall to select it; the selected wall does not flicker at corners

## Sprint 4: models (FR4, NFR3) (regression)

- [ ] Upload a valid `.glb` → it appears under "Mine" in the library
- [ ] Uploading a non-GLB, a renamed text file or a file over 20 MB shows a clear error
- [ ] Click a model in the library → it is placed at the floor centre, standing on the floor
- [ ] A second user sees the built-ins but not the first user's uploads
- [ ] Delete your own upload → it disappears from the library (and its objects from the open scene)

## Sprint 5: transforms and real-world sizing (FR5, FR6, NFR4)

Place the **Reference cube (1 m)** and the **Test table**.

- [ ] Click the cube → blue outline, gizmo, properties panel showing **1 × 1 × 1 m**
- [ ] Drag the move arrows → the cube slides along the floor in 0.1 m steps; X/Z update live; the camera does not orbit while dragging; releasing does not deselect
- [ ] Press **R** and drag the ring → rotates in 15° steps; past 90° the angle in the panel stays correct
- [ ] Press **S** (snap off) → movement and rotation are smooth; press **S** again
- [ ] Table shows 1.2 × 0.75 × 0.8 m; type **2** in Width → 2 × 1.25 × 1.33 m (proportional); **Reset to original size** restores it
- [ ] Typing 0 or a negative size changes nothing
- [ ] **Ctrl+D** duplicates 0.5 m away and selects the copy; **Delete** removes it; the Duplicate/Delete buttons do the same
- [ ] **Esc**, clicking the floor and clicking the sky all deselect
- [ ] While typing in a number field, **Delete**, **G**, **R**, **S** edit the text and do not affect the scene

## Sprint 6: saving and loading (FR7)

- [ ] Make an edit → badge says "Unsaved changes"; about 5 s later "Saving…" then "Saved" (autosave)
- [ ] Press **Ctrl+S** (or the Save button) → "Project saved" toast
- [ ] Type a value in a number field and press **Ctrl+S** without leaving the field → the typed value is saved
- [ ] Reload the page → environment, walls, objects, positions, rotations and sizes are exactly as before
- [ ] Back to the dashboard → the project card shows a thumbnail of the scene (no gizmo or blue outline in it)
- [ ] Make an edit and immediately click "Projects" → reopening the project shows the edit (saved on exit)
- [ ] Make an edit and immediately close or reload the tab → the browser asks for confirmation
- [ ] Stop the API (Ctrl+C in the terminal running only the API, or stop `npm run dev`), make an edit → after 5 s "Save failed" and an error toast; it does not keep retrying; restart and press Ctrl+S → "Saved"
- [ ] Deleted models: place your own upload in project A and save; open project B and delete that model from the library there; reopen project A → a red placeholder box plus the alert "1 object uses a model that no longer exists"; **Remove** clears it

## Sprint 7: presentation (FR8, FR9, NFR5)

- [ ] Editor: **Share** → turn the switch on → a link appears; **Copy** copies it; the open-in-new-tab button opens the viewer
- [ ] Open the link in a private window (not logged in) → the design is shown with "View only"; you can orbit, pan and zoom; nothing can be selected or moved; no library or panels
- [ ] Edit and save in the editor, reload the viewer → it shows the saved changes
- [ ] Turn sharing off → reloading the old link shows "does not exist or sharing was turned off"; turning it on again gives a **new** link
- [ ] The dashboard card of a shared project shows a "Shared" badge
- [ ] Camera presets (bottom-left toolbar) in the editor and the viewer: **Perspective**, **Top** (floor plan from above) and **Front** each frame the whole scene
- [ ] Vertical panning: right-drag up/down moves the view up and down; you can never get below the floor (try dragging far down)
- [ ] **Export as PNG** (editor and viewer) downloads `<project-name>.png` without the grid, gizmo or selection outline
- [ ] **?** key (editor) or the help button (editor and viewer) opens the Controls dialog
- [ ] The library contains the 23 built-in models (furniture, decor, plants, outdoor) for every user, each at a plausible real size (e.g. Sofa 2.0 m wide, Pine tree 7 m tall)

## Sprint 8: hardening and demo (NFR1, NFR2, NFR5)

- [ ] Log in as `demo@example.com` / `demo1234` → "Living room", "Garden" and "Performance test (50 objects)" exist and open correctly
- [ ] Open "Performance test (50 objects)" with `?fps` added to the URL (e.g. `/projects/<id>?fps`) → the fps counter (top left) stays above 30 while orbiting (NFR2); note the value for the thesis
- [ ] Full walkthrough in each browser (Chrome, Firefox, Edge): register → create a project → set up the environment → upload and place a model → resize it → save → reload and check → share and open the link in a private window
- [ ] Clean setup (optional, already checked by Claude): clone into a new folder, follow `README.md` (`npm install`, copy `.env`, migrate, seed, `npm run dev`) → works without extra steps
- [ ] Demo mode: `npm run build && npm start`, open <http://localhost:3001> → the app works from one port
- [ ] Rehearse the demo script (`docs/demo-script.md`), 5–10 minutes
- [ ] Usability test (optional): 3–5 people do the scripted tasks from the demo script; note times and problems
