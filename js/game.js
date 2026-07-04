// ============================================================
// TACTIC — a small platformer about Tourette Syndrome
// Engine: plain canvas 2D, fixed-timestep-ish update loop.
// ============================================================

let blinkState = { visible: true, timer: 0 };

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const VIEW_W = 1280;
const VIEW_H = 720;

const GRAVITY = 1800; // px/s^2
const JUMP_VELOCITY = -680; // px/s
const MOVE_SPEED = 320; // px/s
const FRICTION_GROUND = 0.0; // (instant accel model, kept for tuning)
const PLAYER_W = 28;
const PLAYER_H = 64;
const TRAP_FALL_DELAY = 0.28; // seconds between jump-trigger and collapse
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
let isPaused = false;

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayBtn = document.getElementById("overlay-btn");
const levelLabel = document.getElementById("level-label");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");

const BOX_SRC = "assets/images/box.png";
const HAZARD_W = 79;
const HAZARD_H = 56;

const boxImg = new Image();
boxImg.src = BOX_SRC;
let boxLoaded = false;

const SPRITE_SHEET_SRC = "assets/images/mailman.png";

const SPRITE_FRAME_W = 117;
const SPRITE_FRAME_H = 189;
const SPRITE_COLS = 4;
const SPRITE_FRAME_DURATION = 0.12;

const spriteSheet = new Image();

let spriteLoaded = false;

function preloadSprite() {
  return new Promise((resolve) => {
    spriteSheet.onload = () => {
      spriteLoaded = true;
      console.log("Sprite loaded successfully");
      resolve(true);
    };

    spriteSheet.onerror = () => {
      console.error("FAILED TO LOAD SPRITE:", SPRITE_SHEET_SRC);
      resolve(false); // game still runs
    };

    spriteSheet.src = SPRITE_SHEET_SRC;
  });
}

// Mailbox (replaces the plain door rectangle), level background art,
// and the title-screen background. Door rects in levels.js are 56x90,
// matching mailbox.png's native size, so the door hitbox doubles as the
// mailbox hitbox with no changes needed there — including levels that
// override the door's y position (e.g. Level 5).
const MAILBOX_SRC = "assets/images/mailbox.png";
const LEVEL_BG_SRC = "assets/images/levelbg.png";
const TITLE_BG_SRC = "assets/images/titlebg.png";

const mailboxImg = new Image();
const levelBgImg = new Image();
const titleBgImg = new Image();

let mailboxLoaded = false;
let levelBgLoaded = false;
let titleBgLoaded = false;

function preloadImage(img, src, onDone) {
  return new Promise((resolve) => {
    img.onload = () => {
      onDone(true);
      resolve(true);
    };
    img.onerror = () => {
      console.error("FAILED TO LOAD IMAGE:", src);
      onDone(false);
      resolve(false); // game still runs with a flat-color fallback
    };
    img.src = src;
  });
}

function preloadAllAssets() {
  return Promise.all([
    preloadSprite(),
    preloadImage(mailboxImg, MAILBOX_SRC, (ok) => (mailboxLoaded = ok)),
    preloadImage(levelBgImg, LEVEL_BG_SRC, (ok) => (levelBgLoaded = ok)),
    preloadImage(titleBgImg, TITLE_BG_SRC, (ok) => (titleBgLoaded = ok)),
    preloadImage(boxImg, BOX_SRC, (ok) => (boxLoaded = ok)),
  ]);
}

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
  blinkState = { visible: true, timer: 0 };

  // deep-ish copy of mutable runtime state per level
  level = {
    def,
    trapState: def.trapGround.map((t) => ({
      ...t,
      // `prefallen` lets a level (e.g. Level 4's gap-seed) start already
      // collapsed, so it renders as an open pit from the very first frame.
      armed: t.prefallen || false,
      fallTimer: 0,
      fallen: t.prefallen || false,
      fallOffset: t.prefallen ? 400 : 0,
    })),
    movingPlatforms: def.movingPlatforms.map((p) => ({ ...p })),
  };

  player = makePlayer(def.spawn);
  camera.x = 0;
  levelLabel.textContent = def.title.split("—")[0].trim();

  // "back to previous level" only makes sense once you've moved past level 1
  if (backBtn) {
    backBtn.disabled = currentLevelIndex === 0;
  }

  // ensure input state is reset and clear pause state
  keys.left = keys.right = keys.up = false;
  isPaused = false;
  const menuBtn = document.getElementById("overlay-menu-btn");
  if (menuBtn) menuBtn.remove();

  // clear any previous Level 1 spawner
  if (hazardSpawner !== null) {
    clearInterval(hazardSpawner);
    hazardSpawner = null;
  }

  // Level 1: spawn a single dynamic red cube at a new random x every 1.5s
  level.dynamicHazard = null;
  if (index === 0) {
    const hw = HAZARD_W;
    const hh = HAZARD_H;
    const minGapPlayer = 200; // avoid spawning too close to player center
    const minGapDoor = 180; // avoid spawning too close to door center
    const leftBound = 0;
    const rightBound = Math.max(0, def.width - hw);
    const pickX = () => {
      let attempts = 0;
      while (attempts < 50) {
        const nx =
          Math.floor(Math.random() * (rightBound - leftBound + 1)) + leftBound;
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
      return (
        Math.floor(Math.random() * (rightBound - leftBound + 1)) + leftBound
      );
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

  // Level 4: start the expanding-gap mechanic
  if (index === 3) {
    initGapExpansion();
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

// Toggles the title-screen art background on the overlay. Only used for the
// very first "Press Play" screen, since titlebg.png already has "TACTIC /
// TITLE PAGE" drawn into the art itself — so we hide the duplicate <h1> on
// that screen only and restore it everywhere else (level intros, pause,
// end screen) which keep the plain dark overlay styling.
function setTitleBackground(active) {
  if (active) {
    overlay.classList.add("title-bg");
    overlayTitle.style.display = "none";
  } else {
    overlay.classList.remove("title-bg");
    overlayTitle.style.display = "";
  }
}

function showLevelOverlay() {
  setTitleBackground(false);
  overlayTitle.textContent = level.def.title;
  overlayText.textContent = level.def.intro;
  overlayBtn.textContent = "Start";
  overlay.classList.remove("hidden");
  levelStartOverlayShown = true;
}

function showStartOverlay() {
  setTitleBackground(true);
  overlayTitle.textContent = "TACTIC";
  overlayBtn.textContent = "Play";
  overlay.classList.remove("hidden");
  overlay.dataset.end = "";
}

function showEndOverlay() {
  setTitleBackground(false);

  overlayBtn.textContent = "Return To Menu";
  overlay.classList.remove("hidden");
  overlay.dataset.end = "1";
}

overlayBtn.addEventListener("click", () => {
  if (overlay.dataset.pauseAction === "restart") {
    overlay.dataset.pauseAction = "";
    isPaused = false;
    const menuBtn = document.getElementById("overlay-menu-btn");
    if (menuBtn) menuBtn.remove();
    loadLevel(currentLevelIndex);
    overlay.classList.add("hidden");
  } else if (overlay.dataset.end === "1") {
    overlay.dataset.end = "";

    loadLevel(0);
    showStartOverlay();
  } else {
    overlay.classList.add("hidden");
  }
});

restartBtn.addEventListener("click", () => {
  loadLevel(currentLevelIndex);
});

if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (currentLevelIndex > 0) {
      loadLevel(currentLevelIndex - 1);
    }
  });
}

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  if (e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") {
    keys.up = true;
  }
  if (e.code === "Escape") {
    if (!isPaused && overlay.classList.contains("hidden")) {
      // show pause menu
      isPaused = true;
      setTitleBackground(false);
      overlayTitle.textContent = "PAUSED";
      overlayBtn.textContent = "Restart Level";
      overlay.dataset.pauseAction = "restart";
      overlay.classList.remove("hidden");
      // add main menu button if not already there
      let menuBtn = document.getElementById("overlay-menu-btn");
      if (!menuBtn) {
        menuBtn = document.createElement("button");
        menuBtn.id = "overlay-menu-btn";
        menuBtn.textContent = "Main Menu";
        menuBtn.style.marginLeft = "10px";
        overlayBtn.parentNode.insertBefore(menuBtn, overlayBtn.nextSibling);
        menuBtn.addEventListener("click", () => {
          isPaused = false;
          overlay.dataset.pauseAction = "";

          const menuBtn = document.getElementById("overlay-menu-btn");
          if (menuBtn) menuBtn.remove();

          loadLevel(0); // RESET GAME STATE
          showStartOverlay(); // SHOW TITLE SCREEN PROPERLY
        });
      }
    } else if (isPaused) {
      // ESC to resume
      isPaused = false;
      overlay.dataset.pauseAction = "";
      const menuBtn = document.getElementById("overlay-menu-btn");
      if (menuBtn) menuBtn.remove();
      overlay.classList.add("hidden");
    }
    e.preventDefault();
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
        newSegs.push({
          left: s.left,
          right: Math.min(t.x, s.right),
          top: s.top,
        });
      }
      // right piece
      const rightStart = t.x + t.width;
      if (rightStart < s.right) {
        newSegs.push({
          left: Math.max(rightStart, s.left),
          right: s.right,
          top: s.top,
        });
      }
    }
    segs.length = 0;
    segs.push(...newSegs);
  }

  if (level.def.blocks && level.def.blocks.length) {
    for (const b of level.def.blocks) {
      segs.push({
        left: b.x,
        right: b.x + b.width,
        top: level.def.groundY - b.height,
      });
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

// ---------- Level 4 gap expansion ----------
// Attached to `level` at load time as level.gapExpansion:
// {
//   triggered: false,
//   x: 380,           // left edge of gap (never moves)
//   width: 80,        // current gap width — grows rightward
//   maxWidth: 1640,   // stops just before the door shelf
//   speed: 190,       // px/s the gap expands (tune this for difficulty)
// }
function initGapExpansion() {
  // maxWidth is tuned so the gap stops well short of the mailbox shelf
  // (door sits at x:1150 on a level that's only 1280px wide now that the
  // level width is fixed — it used to stop short of a door near x:2020 on
  // a 2200-wide level, so this is the same margin scaled down).
  level.gapExpansion = {
    triggered: false,
    x: 380,
    width: 80,
    maxWidth: 700,
    speed: 190,
  };
}

function updateGapExpansion(dt) {
  const g = level.gapExpansion;
  if (!g) return;

  // Trigger: player has crossed the gap and is standing on the right side
  if (!g.triggered) {
    const playerCenterX = player.x + player.w / 2;
    if (player.grounded && playerCenterX > g.x + g.width) {
      g.triggered = true;
    }
  }

  if (!g.triggered) return;

  // Grow the gap rightward
  g.width = Math.min(g.maxWidth, g.width + g.speed * dt);

  // Sync the trapState entry so the renderer and collision system see it
  const t = level.trapState.find((t) => t.id === "gap-seed");
  if (t) {
    t.width = g.width;
    // Make sure it's in the fully-fallen state so it renders black and
    // its ground is subtracted from getGroundSegmentsAt
    t.fallen = true;
    t.fallOffset = 400;
  }
}

// ---------- Level 5 blinking player ----------
function updateBlink(dt) {
  if (currentLevelIndex !== 4) {
    blinkState.visible = true;
    return;
  }

  blinkState.timer -= dt;
  if (blinkState.timer <= 0) {
    blinkState.visible = !blinkState.visible;
    if (blinkState.visible) {
      // visible for a moderate random duration
      blinkState.timer = 0.4 + Math.random() * 0.9;
    } else {
      // invisible for a short random duration — feels like a blink not a vanish
      blinkState.timer = 0.08 + Math.random() * 0.18;
    }
  }
}

function update(dt) {
  if (!player.alive) return;

  updateMovingPlatforms(dt);
  updateTraps(dt);
  updateGapExpansion(dt);
  updateBlink(dt);

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
      if (
        rectsOverlap(
          player.x,
          player.y,
          player.w,
          player.h,
          bx,
          bTop,
          b.width,
          b.height,
        )
      ) {
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

  // horizontal collision with the ground itself, treated as a solid wall
  // on its sides. Ground tiles only ever resolved as a "stand on top of
  // it" surface before, so a falling/jumping player could be pushed
  // sideways straight through the edge of a ground slab (e.g. an
  // elevated step) and end up embedded inside it instead of being
  // blocked by it like a cliff face.
  const wallSegs = getGroundSegmentsAt(player.x);
  for (const seg of wallSegs) {
    const overlapX = player.x + player.w > seg.left && player.x < seg.right;
    const embedded = player.y + player.h > seg.top + 4;
    if (overlapX && embedded) {
      if (player.x > prevX) {
        player.x = seg.left - player.w;
      } else if (player.x < prevX) {
        player.x = seg.right;
      }
      player.vx = 0;
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
    if (
      overlapX &&
      player.vy >= 0 &&
      feetY >= seg.top &&
      feetY - player.vy * dt <= seg.top + 12
    ) {
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
    if (
      overlapX &&
      player.vy >= 0 &&
      feetY >= top &&
      feetY - player.vy * dt <= top + 14
    ) {
      player.y = top - player.h;
      player.vy = 0;
      player.grounded = true;
      // carry player with platform horizontal motion
      player.x += px - (p.lastX !== undefined ? p.lastX : px);
    }
    p.lastX = px;
  }

  // ---- hazards (flashing tic blocks) ----
  // hz.y lets a level (e.g. Level 5's airborne hazards) place a hazard at an
  // explicit height instead of sitting on the ground.
  for (const hz of getAllHazards()) {
    const hzY = hz.y !== undefined ? hz.y : level.def.groundY - hz.height;
    if (
      rectsOverlap(
        player.x,
        player.y,
        player.w,
        player.h,
        hz.x,
        hzY,
        hz.width,
        hz.height,
      )
    ) {
      killPlayer();
      return;
    }
  }

  // ---- fell into a pit / off the world ----
  // level.def.fallLimit lets a level (e.g. Level 5's tall vertical climb)
  // override the default "300px below ground" death threshold.
  const fallLimit =
    level.def.fallLimit !== undefined
      ? level.def.fallLimit
      : level.def.groundY + 300;
  if (player.y > fallLimit) {
    killPlayer();
    return;
  }

  // ---- mailbox (door) / level complete ----
  // d.y lets a level (e.g. Level 5's door perched up high) override the
  // default "sitting on the ground" door position. Hitbox size (56x90)
  // is unchanged and still matches mailbox.png exactly.
  const d = level.def.door;
  const doorTop = d.y !== undefined ? d.y : level.def.groundY - d.height;
  if (
    rectsOverlap(
      player.x,
      player.y,
      player.w,
      player.h,
      d.x,
      doorTop,
      d.width,
      d.height,
    )
  ) {
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

  // level background art (flat-color fallback if it hasn't loaded)
  if (levelBgLoaded) {
    ctx.drawImage(levelBgImg, 0, 0, VIEW_W, VIEW_H);
  } else {
    ctx.fillStyle = "#d0d0d0";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  ctx.save();

  // ground line — semi-transparent so the dirt texture from levelbg.png
  // shows through instead of being completely hidden behind a flat fill
  ctx.fillStyle = "rgba(191, 191, 191, 0)";
  for (const g of level.def.ground) {
    ctx.fillRect(g.x, level.def.groundY, g.width, VIEW_H);
  }

  for (const t of level.trapState) {
    if (t.fallen) {
      // falling slab graphic dropping out of view
      ctx.fillStyle = "tan";
      ctx.fillRect(t.x, level.def.groundY + t.fallOffset, t.width, 14);
      // pit interior (darker) revealed behind it
      ctx.fillStyle = "black";
      ctx.fillRect(t.x, level.def.groundY, t.width, VIEW_H);
    } else if (t.armed) {
      // subtle pre-collapse tremor cue
      const shake = Math.sin(gameTime * 60) * 2;
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(t.x + shake, level.def.groundY, t.width, 6);
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

  // hazards (box tics)
  for (const hz of getAllHazards()) {
    const hzY = hz.y !== undefined ? hz.y : level.def.groundY - hz.height;

    if (boxLoaded) {
      ctx.drawImage(boxImg, hz.x, hzY, hz.width, hz.height);
    } else {
      // fallback
      ctx.fillStyle = "#ff3b3b";
      ctx.fillRect(hz.x, hzY, hz.width, hz.height);
    }
  }

  // mailbox (door / level exit), honoring d.y override
  const d = level.def.door;
  const doorTop = d.y !== undefined ? d.y : level.def.groundY - d.height;
  if (mailboxLoaded) {
    ctx.drawImage(mailboxImg, d.x, doorTop, d.width, d.height);
  } else {
    // flat-color fallback if the art hasn't loaded yet / failed to load
    ctx.fillStyle = "#9c6b2a";
    ctx.fillRect(d.x - 6, doorTop - 6, d.width + 12, d.height + 6);
    ctx.fillStyle = "#c9c9c9";
    ctx.fillRect(d.x, doorTop, d.width, d.height);
  }

  // player
  if (player.alive || deathFlashTimer > 0) {
    drawPlayer();
  }

  ctx.restore();
}

function drawPlayer() {
  // Level 5's blink mechanic — skip the draw entirely while "invisible"
  if (!blinkState.visible) return;

  const x = player.x;
  const y = player.y;
  const w = player.w;
  const h = player.h;

  // fallback while loading (no sprite yet)
  if (!spriteLoaded) {
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);
    return;
  }

  // --------------------------------------------------------
  // ANIMATION
  // --------------------------------------------------------
  const row = player.facing === -1 ? 0 : 1;

  // Animate only while a direction key is actually held down. Using vx
  // here would keep the walk-cycle running on Level 3 while the player
  // slides to a stop from friction after letting go of the key.
  const isMoving = player.grounded && (keys.left || keys.right);

  const col = isMoving
    ? Math.floor((gameTime / SPRITE_FRAME_DURATION) % SPRITE_COLS)
    : 0;

  const sx = col * SPRITE_FRAME_W;
  const sy = row * SPRITE_FRAME_H;

  // --------------------------------------------------------
  // SCALE + FOOT LOCK (THIS FIXES FLOATING FEET)
  // --------------------------------------------------------
  const SPRITE_SCALE = 0.4; // adjust to taste

  const drawW = SPRITE_FRAME_W * SPRITE_SCALE;
  const drawH = SPRITE_FRAME_H * SPRITE_SCALE;

  const drawX = x + w / 2 - drawW / 2;
  const drawY = y + h - drawH;

  ctx.drawImage(
    spriteSheet,
    sx,
    sy,
    SPRITE_FRAME_W,
    SPRITE_FRAME_H,
    drawX,
    drawY,
    drawW,
    drawH,
  );
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

preloadAllAssets().then(() => {
  loadLevel(0);
  showStartOverlay();
  requestAnimationFrame(frame);
});
