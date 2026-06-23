// ============================================================
// TACTIC — a small platformer about Tourette Syndrome
// Engine: plain canvas 2D, fixed-timestep-ish update loop.
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const VIEW_W = 1280;
const VIEW_H = 720;

const GRAVITY = 1800;          // px/s^2
const JUMP_VELOCITY = -680;    // px/s
const MOVE_SPEED = 320;        // px/s
const FRICTION_GROUND = 0.0;   // (instant accel model, kept for tuning)
const PLAYER_W = 28;
const PLAYER_H = 64;
const TRAP_FALL_DELAY = 0.28;  // seconds between jump-trigger and collapse
const TRAP_TRIGGER_RANGE = 520; // how far from player a trap can be armed

let currentLevelIndex = 0;
let level = null;
let player = null;
let camera = { x: 0 };
let keys = { left: false, right: false, up: false };
let lastTime = null;
let gameTime = 0;
let levelStartOverlayShown = false;
let deathFlashTimer = 0;
let hazardSpawner = null; // interval ID for dynamic Level 1 hazard

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayBtn = document.getElementById("overlay-btn");
const levelLabel = document.getElementById("level-label");
const restartBtn = document.getElementById("restart-btn");

function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    w: PLAYER_W,
    h: PLAYER_H,
    grounded: false,
    wasGrounded: false,
    facing: 1,
    alive: true,
    standingTrapId: null,
  };
}

function loadLevel(index) {
  currentLevelIndex = index;
  const def = LEVELS[index];

  // deep-ish copy of mutable runtime state per level
  level = {
    def,
    trapState: def.trapGround.map(t => ({
      ...t,
      armed: false,
      fallTimer: 0,
      fallen: false,
      fallOffset: 0,
    })),
    movingPlatforms: def.movingPlatforms.map(p => ({ ...p })),
  };

  player = makePlayer(def.spawn);
  camera.x = 0;
  levelLabel.textContent = def.title.split("—")[0].trim();

  // ensure input state is reset
  keys.left = keys.right = keys.up = false;

  // clear any previous Level 1 spawner
  if (hazardSpawner !== null) {
    clearInterval(hazardSpawner);
    hazardSpawner = null;
  }

  // Level 1: spawn a single dynamic red cube at a new random x every 1.5s
  level.dynamicHazard = null;
  if (index === 0) {
    const hw = 40;
    const hh = 50;
    const minGapPlayer = 200; // avoid spawning too close to player center
    const minGapDoor = 180; // avoid spawning too close to door center
    const leftBound = 0;
    const rightBound = Math.max(0, def.width - hw);
    const pickX = () => {
      let attempts = 0;
      while (attempts < 50) {
        const nx = Math.floor(Math.random() * (rightBound - leftBound + 1)) + leftBound;
        const hazardCenter = nx + hw / 2;
        const playerCenter = player.x + player.w / 2;
        const doorCenter = def.door.x + def.door.width / 2;
        if (
          Math.abs(hazardCenter - playerCenter) >= minGapPlayer &&
          Math.abs(hazardCenter - doorCenter) >= minGapDoor
        ) {
          return nx;
        }
        attempts++;
      }
      // fallback if we couldn't find a spot after many attempts
      return Math.floor(Math.random() * (rightBound - leftBound + 1)) + leftBound;
    };

    level.dynamicHazard = { x: pickX(), width: hw, height: hh, flash: true };
    hazardSpawner = setInterval(() => {
      if (!level) return;
      const oldX = level.dynamicHazard ? level.dynamicHazard.x : -9999;
      let nx = pickX();
      // avoid trivial repeats
      let attempts = 0;
      while (Math.abs(nx - oldX) < 8 && attempts < 8) {
        nx = pickX();
        attempts++;
      }
      level.dynamicHazard = { x: nx, width: hw, height: hh, flash: true };
    }, 1500);
  }
}

function clampCamera(targetX) {
  const half = VIEW_W / 2;
  let cx = targetX - half;
  cx = Math.max(0, cx);
  cx = Math.min(level.def.width - VIEW_W, cx);
  if (level.def.width < VIEW_W) cx = 0;
  return cx;
}

function showLevelOverlay() {
  overlayTitle.textContent = level.def.title;
  overlayText.textContent = level.def.intro;
  overlayBtn.textContent = "Start";
  overlay.classList.remove("hidden");
  levelStartOverlayShown = true;
}

function showStartOverlay() {
  overlayTitle.textContent = "TACTIC";
  overlayText.textContent = "Press Play to begin.";
  overlayBtn.textContent = "Play";
  overlay.classList.remove("hidden");
  overlay.dataset.end = "";
}

function showEndOverlay() {
  overlayTitle.textContent = "TACTIC";
  overlayText.textContent =
    "You've reached the end of the demo.\n\n" +
    "Tourette Syndrome involves involuntary movements and sounds called tics.\n" +
    "They can be sudden, delayed, triggered, or seemingly random — but the people\n" +
    "who live with them adapt, every single day.\n\n" +
    "Thank you for playing.";
  overlayBtn.textContent = "Play Again";
  overlay.classList.remove("hidden");
  overlay.dataset.end = "1";
}

overlayBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  if (overlay.dataset.end === "1") {
    overlay.dataset.end = "";
    loadLevel(0);
    overlay.classList.add("hidden");
  }
});

restartBtn.addEventListener("click", () => {
  loadLevel(currentLevelIndex);
});

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") {
    keys.up = true;
  }
  if (e.code === "Escape") {
    loadLevel(currentLevelIndex);
  }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") {
    keys.up = false;
  }
});

// ------------------------------------------------------------
// Collision helpers
// ------------------------------------------------------------

function getGroundSegmentsAt(x) {
  // returns array of {left, right, top} solid ground spans at world x
  // Start with the defined ground segments, then subtract any fallen trap ranges
  const segs = [];
  for (const g of level.def.ground) {
    segs.push({ left: g.x, right: g.x + g.width, top: level.def.groundY });
  }

  for (const t of level.trapState) {
    if (!t.fallen) continue;
    const newSegs = [];
    for (const s of segs) {
      // no overlap
      if (t.x >= s.right || t.x + t.width <= s.left) {
        newSegs.push(s);
        continue;
      }
      // left piece
      if (t.x > s.left) {
        newSegs.push({ left: s.left, right: Math.min(t.x, s.right), top: s.top });
      }
      // right piece
      const rightStart = t.x + t.width;
      if (rightStart < s.right) {
        newSegs.push({ left: Math.max(rightStart, s.left), right: s.right, top: s.top });
      }
    }
    segs.length = 0;
    segs.push(...newSegs);
  }

  if (level.def.blocks && level.def.blocks.length) {
    for (const b of level.def.blocks) {
      segs.push({ left: b.x, right: b.x + b.width, top: level.def.groundY - b.height });
    }
  }

  return segs;
}

function getAllHazards() {
  const staticHazards = level.def.hazards || [];
  const dyn = level.dynamicHazard ? [level.dynamicHazard] : [];
  return staticHazards.concat(dyn);
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ------------------------------------------------------------
// Update
// ------------------------------------------------------------

function triggerJumpTraps() {
  // Called the instant the player leaves the ground via a jump.
  for (const t of level.trapState) {
    if (t.armed || t.fallen) continue;
    const centerX = t.x + t.width / 2;
    if (Math.abs(centerX - (player.x + player.w / 2)) <= TRAP_TRIGGER_RANGE) {
      t.armed = true;
      t.fallTimer = TRAP_FALL_DELAY;
    }
  }
}

function killPlayer() {
  if (!player.alive) return;
  player.alive = false;
  deathFlashTimer = 0.5;
  setTimeout(() => {
    loadLevel(currentLevelIndex);
  }, 420);
}

function updateMovingPlatforms(dt) {
  for (const p of level.movingPlatforms) {
    const t = gameTime * p.speed * 0.01 + p.phase * Math.PI;
    // ping-pong via sine wave for smooth back-and-forth motion
    const norm = (Math.sin(t) + 1) / 2; // 0..1
    p.currentX = p.x + norm * p.range;
  }
}

function updateTraps(dt) {
  for (const t of level.trapState) {
    if (t.armed && !t.fallen) {
      t.fallTimer -= dt;
      if (t.fallTimer <= 0) {
        t.fallen = true;
      }
    }
    if (t.fallen && t.fallOffset < 400) {
      t.fallOffset += 1400 * dt;
    }
  }
}

function update(dt) {
  if (!player.alive) return;

  updateMovingPlatforms(dt);
  updateTraps(dt);

  // horizontal input
  // Normal levels use instant velocity for responsive controls.
  // Level 3 has a slippery feel: smooth velocity changes both on ground and in the air.
  const targetVx = keys.left ? -MOVE_SPEED : keys.right ? MOVE_SPEED : 0;
  if (currentLevelIndex === 2 && player.grounded) {
    // smaller accel => more slippery on ground only
    const slipAccel = 1.0;
    const blend = Math.min(1, slipAccel * dt);
    player.vx += (targetVx - player.vx) * blend;
    if (player.vx < 0) player.facing = -1;
    else if (player.vx > 0) player.facing = 1;
  } else {
    player.vx = targetVx;
    if (player.vx < 0) player.facing = -1;
    else if (player.vx > 0) player.facing = 1;
  }

  // jump
  if (keys.up && player.grounded) {
    player.vy = JUMP_VELOCITY;
    player.grounded = false;
    triggerJumpTraps();
  }

  // gravity
  player.vy += GRAVITY * dt;

  // integrate horizontal
  const prevX = player.x;
  player.x += player.vx * dt;

  // horizontal collision with blocking `blocks` (solid obstacles)
  if (level.def.blocks && level.def.blocks.length) {
    for (const b of level.def.blocks) {
      const bx = b.x;
      const bTop = level.def.groundY - b.height;
      if (rectsOverlap(player.x, player.y, player.w, player.h, bx, bTop, b.width, b.height)) {
        if (player.x > prevX) {
          // moved right into a block
          player.x = bx - player.w;
        } else if (player.x < prevX) {
          // moved left into a block
          player.x = bx + b.width;
        }
        player.vx = 0;
      }
    }
  }

  player.x = Math.max(0, Math.min(level.def.width - player.w, player.x));

  // integrate vertical
  player.y += player.vy * dt;

  // ---- collisions: ground segments ----
  player.grounded = false;
  const feetY = player.y + player.h;
  const segs = getGroundSegmentsAt(player.x);
  for (const seg of segs) {
    const overlapX = player.x + player.w > seg.left && player.x < seg.right;
    if (overlapX && player.vy >= 0 && feetY >= seg.top && feetY - player.vy * dt <= seg.top + 12) {
      player.y = seg.top - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  // ---- collisions: moving platforms ----
  for (const p of level.movingPlatforms) {
    const px = p.currentX !== undefined ? p.currentX : p.x;
    const overlapX = player.x + player.w > px && player.x < px + p.width;
    const top = p.y;
    if (overlapX && player.vy >= 0 && feetY >= top && feetY - player.vy * dt <= top + 14) {
      player.y = top - player.h;
      player.vy = 0;
      player.grounded = true;
      // carry player with platform horizontal motion
      player.x += (px - (p.lastX !== undefined ? p.lastX : px));
    }
    p.lastX = px;
  }

  // ---- hazards (flashing tic blocks) ----
  for (const hz of getAllHazards()) {
    if (rectsOverlap(player.x, player.y, player.w, player.h, hz.x, level.def.groundY - hz.height, hz.width, hz.height)) {
      killPlayer();
      return;
    }
  }

  // ---- fell into a pit / off the world ----
  if (player.y > level.def.groundY + 300) {
    killPlayer();
    return;
  }

  // ---- door / level complete ----
  const d = level.def.door;
  const doorTop = level.def.groundY - d.height;
  if (rectsOverlap(player.x, player.y, player.w, player.h, d.x, doorTop, d.width, d.height)) {
    nextLevel();
  }

  // fixed view: show full level instead of following the player
  camera.x = 0;
}

function nextLevel() {
  if (currentLevelIndex + 1 < LEVELS.length) {
    loadLevel(currentLevelIndex + 1);
  } else {
    showEndOverlay();
  }
}

// ------------------------------------------------------------
// Render
// ------------------------------------------------------------

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  // outer background
  ctx.fillStyle = "#c98c2e";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const scale = Math.min(1, VIEW_W / level.def.width);
  const yOffset = (VIEW_H / scale - VIEW_H) / 2;

  ctx.save();
  ctx.translate(0, yOffset);
  ctx.scale(scale, scale);

  // playable strip background (lighter band like the reference art)
  ctx.fillStyle = "#e8c25f";
  ctx.fillRect(0, 220, level.def.width, level.def.groundY - 220);

  // ground line
  ctx.fillStyle = "#c98c2e";
  for (const g of level.def.ground) {
    // draw pit gaps under collapsed traps by skipping them visually too
    ctx.fillRect(g.x, level.def.groundY, g.width, VIEW_H - level.def.groundY);
  }

  // ground top edge highlight + trap ground tiles
  const groundEdgeColor = currentLevelIndex === 2 ? "#b87a23" : "#b87a23";
  for (const seg of level.def.ground) {
    ctx.fillStyle = groundEdgeColor;
    ctx.fillRect(seg.x, level.def.groundY, seg.width, 6);
  }

  for (const t of level.trapState) {
    if (t.fallen) {
      // falling slab graphic dropping out of view
      ctx.fillStyle = "#a8671c";
      ctx.fillRect(t.x, level.def.groundY + t.fallOffset, t.width, 14);
      // pit interior (darker) revealed behind it
      ctx.fillStyle = "#000000";
      ctx.fillRect(t.x, level.def.groundY, t.width, VIEW_H - level.def.groundY);
    } else {
      // looks completely identical to normal ground -- intentionally indistinguishable
      ctx.fillStyle = "#b87a23";
      ctx.fillRect(t.x, level.def.groundY, t.width, 6);
      if (t.armed) {
        // subtle pre-collapse tremor cue
        const shake = Math.sin(gameTime * 60) * 2;
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(t.x + shake, level.def.groundY, t.width, 6);
      }
    }
  }

  // moving platforms
  for (const p of level.movingPlatforms) {
    const px = p.currentX !== undefined ? p.currentX : p.x;
    ctx.fillStyle = "#caa24c";
    ctx.fillRect(px, p.y, p.width, 14);
    ctx.fillStyle = "#8a5d1d";
    ctx.fillRect(px, p.y + 14, p.width, 8);
  }

  // blocking blocks (solid obstacles the player must jump over)
  for (const b of level.def.blocks || []) {
    const top = level.def.groundY - b.height;
    ctx.fillStyle = "#6b6b6b";
    ctx.fillRect(b.x, top, b.width, b.height);
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, top, b.width, b.height);
  }

  // hazards (flashing red tic blocks)
  for (const hz of getAllHazards()) {
    const pulse = (Math.sin(gameTime * 9) + 1) / 2; // 0..1
    const r = Math.floor(180 + pulse * 75);
    ctx.fillStyle = `rgb(${r}, ${Math.floor(20 + pulse * 20)}, ${Math.floor(20 + pulse * 20)})`;
    ctx.fillRect(hz.x, level.def.groundY - hz.height, hz.width, hz.height);
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(hz.x, level.def.groundY - hz.height, hz.width, hz.height);
  }

  // door
  const d = level.def.door;
  const doorTop = level.def.groundY - d.height;
  ctx.fillStyle = "#9c6b2a";
  ctx.fillRect(d.x - 6, doorTop - 6, d.width + 12, d.height + 6);
  ctx.fillStyle = "#c9c9c9";
  ctx.fillRect(d.x, doorTop, d.width, d.height);

  // player (simple black silhouette figure, matching reference style)
  if (player.alive || deathFlashTimer > 0) {
    drawPlayer();
  }

  ctx.restore();
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  const w = player.w;
  const h = player.h;

  ctx.fillStyle = player.alive ? "#1a1a1a" : "#c0392b";

  // head
  const headSize = w * 0.62;
  ctx.fillRect(x + (w - headSize) / 2, y, headSize, headSize);

  // body
  const bodyTop = y + headSize - 2;
  const bodyH = h - headSize + 2;
  ctx.fillRect(x + w * 0.18, bodyTop, w * 0.64, bodyH * 0.62);

  // legs (slight walking offset based on vx for a touch of life)
  const legW = w * 0.26;
  const legH = bodyH * 0.42;
  const legY = bodyTop + bodyH * 0.6;
  const stride = player.grounded && player.vx !== 0 ? Math.sin(gameTime * 14) * 4 : 0;
  ctx.fillRect(x + w * 0.18 + stride, legY, legW, legH);
  ctx.fillRect(x + w * 0.56 - stride, legY, legW, legH);
}

// ------------------------------------------------------------
// Main loop
// ------------------------------------------------------------

function frame(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  dt = Math.min(dt, 1 / 30); // clamp huge gaps (tab switch etc)

  if (!overlay.classList.contains("hidden")) {
    // paused while overlay (level intro / end screen) is up
    requestAnimationFrame(frame);
    return;
  }

  gameTime += dt;
  if (deathFlashTimer > 0) deathFlashTimer -= dt;

  update(dt);
  draw();

  requestAnimationFrame(frame);
}

// kick things off
loadLevel(0);
showStartOverlay();
requestAnimationFrame(frame);
