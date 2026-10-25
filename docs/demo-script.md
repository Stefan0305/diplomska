# Demo script (thesis defence, 5–10 minutes)

**Before the defence**

- Run `npm run build && npm start` and open <http://localhost:3001>, or use `npm run dev` and <http://localhost:5173>.
- Run `npm run db:seed` so the demo account and its example projects exist. The seed never overwrites existing projects. To restore the original examples, delete them on the dashboard and seed again.
- Open each example project once and press **Ctrl+S**, so the dashboard shows thumbnails (seeded projects have none until they are saved).
- Keep a small `.glb` file on the desktop for the upload step (any furniture model works, e.g. from Sketchfab or Poly Pizza; note its licence).
- Open a private browser window for the share link.
- Close other heavy apps; the laptop should be on mains power.

## 1. Problem and idea (30 s)

"Designers, garden planners and home owners want to try out furniture and plants at real size before buying. This tool runs in the browser, needs no installation, and always works in metres."

## 2. Account and projects (1 min) — FR1, FR2

1. Show the login page and log in as `demo@example.com` / `demo1234` (or register a new account to show registration).
2. The dashboard shows projects with thumbnails. Point out rename, duplicate and delete in the card menu.

## 3. The environment (1 min) — FR3

1. Create a new project "Defence demo".
2. The default is a 6 × 5 m room with walls. Change the width to 7 m; the walls follow.
3. Switch the floor material to tiles. Add a wall and type its start and end points to make a partition.
4. Mention the exterior preset (grass plot, no walls) for gardens.

## 4. Models at real-world size (2 min) — FR4, FR5, FR6

1. Open the library: built-in furniture, decor, plants and outdoor items, plus the user's own uploads.
2. Upload the prepared `.glb` (name and category), then place it. It lands on the floor, centred, whatever its original pivot was.
3. Place the **Sofa**. Select it: the properties panel shows **2.00 × 0.85 × 0.90 m**.
4. Type **1.8** in Width; height and depth follow (uniform scale, proportions kept). Explain the formula: scale = target / native size.
5. Move it with the gizmo (0.1 m snapping), press **R** and rotate in 15° steps. **Ctrl+D** duplicates, **Delete** removes.

## 5. Saving (30 s) — FR7

1. Point at the save badge: "Pending changes" → "Saved" after a few seconds (autosave), or **Ctrl+S**.
2. Reload the page: everything is exactly where it was. Back on the dashboard, the thumbnail shows the new design.

## 6. Presenting to a client (2 min) — FR8, FR9

1. Open **Living room** (or **Garden**) from the dashboard.
2. Camera presets: **Top** (floor plan), **Front**, **Perspective**. Each one frames the whole design.
3. **Export as PNG**: a clean image without grid or gizmos, ready for an offer or the thesis.
4. **Share** → switch on → copy the link → paste it into the private window. The client sees the design without an account and can only look around.
5. Switch sharing off and reload the private window: the link no longer works.

## 7. Under the hood (1 min, optional)

- One TypeScript codebase: React + Three.js (React Three Fiber) in the browser, Express + Prisma + SQLite on the server, with Zod schemas shared by both.
- The scene is a small, validated JSON document (show the example in the Sprint 6 notes).
- About 200 unit tests (scene schema, scaling maths, editor store, camera framing, share tokens).
- Performance: the 50-object project, opened with `?fps` in the URL, stays above 30 fps (quote the measured value).

## Usability test tasks (for 3–5 participants)

Give each participant the demo account or a fresh account, and time each task:

1. Create a project called "My room" and make the room 5 × 4 m. (target: under 1 min)
2. Place a sofa and make it exactly 1.9 m wide. (target: under 2 min, NFR5)
3. Rotate the sofa to face the other way and move it against a wall. (target: under 1 min)
4. Save, go back to the dashboard and open the project again. (target: under 30 s)
5. Create a share link and open it in a private window. (target: under 1 min)

Note the completion time, any help needed, and any problems for each task. Fix the most important issues before the defence.
