// ============================================================
// Week 6 Example 1 — Vertical Scrolling Shoot 'Em Up
// ============================================================
// A top-down vertical scroller. The world scrolls upward as
// the player advances. Orange blob enemies spawn at the top
// and move toward the player. Shoot them with Spacebar.
//
// Dark square obstacles are loaded from data/obstacles.json
// and scroll with the world. Hitting one causes damage and
// bounces the player back. Max 3 enemies on screen at once.
//
// Files:
//   sketch.js            — all game logic
//   data/obstacles.json  — obstacle positions in world coordinates
// ============================================================

// ------------------------------------------------------------
// WORLD
// ------------------------------------------------------------
const WORLD_LENGTH = 3000;
const SCROLL_SPEED = 0.8;
let scrollY = 0;

// ------------------------------------------------------------
// PLAYER CONFIGURATION
// ------------------------------------------------------------
const PLAYER_SPEED = 3;
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN = 12;
const INVINCIBLE_FRAMES = 90;

// ------------------------------------------------------------
// ENEMY CONFIGURATION
// Max 3 enemies on screen at once — spawnEnemies() checks
// enemies.length before spawning a new one.
// ------------------------------------------------------------
const ENEMY_SPAWN_RATE = 120;
const MAX_ENEMIES = 3;
let spawnTimer = 0;

// ------------------------------------------------------------
// OBSTACLES
// Loaded from data/obstacles.json in preload().
// Each obstacle has a world Y position that scrolls with
// the world. Player takes damage and bounces on contact.
// ------------------------------------------------------------
let obstacleData;
let obstacles = []; // built from JSON in setup()

// ------------------------------------------------------------
// BACKGROUND SHAPES
// ------------------------------------------------------------
let bgShapes = [];

// ------------------------------------------------------------
// PLAYER
// ------------------------------------------------------------
let player = {
  x: 400,
  y: 370,
  r: 22,
  blobT: 0,
  direction: { x: 0, y: -1 },
  shootTimer: 0,
  health: 5,
  maxHealth: 5,
  invincible: false,
  invincibleTimer: 0,
  // Bounce velocity applied when hitting an obstacle
  bounceVX: 0,
  bounceVY: 0,
};

// ------------------------------------------------------------
// BULLETS and ENEMIES
// ------------------------------------------------------------
let bullets = [];
let enemies = [];

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------
let score = 0;

const STATE_PLAY = "play";
const STATE_WIN = "win";
const STATE_OVER = "over";
let gameState = STATE_PLAY;

// ------------------------------------------------------------
// SOUNDS — uncomment and fill in paths to add audio
// ------------------------------------------------------------
// let shootSound;
// let hitSound;
// let playerHitSound;
// let winSound;
// let music;

// ============================================================
// preload()
// ============================================================
function preload() {
  obstacleData = loadJSON("data/obstacles.json");

  // Uncomment to load sounds:
  // shootSound     = loadSound("assets/sounds/shoot.wav");
  // hitSound       = loadSound("assets/sounds/hit.wav");
  // playerHitSound = loadSound("assets/sounds/playerhit.wav");
  // winSound       = loadSound("assets/sounds/win.wav");
  // music          = loadSound("assets/sounds/music.mp3");
}

// ============================================================
// setup()
// Builds obstacle objects from JSON and generates background shapes.
// ============================================================
function setup() {
  createCanvas(800, 450);

  // Build obstacle objects from JSON
  // Each obstacle stores its world Y position so it scrolls
  // with the world the same way enemies do.
  for (let i = 0; i < obstacleData.obstacles.length; i++) {
    let o = obstacleData.obstacles[i];
    obstacles.push({
      x: o.x,
      worldY: o.worldY, // position in world coordinates
      size: o.size,
    });
  }

  // Generate background shapes
  for (let i = 0; i < 80; i++) {
    bgShapes.push({
      x: random(width),
      worldY: random(-WORLD_LENGTH, 0),
      scrollMult: random(0.4, 0.9),
      type: random() > 0.5 ? "circle" : "rect",
      size: random(8, 40),
      r: floor(random(30, 70)),
      g: floor(random(30, 70)),
      b: floor(random(50, 100)),
    });
  }

  // Uncomment to start music:
  // music.loop();
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(20);

  if (gameState === STATE_PLAY) {
    scrollWorld();
    drawBackground();
    drawObstacles();
    handleInput();
    applyBounce();
    updateBullets();
    updateEnemies();
    spawnEnemies();
    checkBulletEnemyCollisions();
    checkEnemyPlayerCollision();
    checkObstaclePlayerCollision();
    updateInvincibility();
    checkLevelComplete();
    drawEnemies();
    drawBullets();
    drawPlayer();
    drawHUD();
  } else if (gameState === STATE_WIN) {
    drawWinScreen();
  } else if (gameState === STATE_OVER) {
    drawGameOver();
  }
}

// ------------------------------------------------------------
// scrollWorld()
// ------------------------------------------------------------
function scrollWorld() {
  if (scrollY < WORLD_LENGTH) {
    scrollY += SCROLL_SPEED;
  }
}

// ------------------------------------------------------------
// drawBackground()
// ------------------------------------------------------------
function drawBackground() {
  noStroke();
  for (let i = 0; i < bgShapes.length; i++) {
    let s = bgShapes[i];
    let screenY = s.worldY + scrollY * s.scrollMult;

    if (screenY > height + s.size) {
      s.worldY -= WORLD_LENGTH + height;
    }

    fill(s.r, s.g, s.b, 180);

    if (s.type === "circle") {
      ellipse(s.x, screenY, s.size);
    } else {
      rect(s.x - s.size / 2, screenY - s.size / 2, s.size, s.size, 3);
    }
  }

  // Faint HUD boundary line
  stroke(255, 255, 255, 30);
  strokeWeight(1);
  line(0, 70, width, 70);
  noStroke();
}

// ------------------------------------------------------------
// drawObstacles()
// Converts each obstacle's world Y to screen Y using scrollY,
// then draws it as a dark rounded square.
// Only draws obstacles that are currently visible on screen.
// ------------------------------------------------------------
function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    let screenY = o.worldY + scrollY;

    // Skip if off screen
    if (screenY < -o.size || screenY > height + o.size) continue;

    let x = o.x - o.size / 2;
    let y = screenY - o.size / 2;
    let s = o.size;

    // Animated glow — pulses using sin(frameCount)
    // Each obstacle uses a different phase so they don't all pulse together
    let glow = map(sin(frameCount * 0.05 + i * 1.2), -1, 1, 40, 90);

    push();

    // Outer glow — slightly larger, semi-transparent orange
    noStroke();
    fill(255, 100, 0, glow);
    rect(x - 4, y - 4, s + 8, s + 8, 8);

    // Lava base — dark red-orange
    fill(180, 40, 0);
    rect(x, y, s, s, 4);

    // Lava surface — brighter orange patches
    fill(220, 80, 10);
    rect(x + s * 0.1, y + s * 0.1, s * 0.4, s * 0.35, 2);
    rect(x + s * 0.55, y + s * 0.5, s * 0.35, s * 0.3, 2);
    rect(x + s * 0.2, y + s * 0.6, s * 0.25, s * 0.25, 2);

    // Crack lines — drawn across the surface
    stroke(100, 20, 0);
    strokeWeight(1.5);
    line(x + s * 0.3, y, x + s * 0.5, y + s * 0.4);
    line(x + s * 0.5, y + s * 0.4, x + s * 0.7, y + s * 0.6);
    line(x, y + s * 0.5, x + s * 0.3, y + s * 0.7);
    line(x + s * 0.3, y + s * 0.7, x + s * 0.6, y + s);

    // Hot edge highlight — bright orange rim at top and left
    noStroke();
    fill(255, 140, 0, 180);
    rect(x, y, s, 3, 2);
    rect(x, y, 3, s, 2);

    pop();
  }
}

// ------------------------------------------------------------
// checkObstaclePlayerCollision()
// Checks if the player overlaps any obstacle using a simple
// circle-rectangle overlap test.
// On contact: lose 1 health, become invincible, bounce back.
// The bounce direction is away from the obstacle centre.
// ------------------------------------------------------------
function checkObstaclePlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    let screenY = o.worldY + scrollY;

    // Skip if off screen
    if (screenY < -o.size || screenY > height + o.size) continue;

    // Find the closest point on the rectangle to the player centre
    let closestX = constrain(player.x, o.x - o.size / 2, o.x + o.size / 2);
    let closestY = constrain(player.y, screenY - o.size / 2, screenY + o.size / 2);

    // Distance from player centre to closest point
    let d = dist(player.x, player.y, closestX, closestY);

    if (d < player.r) {
      player.health--;
      player.invincible = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;

      // Bounce direction — away from obstacle centre
      let dx = player.x - o.x;
      let dy = player.y - screenY;
      let len = dist(0, 0, dx, dy);
      if (len > 0) {
        player.bounceVX = (dx / len) * 8;
        player.bounceVY = (dy / len) * 8;
      }

      // Uncomment to play player hit sound:
      // playerHitSound.play();

      if (player.health <= 0) {
        gameState = STATE_OVER;
        // music.stop();
      }

      break;
    }
  }
}

// ------------------------------------------------------------
// applyBounce()
// Applies and decays the bounce velocity each frame.
// Bounce fades quickly so the player regains control fast.
// ------------------------------------------------------------
function applyBounce() {
  if (abs(player.bounceVX) > 0.1 || abs(player.bounceVY) > 0.1) {
    player.x += player.bounceVX;
    player.y += player.bounceVY;
    player.bounceVX *= 0.75; // decay
    player.bounceVY *= 0.75;

    player.x = constrain(player.x, player.r, width - player.r);
    player.y = constrain(player.y, 70 + player.r, height - player.r);
  }
}

// ------------------------------------------------------------
// handleInput()
// ------------------------------------------------------------
function handleInput() {
  if (keyIsDown(87)) {
    player.y -= PLAYER_SPEED;
    player.direction = { x: 0, y: -1 };
  }
  if (keyIsDown(83)) {
    player.y += PLAYER_SPEED;
    player.direction = { x: 0, y: 1 };
  }
  if (keyIsDown(65)) {
    player.x -= PLAYER_SPEED;
    player.direction = { x: -1, y: 0 };
  }
  if (keyIsDown(68)) {
    player.x += PLAYER_SPEED;
    player.direction = { x: 1, y: 0 };
  }

  player.x = constrain(player.x, player.r, width - player.r);
  player.y = constrain(player.y, 70 + player.r, height - player.r);

  if (player.shootTimer > 0) player.shootTimer--;

  if (keyIsDown(32) && player.shootTimer === 0) {
    bullets.push({
      x: player.x + player.direction.x * (player.r + 4),
      y: player.y + player.direction.y * (player.r + 4),
      vx: player.direction.x * BULLET_SPEED,
      vy: player.direction.y * BULLET_SPEED,
    });
    player.shootTimer = SHOOT_COOLDOWN;
    // shootSound.play();
  }
}

// ------------------------------------------------------------
// updateBullets()
// ------------------------------------------------------------
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;

    if (
      bullets[i].x < 0 ||
      bullets[i].x > width ||
      bullets[i].y < 0 ||
      bullets[i].y > height
    ) {
      bullets.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// spawnEnemies()
// Only spawns if fewer than MAX_ENEMIES are on screen.
// ------------------------------------------------------------
function spawnEnemies() {
  if (enemies.length >= MAX_ENEMIES) return;

  spawnTimer++;
  if (spawnTimer < ENEMY_SPAWN_RATE) return;
  spawnTimer = 0;

  let progress = scrollY / WORLD_LENGTH;
  let speed = 0.8 + progress * 1.0;

  enemies.push({
    x: random(30, width - 30),
    y: -25,
    r: 20,
    speed: speed,
    blobT: random(100),
  });
}

// ------------------------------------------------------------
// updateEnemies()
// ------------------------------------------------------------
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d = dist(e.x, e.y, player.x, player.y);

    if (d > 0) {
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    }

    e.y += SCROLL_SPEED;

    if (e.y > height + 30) {
      enemies.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// checkBulletEnemyCollisions()
// ------------------------------------------------------------
function checkBulletEnemyCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      let d = dist(bullets[i].x, bullets[i].y, enemies[j].x, enemies[j].y);
      if (d < enemies[j].r + 6) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;
        // hitSound.play();
        break;
      }
    }
  }
}

// ------------------------------------------------------------
// checkEnemyPlayerCollision()
// ------------------------------------------------------------
function checkEnemyPlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < enemies.length; i++) {
    let d = dist(player.x, player.y, enemies[i].x, enemies[i].y);
    if (d < player.r + enemies[i].r - 8) {
      player.health--;
      player.invincible = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;
      // playerHitSound.play();

      if (player.health <= 0) {
        gameState = STATE_OVER;
        // music.stop();
      }
      break;
    }
  }
}

// ------------------------------------------------------------
// updateInvincibility()
// ------------------------------------------------------------
function updateInvincibility() {
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
}

// ------------------------------------------------------------
// checkLevelComplete()
// ------------------------------------------------------------
function checkLevelComplete() {
  if (scrollY >= WORLD_LENGTH) {
    gameState = STATE_WIN;
    // winSound.play();
    // music.stop();
  }
}

// ------------------------------------------------------------
// drawBullets()
// ------------------------------------------------------------
function drawBullets() {
  fill(255);
  noStroke();
  for (let i = 0; i < bullets.length; i++) {
    ellipse(bullets[i].x, bullets[i].y, 10);
  }
}

// ------------------------------------------------------------
// drawEnemies()
// ------------------------------------------------------------
function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];
    push();
    fill(255, 150, 30);
    noStroke();

    beginShape();
    let numPoints = 48;
    for (let j = 0; j < numPoints; j++) {
      let angle = (TWO_PI / numPoints) * j;
      let noiseVal = noise(
        cos(angle) * 0.8 + e.blobT,
        sin(angle) * 0.8 + e.blobT
      );
      let r = e.r + map(noiseVal, 0, 1, -5, 5);
      vertex(e.x + cos(angle) * r, e.y + sin(angle) * r);
    }
    endShape(CLOSE);

    fill(10);
    ellipse(e.x - 6, e.y - 4, 6, 6);
    ellipse(e.x + 6, e.y - 4, 6, 6);
    pop();

    e.blobT += 0.015;
  }
}

// ------------------------------------------------------------
// drawPlayer()
// ------------------------------------------------------------
function drawPlayer() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) return;

  push();
  fill(0, 200, 180);
  noStroke();

  beginShape();
  let numPoints = 48;
  for (let i = 0; i < numPoints; i++) {
    let angle = (TWO_PI / numPoints) * i;
    let noiseVal = noise(
      cos(angle) * 0.8 + player.blobT,
      sin(angle) * 0.8 + player.blobT
    );
    let r = player.r + map(noiseVal, 0, 1, -6, 6);
    vertex(player.x + cos(angle) * r, player.y + sin(angle) * r);
  }
  endShape(CLOSE);

  fill(10);
  ellipse(player.x - 7, player.y - 5, 7, 7);
  ellipse(player.x + 7, player.y - 5, 7, 7);

  fill(255);
  ellipse(
    player.x + player.direction.x * (player.r - 4),
    player.y + player.direction.y * (player.r - 4),
    8
  );

  pop();
  player.blobT += 0.015;
}

// ------------------------------------------------------------
// drawHUD()
// ------------------------------------------------------------
function drawHUD() {
  noStroke();

  fill(160);
  textSize(13);
  textAlign(LEFT);
  textFont("monospace");
  text("Move: WASD   Shoot: Spacebar", 16, 24);

  fill(255);
  textSize(16);
  textAlign(RIGHT);
  text("Score: " + score, width - 16, 28);

  let barW = 160;
  let barH = 14;
  let barX = width - barW - 16;
  let barY = 40;
  let fillW = map(player.health, 0, player.maxHealth, 0, barW);

  fill(40);
  rect(barX, barY, barW, barH, 4);

  let healthColour = lerpColor(
    color(220, 60, 60),
    color(60, 220, 120),
    player.health / player.maxHealth
  );
  fill(healthColour);
  rect(barX, barY, fillW, barH, 4);

  fill(200);
  textSize(11);
  textAlign(RIGHT);
  text("Health", width - 16, barY + barH + 12);

  // Scroll progress bar
  let progBarX = width - 6;
  let progBarH = height - 40;
  let progBarY = 20;
  let progFill = map(scrollY, 0, WORLD_LENGTH, 0, progBarH);

  fill(40);
  rect(progBarX, progBarY, 4, progBarH, 2);

  fill(100, 180, 255);
  rect(progBarX, progBarY + progBarH - progFill, 4, progFill, 2);
}

// ------------------------------------------------------------
// drawWinScreen()
// ------------------------------------------------------------
function drawWinScreen() {
  background(20);
  fill(255);
  textAlign(CENTER);
  textSize(52);
  text("Level Complete!", width / 2, height / 2 - 30);

  fill(180);
  textSize(18);
  text("Score: " + score, width / 2, height / 2 + 20);

  fill(120);
  textSize(14);
  text("Press R to play again", width / 2, height / 2 + 60);
}

// ------------------------------------------------------------
// drawGameOver()
// ------------------------------------------------------------
function drawGameOver() {
  background(20);
  fill(255);
  textAlign(CENTER);
  textSize(52);
  text("Game Over", width / 2, height / 2 - 30);

  fill(180);
  textSize(18);
  text("Score: " + score, width / 2, height / 2 + 20);

  fill(120);
  textSize(14);
  text("Press R to play again", width / 2, height / 2 + 60);
}

// ------------------------------------------------------------
// keyPressed()
// ------------------------------------------------------------
function keyPressed() {
  if ((key === "r" || key === "R") && gameState !== STATE_PLAY) {
    gameState = STATE_PLAY;
    score = 0;
    scrollY = 0;
    spawnTimer = 0;
    bullets = [];
    enemies = [];

    player.x = 400;
    player.y = 370;
    player.direction = { x: 0, y: -1 };
    player.shootTimer = 0;
    player.health = player.maxHealth;
    player.invincible = false;
    player.invincibleTimer = 0;
    player.bounceVX = 0;
    player.bounceVY = 0;

    // music.loop();
  }
}
