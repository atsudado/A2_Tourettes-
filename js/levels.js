// ============================================================
// LEVELS — SHARED ENGINE CORE
// This file no longer holds any per-level stage data. It just
// turns stage-data arrays into playable worlds and keeps the
// active-world registry.
//
// Level data now lives in its own file per level:
//   js/level1.js  -> LEVEL_1_STAGES (L1-1 through L1-5)
//   js/level2.js  -> LEVEL_2_STAGES (L2-1, L2-2 so far)
//
// index.html must load level1.js and level2.js BEFORE this file,
// since buildWorld() below is called with LEVEL_1_STAGES /
// LEVEL_2_STAGES as soon as this file runs.
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
      // Level 2-2's "Drowned Out" code-lock puzzle (NPC + speech bubble
      // + honking cars — see main.js's initCodeLock()/updateCarsAndNpc()).
      // `npc`/`cars` are optional per-stage config objects; codeLock just
      // flags which section (if any) currently owns the mechanic so it
      // can be found generically instead of by hardcoded index.
      npc: def.npc ? { ...def.npc, x: startX + def.npc.x } : null,
      cars: def.cars
        ? {
            ...def.cars,
            minX:
              startX + (def.cars.minX !== undefined ? def.cars.minX : 0),
            maxX:
              startX +
              (def.cars.maxX !== undefined ? def.cars.maxX : def.width),
          }
        : null,
      codeLock: !!def.codeLock,
      // Level 2-4's thunderstorm weather (random-x lightning strikes +
      // falling rain droplets — see initWeather()/updateWeather()/
      // drawWeather() in main.js). Just a flag on the section; the actual
      // rain-drop/lightning state lives on `world`, same pattern as
      // codeLock/npc/cars above.
      storm: !!def.storm,
    });

    for (const g of def.ground) {
      // `surface` is optional per ground segment ("gravel" so far — see
      // Level 2 / Stage 3); defaults to the plain/dirt look + no footstep
      // sound when a stage doesn't specify one, so every earlier stage's
      // ground data keeps working unchanged.
      ground.push({
        x: startX + g.x,
        width: g.width,
        surface: g.surface || "dirt",
      });
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
      // Locked mailboxes (Level 2-2's code puzzle) don't complete the
      // stage on touch until the right code has been entered — see the
      // mailbox-collision handling in main.js's update().
      locked: !!def.codeLock,
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
