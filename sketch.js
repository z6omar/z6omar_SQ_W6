// ============================================================
// Free Roam Top-Down Game with Background, Sprites, and Sounds
// ============================================================

const WORLD_W = 1600;
const WORLD_H = 2000;

let camX = 0;
let camY = 0;
const CAM_SMOOTHING = 0.1;

const PLAYER_SPEED = 3;
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN = 12;
const INVINCIBLE_FRAMES = 90;

let bgImg;
let heroImg;
let enemyImg;

let gunSound;
let hitSound;
let music;
let winSound;

let musicStarted = false;
let winSoundPlayed = false;

// ============================================================
// SPRITE SETTINGS — ADJUST THESE IF SPRITES ARE NOT CENTERED
// ============================================================

// HERO SPRITE SHEET SETTINGS
let HERO_FRAME_W = 202.5;
let HERO_FRAME_H = 170;
let HERO_FRAMES = 3;
let HERO_SCALE = 0.4;
let HERO_OFFSET_X = 0;
let HERO_OFFSET_Y = 0;

// ENEMY SPRITE SHEET SETTINGS
let ENEMY_FRAME_W = 202.5;
let ENEMY_FRAME_H = 170;
let ENEMY_FRAMES = 3;
let ENEMY_SCALE = 0.4;
let ENEMY_OFFSET_X = 0;
let ENEMY_OFFSET_Y = 0;

// BOSS USES SAME ENEMY SPRITE BUT BIGGER
let BOSS_SCALE = 2.0;
let BOSS_OFFSET_X = 0;
let BOSS_OFFSET_Y = 0;

let player = {
  x: WORLD_W / 2,
  y: WORLD_H - 200,
  r: 22,
  direction: { x: 0, y: -1 },
  moving: false,
  shootTimer: 0,
  health: 5,
  maxHealth: 5,
  invincible: false,
  invincibleTimer: 0,
  bounceVX: 0,
  bounceVY: 0,
};

let bullets = [];
let enemies = [];

let obstacleData;
let obstacles = [];

let enemyData;
let nextWave = 0;

let boss = null;
let bossData = null;
const BOSS_ZONE_Y = 300;

const MAP_W = 120;
const MAP_H = 120;
const MAP_X = 16;
const MAP_Y_OFFSET = 16;

let score = 0;

const STATE_PLAY = "play";
const STATE_BOSS = "boss";
const STATE_WIN = "win";
const STATE_OVER = "over";
let gameState = STATE_PLAY;

// ============================================================
// preload()
// ============================================================
function preload() {
  enemyData = loadJSON("data/enemies.json");
  obstacleData = loadJSON("data/obstacles.json");

  bgImg = loadImage("assets/images/background.png");
  heroImg = loadImage("assets/images/hero.png");
  enemyImg = loadImage("assets/images/enemy.png");

  gunSound = loadSound("assets/sounds/gun.mp3");
  hitSound = loadSound("assets/sounds/hit.mp3");
  music = loadSound("assets/sounds/background_music.mp3");
  winSound = loadSound("assets/sounds/win.mp3");
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(800, 450);
  bossData = enemyData.boss;

  for (let i = 0; i < obstacleData.obstacles.length; i++) {
    let o = obstacleData.obstacles[i];
    obstacles.push({ x: o.x, y: o.y, size: o.size });
  }

  camX = player.x - width / 2;
  camY = player.y - height / 2;
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(20);

  updateCamera();

  push();
  translate(-camX, -camY);

  drawBackground();
  drawBossZone();

  if (gameState === STATE_PLAY) {
    handleInput();
    applyBounce();
    updateBullets();
    updateEnemies();
    checkWaveSpawns();
    checkBossZone();
    checkBulletEnemyCollisions();
    checkEnemyPlayerCollision();
    checkObstaclePlayerCollision();
    updateInvincibility();

    drawObstacles();
    drawEnemies();
    drawBullets();
    drawPlayer();
  }

  else if (gameState === STATE_BOSS) {
    handleInput();
    applyBounce();
    updateBullets();
    updateBoss();
    checkBulletBossCollision();
    checkBossPlayerCollision();
    checkObstaclePlayerCollision();
    updateInvincibility();

    drawObstacles();
    drawBoss();
    drawBullets();
    drawPlayer();
  }

  pop();

  drawHUD();
  drawMinimap();

  if (gameState === STATE_BOSS) drawBossHUD();
  if (gameState === STATE_WIN) drawWinScreen();
  if (gameState === STATE_OVER) drawGameOver();
}

// ============================================================
// AUDIO STARTER
// Browser only allows audio after the player clicks/presses a key
// ============================================================
function startGameMusic() {
  if (!musicStarted) {
    userStartAudio();

    if (music && !music.isPlaying()) {
      music.loop();
    }

    musicStarted = true;
  }
}

// ============================================================
// CAMERA
// ============================================================
function updateCamera() {
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  targetX = constrain(targetX, 0, WORLD_W - width);
  targetY = constrain(targetY, 0, WORLD_H - height);

  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);
}

// ============================================================
// BACKGROUND IMAGE
// ============================================================
function drawBackground() {
  image(bgImg, 0, 0, WORLD_W, WORLD_H);

  noFill();
  stroke(60, 50, 80);
  strokeWeight(4);
  rect(0, 0, WORLD_W, WORLD_H);
  noStroke();
}

function drawBossZone() {
  noStroke();

  if (gameState === STATE_BOSS) {
    fill(255, 80, 80, 30);
  } else {
    fill(255, 150, 30, 20);
  }

  rect(0, 0, WORLD_W, BOSS_ZONE_Y);

  stroke(gameState === STATE_BOSS ? color(255, 80, 80, 100) : color(255, 150, 30, 60));
  strokeWeight(2);
  drawingContext.setLineDash([10, 8]);
  line(0, BOSS_ZONE_Y, WORLD_W, BOSS_ZONE_Y);
  drawingContext.setLineDash([]);
  noStroke();
}

// ============================================================
// INPUT
// ============================================================
function handleInput() {
  player.moving = false;
  startGameMusic();

  if (keyIsDown(87)) {
    player.y -= PLAYER_SPEED;
    player.direction = { x: 0, y: -1 };
    player.moving = true;
  }

  if (keyIsDown(83)) {
    player.y += PLAYER_SPEED;
    player.direction = { x: 0, y: 1 };
    player.moving = true;
  }

  if (keyIsDown(65)) {
    player.x -= PLAYER_SPEED;
    player.direction = { x: -1, y: 0 };
    player.moving = true;
  }

  if (keyIsDown(68)) {
    player.x += PLAYER_SPEED;
    player.direction = { x: 1, y: 0 };
    player.moving = true;
  }

  player.x = constrain(player.x, player.r, WORLD_W - player.r);
  player.y = constrain(player.y, player.r, WORLD_H - player.r);

  if (player.shootTimer > 0) player.shootTimer--;

  if (keyIsDown(32) && player.shootTimer === 0) {
    bullets.push({
      x: player.x + player.direction.x * (player.r + 4),
      y: player.y + player.direction.y * (player.r + 4),
      vx: player.direction.x * BULLET_SPEED,
      vy: player.direction.y * BULLET_SPEED,
    });

    player.shootTimer = SHOOT_COOLDOWN;

    if (gunSound) {
      gunSound.stop();
      gunSound.play();
    }
  }
}

// ============================================================
// SPRITE DRAWER
// ============================================================
function drawSpriteSheet(img, x, y, frameW, frameH, totalFrames, scaleAmount, offsetX, offsetY, direction, moving) {
  let col = 0;

  if (direction.y === 1) col = 0;
  if (direction.y === -1) col = 1;
  if (direction.x === 1) col = 2;
  if (direction.x === -1) col = 3;

  let row;

  if (moving) {
    row = floor(frameCount / 10) % totalFrames;
  } else {
    row = 0;
  }

  let sx = col * frameW;
  let sy = row * frameH;

  imageMode(CENTER);
  image(
    img,
    x + offsetX,
    y + offsetY,
    frameW * scaleAmount,
    frameH * scaleAmount,
    sx,
    sy,
    frameW,
    frameH
  );
  imageMode(CORNER);
}

// ============================================================
// PLAYER
// ============================================================
function drawPlayer() {
  if (player.invincible && floor(player.invincibleTimer / 6) % 2 === 0) return;

  drawSpriteSheet(
    heroImg,
    player.x,
    player.y,
    HERO_FRAME_W,
    HERO_FRAME_H,
    HERO_FRAMES,
    HERO_SCALE,
    HERO_OFFSET_X,
    HERO_OFFSET_Y,
    player.direction,
    player.moving
  );
}

// ============================================================
// ENEMIES
// ============================================================
function updateEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d = dist(e.x, e.y, player.x, player.y);

    if (d > 0) {
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    }
  }
}

function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];

    let enemyDirection = {
      x: player.x > e.x ? 1 : -1,
      y: abs(player.x - e.x) > abs(player.y - e.y) ? 0 : player.y > e.y ? 1 : -1
    };

    drawSpriteSheet(
      enemyImg,
      e.x,
      e.y,
      ENEMY_FRAME_W,
      ENEMY_FRAME_H,
      ENEMY_FRAMES,
      ENEMY_SCALE,
      ENEMY_OFFSET_X,
      ENEMY_OFFSET_Y,
      enemyDirection,
      true
    );
  }
}

// ============================================================
// BULLETS
// ============================================================
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;

    if (
      bullets[i].x < 0 ||
      bullets[i].x > WORLD_W ||
      bullets[i].y < 0 ||
      bullets[i].y > WORLD_H
    ) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  fill(255);
  noStroke();

  for (let i = 0; i < bullets.length; i++) {
    ellipse(bullets[i].x, bullets[i].y, 10);
  }
}

// ============================================================
// WAVES
// ============================================================
function checkWaveSpawns() {
  if (nextWave >= enemyData.waves.length) return;

  let wave = enemyData.waves[nextWave];

  if (player.y < wave.spawnAt) {
    for (let i = 0; i < wave.enemies.length; i++) {
      let data = wave.enemies[i];

      enemies.push({
        x: random(100, WORLD_W - 100),
        y: random(BOSS_ZONE_Y + 50, BOSS_ZONE_Y + 300),
        r: 20,
        speed: data.speed,
      });
    }

    nextWave++;
  }
}

// ============================================================
// BOSS
// ============================================================
function checkBossZone() {
  if (boss !== null) return;
  if (player.y > BOSS_ZONE_Y) return;

  spawnBoss();
}

function spawnBoss() {
  boss = {
    x: WORLD_W / 2,
    y: bossData.retreatY,
    r: bossData.r,
    health: bossData.health,
    maxHealth: bossData.health,
    state: "pausing",
    pauseTimer: bossData.chargePause,
    chargeSpeed: bossData.chargeSpeed,
    retreatSpeed: bossData.retreatSpeed,
    retreatY: bossData.retreatY,
    chargeVX: 0,
    chargeVY: 0,
  };

  enemies = [];
  gameState = STATE_BOSS;
}

function updateBoss() {
  if (!boss) return;

  if (boss.state === "pausing") {
    boss.pauseTimer--;

    if (boss.pauseTimer <= 0) {
      let dx = player.x - boss.x;
      let dy = player.y - boss.y;
      let d = dist(boss.x, boss.y, player.x, player.y);

      boss.chargeVX = (dx / d) * boss.chargeSpeed;
      boss.chargeVY = (dy / d) * boss.chargeSpeed;
      boss.state = "charging";
    }
  }

  else if (boss.state === "charging") {
    boss.x += boss.chargeVX;
    boss.y += boss.chargeVY;

    let pastPlayer = dist(boss.x, boss.y, player.x, player.y) > 200 && boss.y > player.y;
    let offWorld = boss.x < 0 || boss.x > WORLD_W || boss.y < 0 || boss.y > WORLD_H;

    if (pastPlayer || offWorld) {
      boss.state = "retreating";
    }
  }

  else if (boss.state === "retreating") {
    let targetX = WORLD_W / 2;
    let targetY = boss.retreatY;
    let dx = targetX - boss.x;
    let dy = targetY - boss.y;
    let d = dist(boss.x, boss.y, targetX, targetY);

    if (d < 8) {
      boss.x = targetX;
      boss.y = targetY;
      boss.state = "pausing";
      boss.pauseTimer = bossData.chargePause;
    } else {
      boss.x += (dx / d) * boss.retreatSpeed;
      boss.y += (dy / d) * boss.retreatSpeed;
    }
  }
}

function drawBoss() {
  if (!boss) return;

  let bossDirection = {
    x: player.x > boss.x ? 1 : -1,
    y: abs(player.x - boss.x) > abs(player.y - boss.y) ? 0 : player.y > boss.y ? 1 : -1
  };

  drawSpriteSheet(
    enemyImg,
    boss.x,
    boss.y,
    ENEMY_FRAME_W,
    ENEMY_FRAME_H,
    ENEMY_FRAMES,
    BOSS_SCALE,
    BOSS_OFFSET_X,
    BOSS_OFFSET_Y,
    bossDirection,
    true
  );
}

// ============================================================
// COLLISIONS
// ============================================================
function checkBulletEnemyCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      let d = dist(bullets[i].x, bullets[i].y, enemies[j].x, enemies[j].y);

      if (d < enemies[j].r + 6) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;
        break;
      }
    }
  }
}

function checkBulletBossCollision() {
  if (!boss) return;

  for (let i = bullets.length - 1; i >= 0; i--) {
    let d = dist(bullets[i].x, bullets[i].y, boss.x, boss.y);

    if (d < boss.r + 6) {
      bullets.splice(i, 1);
      boss.health--;

      if (boss.health <= 0) {
        gameState = STATE_WIN;

        if (music && music.isPlaying()) {
          music.stop();
        }

        if (!winSoundPlayed && winSound) {
          winSound.play();
          winSoundPlayed = true;
        }
      }

      break;
    }
  }
}

function checkEnemyPlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < enemies.length; i++) {
    let d = dist(player.x, player.y, enemies[i].x, enemies[i].y);

    if (d < player.r + enemies[i].r - 8) {
      damagePlayer();

      if (player.health <= 0) {
        gameState = STATE_OVER;
        if (music && music.isPlaying()) music.stop();
      }

      break;
    }
  }
}

function checkBossPlayerCollision() {
  if (!boss || player.invincible) return;

  let d = dist(player.x, player.y, boss.x, boss.y);

  if (d < player.r + boss.r - 10) {
    damagePlayer();

    if (player.health <= 0) {
      gameState = STATE_OVER;
      if (music && music.isPlaying()) music.stop();
    }
  }
}

function damagePlayer() {
  player.health--;
  player.invincible = true;
  player.invincibleTimer = INVINCIBLE_FRAMES;

  if (hitSound) {
    hitSound.stop();
    hitSound.play();
  }
}

// ============================================================
// OBSTACLES
// ============================================================
function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    if (
      o.x + o.size < camX ||
      o.x - o.size > camX + width ||
      o.y + o.size < camY ||
      o.y - o.size > camY + height
    ) continue;

    let x = o.x - o.size / 2;
    let y = o.y - o.size / 2;
    let s = o.size;

    push();

    noStroke();
    fill(255, 100, 0, 70);
    rect(x - 4, y - 4, s + 8, s + 8, 8);

    fill(180, 40, 0);
    rect(x, y, s, s, 4);

    fill(220, 80, 10);
    rect(x + s * 0.1, y + s * 0.1, s * 0.4, s * 0.35, 2);
    rect(x + s * 0.55, y + s * 0.5, s * 0.35, s * 0.3, 2);

    pop();
  }
}

function checkObstaclePlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    let closestX = constrain(player.x, o.x - o.size / 2, o.x + o.size / 2);
    let closestY = constrain(player.y, o.y - o.size / 2, o.y + o.size / 2);
    let d = dist(player.x, player.y, closestX, closestY);

    if (d < player.r) {
      damagePlayer();

      let dx = player.x - o.x;
      let dy = player.y - o.y;
      let len = dist(0, 0, dx, dy);

      if (len > 0) {
        player.bounceVX = (dx / len) * 8;
        player.bounceVY = (dy / len) * 8;
      }

      if (player.health <= 0) {
        gameState = STATE_OVER;
        if (music && music.isPlaying()) music.stop();
      }

      break;
    }
  }
}

function applyBounce() {
  if (abs(player.bounceVX) > 0.1 || abs(player.bounceVY) > 0.1) {
    player.x += player.bounceVX;
    player.y += player.bounceVY;

    player.bounceVX *= 0.75;
    player.bounceVY *= 0.75;

    player.x = constrain(player.x, player.r, WORLD_W - player.r);
    player.y = constrain(player.y, player.r, WORLD_H - player.r);
  }
}

function updateInvincibility() {
  if (player.invincible) {
    player.invincibleTimer--;

    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
}

// ============================================================
// HUD
// ============================================================
function drawHUD() {
  noStroke();

  fill(160);
  textSize(13);
  textAlign(LEFT);
  textFont("monospace");
  text("Move: WASD   Shoot: Spacebar   B: Boss fight", 16, 24);

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

  fill(60, 220, 120);
  rect(barX, barY, fillW, barH, 4);

  fill(200);
  textSize(11);
  textAlign(RIGHT);
  text("Health", width - 16, barY + barH + 12);

  if (gameState === STATE_PLAY && player.y < 600) {
    fill(255, 150, 30);
    textAlign(CENTER);
    textSize(14);
    text("Boss zone ahead — proceed carefully", width / 2, height - 20);
  }
}

function drawBossHUD() {
  if (!boss) return;

  let barW = 400;
  let barH = 18;
  let barX = (width - barW) / 2;
  let barY = 10;
  let fillW = map(boss.health, 0, boss.maxHealth, 0, barW);

  fill(40);
  rect(barX, barY, barW, barH, 4);

  fill(255, 150, 30);
  rect(barX, barY, fillW, barH, 4);

  fill(255);
  textSize(12);
  textAlign(CENTER);
  textFont("monospace");
  text("BOSS", width / 2, barY + barH + 14);
}

// ============================================================
// MINIMAP
// ============================================================
function drawMinimap() {
  let mapX = MAP_X;
  let mapY = height - MAP_H - MAP_Y_OFFSET;

  fill(0, 0, 0, 180);
  stroke(80, 60, 120);
  strokeWeight(1);
  rect(mapX, mapY, MAP_W, MAP_H, 4);
  noStroke();

  let zoneH = map(BOSS_ZONE_Y, 0, WORLD_H, 0, MAP_H);
  fill(255, 150, 30, 40);
  rect(mapX, mapY, MAP_W, zoneH, 4);

  function worldToMap(wx, wy) {
    return {
      x: mapX + map(wx, 0, WORLD_W, 0, MAP_W),
      y: mapY + map(wy, 0, WORLD_H, 0, MAP_H),
    };
  }

  fill(255, 150, 30);
  for (let i = 0; i < enemies.length; i++) {
    let p = worldToMap(enemies[i].x, enemies[i].y);
    ellipse(p.x, p.y, 5);
  }

  if (boss) {
    fill(255, 60, 60);
    let p = worldToMap(boss.x, boss.y);
    ellipse(p.x, p.y, 8);
  }

  fill(0, 200, 180);
  let pp = worldToMap(player.x, player.y);
  ellipse(pp.x, pp.y, 7);

  noFill();
  stroke(255, 255, 255, 60);
  strokeWeight(1);

  let vp = worldToMap(camX, camY);
  let vpW = map(width, 0, WORLD_W, 0, MAP_W);
  let vpH = map(height, 0, WORLD_H, 0, MAP_H);

  rect(vp.x, vp.y, vpW, vpH);
  noStroke();

  fill(120);
  textSize(9);
  textAlign(LEFT);
  textFont("monospace");
  text("MAP", mapX + 4, mapY + MAP_H - 4);
}

// ============================================================
// WIN / GAME OVER
// ============================================================
function drawWinScreen() {
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);
  textSize(52);
  text("Boss Defeated!", width / 2, height / 2 - 30);

  fill(180);
  textSize(18);
  text("Score: " + score, width / 2, height / 2 + 20);

  fill(120);
  textSize(14);
  text("Press R to play again", width / 2, height / 2 + 60);
}

function drawGameOver() {
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

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

// ============================================================
// KEY PRESSED
// ============================================================
function keyPressed() {
  startGameMusic();

  if (key === "b" || key === "B") {
    player.y = BOSS_ZONE_Y - 10;
    if (!boss) spawnBoss();
  }

  if ((key === "r" || key === "R") && gameState !== STATE_PLAY && gameState !== STATE_BOSS) {
    gameState = STATE_PLAY;
    score = 0;
    nextWave = 0;
    bullets = [];
    enemies = [];
    boss = null;
    winSoundPlayed = false;

    player.x = WORLD_W / 2;
    player.y = WORLD_H - 200;
    player.direction = { x: 0, y: -1 };
    player.shootTimer = 0;
    player.health = player.maxHealth;
    player.invincible = false;
    player.invincibleTimer = 0;
    player.bounceVX = 0;
    player.bounceVY = 0;

    camX = player.x - width / 2;
    camY = player.y - height / 2;

    if (music && !music.isPlaying()) {
      music.loop();
    }
  }
}

function mousePressed() {
  startGameMusic();
}