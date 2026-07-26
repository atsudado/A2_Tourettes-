// ============================================================
// LEVEL 1 — five stages/checkpoints (L1-1 through L1-5).
// Levels 2-5 haven't been built yet; see buildWorld() below for how
// this plugs into the 5x5 level-select grid.
// ============================================================
const LEVEL_1_STAGES = [
  {
    title: "Stage 1 — Irregular Small Tics",
    intro:
      "Tics can appear suddenly, without warning, anywhere in the body.\n" +
      "One flash. One twitch. You just have to be ready to jump over it.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },

  {
    title: "Stage 2 — Cause-and-Effect Tics",
    intro:
      "From the outside, everything looks calm and ordinary.\n" +
      "But one sudden movement — and the ground gives way beneath you.\n" +
      "Careful what you jump for.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    // Each block's right edge sits flush against its pit's left edge
    // (2box.png is 79x97) — jump over the box without enough distance
    // and you land straight in the pit that opens right after it.
    blocks: [
      { x: 301, width: 79, height: 97 }, // butts up against trap t1 (x:380)
      { x: 681, width: 79, height: 97 }, // butts up against trap t2 (x:760)
    ],
    trapGround: [
      { x: 380, width: 120, id: "t1" },
      { x: 760, width: 120, id: "t2" },
    ],
    movingPlatforms: [],
    hazards: [],
  },

  {
    title: "Stage 3 — Delayed Tics",
    intro:
      "Sometimes the reaction doesn't come right away.\n" +
      "It builds, it delays, and then — right when you commit — it moves.\n" +
      "Time your jump for when the platform arrives, not when you wish it would.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [
      { x: 0, width: 400 },
      { x: 1080, width: 200 },
    ],
    // Purely a visual cue (matches Stage 4's black-pit rendering):
    // `ground` above already has no tile between x:400 and x:1080, so this
    // "prefallen" entry doesn't change collision at all — it just paints
    // a black pit across that same gap so its edges (start and end) read
    // clearly instead of showing empty space.
    trapGround: [{ x: 400, width: 680, id: "l1-3-pit", prefallen: true }],
    movingPlatforms: [
      { x: 420, y: 550, width: 120, range: 220, speed: 150, phase: 0 },
      { x: 730, y: 550, width: 120, range: 220, speed: 150, phase: 1.5 },
    ],
    hazards: [],
  },

  {
    title: "Stage 4 — Persistent Tics",
    intro:
      "Some tics don't stop once they start.\n" +
      "They keep going, pulling you along — and if you resist, you fall behind.\n" +
      "Sometimes you have to move with the tic, not against it.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },

    ground: [{ x: 0, width: 1280 }],

    trapGround: [{ x: 380, width: 80, id: "gap-seed", prefallen: true }],

    hazards: [],
    movingPlatforms: [],
  },

  {
    title: "Stage 5 — Blinking Tics",
    intro:
      "Tics don't always come one at a time.\n" +
      "Sometimes they layer — a movement here, a flash there, the ground shifting beneath you.\n" +
      "Stay focused. Keep moving.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    // Mailbox sits on the rooftop platform at the far right (see the
    // last entry in movingPlatforms below): platform now spans
    // x:1060-1310 at y:135, so the mailbox (56x90) is centered on it and
    // its base (y + height) lines up with the platform's top surface.
    door: { x: 1157, width: 56, height: 90, y: 45 },

    // Solid ground the whole way across — this replaced an earlier
    // fall-through-pit design under the hedges. No trapGround here on
    // purpose; the hedge stretch is now guarded by patrolling ground
    // dogs (see groundHazards) instead of a floor that gives way.
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    blocks: [],

    // Matches BG.png's art for this stretch of the map, left to right:
    // bench (decorative only) -> two hedges -> tree -> building.
    // Each platform's x/y is measured directly off the background image
    // so it visually sits on/in the object it belongs to, and each has
    // its own `color`/`colorSide` so it reads as part of that object
    // instead of the old one-size-fits-all green-on-brown look.
    movingPlatforms: [
      // Hedge 1 — moving platform drifting back and forth along the
      // hedge's top (kept from the original design).
      {
        x: -30,
        y: 480,
        width: 180,
        range: 0,
        speed: 0,
        phase: 0,
        color: "#b78555",
        colorSide: "#8b6346",
      },

      {
        x: 250,
        y: 405,
        width: 140,
        range: 110,
        speed: 90,
        phase: 0,
        color: "#7CAF4C",
        colorSide: "#4B7A2E",
      },
      // Hedge 2 — same idea, offset phase so the two don't move in sync.
      {
        x: 540,
        y: 405,
        width: 140,
        range: 110,
        speed: 90,
        phase: 1.5,
        color: "#7CAF4C",
        colorSide: "#4B7A2E",
      },
      // Tree — middle-of-the-canopy platform (a flashing dog hazard
      // sits on this one, see hazards below).
      {
        x: 870,
        y: 370,
        width: 130,
        range: 0,
        speed: 0,
        phase: 0,
        color: "#79c14f",
        colorSide: "#4d7a48",
      },
      // Tree — short platform up near the top of the canopy, just a
      // safe resting spot on the way to the building.
      {
        x: 890,
        y: 200,
        width: 90,
        range: 0,
        speed: 0,
        phase: 0,
        color: "#dfe9f0",
        colorSide: "#7dafd5",
      },
      // Building — second-floor balcony (a flashing dog hazard sits on
      // this one too).
      {
        x: 1060,
        y: 325,
        width: 250,
        range: 0,
        speed: 0,
        phase: 0,
        color: "#D8C6A1",
        colorSide: "#A68A5B",
      },
      // Building — rooftop. Final platform; holds the mailbox.
      {
        x: 1060,
        y: 135,
        width: 250,
        range: 0,
        speed: 0,
        phase: 0,
        color: "#586683",
        colorSide: "#0F2D4C",
      },
    ],

    // `flash: true` boxes blink on their own rate/phase (see
    // isHazardVisible() in main.js) and only damage the player while
    // flashed in — while flashed out, collision is skipped entirely so
    // the player can walk straight through. `sprite: "whitedog"` renders
    // these two with Stage 5's own whitedog.png instead of box.png.
    hazards: [
      // sits on the tree's middle platform (x:870-1000, y:370) — only
      // damages while flashed in; while flashed out it's fully gone,
      // collision included, so the player can walk straight through.
      {
        x: 895,
        width: 79,
        height: 56,
        y: 314,
        sprite: "whitedog",
        flash: true,
        flashOn: 0.8,
        flashOff: 3,
        flashPhase: 0.4,
      },
      // sits on the building's 2nd-floor balcony platform (x:1060-1310, y:325)
      {
        x: 1175,
        width: 79,
        height: 56,
        y: 269,
        sprite: "whitedog",
        flash: true,
        flashOn: 0.5,
        flashOff: 1,
        flashPhase: 1.2,
      },
    ],

    // New for this stage: dogs that patrol back and forth along the
    // ground beneath the hedges (solid ground now, no pit) instead of
    // the old fall-through floor. Always visible, always damaging on
    // touch — same "reset on contact" rule as every other hazard, just
    // grounded and moving instead of static/airborne. Motion itself
    // (inching forward, pausing, turning around at the ends) is handled
    // in main.js's updateGroundHazards() rather than the smooth
    // ping-pong the moving platforms use, so `speed` here just sets each
    // dog's own base walking rate.
    groundHazards: [
      {
        x: 220,
        width: 79,
        height: 56,
        range: 550,
        speed: 125,
        phase: 1.2,
        sprite: "whitedog",
      },
    ],
  },
];
function buildWorld(stages, levelIndex = 0) {
  const sections = [];
  const ground = [];
  const trapGround = [];
  const movingPlatforms = [];
  const hazards = [];
  const groundHazards = [];
  const blocks = [];
  const mailboxes = [];
  // Decorative trees + the birds perched on them (Level 2 onward). Kept as
  // their own arrays, offset the same way as everything else above, so a
  // stage just lists them in local coordinates and buildWorld() places them
  // correctly in the level's world space.
  const trees = [];
  const birds = [];

  let offsetX = 0;

  stages.forEach((def, i) => {
    const startX = offsetX;
    const endX = startX + def.width;

    sections.push({
      index: i, // position within the continuous map (used by getSectionIndexForX)
      levelIndex,
      stageIndex: i,
      title: def.title,
      intro: def.intro,
      startX,
      endX,
      spawn: { x: startX + def.spawn.x, y: def.spawn.y },
      // Preserve each stage's own "how far can you fall before you die"
      // rule (Level 5's tall vertical climb needed a much lower limit
      // than the default).
      fallLimit:
        def.fallLimit !== undefined ? def.fallLimit : def.groundY + 300,
    });

    for (const g of def.ground) {
      ground.push({ x: startX + g.x, width: g.width });
    }
    for (const t of def.trapGround) {
      trapGround.push({ ...t, x: startX + t.x });
    }
    for (const p of def.movingPlatforms) {
      movingPlatforms.push({ ...p, x: startX + p.x });
    }
    for (const hz of def.hazards) {
      hazards.push({ ...hz, x: startX + hz.x });
    }
    for (const gh of def.groundHazards || []) {
      groundHazards.push({ ...gh, x: startX + gh.x });
    }
    for (const b of def.blocks || []) {
      blocks.push({ ...b, x: startX + b.x });
    }
    for (const tr of def.trees || []) {
      trees.push({ ...tr, x: startX + tr.x });
    }
    for (const b of def.birds || []) {
      birds.push({ ...b, x: startX + b.x });
    }

    const d = def.door;
    mailboxes.push({
      x: startX + d.x,
      y: d.y, // undefined => sits on the shared ground line
      width: d.width,
      height: d.height,
      levelIndex,
      stageIndex: i,
      activated: false,
    });

    offsetX = endX;
  });

  return {
    width: offsetX,
    groundY: 550,
    spawn: { x: sections[0].spawn.x, y: sections[0].spawn.y },
    levelIndex,
    // How many stages of this level actually have content — used by the
    // level-select grid to decide what's clickable vs. permanently greyed
    // out, independent of what Progress has (pre-)unlocked.
    stageCount: stages.length,
    builtLevelIndices: [levelIndex],
    sections,
    ground,
    trapGround,
    movingPlatforms,
    hazards,
    groundHazards,
    blocks,
    mailboxes,
    trees,
    birds,
  };
}

// ============================================================
// LEVEL 2 — a brand new world, NOT a continuation of Level 1's map.
// Only L2-1 exists so far; the other 4 stage slots for this level stay
// locked in the level-select grid until they're built (see stageCount
// above / the "built" check in level-select.js).
//
// Reuses BG.png as its backdrop (per the ask — dedicated Level 2 art
// isn't ready yet) and tree.png for three evenly-spaced decorative
// trees. Each tree has a bird perched in it; bird art isn't ready
// either, so these reuse dog.png as a placeholder sprite (see
// birdOnTree() below / main.js's drawing code) — mechanically they're birds,
// not hazards: touching one doesn't hurt the player, but they
// occasionally chirp (env_bird_mushikui_2.mp3) and briefly freeze the
// player's controls when they do (see updateBirds() in main.js).
// ============================================================

// tree.png is 779x1177 natively (~1.51 aspect); dog.png (reused for the
// birds) is drawn small here, at roughly its own native ~1.41 aspect.
const TREE_DRAW_W = 200;
const TREE_DRAW_H = 302;
const BIRD_DRAW_W = 42;
const BIRD_DRAW_H = 30;
// How far down from the top of a tree's canopy a perched bird sits.
const BIRD_PERCH_OFFSET_Y = 60;
const LEVEL_2_GROUND_Y = 550;

// Places a bird centered horizontally in the tree at `treeX`, perched
// near the top of its canopy. Keeps the tree/bird math in one place so
// the three trees below don't each hand-roll the same arithmetic.
function birdOnTree(treeX, id) {
  return {
    id,
    x: treeX + TREE_DRAW_W / 2 - BIRD_DRAW_W / 2,
    width: BIRD_DRAW_W,
    height: BIRD_DRAW_H,
    y: LEVEL_2_GROUND_Y - TREE_DRAW_H + BIRD_PERCH_OFFSET_Y,
    sprite: "dog", // placeholder — dog.png reused until bird art exists
  };
}

const LEVEL_2_STAGES = [
  {
    title: "Stage 1 — A New Path",
    intro:
      "The road behind you is gone; there's no walking back to it now.\n" +
      "Ahead is somewhere new — quiet, green, and watching.\n" +
      "Listen closely. Not everything here stays still.",
    width: 1400,
    groundY: LEVEL_2_GROUND_Y,
    spawn: { x: 80, y: 450 },
    door: { x: 1300, width: 56, height: 90 },
    ground: [{ x: 0, width: 1400 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
    groundHazards: [],
    blocks: [],
    // Three trees, evenly spaced across the stage.
    trees: [
      { x: 260, width: TREE_DRAW_W, height: TREE_DRAW_H },
      { x: 680, width: TREE_DRAW_W, height: TREE_DRAW_H },
      { x: 1100, width: TREE_DRAW_W, height: TREE_DRAW_H },
    ],
    // One bird per tree.
    birds: [
      birdOnTree(260, "bird-1"),
      birdOnTree(680, "bird-2"),
      birdOnTree(1100, "bird-3"),
    ],
  },
];

// ---------- The active-world registry ----------
// Each level gets its own independent, self-contained map (its own width,
// ground, sections, mailboxes...) instead of everything sharing one giant
// continuous x-space. `WORLD` always points at whichever level is
// currently loaded; main.js reassigns it (via setActiveLevel(), called
// from loadWorld()) whenever the player starts a stage in a different
// level, so every existing `WORLD.*` reference elsewhere in the engine
// keeps working unchanged no matter which level is active. Because each
// level's map is its own separate object with its own width/ground, there
// is no shared coordinate space linking them — so, e.g., walking to the
// right edge of Level 2 can't lead back into Level 1.
const WORLD_DEFS = {
  0: buildWorld(LEVEL_1_STAGES, 0),
  1: buildWorld(LEVEL_2_STAGES, 1),
};

let WORLD = WORLD_DEFS[0];

function setActiveLevel(levelIndex) {
  const def = WORLD_DEFS[levelIndex];
  if (def) WORLD = def;
  return WORLD;
}
