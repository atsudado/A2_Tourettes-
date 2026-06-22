# TACTIC
A small browser platformer (vanilla HTML/CSS/JS, no build tools needed) made for a school
assignment. Inspired by "Level Devil"-style rage-platformers, but reframed: each level's
"gotcha" mechanic represents a different way a tic can present in Tourette Syndrome.

## How to run
Just open `index.html` in any modern browser (double-click it, or serve the folder with
any static file server, e.g. `npx serve .` or `python3 -m http.server`).

## Controls
- Left / Right arrow (or A / D): move
- Up arrow / Space / W: jump
- Esc: restart current level
- ⟲ button (top-right): restart current level

## Levels
1. **Irregular Small Tics** — a flashing red block appears without warning; jump over it.
2. **Cause-and-Effect Tics** — the floor looks perfectly normal, but jumping near certain
   spots causes the ground there to collapse a moment later. Triggered by your own action.
3. **Delayed Tics** — two platforms swing back and forth on their own timing; you have to
   read and time your jump to their rhythm rather than your own.

## Files
- `index.html` — page structure / HUD / overlays
- `css/style.css` — visual styling
- `js/levels.js` — level data (ground layout, hazards, moving platforms, door, intro text)
- `js/game.js` — game engine: input, physics, collision, camera, rendering, level flow
