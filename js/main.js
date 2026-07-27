// ============================================================
// TACTIC — a small platformer about Tourette Syndrome
// Engine: plain canvas 2D, fixed-timestep-ish update loop.
// ============================================================

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
const TRAP_TRIGGER_RANGE = 300;

let world = null; // the one continuous map (mutable runtime state)
let checkpoint = { x: 0, y: 0 }; // latest activated mailbox (or the world start)
let player = null;
let camera = { x: 0 };
let keys = { left: false, right: false, up: false };
let lastTime = null;
let gameTime = 0;
let deathFlashTimer = 0;
let hazardSpawner = null; // interval ID(s) for the dynamic Stage 1 hazards (array)
let isPaused = false;
// Seconds remaining on a bird-chirp freeze (Level 2) — while > 0, all
// player controls are locked. Reset to 0 whenever the world (re)loads.
let freezeTimer = 0;
const BIRD_FREEZE_DURATION = 1.5;

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayBtn = document.getElementById("overlay-btn");
const levelLabel = document.getElementById("level-label");
const restartBtn = document.getElementById("restart-btn");

const BOX_SRC = "assets/images/box.png";
const DOG_SRC = "assets/images/dog.png";
const HAZARD_W = 79;
const HAZARD_H = 56;

const boxImg = new Image();
boxImg.src = BOX_SRC;
let boxLoaded = false;

// Level 1 / Stage 1's dynamic hazard uses dog.png instead of box.png (same
// size, same mechanics — just a different sprite so the very first
// hazard the player meets reads a little friendlier). The static hazards
// in the last stage keep box.png.
const dogImg = new Image();
dogImg.src = DOG_SRC;
let dogLoaded = false;

// Level 1 / Stage 2's obstacle blocks use 2box.png instead of a flat
// grey rectangle (same solid-collision mechanics, just reskinned).
const BOX2_SRC = "assets/images/2box.png";
const box2Img = new Image();
box2Img.src = BOX2_SRC;
let box2Loaded = false;

// Stage 5's dogs (the two flashing tree/balcony hazards, plus the
// ground-patrol dogs under the hedges) use their own whitedog.png sprite
// — kept entirely separate from Stage 1's dog.png so each stage can look
// different even though the mechanics are shared.
const WHITEDOG_SRC = "assets/images/whitedog.png";
const whitedogImg = new Image();
whitedogImg.src = WHITEDOG_SRC;
let whitedogLoaded = false;

// Level 2's decorative trees, plus the birds perched in them (see
// TREE_DRAW_W/BIRD_DRAW_W etc. and birdOnTree() in level2.js). Each has
// its own sprite.
const TREE_SRC = "assets/images/tree.png";
const treeImg = new Image();
treeImg.src = TREE_SRC;
let treeLoaded = false;

const BIRD_SRC = "assets/images/bird.png";
const birdImg = new Image();
birdImg.src = BIRD_SRC;
let birdImgLoaded = false;

// Level 2 / Stage 2's NPC and background cars — PLACEHOLDER ART.
// Swap these two path strings (and drop the matching files into
// assets/images/) to bring in the final sprites; nothing else needs to
// change since every draw call below already falls back to a flat-color
// rectangle if the image fails to load, same pattern as every other
// sprite in the game.
const NPC_PLACEHOLDER_SRC = "assets/images/npc_placeholder.png";
const CAR_PLACEHOLDER_SRC = "assets/images/car_placeholder.png";
const npcImg = new Image();
npcImg.src = NPC_PLACEHOLDER_SRC;
let npcLoaded = false;
const carImg = new Image();
carImg.src = CAR_PLACEHOLDER_SRC;
let carLoaded = false;

const SPRITE_SHEET_SRC = "assets/images/mailman.png";

const SPRITE_FRAME_W = 117;
const SPRITE_FRAME_H = 189;
const SPRITE_COLS = 4;
const SPRITE_FRAME_DURATION = 0.12;

const spriteSheet = new Image();

let spriteLoaded = false;
let menuMusic = null;
let gameplayMusic = null;
let currentMusic = null;
let buttonClickSound = null;
let jumpSound = null;
let mailboxBellSound = null;
let birdChirpSound = null;
// Level 2 / Stage 2's passing-car honk — placeholder audio file path,
// same "safe to swap later" treatment as the sprites above.
let carHonkSound = null;
let audioInitialized = false;

function initAudio() {
  if (audioInitialized) return;

  audioInitialized = true;

  menuMusic = new Audio("assets/sounds/background_music.mp3");
  menuMusic.loop = true;
  menuMusic.volume = 0.35;
  menuMusic.preload = "auto";

  gameplayMusic = new Audio("assets/sounds/game_music.mp3");
  gameplayMusic.loop = true;
  gameplayMusic.volume = 0.35;
  gameplayMusic.preload = "auto";

  buttonClickSound = new Audio("assets/sounds/button_click.mp3");
  buttonClickSound.volume = 0.45;
  buttonClickSound.preload = "auto";

  jumpSound = new Audio("assets/sounds/jump_sound.mp3");
  jumpSound.volume = 0.5;
  jumpSound.preload = "auto";

  mailboxBellSound = new Audio("assets/sounds/mailbox_bell.mp3");
  mailboxBellSound.volume = 0.5;
  mailboxBellSound.preload = "auto";

  birdChirpSound = new Audio("assets/sounds/bird_chirp.mp3");
  birdChirpSound.volume = 0.55;
  birdChirpSound.preload = "auto";

  carHonkSound = new Audio("assets/sounds/car_honk.mp3");
  carHonkSound.volume = 0.5;
  carHonkSound.preload = "auto";
}

function playSound(sound) {
  if (!sound) return;
  try {
    sound.currentTime = 0;
    const playPromise = sound.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        const retry = () => {
          playSound(sound);
          window.removeEventListener("pointerdown", retry);
          window.removeEventListener("keydown", retry);
        };

        window.addEventListener("pointerdown", retry, { once: true });
        window.addEventListener("keydown", retry, { once: true });
      });
    }
  } catch (e) {
    // ignore autoplay/browser restrictions
  }
}

function stopMusic(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (e) {
    // ignore browser restrictions
  }
}

function playMenuMusic() {
  initAudio();
  if (currentMusic === menuMusic) return;

  stopMusic(gameplayMusic);
  stopMusic(menuMusic);
  currentMusic = menuMusic;
  playSound(menuMusic);
}

function playGameplayMusic() {
  initAudio();
  if (currentMusic === gameplayMusic) return;

  stopMusic(menuMusic);
  stopMusic(gameplayMusic);
  currentMusic = gameplayMusic;
  playSound(gameplayMusic);
}

function playButtonSound() {
  playSound(buttonClickSound);
}

function playJumpSound() {
  playSound(jumpSound);
}

function playMailboxBellSound() {
  playSound(mailboxBellSound);
}

function playBirdChirpSound() {
  playSound(birdChirpSound);
}

function playCarHonkSound() {
  initAudio();
  playSound(carHonkSound);
}

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
// matching mailboxup.png/mailboxdown.png's native size, so the door
// hitbox doubles as the mailbox hitbox with no changes needed there —
// including levels that override the door's y position (e.g. Level 5).
// Mailboxes render "up" until their checkpoint is reached, then swap to
// "down" to show the stage has been passed.
const MAILBOX_UP_SRC = "assets/images/mailboxup.png";
const MAILBOX_DOWN_SRC = "assets/images/mailboxdown.png";
// BG.png is one continuous 6400x720 backdrop — exactly the width of the
// whole 5-stage map (5 x 1280) — so it's drawn once in world space and
// pans naturally with the camera instead of sitting fixed to the screen.
const LEVEL_BG_SRC = "assets/images/BG.png";
const TITLE_BG_SRC = "assets/images/titlebg.png";

const mailboxUpImg = new Image();
const mailboxDownImg = new Image();
const levelBgImg = new Image();
const titleBgImg = new Image();

let mailboxUpLoaded = false;
let mailboxDownLoaded = false;
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
    preloadImage(mailboxUpImg, MAILBOX_UP_SRC, (ok) => (mailboxUpLoaded = ok)),
    preloadImage(
      mailboxDownImg,
      MAILBOX_DOWN_SRC,
      (ok) => (mailboxDownLoaded = ok),
    ),
    preloadImage(levelBgImg, LEVEL_BG_SRC, (ok) => (levelBgLoaded = ok)),
    preloadImage(titleBgImg, TITLE_BG_SRC, (ok) => (titleBgLoaded = ok)),
    preloadImage(boxImg, BOX_SRC, (ok) => (boxLoaded = ok)),
    preloadImage(dogImg, DOG_SRC, (ok) => (dogLoaded = ok)),
    preloadImage(box2Img, BOX2_SRC, (ok) => (box2Loaded = ok)),
    preloadImage(whitedogImg, WHITEDOG_SRC, (ok) => (whitedogLoaded = ok)),
    preloadImage(treeImg, TREE_SRC, (ok) => (treeLoaded = ok)),
    preloadImage(birdImg, BIRD_SRC, (ok) => (birdImgLoaded = ok)),
    preloadImage(npcImg, NPC_PLACEHOLDER_SRC, (ok) => (npcLoaded = ok)),
    preloadImage(carImg, CAR_PLACEHOLDER_SRC, (ok) => (carLoaded = ok)),
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

function freshTrapState() {
  return WORLD.trapGround.map((t) => ({
    ...t,
    // `prefallen` lets a section (e.g. the old Level 4's gap-seed) start
    // already collapsed, so it renders as an open pit from the very first
    // frame.
    armed: t.prefallen || false,
    fallTimer: 0,
    fallen: t.prefallen || false,
    fallOffset: t.prefallen ? 400 : 0,
  }));
}

// ------------------------------------------------------------
// Locked mailbox / code-entry keypad (Level 2-2 — "Drowned Out")
//
// A stage can mark one of its sections with `codeLock: true` and an
// `npc`/`cars` config (see levels.js). When that's present:
//  - its mailbox spawns locked (mb.locked = true) and won't complete the
//    stage on touch until the right 4-digit code has been entered
//  - an NPC in that section cycles a speech bubble containing a randomly
//    generated 4-digit code
//  - background cars drive by and occasionally honk, which stamps a
//    "BEEP" over one or two of the bubble's digits for a moment
//  - touching the locked mailbox opens an on-screen keypad; entering the
//    correct code unlocks it so the next touch delivers the mail as
//    normal (see the mailbox loop in update() and activateCheckpoint())
//
// Scoped the same way the Stage 1 dynamic hazard / Stage 4 gap-expansion
// mechanics are (a lookup against the currently active WORLD.sections)
// rather than a hardcoded level/stage index, so it keeps working
// wherever a future `codeLock` section ends up.
// ------------------------------------------------------------

const NPC_BUBBLE_SHOW_DURATION = 3.6; // seconds the code bubble is visible
const NPC_BUBBLE_HIDE_DURATION = 1.1; // brief pause between cycles
const CAR_HONK_OBSCURE_DURATION = 1.0; // seconds a honked digit stays covered

function generateRandomCode() {
  const code = [];
  for (let i = 0; i < 4; i++) {
    code.push(String(Math.floor(Math.random() * 10)));
  }
  return code;
}

function findCodeLockSection() {
  return WORLD.sections.find((s) => s.codeLock && s.npc);
}

// Full (re)init — called from loadWorld(). Generates a fresh code, since
// this only happens when the player (re)starts the stage from scratch.
function initCodeLock() {
  const section = findCodeLockSection();
  if (!section) {
    world.codeLock = null;
    return;
  }

  world.codeLock = {
    section,
    code: generateRandomCode(),
    solved: false,
    // NPC speech-cycle state
    cyclePhase: "showing", // "showing" | "hidden"
    cycleTimer: NPC_BUBBLE_SHOW_DURATION,
    // per-digit seconds remaining obscured by a "BEEP" (0 = visible)
    obscured: [0, 0, 0, 0],
    // background cars
    cars: [],
    spawnTimer: 0.5 + Math.random() * 1.5,
    honkTimer: 1 + Math.random() * 1.5,
  };
}

// Lighter reset — called from respawnPlayer(). Intentionally preserves
// `code` and `solved`: dying shouldn't erase progress the player has
// already made on the puzzle (partially memorized digits, or an already
// -unlocked mailbox), same spirit as checkpoints staying activated.
function resetCodeLockRunState() {
  if (!world.codeLock) return;
  world.codeLock.cyclePhase = "showing";
  world.codeLock.cycleTimer = NPC_BUBBLE_SHOW_DURATION;
  world.codeLock.obscured = [0, 0, 0, 0];
  world.codeLock.cars = [];
  world.codeLock.spawnTimer = 0.5 + Math.random() * 1.5;
  world.codeLock.honkTimer = 1 + Math.random() * 1.5;
}

function updateCarsAndNpc(dt) {
  const cl = world.codeLock;
  if (!cl) return;

  // Speech-bubble show/hide cycle.
  cl.cycleTimer -= dt;
  if (cl.cycleTimer <= 0) {
    if (cl.cyclePhase === "showing") {
      cl.cyclePhase = "hidden";
      cl.cycleTimer = NPC_BUBBLE_HIDE_DURATION;
    } else {
      cl.cyclePhase = "showing";
      cl.cycleTimer = NPC_BUBBLE_SHOW_DURATION;
      cl.obscured = [0, 0, 0, 0];
    }
  }

  // Count down any digits currently covered by a "BEEP".
  for (let i = 0; i < cl.obscured.length; i++) {
    if (cl.obscured[i] > 0) cl.obscured[i] = Math.max(0, cl.obscured[i] - dt);
  }

  const carsCfg = cl.section.cars;
  if (!carsCfg) return;

  // Spawn cars.
  cl.spawnTimer -= dt;
  if (cl.spawnTimer <= 0) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const speedMin = carsCfg.speedMin || 150;
    const speedMax = carsCfg.speedMax || 240;
    const w = carsCfg.width || 70;
    const h = carsCfg.height || 34;
    cl.cars.push({
      x: dir === 1 ? carsCfg.minX - w : carsCfg.maxX,
      y: carsCfg.laneY,
      width: w,
      height: h,
      speed: speedMin + Math.random() * (speedMax - speedMin),
      dir,
    });
    const spawnMin = carsCfg.spawnIntervalMin || 1.5;
    const spawnMax = carsCfg.spawnIntervalMax || 3;
    cl.spawnTimer = spawnMin + Math.random() * (spawnMax - spawnMin);
  }

  // Move + cull cars that have driven off either edge of the stretch.
  for (const car of cl.cars) {
    car.x += car.dir * car.speed * dt;
  }
  cl.cars = cl.cars.filter(
    (car) => car.x > carsCfg.minX - 200 && car.x < carsCfg.maxX + 200,
  );

  // Honks — only meaningful (and only obscure anything) while the bubble
  // is actually showing; a honk with nothing on screen to cover is just
  // a passing car.
  cl.honkTimer -= dt;
  if (cl.honkTimer <= 0) {
    const honkMin = carsCfg.honkIntervalMin || 1.2;
    const honkMax = carsCfg.honkIntervalMax || 2.6;
    cl.honkTimer = honkMin + Math.random() * (honkMax - honkMin);

    if (cl.cyclePhase === "showing" && cl.cars.length > 0) {
      playCarHonkSound();
      // Cover one digit most of the time, occasionally two — enough to
      // genuinely slow the player down without ever hiding the whole
      // code at once.
      const numObscured = Math.random() < 0.55 ? 1 : 2;
      const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numObscured; i++) {
        cl.obscured[order[i]] = CAR_HONK_OBSCURE_DURATION;
      }
    }
  }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawCarsAndNpc() {
  const cl = world.codeLock;
  if (!cl) return;

  // Background cars.
  for (const car of cl.cars) {
    if (carLoaded) {
      ctx.save();
      if (car.dir === -1) {
        // flip horizontally so the placeholder art faces its direction
        // of travel
        ctx.translate(car.x + car.width, car.y);
        ctx.scale(-1, 1);
        ctx.drawImage(carImg, 0, 0, car.width, car.height);
      } else {
        ctx.drawImage(carImg, car.x, car.y, car.width, car.height);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#555a63";
      ctx.fillRect(car.x, car.y, car.width, car.height);
    }
  }

  // NPC.
  const npc = cl.section.npc;
  const npcTop = npc.y !== undefined ? npc.y : world.def.groundY - npc.height;
  if (npcLoaded) {
    ctx.drawImage(npcImg, npc.x, npcTop, npc.width, npc.height);
  } else {
    ctx.fillStyle = "#3a6ea5";
    ctx.fillRect(npc.x, npcTop, npc.width, npc.height);
  }

  // Speech bubble — one slot per code digit; a slot shows "BEEP" instead
  // of its digit while that digit is currently honked-over.
  if (cl.cyclePhase === "showing") {
    const bubbleW = 150;
    const bubbleH = 54;
    const bubbleX = npc.x + npc.width / 2 - bubbleW / 2;
    const bubbleY = npcTop - bubbleH - 14;

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 10);
    ctx.fill();
    ctx.stroke();

    // little tail pointing down toward the NPC
    ctx.beginPath();
    ctx.moveTo(bubbleX + bubbleW / 2 - 8, bubbleY + bubbleH);
    ctx.lineTo(bubbleX + bubbleW / 2 + 8, bubbleY + bubbleH);
    ctx.lineTo(bubbleX + bubbleW / 2, bubbleY + bubbleH + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const slotW = bubbleW / 4;
    for (let i = 0; i < 4; i++) {
      const cx = bubbleX + slotW * i + slotW / 2;
      const cy = bubbleY + bubbleH / 2;
      if (cl.obscured[i] > 0) {
        ctx.fillStyle = "#d1352c";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("BEEP", cx, cy);
      } else {
        ctx.fillStyle = "#222";
        ctx.font = "bold 22px monospace";
        ctx.fillText(cl.code[i], cx, cy);
      }
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

// ---------- The on-screen keypad (opened by touching a locked mailbox) ----------
let keypadEl = null;
let pendingLockedMailbox = null;
let keypadInput = "";

function buildKeypadDOM() {
  const root = document.createElement("div");
  root.id = "keypad-overlay";
  Object.assign(root.style, {
    position: "absolute",
    inset: "0",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.65)",
    zIndex: "1000",
    flexDirection: "column",
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "#22242b",
    padding: "24px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#fff",
    fontFamily: "inherit",
    minWidth: "260px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  });

  const heading = document.createElement("h2");
  heading.textContent = "Enter the 4-Digit Code";
  Object.assign(heading.style, { marginTop: "0", fontSize: "18px" });
  panel.appendChild(heading);

  const display = document.createElement("div");
  display.id = "keypad-display";
  Object.assign(display.style, {
    fontSize: "30px",
    letterSpacing: "6px",
    margin: "10px 0",
    minHeight: "38px",
    fontFamily: "monospace",
  });
  panel.appendChild(display);

  const feedback = document.createElement("div");
  feedback.id = "keypad-feedback";
  Object.assign(feedback.style, {
    minHeight: "18px",
    marginBottom: "10px",
    fontSize: "13px",
  });
  panel.appendChild(feedback);

  const grid = document.createElement("div");
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(3, 56px)",
    gap: "8px",
    justifyContent: "center",
  });
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "Enter"];
  for (const k of keys) {
    const b = document.createElement("button");
    b.textContent = k;
    b.className = "menu-btn";
    Object.assign(b.style, { padding: "12px 0", fontSize: "15px" });
    b.addEventListener("click", () => {
      playButtonSound();
      handleKeypadKey(k);
    });
    grid.appendChild(b);
  }
  panel.appendChild(grid);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Cancel";
  closeBtn.className = "menu-btn";
  Object.assign(closeBtn.style, { marginTop: "14px" });
  closeBtn.addEventListener("click", () => {
    playButtonSound();
    hideKeypad();
  });
  panel.appendChild(closeBtn);

  root.appendChild(panel);
  document.getElementById("game-container").appendChild(root);
  return { root, display, feedback };
}

function updateKeypadDisplay() {
  const padded = keypadInput.padEnd(4, "_");
  keypadEl.display.textContent = padded.split("").join(" ");
}

function showKeypad() {
  if (!keypadEl) keypadEl = buildKeypadDOM();
  keypadInput = "";
  updateKeypadDisplay();
  keypadEl.feedback.textContent = "";
  keypadEl.feedback.style.color = "";
  keypadEl.root.style.display = "flex";
}

/*
function hideKeypad() {
  if (keypadEl) keypadEl.root.style.display = "none";
  pendingLockedMailbox = null;
}
  */
 function hideKeypad() {
  if (keypadEl) keypadEl.root.style.display = "none";
  if (pendingLockedMailbox) pendingLockedMailbox._suppressReopen = true;
  pendingLockedMailbox = null;
}

function openKeypadForMailbox(mb) {
  if (!world.codeLock) return; // safety net: a locked mailbox with no puzzle data
  if (keypadEl && keypadEl.root.style.display === "flex") return; // already open
  pendingLockedMailbox = mb;
  showKeypad();
}

function handleKeypadKey(k) {
  if (!keypadEl) return;
  if (k === "⌫") {
    keypadInput = keypadInput.slice(0, -1);
  } else if (k === "Enter") {
    submitKeypadCode();
    return;
  } else if (/^[0-9]$/.test(k)) {
    if (keypadInput.length < 4) keypadInput += k;
  }
  keypadEl.feedback.textContent = "";
  updateKeypadDisplay();
}

function submitKeypadCode() {
  if (!world.codeLock || !pendingLockedMailbox) return;
  if (keypadInput.length < 4) {
    keypadEl.feedback.textContent = "Enter all 4 digits first.";
    keypadEl.feedback.style.color = "#ffb648";
    return;
  }

  const correct = keypadInput === world.codeLock.code.join("");
  if (correct) {
    world.codeLock.solved = true;
    pendingLockedMailbox.locked = false;
    playMailboxBellSound();
    keypadEl.feedback.textContent = "Correct! The mailbox unlocks.";
    keypadEl.feedback.style.color = "#7CFF7C";
    setTimeout(() => {
      hideKeypad();
    }, 700);
  } else {
    playButtonSound();
    keypadEl.feedback.textContent = "That's not it. Listen again.";
    keypadEl.feedback.style.color = "#ff6b6b";
    keypadInput = "";
    updateKeypadDisplay();
  }
}

// Builds a level's map from scratch. Called at startup, when the player
// returns to the main menu (a full reset to Level 1), and whenever the
// level-select screen sends the player into a stage — including one in a
// different level, in which case `levelIndex` swaps the active WORLD
// definition entirely (its own width/ground/hazards/birds/etc.), so there
// is no shared coordinate space a player could walk back through into a
// previous level's map.
function loadWorld(levelIndex = 0, spawnOverride = null) {
  setActiveLevel(levelIndex); // reassigns the global WORLD (see levels.js)

  world = {
    def: WORLD,
    trapState: freshTrapState(),
    movingPlatforms: WORLD.movingPlatforms.map((p) => ({ ...p })),
    // Patrolling ground hazards (e.g. Stage 5's hedge dogs) — mutable
    // copies just like movingPlatforms, since they need their own
    // `currentX` written in every frame.
    groundHazards: (WORLD.groundHazards || []).map((g) => ({ ...g })),
    // mutable copies so `activated` (and, for a locked mailbox, `locked`)
    // can flip on/off without touching WORLD
    mailboxes: WORLD.mailboxes.map((m) => ({ ...m })),
    // Level 2+'s perched birds — mutable copies since each needs its own
    // countdown to its next chirp.
    birdState: (WORLD.birds || []).map((b) => ({
      ...b,
      chirpTimer: randomBirdInterval(),
    })),
  };

  // Start each fresh run with mailboxes in their default up state.
  // We only restore the saved completed-state for the current run once
  // the player has actually passed a stage and the progress save says it
  // should already be cleared.
  resetMailboxStatesForRun();
  syncMailboxActivationFromProgress();

  checkpoint = spawnOverride || { x: WORLD.spawn.x, y: WORLD.spawn.y };
  player = makePlayer(checkpoint);
  camera.x = clampCamera(player.x + player.w / 2);
  updateLevelLabel();

  // ensure input state is reset and clear pause/freeze state
  keys.left = keys.right = keys.up = false;
  isPaused = false;
  freezeTimer = 0;
  const menuBtn = document.getElementById("overlay-menu-btn");
  if (menuBtn) menuBtn.remove();
  hideKeypad();

  if (hazardSpawner !== null) {
    // hazardSpawner is now an array of interval IDs (one per dynamic dog)
    for (const id of hazardSpawner) clearInterval(id);
    hazardSpawner = null;
  }

  initDynamicHazard();
  initGapExpansion();
  initCodeLock();
}

// Puts the player back at the latest checkpoint and resets the current
// level's resettable hazards (falling traps, the expanding gap, bird
// chirp timers) without touching already-activated mailboxes —
// checkpoints, once reached, stay reached. Never changes which level is
// active; that only happens via loadWorld().
function respawnPlayer() {
  world.trapState = freshTrapState();
  world.movingPlatforms = WORLD.movingPlatforms.map((p) => ({ ...p }));
  world.groundHazards = (WORLD.groundHazards || []).map((g) => ({ ...g }));
  world.birdState = (WORLD.birds || []).map((b) => ({
    ...b,
    chirpTimer: randomBirdInterval(),
  }));
  freezeTimer = 0;
  hideKeypad();

  if (hazardSpawner !== null) {
    // hazardSpawner is now an array of interval IDs (one per dynamic dog)
    for (const id of hazardSpawner) clearInterval(id);
    hazardSpawner = null;
  }
  initDynamicHazard();
  initGapExpansion();
  resetCodeLockRunState();

  player = makePlayer(checkpoint);
  camera.x = clampCamera(player.x + player.w / 2);
  keys.left = keys.right = keys.up = false;
}

// The old dynamic red-cube hazard from "Stage 1" — kept scoped to that
// section's stretch of the map, since it was only ever meant to threaten
// that part of the level. Now spawns DYNAMIC_HAZARD_COUNT of these dogs
// at once (2, per the "two running total" ask) instead of just one, each
// teleporting to a new spot on its own independent timer so they don't
// blink in sync.
const DYNAMIC_HAZARD_COUNT = 2;

function initDynamicHazard() {
  // This mechanic is specific to Level 1 / Stage 1 — other levels (e.g.
  // Level 2) don't have this dynamic teleporting hazard at all.
  if (WORLD.levelIndex !== 0) {
    world.dynamicHazards = [];
    hazardSpawner = [];
    return;
  }

  const section = WORLD.sections[0];
  const doorForSection = world.mailboxes[0];
  const hw = HAZARD_W;
  const hh = HAZARD_H;
  const minGapPlayer = 200; // avoid spawning too close to player center
  const minGapDoor = 180; // avoid spawning too close to mailbox center
  const minGapOtherHazard = 160; // avoid spawning on top of the other dog
  const leftBound = section.startX;
  const rightBound = Math.max(section.startX, section.endX - hw);

  // `avoidIndex` lets each hazard's picker steer clear of every *other*
  // currently-placed dynamic hazard (not itself).
  const pickX = (avoidIndex) => {
    let attempts = 0;
    while (attempts < 50) {
      const nx =
        Math.floor(Math.random() * (rightBound - leftBound + 1)) + leftBound;
      const hazardCenter = nx + hw / 2;
      const playerCenter = player.x + player.w / 2;
      const doorCenter = doorForSection.x + doorForSection.width / 2;
      const clearsOthers = world.dynamicHazards.every((h, i) => {
        if (i === avoidIndex || !h) return true;
        return Math.abs(hazardCenter - (h.x + hw / 2)) >= minGapOtherHazard;
      });
      if (
        Math.abs(hazardCenter - playerCenter) >= minGapPlayer &&
        Math.abs(hazardCenter - doorCenter) >= minGapDoor &&
        clearsOthers
      ) {
        return nx;
      }
      attempts++;
    }
    // fallback if we couldn't find a spot after many attempts
    return Math.floor(Math.random() * (rightBound - leftBound + 1)) + leftBound;
  };

  // sprite: "dog" — Stage 1's hazards render as dog.png instead of
  // box.png (same size/mechanics, just a different look for this stage).
  world.dynamicHazards = [];
  for (let i = 0; i < DYNAMIC_HAZARD_COUNT; i++) {
    world.dynamicHazards.push({
      x: pickX(i),
      width: hw,
      height: hh,
      sprite: "dog",
    });
  }

  hazardSpawner = [];
  for (let i = 0; i < DYNAMIC_HAZARD_COUNT; i++) {
    // Stagger each dog's retimer slightly so the two don't teleport in
    // lockstep.
    const intervalMs = 1500 + i * 200;
    hazardSpawner.push(
      setInterval(() => {
        if (!world || !world.dynamicHazards) return;
        const oldX = world.dynamicHazards[i] ? world.dynamicHazards[i].x : -9999;
        let nx = pickX(i);
        // avoid trivial repeats
        let attempts = 0;
        while (Math.abs(nx - oldX) < 8 && attempts < 8) {
          nx = pickX(i);
          attempts++;
        }
        world.dynamicHazards[i] = { x: nx, width: hw, height: hh, sprite: "dog" };
      }, intervalMs),
    );
  }
}

// Which of the 5 original levels does world-x `x` fall inside? Drives the
// section-specific mechanics below (slippery movement, the expanding gap,
// the blink cycle) now that they all share one map instead of separate
// pages.
function getSectionIndexForX(x) {
  for (const s of WORLD.sections) {
    if (x >= s.startX && x < s.endX) return s.index;
  }
  return WORLD.sections[WORLD.sections.length - 1].index;
}

function updateLevelLabel() {
  const idx = getSectionIndexForX(player.x);
  levelLabel.textContent = WORLD.sections[idx].title.split("—")[0].trim();
}

function clampCamera(targetX) {
  const half = VIEW_W / 2;
  let cx = targetX - half;
  cx = Math.max(0, cx);
  cx = Math.min(Math.max(0, WORLD.width - VIEW_W), cx);
  if (WORLD.width < VIEW_W) cx = 0;
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

function showStartOverlay() {
  playMenuMusic();
  setTitleBackground(true);
  overlayTitle.textContent = "TACTIC";
  overlayBtn.textContent = "Play";
  overlay.classList.remove("hidden");
  overlay.dataset.end = "";
  // Flags this as the title screen so the shared button handler below
  // knows "Play" should open Level Select rather than just dismissing
  // the overlay.
  overlay.dataset.title = "1";
}

function showEndOverlay() {
  setTitleBackground(false);

  overlayTitle.textContent = "You made it!";
  overlayText.textContent =
    "You've reached the end of the road, checkpoint by checkpoint.";
  overlayBtn.textContent = "Return To Menu";
  overlay.classList.remove("hidden");
  overlay.dataset.end = "1";
}

overlayBtn.addEventListener("click", () => {
  playButtonSound();

  if (overlay.dataset.title === "1") {
    playButtonSound();
    // "Play" on the title screen — hand off to the level-select screen
    // instead of dropping straight into gameplay. This is also where a
    // returning player picks up wherever they left off.
    overlay.dataset.title = "";
    overlay.classList.add("hidden");
    showLevelSelect();
    return;
  }
  if (overlay.dataset.pauseAction === "restart") {
    overlay.dataset.pauseAction = "";
    isPaused = false;
    const menuBtn = document.getElementById("overlay-menu-btn");
    if (menuBtn) menuBtn.remove();
    respawnPlayer();
    overlay.classList.add("hidden");
  } else if (overlay.dataset.end === "1") {
    overlay.dataset.end = "";

    loadWorld();
    showStartOverlay();
  } else {
    overlay.classList.add("hidden");
  }
});

restartBtn.addEventListener("click", () => {
  playButtonSound();
  respawnPlayer();
});

window.addEventListener("keydown", (e) => {
  // While the code-entry keypad is open, it owns all keyboard input:
  // digits/backspace/enter drive it directly, Escape cancels it, and
  // everything else (movement, jump, pause) is swallowed so the player
  // can't walk around or open the pause menu mid-entry.
  if (keypadEl && keypadEl.root.style.display === "flex") {
    if (/^Digit[0-9]$/.test(e.code)) {
      handleKeypadKey(e.code.replace("Digit", ""));
      e.preventDefault();
      return;
    }
    if (/^Numpad[0-9]$/.test(e.code)) {
      handleKeypadKey(e.code.replace("Numpad", ""));
      e.preventDefault();
      return;
    }
    if (e.code === "Backspace") {
      handleKeypadKey("⌫");
      e.preventDefault();
      return;
    }
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      handleKeypadKey("Enter");
      e.preventDefault();
      return;
    }
    if (e.code === "Escape") {
      playButtonSound();
      hideKeypad();
      e.preventDefault();
      return;
    }
    e.preventDefault();
    return;
  }

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
      overlayBtn.textContent = "Restart From Checkpoint";
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
          playButtonSound();
          isPaused = false;
          overlay.dataset.pauseAction = "";

          const menuBtn = document.getElementById("overlay-menu-btn");
          if (menuBtn) menuBtn.remove();

          loadWorld(); // RESET GAME STATE (whole map, back to the first checkpoint)
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
  for (const g of world.def.ground) {
    segs.push({ left: g.x, right: g.x + g.width, top: world.def.groundY });
  }

  for (const t of world.trapState) {
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

  if (world.def.blocks && world.def.blocks.length) {
    for (const b of world.def.blocks) {
      segs.push({
        left: b.x,
        right: b.x + b.width,
        top: world.def.groundY - b.height,
      });
    }
  }

  return segs;
}

function getAllHazards() {
  const staticHazards = world.def.hazards || [];
  const dyn = world.dynamicHazards || [];
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
  for (const t of world.trapState) {
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
    respawnPlayer();
  }, 420);
}

function updateMovingPlatforms(dt) {
  for (const p of world.movingPlatforms) {
    const t = gameTime * p.speed * 0.01 + p.phase * Math.PI;
    // ping-pong via sine wave for smooth back-and-forth motion
    const norm = (Math.sin(t) + 1) / 2; // 0..1
    p.currentX = p.x + norm * p.range;
  }
}

// Patrolling ground hazards (Stage 5's hedge dogs): unlike the moving
// platforms' smooth ping-pong glide, these dogs walk in short bursts at
// their own pace, pause (both at the ends of their patrol and randomly
// mid-walk, like they're sniffing around), and turn around when they hit
// either edge of their range — meant to read as an actual walking
// animal instead of something sliding back and forth.
function updateGroundHazards(dt) {
  for (const g of world.groundHazards || []) {
    if (!g.range || g.range <= 0) {
      g.currentX = g.x;
      continue;
    }

    // Lazy-init this dog's own walk/pause state the first time it's
    // seen, so levels.js only has to describe the patrol range/speed —
    // the moment-to-moment behavior lives here.
    if (g._dir === undefined) {
      g.currentX = g.x;
      g._dir = 1;
      g._paused = true;
      g._pauseTimer = Math.random() * 0.6;
      g._moveTimer = 0;
      g._rate = 0.6 + Math.random() * 0.7; // this dog's current pace multiplier
    }

    if (g._paused) {
      g._pauseTimer -= dt;
      if (g._pauseTimer <= 0) {
        g._paused = false;
        // how long this walking burst lasts, and how fast, before the
        // next pause — re-rolled every time so no two bursts match
        g._moveTimer = 0.35 + Math.random() * 0.9;
        g._rate = 0.6 + Math.random() * 0.7;
      }
      continue;
    }

    const minX = g.x;
    const maxX = g.x + g.range;
    g.currentX += g._dir * g.speed * g._rate * dt;

    if (g.currentX <= minX) {
      g.currentX = minX;
      g._dir = 1; // turn around
      g._paused = true;
      g._pauseTimer = 0.3 + Math.random() * 0.8;
      continue;
    }
    if (g.currentX >= maxX) {
      g.currentX = maxX;
      g._dir = -1; // turn around
      g._paused = true;
      g._pauseTimer = 0.3 + Math.random() * 0.8;
      continue;
    }

    g._moveTimer -= dt;
    if (g._moveTimer <= 0) {
      // brief pause mid-patrol, not just at the ends
      g._paused = true;
      g._pauseTimer = 0.2 + Math.random() * 0.6;
    }
  }
}

// ---------- Birds (Level 2) ----------
// Each bird chirps at its own random interval. When one chirps, it plays
// the chirp sound and locks the player's controls (freezeTimer) for
// BIRD_FREEZE_DURATION seconds — doesn't hurt/kill the player, just
// interrupts them, the way an involuntary tic would.
function randomBirdInterval() {
  return 3 + Math.random() * 4; // next chirp in 3–7s
}

/*
function updateBirds(dt) {
  
  
  for (const b of world.birdState || []) {
    b.chirpTimer -= dt;
    if (b.chirpTimer <= 0) {
      playBirdChirpSound();
      freezeTimer = BIRD_FREEZE_DURATION;
      b.chirpTimer = randomBirdInterval();
    }
  }
}
  */

function updateBirds(dt) {
  const playerSection = getSectionIndexForX(player.x);
  for (const b of world.birdState || []) {
    const birdSection = getSectionIndexForX(b.x);
    if (birdSection !== playerSection) continue; // bird's stage isn't the one you're in

    b.chirpTimer -= dt;
    if (b.chirpTimer <= 0) {
      playBirdChirpSound();
      freezeTimer = BIRD_FREEZE_DURATION;
      b.chirpTimer = randomBirdInterval();
    }
  }
}

function updateTraps(dt) {
  for (const t of world.trapState) {
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

// ---------- Section 4 (old "Level 4") gap expansion ----------
// Attached to `world` at load time as world.gapExpansion:
// {
//   triggered: false,
//   x: <section start> + 380, // left edge of gap (never moves)
//   width: 80,                // current gap width — grows rightward
//   maxWidth: 700,            // stops well short of the mailbox shelf
//   speed: 190,               // px/s the gap expands (tune this for difficulty)
// }
function initGapExpansion() {
  // This mechanic is specific to Level 1 / Stage 4 (section index 3 of
  // that level's map) — other levels don't have this gap-seed trap.
  if (WORLD.levelIndex !== 0) {
    world.gapExpansion = null;
    return;
  }

  // Section 4 is the old Level 4. Its gap-seed trap lives at
  // (section start + 380) in world space; maxWidth is tuned so the gap
  // stops well short of that section's mailbox.
  const section = WORLD.sections[3];
  world.gapExpansion = {
    triggered: false,
    x: section.startX + 380,
    width: 80,
    maxWidth: 700,
    speed: 380,
  };
}

function updateGapExpansion(dt) {
  const g = world.gapExpansion;
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
  const t = world.trapState.find((t) => t.id === "gap-seed");
  if (t) {
    t.width = g.width;
    // Make sure it's in the fully-fallen state so it renders black and
    // its ground is subtracted from getGroundSegmentsAt
    t.fallen = true;
    t.fallOffset = 400;
  }
}

// ---------- Flashing hazard boxes (Stage 5) ----------
// Each hazard tagged `flash: true` blinks on its own independent on/off
// cycle (flashOn seconds visible, flashOff seconds invisible, flashPhase
// offsetting where in that cycle it starts) so a row of boxes flickers
// at different times and rates instead of all in lockstep. Purely a
// draw-time check — collision in update() doesn't consult this, so a box
// still damages the player whether or not it's currently visible.
function isHazardVisible(hz) {
  const onDur = hz.flashOn !== undefined ? hz.flashOn : 0.6;
  const offDur = hz.flashOff !== undefined ? hz.flashOff : 0.3;
  const phase = hz.flashPhase || 0;
  const cycle = onDur + offDur;
  const t = ((gameTime + phase) % cycle) + cycle; // avoid negative modulo
  return t % cycle < onDur;
}

function update(dt) {
  if (!player.alive) return;

  if (freezeTimer > 0) freezeTimer -= dt;
  const isFrozen = freezeTimer > 0;

  updateMovingPlatforms(dt);
  updateGroundHazards(dt);
  updateTraps(dt);
  updateGapExpansion(dt);
  updateBirds(dt);
  updateCarsAndNpc(dt);

  // horizontal input
  // Normal levels use instant velocity for responsive controls.
  // Level 3 has a slippery feel: smooth velocity changes both on ground and in the air.
  // While frozen (a bird just chirped — Level 2), all movement input is
  // ignored and the player holds still, same as a real involuntary tic
  // interrupting whatever they were doing.
  const targetVx = isFrozen
    ? 0
    : keys.left
      ? -MOVE_SPEED
      : keys.right
        ? MOVE_SPEED
        : 0;
  if (getSectionIndexForX(player.x) === 2 && player.grounded) {
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
  if (keys.up && player.grounded && !isFrozen) {
    player.vy = JUMP_VELOCITY;
    player.grounded = false;
    playJumpSound();
    triggerJumpTraps();
  }

  // gravity
  player.vy += GRAVITY * dt;

  // integrate horizontal
  const prevX = player.x;
  player.x += player.vx * dt;

  // horizontal collision with blocking `blocks` (solid obstacles)
  if (world.def.blocks && world.def.blocks.length) {
    for (const b of world.def.blocks) {
      const bx = b.x;
      const bTop = world.def.groundY - b.height;
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

  player.x = Math.max(0, Math.min(world.def.width - player.w, player.x));

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
  for (const p of world.movingPlatforms) {
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
  // explicit height instead of sitting on the ground. Flashing hazards
  // (`flash: true`) skip collision entirely while flashed out — they're
  // not just invisible then, they're genuinely not there, so the player
  // can walk straight through during the "off" phase.
  for (const hz of getAllHazards()) {
    if (hz.flash && !isHazardVisible(hz)) continue;

    const hzY = hz.y !== undefined ? hz.y : world.def.groundY - hz.height;
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

  // ---- patrolling ground hazards (e.g. Stage 5's hedge dogs) ----
  for (const g of world.groundHazards || []) {
    const gx = g.currentX !== undefined ? g.currentX : g.x;
    const gy = world.def.groundY - g.height;
    if (
      rectsOverlap(player.x, player.y, player.w, player.h, gx, gy, g.width, g.height)
    ) {
      killPlayer();
      return;
    }
  }

  // ---- fell into a pit / off the world ----
  // Each section keeps its own "how far can you fall before you die" rule
  // (e.g. the old Level 5's tall vertical climb needed a much lower limit
  // than the default), chosen by whichever section the player is over.
  const fallLimit = WORLD.sections[getSectionIndexForX(player.x)].fallLimit;
  if (player.y > fallLimit) {
    killPlayer();
    return;
  }

  // ---- mailbox checkpoints ----
  // mb.y lets a section (e.g. the old Level 5's door perched up high)
  // override the default "sitting on the ground" position. Hitbox size
  // (56x90) is unchanged and still matches mailbox.png exactly. Touching
  // a mailbox sets it as the respawn point; it no longer ends the level.
  // A mailbox flagged `locked` (Level 2-2's code puzzle) doesn't complete
  // on touch — it opens the code-entry keypad instead, and only behaves
  // like a normal checkpoint once the correct code has unlocked it.
  /*
  for (const mb of world.mailboxes) {
    const mbTop = mb.y !== undefined ? mb.y : world.def.groundY - mb.height;
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const mbCenterX = mb.x + mb.width / 2;
    const mbCenterY = mbTop + mb.height / 2;
    const horizontalPadding = 8;
    const verticalPadding = 10;

    if (
      Math.abs(playerCenterX - mbCenterX) < (player.w / 2 + mb.width / 2 + horizontalPadding) &&
      Math.abs(playerCenterY - mbCenterY) < (player.h / 2 + mb.height / 2 + verticalPadding)
    ) {
      if (mb.locked) {
        openKeypadForMailbox(mb);
      } else {
        activateCheckpoint(mb);
      }
    }
  }
    */

  for (const mb of world.mailboxes) {
  const mbTop = mb.y !== undefined ? mb.y : world.def.groundY - mb.height;
  const playerCenterX = player.x + player.w / 2;
  const playerCenterY = player.y + player.h / 2;
  const mbCenterX = mb.x + mb.width / 2;
  const mbCenterY = mbTop + mb.height / 2;
  const horizontalPadding = 8;
  const verticalPadding = 10;

  const overlapping =
    Math.abs(playerCenterX - mbCenterX) < (player.w / 2 + mb.width / 2 + horizontalPadding) &&
    Math.abs(playerCenterY - mbCenterY) < (player.h / 2 + mb.height / 2 + verticalPadding);

  if (overlapping) {
    if (mb.locked) {
      if (!mb._suppressReopen) {
        openKeypadForMailbox(mb);
      }
    } else {
      activateCheckpoint(mb);
    }
  } else {
    mb._suppressReopen = false; // player stepped away — arm it again for next time
  }
}


  updateLevelLabel();

  // scroll the camera to follow the player across the full continuous map
  camera.x = clampCamera(player.x + player.w / 2);
}

// Marks a mailbox as this run's latest checkpoint (once), records the
// stage as completed in the persistent save, and figures out where that
// leaves the player: on to the next stage's respawn point, or — if that
// was the last stage in this level — off to the Level Select screen so
// they can choose where to go next. Reaching the very last stage of the
// very last level still ends the game like before.
function activateCheckpoint(mb) {
  if (mb.activated) return;
  mb.activated = true;
  checkpoint = {
    x: mb.x,
    y: mb.y !== undefined ? mb.y : world.def.groundY - mb.height,
  };
  playMailboxBellSound();

  Progress.completeStage(mb.levelIndex, mb.stageIndex);

  // "Last stage of the level" means the last stage that's actually been
  // built so far (WORLD_DEFS[levelIndex].stageCount), not necessarily the
  // full STAGES_PER_LEVEL — e.g. Level 2 currently only has L2-1 and
  // L2-2 built, so clearing L2-2 should send the player back to Level
  // Select just like clearing L1-5 does, rather than leaving them
  // stranded with nothing further to do on that map. For Level 1 these
  // are the same number (5), so its behavior is unchanged.
  const levelDef = WORLD_DEFS[mb.levelIndex];
  const builtStageCount = levelDef ? levelDef.stageCount : STAGES_PER_LEVEL;
  const isLastStageOfLevel = mb.stageIndex === builtStageCount - 1;
  const isLastLevel = mb.levelIndex === LEVEL_COUNT - 1;

  if (isLastStageOfLevel && isLastLevel) {
    // The true end of the game (Level 5's 5th stage). Dormant for now
    // since only Level 1 is built — this fires once Levels 2-5 exist.
    showEndOverlay();
    return;
  }

  // Respawn point becomes wherever this checkpoint is (mirrors the old
  // "checkpoint = the mailbox you just hit" behavior).
  checkpoint = {
    x: mb.x,
    y: mb.y !== undefined ? mb.y : world.def.groundY - mb.height,
  };

  if (isLastStageOfLevel) {
    // Cleared every stage in this level — hand the player back to Level
    // Select to pick where to go next.
    showLevelSelect();
  }
}

// ------------------------------------------------------------
// Render
// ------------------------------------------------------------

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  // shift the whole world left by the camera's position so the section
  // currently under the player is what's visible — everything below is
  // drawn in world (not screen) coordinates.
  ctx.translate(-camera.x, 0);

  // ground/backdrop art — BG.png is the shared backdrop for Levels 1 and 2,
  // spanning the whole map as a continuous image instead of a per-screen
  // tile, so it pans naturally with the camera as the player moves.
  const useSharedLevelBg = world.def.levelIndex === 0 || world.def.levelIndex === 1;
  if (useSharedLevelBg && levelBgLoaded) {
    // Scale BG.png to the viewport height while preserving its exact
    // aspect ratio, then tile that scaled copy across the level width.
    const bgW = levelBgImg.naturalWidth || 1;
    const bgH = levelBgImg.naturalHeight || VIEW_H;
    const scale = VIEW_H / bgH;
    const drawW = bgW * scale;
    const drawH = VIEW_H;
    const tileCount = Math.ceil(world.def.width / drawW);

    for (let i = 0; i < tileCount; i++) {
      const tx = i * drawW;
      ctx.drawImage(levelBgImg, 0, 0, bgW, bgH, tx, 0, drawW, drawH);
    }
  } else {
    ctx.fillStyle = "#d0d0d0";
    ctx.fillRect(0, 0, world.def.width, VIEW_H);
  }

  // ground line — semi-transparent so the dirt texture from levelbg.png
  // shows through instead of being completely hidden behind a flat fill
  ctx.fillStyle = "rgba(191, 191, 191, 0)";
  for (const g of world.def.ground) {
    ctx.fillRect(g.x, world.def.groundY, g.width, VIEW_H);
  }

  // decorative trees (Level 2's evenly-spaced tree.png) — purely visual,
  // no collision, so they're drawn early as background scenery.
  for (const tr of world.def.trees || []) {
    const ty = world.def.groundY - tr.height;
    if (treeLoaded) {
      ctx.drawImage(treeImg, tr.x, ty, tr.width, tr.height);
    } else {
      ctx.fillStyle = "#4d7a48";
      ctx.fillRect(tr.x, ty, tr.width, tr.height);
    }
  }

  // birds perched in the trees (mechanically these are birds, not
  // hazards; see updateBirds()).
  for (const b of world.birdState || []) {
    if (birdImgLoaded) {
      ctx.drawImage(birdImg, b.x, b.y, b.width, b.height);
    } else {
      ctx.fillStyle = "#8a5a3a";
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }
  }

  // Level 2-2's background cars + NPC (with its code speech-bubble) —
  // purely a visual/informational layer, no collision, so it's drawn as
  // background scenery alongside the trees/birds above.
  drawCarsAndNpc();

  for (const t of world.trapState) {
    if (t.fallen) {
      // falling slab graphic dropping out of view
      ctx.fillStyle = "tan";
      ctx.fillRect(t.x, world.def.groundY + t.fallOffset, t.width, 14);
      // pit interior (darker) revealed behind it
      ctx.fillStyle = "#38201F";
      ctx.fillRect(t.x, world.def.groundY, t.width, VIEW_H);
    } else if (t.armed) {
      // subtle pre-collapse tremor cue
      const shake = Math.sin(gameTime * 60) * 2;
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(t.x + shake, world.def.groundY, t.width, 6);
    }
  }

  // moving platforms (each can carry its own `color`/`colorSide` so it
  // reads as part of whatever it's sitting on — a hedge, a tree branch,
  // a rooftop — instead of every platform in the game sharing one look;
  // falls back to the original green-on-brown if a stage doesn't specify).
  for (const p of world.movingPlatforms) {
    const px = p.currentX !== undefined ? p.currentX : p.x;
    ctx.fillStyle = p.color || "#6ABB40";
    ctx.fillRect(px, p.y, p.width, 14);
    ctx.fillStyle = p.colorSide || "#754F33";
    ctx.fillRect(px, p.y + 14, p.width, 8);
  }

  // patrolling ground hazards (e.g. Stage 5's hedge dogs) — always
  // visible, always damaging. These use whitedog.png (Stage 5's own
  // sprite, kept separate from Stage 1's dog.png).
  for (const g of world.groundHazards || []) {
    const gx = g.currentX !== undefined ? g.currentX : g.x;
    const gy = world.def.groundY - g.height;
    const useDog = g.sprite === "dog";
    const img = useDog ? dogImg : whitedogImg;
    const imgReady = useDog ? dogLoaded : whitedogLoaded;
    if (imgReady) {
      ctx.drawImage(img, gx, gy, g.width, g.height);
    } else {
      ctx.fillStyle = "#ff3b3b";
      ctx.fillRect(gx, gy, g.width, g.height);
    }
  }

  // blocking blocks (solid obstacles the player must jump over)
  for (const b of world.def.blocks || []) {
    const top = world.def.groundY - b.height;
    if (box2Loaded) {
      ctx.drawImage(box2Img, b.x, top, b.width, b.height);
    } else {
      ctx.fillStyle = "#6b6b6b";
      ctx.fillRect(b.x, top, b.width, b.height);
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, top, b.width, b.height);
    }
  }

  // hazards (box/dog/whitedog tics). Last-stage flashing hazards
  // (`flash: true`) blink on/off — collision in update() now skips them
  // entirely while they're flashed out, so the player can walk straight
  // through during the "off" phase, not just visually miss them.
  for (const hz of getAllHazards()) {
    if (hz.flash && !isHazardVisible(hz)) continue;

    const hzY = hz.y !== undefined ? hz.y : world.def.groundY - hz.height;
    const img =
      hz.sprite === "whitedog"
        ? whitedogImg
        : hz.sprite === "dog"
          ? dogImg
          : boxImg;
    const imgReady =
      hz.sprite === "whitedog"
        ? whitedogLoaded
        : hz.sprite === "dog"
          ? dogLoaded
          : boxLoaded;

    if (imgReady) {
      ctx.drawImage(img, hz.x, hzY, hz.width, hz.height);
    } else {
      // fallback
      ctx.fillStyle = "#ff3b3b";
      ctx.fillRect(hz.x, hzY, hz.width, hz.height);
    }
  }

  // mailbox checkpoints, honoring each one's mb.y override. Renders
  // mailboxup.png until the checkpoint is reached, then swaps to
  // mailboxdown.png to show that stage has been cleared. A locked
  // mailbox (Level 2-2) additionally gets a small padlock badge so it
  // reads as "not ready yet" rather than broken/unreachable.
  for (const mb of world.mailboxes) {
    const mbTop = mb.y !== undefined ? mb.y : world.def.groundY - mb.height;

    const mailboxImg = mb.activated ? mailboxDownImg : mailboxUpImg;
    const mailboxReady = mb.activated ? mailboxDownLoaded : mailboxUpLoaded;

    if (mailboxReady) {
      ctx.drawImage(mailboxImg, mb.x, mbTop, mb.width, mb.height);
    } else {
      // flat-color fallback if the art hasn't loaded yet / failed to load
      ctx.fillStyle = "#9c6b2a";
      ctx.fillRect(mb.x - 6, mbTop - 6, mb.width + 12, mb.height + 6);
      ctx.fillStyle = "#c9c9c9";
      ctx.fillRect(mb.x, mbTop, mb.width, mb.height);
    }

    if (mb.locked) {
      ctx.fillStyle = "#ffd23f";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("\uD83D\uDD12", mb.x + mb.width / 2, mbTop - 10);
      ctx.textAlign = "left";
    }
  }

  // player
  if (player.alive || deathFlashTimer > 0) {
    drawPlayer();
  }

  // brief visual cue while a bird chirp has the player's controls locked
  if (freezeTimer > 0) {
    ctx.fillStyle = "rgba(120, 180, 255, 0.35)";
    ctx.fillRect(player.x - 4, player.y - 4, player.w + 8, player.h + 8);
  }

  ctx.restore();
}

function drawPlayer() {
  // Level 5's blink mechanic now drives the last stage's hazard boxes
  // (see draw()'s hazard loop), not the player — the player always
  // renders normally.
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

  const levelSelectOpen =
    typeof levelSelectEl !== "undefined" &&
    levelSelectEl &&
    levelSelectEl.root.style.display !== "none";

  const keypadOpen = !!(keypadEl && keypadEl.root.style.display === "flex");

  if (!overlay.classList.contains("hidden") || levelSelectOpen || keypadOpen) {
    // paused while overlay (level intro / end screen), the level-select
    // grid, or the code-entry keypad is up
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
  loadWorld();
  showStartOverlay();
  requestAnimationFrame(frame);
});
