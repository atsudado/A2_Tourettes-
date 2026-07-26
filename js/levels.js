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
// ============================================================
// LEVEL 2 — only stages 1 and 2 (L2-1, L2-2) are built so far, per
// spec: do not touch L1-1..5, and don't build L2-3/4/5 yet.
//
// New mechanic this level: birds perched in trees (using dog.png as a
// placeholder sprite — no bird art yet) that chirp at random. A chirp
// locks the player's controls and freezes them in place for 1.5s (see
// updateBirds()/freezePlayer() in main.js). Trees are pure background
// decoration (tree.png, no collision) with 3 evenly spaced per stage.
// ============================================================
const LEVEL_2_STAGES = [
  {
    title: "Stage 1 — Vocal Tics",
    intro:
      "Not every tic is a movement.\n" +
      "Sometimes it's a sound — sudden, involuntary, out of nowhere.\n" +
      "When you hear it, you won't be able to do anything but wait it out.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
    // 3 trees evenly spaced across the 1280-wide stage (quarter marks:
    // 320 / 640 / 960), each with one bird perched near the top of the
    // canopy.
    trees: [
      { x: 320, width: 240 },
      { x: 640, width: 240 },
      { x: 960, width: 240 },
    ],
    birds: [
      { x: 320, treeWidth: 240 },
      { x: 640, treeWidth: 240 },
      { x: 960, treeWidth: 240 },
    ],
  },

  {
    title: "Stage 2 — Vocal Tics (Continued)",
    intro:
      "The sounds keep coming, closer together now.\n" +
      "You'll get used to freezing mid-stride — you don't have a choice.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
    trees: [
      { x: 320, width: 240 },
      { x: 640, width: 240 },
      { x: 960, width: 240 },
    ],
    // Same layout as Stage 1, but each bird chirps on a shorter average
    // cycle (see chirpMin/chirpMax) so the stage feels a notch harder.
    birds: [
      { x: 320, treeWidth: 240, chirpMin: 3, chirpMax: 6 },
      { x: 640, treeWidth: 240, chirpMin: 3, chirpMax: 6 },
      { x: 960, treeWidth: 240, chirpMin: 3, chirpMax: 6 },
    ],
  },
];

// Builds the one continuous map out of one or more levels' worth of
// stages, each group keeping its own levelIndex but all sharing a single
// running offsetX — so the whole game (all built levels back to back)
// stays one seamless map, exactly like the original single-level
// buildWorld did. Pass groups in play order: [{levelIndex, stages}, ...].
function buildWorld(levelGroups) {
  const sections = [];
  const ground = [];
  const trapGround = [];
  const movingPlatforms = [];
  const hazards = [];
  const groundHazards = [];
  const blocks = [];
  const mailboxes = [];
  const trees = [];
  const birds = [];
  const builtLevelIndices = [];

  let offsetX = 0;

  for (const { levelIndex, stages } of levelGroups) {
    builtLevelIndices.push(levelIndex);

    stages.forEach((def, i) => {
      const startX = offsetX;
      const endX = startX + def.width;

      sections.push({
        index: sections.length, // position within the continuous map (used by getSectionIndexForX)
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
      for (const bd of def.birds || []) {
        birds.push({ ...bd, x: startX + bd.x });
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
  }

  return {
    width: offsetX,
    groundY: 550,
    spawn: { x: sections[0].spawn.x, y: sections[0].spawn.y },
    builtLevelIndices,
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

const WORLD = buildWorld([
  { levelIndex: 0, stages: LEVEL_1_STAGES },
  { levelIndex: 1, stages: LEVEL_2_STAGES },
]);
