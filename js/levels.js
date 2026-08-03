// ============================================================
// LEVEL 1 — five stages/checkpoints (L1-1 through L1-5).
//
// OBSTACLE WIPE (team pivot): every hazard/trap/moving-platform/block
// has been stripped out of all 3 levels so the team can redesign them
// from scratch. Each stage is left as flat, walkable ground spanning
// the full stage width, with its original spawn point and door
// (checkpoint) untouched so progress/checkpoints keep working exactly
// as before. Titles/intro text left as-is.
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
    trapGround: [],
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
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
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
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
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
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },
];

// ============================================================
// LEVEL 2 — five stages/checkpoints (L2-1 through L2-5). Reuses
// BG2.png as its backdrop.
// ============================================================
const LEVEL_2_GROUND_Y = 550;

const LEVEL_2_STAGES = [
  {
    title: "Stage 1 — A New Path",
    intro:
      "The road behind you is gone; there's no walking back to it now.\n" +
      "Ahead is somewhere new — quiet, green, and watching.\n" +
      "Listen closely. Not everything here stays still.",
    width: 1280,
    groundY: LEVEL_2_GROUND_Y,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },

  {
    title: "Stage 2 — Drowned Out",
    intro:
      "Someone nearby is trying to tell you something important.\n" +
      "But the noise keeps cutting in — sudden, loud, impossible to ignore.\n" +
      "Listen closely. Piece it together, even through the interruptions.",
    width: 1280,
    groundY: LEVEL_2_GROUND_Y,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },

  {
    title: "Stage 3 — Underfoot",
    intro:
      "The path changes beneath your feet before you even see it.\n" +
      "Every step here announces itself, loud and unavoidable.\n" +
      "Slow down — hold H — and even loud ground learns to stay quiet.",
    width: 1280,
    groundY: LEVEL_2_GROUND_Y,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    // Gravel patch positioned to match the stone path drawn into BG2.png
    // (roughly local x 105-1200) — this is a footstep-sound/background
    // match, not an obstacle, so it's left in place.
    ground: [
      { x: 0, width: 105 },
      { x: 105, width: 1095, surface: "gravel" },
      { x: 1200, width: 80 },
    ],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },

  {
    title: "Stage 4 — Static",
    intro:
      "The sky finally lets go, all at once.\n" +
      "Rain won't hurt you, but the light that follows the thunder can.\n" +
      "Keep moving — standing still under the wrong flash is a bad idea.",
    width: 1280,
    groundY: LEVEL_2_GROUND_Y,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },

  {
    title: "Stage 5 — Bark Back",
    intro:
      "Every dog on this street knows exactly where you're headed.\n" +
      "While they're quiet, walk the way you always have.\n" +
      "The second they start barking, your own feet turn against you.",
    width: 1280,
    groundY: LEVEL_2_GROUND_Y,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },
];

// ============================================================
// LEVEL 3 — five stages/checkpoints (L3-1 through L3-5).
// Owned by the Level 3 teammate — left as flat, obstacle-free ground
// (background/grass and checkpoints preserved) ready for a full
// redesign.
// ============================================================
const LEVEL_3_STAGES = [
  {
    title: "Stage 1 — Unwanted Attention",
    intro:
      "Not every reaction is unkind — but it can still feel like too much.\n" +
      "Stay aware. Keep moving forward.",
    width: 2134,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 2004, width: 56, height: 90 },
    ground: [{ x: 0, width: 2134 }],
    trapGround: [{ x: 1006, width: 96 }],
    movingPlatforms: [],
    hazards: [],
    groundHazards: [
      {
        x: 1608,
        width: 64,
        height: 64,
        sprite: "whitedog",
        range: 392,
        speed: 140,
      },
    ],
    // Obstacle 1 — "stacked boxes" (stackedboxes.png, drawn at its native
    // ~186x187 aspect ratio, not stretched). At 187px tall this clears
    // the player's normal jump apex (~128px), so it can't be jumped over
    // yet — intentional until the planned superjump feature exists.
    blocks: [
      { x: 560, width: 186, height: 187, sprite: "stackedboxes" },
      { x: 915, width: 79, height: 97, sprite: "box2" },
      { x: 1403, width: 186, height: 187, sprite: "stackedboxes" },
    ],
    // Super-jump NPC — the background art already shows the guy telling
    // you to talk to him; this is just his hitbox. Stand within `radius`
    // of him for the full `chargeTime` (2s, uninterrupted) to bank a
    // single-use super jump — it stays available even after walking
    // away, until your next jump uses it up. jumpMultiplier is tuned so
    // that boosted jump clears the 187px-tall stacked boxes at x:560.
    jumpBoostNpcs: [
      {
        x: 407,
        y: 518,
        radius: 60,
        chargeTime: 2,
        jumpMultiplier: 1.4,
      },
      {
        x: 1250,
        y: 518,
        radius: 60,
        chargeTime: 2,
        jumpMultiplier: 1.4,
      },
    ],
  },

  {
    title: "Stage 2 — Dialogue",
    intro:
      "Keeping up a conversation means catching every part of it.\n" +
      "Don't let any of it fall past you.",
    width: 2133,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 2003, width: 56, height: 90 },
    ground: [
      { x: 0, width: 27 },
      { x: 27, width: 930, surface: "gravel" },
      { x: 957, width: 1176 },
    ],
    trapGround: [],
    movingPlatforms: [],
    blocks: [
      { x: 2932, width: 61, height: 53, sprite: "box" },
    ],
    hazards: [
      {
        x: 420,
        width: 79,
        height: 56,
        sprite: "dog",
        flash: true,
        flashOn: 1,
        flashOff: 0.5,
        flashPhase: 0.2,
      },
    ],
    birds: [
      { x: 250, y: 150, width: 48, height: 40 },
      { x: 650, y: 110, width: 48, height: 40 },
    ],
  },

  {
    title: "Stage 3 — Positive / Supportive Social Interactions",
    intro:
      "On your own, some gaps feel too wide to clear.\n" +
      "Stay near the people who support you, and hold T to lean on them — they'll help you build the speed to cross.",
    width: 2133,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 2003, width: 56, height: 90 },
    ground: [{ x: 0, width: 2133 }],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
  },

  // Team pivot: Level 3 is now 3 checkpoints instead of 5 (L3-1/2/3).
  // Stages 4 & 5 were removed rather than left in unbuilt/unlocked, so
  // isStageBuilt() naturally treats them as not-built and the level
  // select grid greys them out. If a 4th/5th checkpoint comes back
  // later, just re-add stage objects here in the same shape as above.
];

// ============================================================
// BUILD ONE LEVEL
// ============================================================
function buildWorld(stages, levelIndex = 0) {
  const sections = [];
  const ground = [];
  const trapGround = [];
  const movingPlatforms = [];
  const hazards = [];
  const groundHazards = [];
  const blocks = [];
  const mailboxes = [];
  const duckFollowers = [];
  const bubbles = [];
  const supportNPCs = [];
  const jumpBoostNpcs = [];
  const pushingNpcs = [];
  const trees = [];
  const birds = [];

  let offsetX = 0;

  stages.forEach((def, i) => {
    const startX = offsetX;
    const endX = startX + def.width;

    sections.push({
      index: i,
      levelIndex,
      stageIndex: i,
      title: def.title,
      intro: def.intro,
      startX,
      endX,

      spawn: {
        x: startX + def.spawn.x,
        y: def.spawn.y,
      },

      fallLimit:
        def.fallLimit !== undefined ? def.fallLimit : def.groundY + 300,

      baseSpeedFactor:
        def.baseSpeedFactor !== undefined ? def.baseSpeedFactor : 1,

      // Level 2-2's "Drowned Out" code-lock puzzle (NPC + speech bubble
      // + honking cars). npc/cars are optional per-stage config objects;
      // codeLock flags which section (if any) owns the mechanic.
      npc: def.npc ? { ...def.npc, x: startX + def.npc.x } : null,
      cars: def.cars
        ? {
            ...def.cars,
            minX: startX + (def.cars.minX !== undefined ? def.cars.minX : 0),
            maxX:
              startX +
              (def.cars.maxX !== undefined ? def.cars.maxX : def.width),
          }
        : null,
      codeLock: !!def.codeLock,
      // Level 2-4's thunderstorm weather (random lightning flashes),
      // with rain/lightning each confined to their own zones (green vs.
      // red pillars in BG2.png) when the stage provides them.
      storm: !!def.storm,
      rainZones: (def.rainZones || []).map((z) => ({
        x: startX + z.x,
        width: z.width,
      })),
      lightningZones: (def.lightningZones || []).map((z) => ({
        x: startX + z.x,
        width: z.width,
      })),
      // Level 2-5's ("Bark Back") barking-dog / control-inversion
      // mechanic — see initBarkState()/updateBarkState()/
      // isControlsInverted() in main.js.
      barkingDogs: !!def.barkingDogs,
      barkConfig: def.barkConfig || null,
    });

    for (const g of def.ground) {
      ground.push({
        x: startX + g.x,
        width: g.width,
        surface: g.surface || "dirt",
      });
    }

    for (const t of def.trapGround) {
      trapGround.push({
        ...t,
        x: startX + t.x,
      });
    }

    for (const p of def.movingPlatforms) {
      movingPlatforms.push({
        ...p,
        x: startX + p.x,
      });
    }

    for (const hz of def.hazards) {
      hazards.push({
        ...hz,
        x: startX + hz.x,
      });
    }

    for (const gh of def.groundHazards || []) {
      groundHazards.push({
        ...gh,
        x: startX + gh.x,
      });
    }

    for (const b of def.blocks || []) {
      blocks.push({
        ...b,
        x: startX + b.x,
      });
    }

    for (const d of def.duckFollowers || []) {
      duckFollowers.push({
        ...d,

        // Initial world position
        x: startX + d.triggerX,

        // Trigger position
        triggerX: startX + d.triggerX,

        stageIndex: i,
        levelIndex,
      });
    }

    for (const b of def.bubbles || []) {
      bubbles.push({
        ...b,
        x: startX + b.x,
        stageIndex: i,
        levelIndex,
      });
    }

    for (const n of def.supportNPCs || []) {
      supportNPCs.push({
        ...n,
        x: startX + n.x,
        stageIndex: i,
        levelIndex,
      });
    }

    for (const n of def.jumpBoostNpcs || []) {
      jumpBoostNpcs.push({
        ...n,
        x: startX + n.x,
        stageIndex: i,
        levelIndex,
      });
    }

    for (const n of def.pushingNpcs || []) {
      pushingNpcs.push({
        ...n,
        x: startX + n.x,
        stageIndex: i,
        levelIndex,
      });
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
      y: d.y,
      width: d.width,
      height: d.height,
      levelIndex,
      stageIndex: i,
      activated: false,
      locked: !!def.codeLock,
    });

    offsetX = endX;
  });

  return {
    width: offsetX,
    groundY: 550,
    spawn: {
      x: sections[0].spawn.x,
      y: sections[0].spawn.y,
    },

    levelIndex,
    builtLevelIndices: [levelIndex],

    sections,
    ground,
    trapGround,
    movingPlatforms,
    hazards,
    groundHazards,
    blocks,
    mailboxes,
    duckFollowers,
    bubbles,
    supportNPCs,
    jumpBoostNpcs,
    pushingNpcs,
    trees,
    birds,
  };
}

// ============================================================
// BUILD MULTI-LEVEL WORLD
// ============================================================
function buildMultiWorld(levelDefs) {
  const LEVEL_GAP = 2000;
  const merged = {
    width: 0,
    groundY: 550,
    spawn: null,

    sections: [],
    ground: [],
    trapGround: [],
    movingPlatforms: [],
    hazards: [],
    groundHazards: [],
    blocks: [],
    mailboxes: [],
    duckFollowers: [],
    bubbles: [],
    supportNPCs: [],
    jumpBoostNpcs: [],
    pushingNpcs: [],
    trees: [],
    birds: [],

    builtLevelIndices: [],
  };

  let offsetX = 0;

  for (const { stages, levelIndex } of levelDefs) {
    const sub = buildWorld(stages, levelIndex);
    const shiftX = offsetX;

    sub.sections.forEach((s, i) => {
      merged.sections.push({
        ...s,

        startX: s.startX + shiftX,
        endX: s.endX + shiftX,

        spawn: {
          x: s.spawn.x + shiftX,
          y: s.spawn.y,
        },

        npc: s.npc ? { ...s.npc, x: s.npc.x + shiftX } : null,
        cars: s.cars
          ? {
              ...s.cars,
              minX: s.cars.minX + shiftX,
              maxX: s.cars.maxX + shiftX,
            }
          : null,

        stormZone: s.stormZone
          ? { ...s.stormZone, x: s.stormZone.x + shiftX }
          : null,
        rainZones: (s.rainZones || []).map((z) => ({ ...z, x: z.x + shiftX })),
        lightningZones: (s.lightningZones || []).map((z) => ({
          ...z,
          x: z.x + shiftX,
        })),

        index: merged.sections.length,
      });
    });

    merged.ground.push(
      ...sub.ground.map((g) => ({
        ...g,
        x: g.x + shiftX,
      })),
    );

    merged.trapGround.push(
      ...sub.trapGround.map((t) => ({
        ...t,
        x: t.x + shiftX,
      })),
    );

    merged.movingPlatforms.push(
      ...sub.movingPlatforms.map((p) => ({
        ...p,
        x: p.x + shiftX,
      })),
    );

    merged.hazards.push(
      ...sub.hazards.map((h) => ({
        ...h,
        x: h.x + shiftX,
      })),
    );

    merged.groundHazards.push(
      ...sub.groundHazards.map((g) => ({
        ...g,
        x: g.x + shiftX,
      })),
    );

    merged.blocks.push(
      ...sub.blocks.map((b) => ({
        ...b,
        x: b.x + shiftX,
      })),
    );

    merged.mailboxes.push(
      ...sub.mailboxes.map((m) => ({
        ...m,
        x: m.x + shiftX,
      })),
    );

    // Keep duck follower positions and trigger positions aligned
    // when the level is shifted into the combined world.
    merged.duckFollowers.push(
      ...(sub.duckFollowers || []).map((d) => ({
        ...d,
        x: d.x + shiftX,
        triggerX: d.triggerX + shiftX,
      })),
    );

    merged.bubbles.push(
      ...(sub.bubbles || []).map((b) => ({
        ...b,
        x: b.x + shiftX,
      })),
    );

    merged.supportNPCs.push(
      ...(sub.supportNPCs || []).map((n) => ({
        ...n,
        x: n.x + shiftX,
      })),
    );

    merged.jumpBoostNpcs.push(
      ...(sub.jumpBoostNpcs || []).map((n) => ({
        ...n,
        x: n.x + shiftX,
      })),
    );

    merged.pushingNpcs.push(
      ...(sub.pushingNpcs || []).map((n) => ({
        ...n,
        x: n.x + shiftX,
      })),
    );

    merged.trees.push(
      ...(sub.trees || []).map((t) => ({
        ...t,
        x: t.x + shiftX,
      })),
    );

    merged.birds.push(
      ...(sub.birds || []).map((b) => ({
        ...b,
        x: b.x + shiftX,
      })),
    );

    merged.builtLevelIndices.push(levelIndex);

    if (merged.spawn === null) {
      merged.spawn = {
        x: sub.spawn.x + shiftX,
        y: sub.spawn.y,
      };
    }

    // A wide dead-zone between levels (bigger than the viewport) so the
    // camera, clamped to [0, width - VIEW_W], can never have one level's
    // far edge and the next level's start on-screen at the same time —
    // they read as fully separate spaces, not one continuous map.
    offsetX += sub.width + LEVEL_GAP;
  }

  merged.width = offsetX - LEVEL_GAP;

  return merged;
}

// ============================================================
// FINAL WORLD
// ============================================================

const WORLD = buildMultiWorld([
  {
    stages: LEVEL_1_STAGES,
    levelIndex: 0,
  },

  {
    stages: LEVEL_2_STAGES,
    levelIndex: 1,
  },

  {
    stages: LEVEL_3_STAGES,
    levelIndex: 2,
  },
]);
