// ============================================================
// LEVEL DATA
// Each level is built from simple primitives the engine understands:
//   ground:   { x, width }            -> solid floor segment at GROUND_Y
//   trapGround: { x, width, id }      -> looks solid, collapses into a pit
//                                         once the player jumps anywhere
//                                         near it (Level 2 mechanic)
//   movingPlatform: { x, y, width, range, speed, phase }
//                                      -> platform oscillates horizontally
//                                         between x and x+range
//   hazard:   { x, width, height }    -> flashing red block, instant death
//   spawn:    { x, y }                -> player start position
//   door:     { x, width, height }    -> level exit
//   width:    total level width (for camera bounds)
//   intro/title: shown on the level-start overlay
// ============================================================

const LEVELS = [
  {
    title: "Level 1 — Irregular Small Tics",
    intro:
      "Tics can appear suddenly, without warning, anywhere in the body.\n" +
      "One flash. One twitch. You just have to be ready to jump over it.",
    width: 1700,
    groundY: 560,
    spawn: { x: 80, y: 460 },
    door: { x: 1580, width: 56, height: 90 },
    ground: [
      { x: 0, width: 1700 },
    ],
    trapGround: [],
    movingPlatforms: [],
    hazards: [
      { x: 820, width: 40, height: 50, flash: true },
    ],
  },

  {
    title: "Level 2 — Cause-and-Effect Tics",
    intro:
      "From the outside, everything looks calm and ordinary.\n" +
      "But one sudden movement — and the ground gives way beneath you.\n" +
      "Careful what you jump for.",
    width: 1900,
    groundY: 560,
    spawn: { x: 80, y: 460 },
    door: { x: 1780, width: 56, height: 90 },
    ground: [
      { x: 0, width: 1900 },
    ],
    trapGround: [
      { x: 560, width: 140, id: "t1" },
      { x: 1180, width: 140, id: "t2" },
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
    width: 2000,
    groundY: 560,
    spawn: { x: 80, y: 460 },
    door: { x: 1880, width: 56, height: 90 },
    ground: [
      { x: 0, width: 480 },
      { x: 1560, width: 440 },
    ],
    trapGround: [],
    movingPlatforms: [
      { x: 560, y: 560, width: 110, range: 320, speed: 90, phase: 0 },
      { x: 1080, y: 560, width: 110, range: 320, speed: 110, phase: 1.5 },
    ],
    hazards: [],
  },
];
