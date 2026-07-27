// ============================================================
// LEVEL 2 DATA — currently just L2-1 and L2-2 (L2-3 through L2-5
// stay locked in level-select until they're built).
// This file only defines LEVEL_2_STAGES (pure data, plus its own
// small tree/bird layout helpers). The shared engine logic that
// turns stage data into a playable world (buildWorld(), the WORLD
// registry, setActiveLevel()) lives in levels.js — load this file
// BEFORE levels.js in index.html.
// ============================================================
// ============================================================
// LEVEL 2 — a brand new world, NOT a continuation of Level 1's map.
// Only L2-1 exists so far; the other 4 stage slots for this level stay
// locked in the level-select grid until they're built (see stageCount
// above / the "built" check in level-select.js).
//
// Reuses BG.png as its backdrop (per the ask — dedicated Level 2 art
// isn't ready yet) and tree.png for three evenly-spaced decorative
// trees. Each tree has a bird perched in it, rendered with bird.png
// (see birdOnTree() below / main.js's drawing code) — mechanically
// they're birds, not hazards: touching one doesn't hurt the player,
// but they occasionally chirp (env_bird_mushikui_2.mp3) and briefly
// freeze the player's controls when they do (see updateBirds() in
// main.js).
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
    sprite: "bird",
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

  {
    title: "Stage 2 — Drowned Out",
    intro:
      "Someone nearby is trying to tell you something important.\n" +
      "But the noise keeps cutting in — sudden, loud, impossible to ignore.\n" +
      "Listen closely. Piece it together, even through the interruptions.",
    width: 1400,
    groundY: LEVEL_2_GROUND_Y,
    spawn: { x: 80, y: 450 },
    door: { x: 1300, width: 56, height: 90 },
    ground: [{ x: 0, width: 1400 }],
    // Deliberately no trapGround/hazards/blocks here — the challenge in
    // this stage is entirely about listening and remembering, not
    // platforming, per the "no fast reactions required" accessibility
    // goal. Flat, hazard-free ground the whole way across.
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
    groundHazards: [],
    blocks: [],
    trees: [],
    birds: [],

    // The NPC who "speaks" the 4-digit code via a cycling speech bubble
    // (see main.js's initCodeLock()/drawCarsAndNpc()). `width`/`height`
    // size the placeholder sprite; swap NPC_PLACEHOLDER_SRC in main.js
    // for the real art whenever it's ready — nothing here needs to change.
    npc: { x: 650, width: 70, height: 96 },

    // Background cars that periodically honk and stamp "BEEP" over part
    // of the NPC's speech bubble. `minX`/`maxX` default to the full
    // stage width when omitted; spelled out here for clarity.
    cars: {
      laneY: 500,
      minX: 0,
      maxX: 1400,
      width: 70,
      height: 34,
      spawnIntervalMin: 1.6,
      spawnIntervalMax: 3.2,
      speedMin: 150,
      speedMax: 240,
      honkIntervalMin: 1.3,
      honkIntervalMax: 2.8,
    },

    // Marks this as the section main.js's code-lock mechanic should
    // attach to; its mailbox spawns locked (see buildWorld() above) and
    // only opens once the correct code has been entered on the keypad.
    codeLock: true,
  },
];
