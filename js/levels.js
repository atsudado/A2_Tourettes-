const LEVELS = [
  {
    title: "Level 1 — Irregular Small Tics",
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
    title: "Level 2 — Cause-and-Effect Tics",
    intro:
      "From the outside, everything looks calm and ordinary.\n" +
      "But one sudden movement — and the ground gives way beneath you.\n" +
      "Careful what you jump for.",
    width: 1280,
    groundY: 550,
    spawn: { x: 80, y: 450 },
    door: { x: 1150, width: 56, height: 90 },
    ground: [{ x: 0, width: 1280 }],
    blocks: [
      { x: 300, width: 40, height: 80 },
      { x: 680, width: 40, height: 80 },
    ],
    trapGround: [
      { x: 380, width: 120, id: "t1" },
      { x: 760, width: 120, id: "t2" },
    ],
    movingPlatforms: [],
    hazards: [],
  },

  {
    title: "Level 3 — Delayed Tics",
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
    trapGround: [],
    movingPlatforms: [
      { x: 480, y: 560, width: 110, range: 260, speed: 90, phase: 0 },
      { x: 760, y: 560, width: 110, range: 220, speed: 110, phase: 1.5 },
    ],
    hazards: [],
  },

  {
    title: "Level 4 — Persistent Tics",
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
    title: "Level 5 — Blinking Tics",
    intro:
      "Tics don't always come one at a time.\n" +
      "Sometimes they layer — a movement here, a flash there, the ground shifting beneath you.\n" +
      "Stay focused. Keep moving.",
    width: 1280,
    groundY: 720,
    fallLimit: 720,
    spawn: { x: 40, y: 480 },
    door: { x: 1150, width: 56, height: 90, y: 50 },

    ground: [],
    trapGround: [],

    // Every platform and hazard below sits inside the visible 1280x720
    // viewport (the camera never scrolls in this game), and each step up
    // is within the player's ~128px max jump height.
    movingPlatforms: [
      { x: 0, y: 600, width: 160, range: 0, speed: 0, phase: 0 }, // start
      { x: 260, y: 560, width: 130, range: 160, speed: 80, phase: 0 },
      { x: 560, y: 560, width: 130, range: 160, speed: 80, phase: 1.5 },
      { x: 900, y: 460, width: 150, range: 0, speed: 0, phase: 0 },
      { x: 760, y: 350, width: 140, range: 0, speed: 0, phase: 0 },
      { x: 980, y: 230, width: 140, range: 0, speed: 0, phase: 0 },
      { x: 1100, y: 140, width: 160, range: 0, speed: 0, phase: 0 }, // landing, holds the mailbox
    ],

    hazards: [
      { x: 935, width: 79, height: 56, y: 404 }, // sits on the y:460 platform
      { x: 1010, width: 79, height: 56, y: 174 }, // sits on the y:230 platform
    ],
  },
];

// ============================================================
// WORLD — merges the 5 formerly-separate levels above into one
// continuous, seamlessly-scrolling map.
//
// Each level's content is shifted rightward by the combined width of all
// levels before it, so level 2 starts exactly where level 1 ends, and so
// on. Every level's original layout (ground, blocks, traps, moving
// platforms, hazards) is preserved untouched relative to its own section
// — only the x-offset changes.
//
// Each level's former "door" becomes a mailbox checkpoint: touching
// mailbox N sets the player's respawn point to the start of section N+1
// (exactly where the old door used to send you). Touching the final
// mailbox ends the game, same as finishing the old level 5.
// ============================================================
function buildWorld(levels) {
  const sections = [];
  const ground = [];
  const trapGround = [];
  const movingPlatforms = [];
  const hazards = [];
  const blocks = [];
  const mailboxes = [];

  let offsetX = 0;

  levels.forEach((def, i) => {
    const startX = offsetX;
    const endX = startX + def.width;

    sections.push({
      index: i,
      title: def.title,
      intro: def.intro,
      startX,
      endX,
      spawn: { x: startX + def.spawn.x, y: def.spawn.y },
      // Preserve each level's own "how far can you fall before you die"
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
    for (const b of def.blocks || []) {
      blocks.push({ ...b, x: startX + b.x });
    }

    const d = def.door;
    mailboxes.push({
      x: startX + d.x,
      y: d.y, // undefined => sits on the shared ground line
      width: d.width,
      height: d.height,
      sectionIndex: i,
      activated: false,
    });

    offsetX = endX;
  });

  return {
    width: offsetX,
    // Shared ground baseline. Only levels 1-4 use flat "ground" collision
    // (all authored at groundY:550); level 5 places every platform and
    // hazard at an explicit y and never touches this value, so one shared
    // number works fine for the whole combined world.
    groundY: 550,
    spawn: { x: sections[0].spawn.x, y: sections[0].spawn.y },
    sections,
    ground,
    trapGround,
    movingPlatforms,
    hazards,
    blocks,
    mailboxes,
  };
}

const WORLD = buildWorld(LEVELS);
