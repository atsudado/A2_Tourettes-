(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GRAVITY = 0.72;
  const FRICTION = 0.78;
  const MAX_FALL = 18;

  const input = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    restartPressed: false,
  };

  const keyMap = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "jump",
    a: "left",
    d: "right",
    w: "jump",
    A: "left",
    D: "right",
    W: "jump",
  };

  window.addEventListener("keydown", (event) => {
    const mapped = keyMap[event.key];
    if (mapped) {
      event.preventDefault();
      if (mapped === "jump" && !input.jump) input.jumpPressed = true;
      input[mapped] = true;
    }
    if (event.key === "r" || event.key === "R") {
      input.restartPressed = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    const mapped = keyMap[event.key];
    if (mapped) {
      event.preventDefault();
      input[mapped] = false;
    }
  });

  function bindHoldButton(id, key) {
    const button = document.getElementById(id);
    if (!button) return;
    const start = (event) => {
      event.preventDefault();
      if (key === "jump" && !input.jump) input.jumpPressed = true;
      input[key] = true;
    };
    const end = (event) => {
      event.preventDefault();
      input[key] = false;
    };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointerleave", end);
    button.addEventListener("pointercancel", end);
  }
  bindHoldButton("leftBtn", "left");
  bindHoldButton("rightBtn", "right");
  bindHoldButton("jumpBtn", "jump");

  const makeRect = (x, y, w, h, extra = {}) => ({ x, y, w, h, ...extra });
  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;

  const basePlayer = () => ({
    x: 60,
    y: 360,
    w: 28,
    h: 38,
    vx: 0,
    vy: 0,
    speed: 0.78,
    maxSpeed: 6.3,
    jumpPower: -14.3,
    onGround: false,
    facing: 1,
  });

  const levelFactories = [
    () => ({
      name: "Level 1: Irregular Small Tics",
      shortName: "Irregular small tics",
      width: 1200,
      spawn: { x: 60, y: 360 },
      door: makeRect(1100, 376, 54, 64),
      platforms: [
        makeRect(0, 440, 1200, 120),
        makeRect(1040, 416, 160, 24),
      ],
      hazards: [makeRect(560, 392, 48, 48, { flash: true })],
      moving: [],
      traps: [],
      message:
        "Some tics can feel sudden and irregular. The flashing block represents an unexpected obstacle that must be handled in the moment.",
      tip: "Jump over the flashing red block and reach the door.",
    }),
    () => ({
      name: "Level 2: Cause-Effect Tics",
      shortName: "Cause-effect tics",
      width: 1260,
      spawn: { x: 60, y: 360 },
      door: makeRect(1140, 376, 54, 64),
      platforms: [
        makeRect(0, 440, 300, 120),
        makeRect(450, 440, 250, 120),
        makeRect(840, 440, 420, 120),
        makeRect(235, 392, 28, 48),
        makeRect(1080, 416, 180, 24),
      ],
      hazards: [],
      moving: [],
      traps: [
        makeRect(300, 440, 150, 120, { hidden: true, falling: false, vy: 0 }),
        makeRect(700, 440, 140, 120, { hidden: true, falling: false, vy: 0 }),
      ],
      triggered: false,
      message:
        "Sometimes a situation can set off a tic or make it harder to control. Here, jumping causes hidden floor sections to drop.",
      tip: "The level looks flat. Pressing jump reveals the two hidden holes.",
      onJump(level) {
        if (level.triggered) return;
        level.triggered = true;
        level.traps.forEach((trap, index) => {
          trap.falling = true;
          trap.vy = 3 + index * 0.8;
        });
        showToast("Cause → effect: the hidden floor reacts to your jump.");
      },
    }),
    () => ({
      name: "Level 3: Delayed Tics",
      shortName: "Delayed tics",
      width: 1320,
      spawn: { x: 60, y: 360 },
      door: makeRect(1180, 376, 54, 64),
      platforms: [
        makeRect(0, 440, 260, 120),
        makeRect(910, 440, 410, 120),
        makeRect(1125, 416, 195, 24),
      ],
      hazards: [],
      traps: [],
      moving: [
        makeRect(305, 392, 132, 24, { minX: 280, maxX: 510, speed: 2.2, dir: 1, dx: 0 }),
        makeRect(635, 348, 132, 24, { minX: 590, maxX: 815, speed: 2.6, dir: -1, dx: 0 }),
      ],
      message:
        "Some tics may feel delayed or build up before happening. The moving platforms ask you to wait, time your movement, and adapt.",
      tip: "Time your jumps across the two moving platforms.",
    }),
  ];

  let currentLevelIndex = 0;
  let level = levelFactories[currentLevelIndex]();
  let player = basePlayer();
  let deaths = 0;
  let completed = false;
  let cameraX = 0;
  let toast = "";
  let toastTimer = 0;
  let startTime = performance.now();
  let lastTime = performance.now();

  function showToast(text) {
    toast = text;
    toastTimer = 2.4;
  }

  function resetPlayer() {
    player = basePlayer();
    player.x = level.spawn.x;
    player.y = level.spawn.y;
  }

  function resetLevel(countDeath = false) {
    if (countDeath) deaths += 1;
    level = levelFactories[currentLevelIndex]();
    resetPlayer();
    cameraX = Math.max(0, player.x - 160);
    showToast(countDeath ? "Restarted. Try a new tactic." : level.tip);
  }

  function nextLevel() {
    currentLevelIndex += 1;
    if (currentLevelIndex >= levelFactories.length) {
      completed = true;
      showToast("You finished the first 3 levels of Tactic!");
      return;
    }
    level = levelFactories[currentLevelIndex]();
    resetPlayer();
    showToast(level.tip);
  }

  function getSolids() {
    return [
      ...level.platforms,
      ...level.moving,
      ...level.traps.filter((trap) => !trap.falling),
    ];
  }

  function resolveHorizontal() {
    for (const block of getSolids()) {
      if (!rectsOverlap(player, block)) continue;
      if (player.vx > 0) player.x = block.x - player.w;
      if (player.vx < 0) player.x = block.x + block.w;
      player.vx = 0;
    }
  }

  function resolveVertical() {
    player.onGround = false;
    for (const block of getSolids()) {
      if (!rectsOverlap(player, block)) continue;
      if (player.vy > 0) {
        player.y = block.y - player.h;
        player.vy = 0;
        player.onGround = true;
        if (block.dx) player.x += block.dx;
      } else if (player.vy < 0) {
        player.y = block.y + block.h;
        player.vy = 0;
      }
    }
  }

  function updateMovingPlatforms() {
    level.moving.forEach((platform) => {
      const oldX = platform.x;
      platform.x += platform.speed * platform.dir;
      if (platform.x <= platform.minX) {
        platform.x = platform.minX;
        platform.dir = 1;
      }
      if (platform.x >= platform.maxX) {
        platform.x = platform.maxX;
        platform.dir = -1;
      }
      platform.dx = platform.x - oldX;
    });
  }

  function updateTraps() {
    level.traps.forEach((trap) => {
      if (!trap.falling) return;
      trap.vy += 0.45;
      trap.y += trap.vy;
    });
  }

  function update(dt) {
    if (completed) {
      if (input.restartPressed) {
        currentLevelIndex = 0;
        deaths = 0;
        completed = false;
        startTime = performance.now();
        resetLevel(false);
      }
      input.jumpPressed = false;
      input.restartPressed = false;
      return;
    }

    if (input.restartPressed) resetLevel(true);

    updateMovingPlatforms();
    updateTraps();

    if (input.left) {
      player.vx -= player.speed;
      player.facing = -1;
    }
    if (input.right) {
      player.vx += player.speed;
      player.facing = 1;
    }
    if (!input.left && !input.right) player.vx *= FRICTION;
    player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));

    if (input.jumpPressed) {
      if (level.onJump) level.onJump(level);
      if (player.onGround) {
        player.vy = player.jumpPower;
        player.onGround = false;
      }
    }

    player.vy += GRAVITY;
    player.vy = Math.min(player.vy, MAX_FALL);

    player.x += player.vx;
    resolveHorizontal();
    player.y += player.vy;
    resolveVertical();

    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }
    if (player.x + player.w > level.width) {
      player.x = level.width - player.w;
      player.vx = 0;
    }

    for (const hazard of level.hazards) {
      if (rectsOverlap(player, hazard)) {
        resetLevel(true);
        break;
      }
    }

    if (player.y > HEIGHT + 120) resetLevel(true);
    if (rectsOverlap(player, level.door)) nextLevel();

    const targetCamera = Math.max(0, Math.min(level.width - WIDTH, player.x - 220));
    cameraX += (targetCamera - cameraX) * 0.12;

    if (toastTimer > 0) toastTimer -= dt;
    input.jumpPressed = false;
    input.restartPressed = false;
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#101936");
    gradient.addColorStop(1, "#070a14");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.translate(-cameraX * 0.18, 0);
    ctx.globalAlpha = 0.2;
    for (let i = -1; i < 14; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#81f4ff" : "#ffffff";
      ctx.fillRect(i * 130, 80 + (i % 3) * 32, 70, 3);
    }
    ctx.restore();
  }

  function drawGridFloor() {
    ctx.save();
    ctx.translate(-cameraX, 0);
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let x = 0; x < level.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 440);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 440; y < HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(level.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBlock(block, color, stroke = "rgba(255,255,255,0.15)") {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(block.x), Math.round(block.y), block.w, block.h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(block.x) + 1, Math.round(block.y) + 1, block.w - 2, block.h - 2);
  }

  function drawLevel() {
    ctx.save();
    ctx.translate(-cameraX, 0);

    level.platforms.forEach((platform) => drawBlock(platform, "#4d5a70"));
    level.traps.forEach((trap) => {
      const color = trap.falling ? "#b56b4d" : "#4d5a70";
      drawBlock(trap, color);
      if (trap.falling) {
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.moveTo(trap.x + 12, trap.y + 8);
        ctx.lineTo(trap.x + trap.w - 20, trap.y + 40);
        ctx.lineTo(trap.x + 26, trap.y + 70);
        ctx.stroke();
      }
    });
    level.moving.forEach((platform) => drawBlock(platform, "#2c9fb8"));

    level.hazards.forEach((hazard) => {
      const pulse = 0.55 + Math.sin(performance.now() / 95) * 0.35;
      ctx.globalAlpha = pulse;
      drawBlock(hazard, "#ff2c2c", "#ffc8c8");
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 24px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("!", hazard.x + hazard.w / 2, hazard.y + 32);
    });

    const door = level.door;
    drawBlock(door, "#efe77a", "#fff7a8");
    ctx.fillStyle = "#3b2f10";
    ctx.fillRect(door.x + door.w - 16, door.y + door.h / 2, 6, 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("NEXT", door.x + door.w / 2, door.y - 10);

    ctx.restore();
  }

  function drawPlayer() {
    const px = Math.round(player.x - cameraX);
    const py = Math.round(player.y);
    ctx.fillStyle = "#f5f7ff";
    ctx.fillRect(px, py, player.w, player.h);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, player.w - 2, player.h - 2);

    ctx.fillStyle = "#0b1020";
    const eyeX = player.facing === 1 ? px + 18 : px + 8;
    ctx.fillRect(eyeX, py + 10, 4, 4);

    ctx.fillStyle = "#81f4ff";
    ctx.fillRect(px + 5, py + player.h - 7, player.w - 10, 4);
  }

  function drawPanel() {
    const padding = 16;
    const panelW = WIDTH - 32;
    ctx.fillStyle = "rgba(7, 10, 20, 0.76)";
    roundRect(ctx, padding, padding, panelW, 100, 18, true, false);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, padding, padding, panelW, 100, 18, false, true);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 24px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(level.name, 32, 48);

    ctx.fillStyle = "#b8c0d9";
    ctx.font = "15px system-ui";
    wrapText(ctx, level.message, 32, 76, 650, 19);

    ctx.textAlign = "right";
    ctx.fillStyle = "#81f4ff";
    ctx.font = "700 14px system-ui";
    ctx.fillText(`Deaths: ${deaths}`, WIDTH - 32, 43);
    ctx.fillStyle = "#b8c0d9";
    ctx.fillText("← → move   ↑ jump   R restart", WIDTH - 32, 68);
    ctx.fillText(level.tip, WIDTH - 32, 93);
  }

  function drawToast() {
    if (toastTimer <= 0 || !toast) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, toastTimer);
    ctx.fillStyle = "rgba(0,0,0,0.68)";
    roundRect(ctx, WIDTH / 2 - 250, HEIGHT - 76, 500, 46, 16, true, false);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(toast, WIDTH / 2, HEIGHT - 47);
    ctx.restore();
  }

  function drawCompletion() {
    drawBackground();
    ctx.fillStyle = "rgba(7,10,20,0.82)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#81f4ff";
    ctx.font = "800 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("TACTIC COMPLETE", WIDTH / 2, 128);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 52px system-ui";
    ctx.fillText("You cleared the first 3 levels", WIDTH / 2, 190);

    const seconds = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillStyle = "#b8c0d9";
    ctx.font = "18px system-ui";
    wrapText(
      ctx,
      "Tourette syndrome and tics can be misunderstood. This game uses surprise, cause-effect, and timing mechanics to build empathy for unpredictable experiences.",
      WIDTH / 2 - 330,
      244,
      660,
      26
    );
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 18px system-ui";
    ctx.fillText(`Deaths: ${deaths}  •  Time: ${seconds}s`, WIDTH / 2, 348);
    ctx.fillStyle = "#81f4ff";
    ctx.fillText("Press R to restart", WIDTH / 2, 392);
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  function draw() {
    if (completed) {
      drawCompletion();
      return;
    }
    drawBackground();
    drawGridFloor();
    drawLevel();
    drawPlayer();
    drawPanel();
    drawToast();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resetLevel(false);
  requestAnimationFrame(loop);
})();
