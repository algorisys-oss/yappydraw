/** Starter game scripts for the Game Script editor. */

export interface GameTemplate { id: string; name: string; script: string }

const PONG = `// PONG — move the paddle with ◀ ▶ keys, or just drag anywhere. Esc stops.
const W = game.width, H = game.height, X = game.x, Y = game.y;
let score = 0;

// find-or-spawn: reuse a sprite you already drew (named Paddle/Ball), else make one.
const paddle = game.find('Paddle') || game.spawn('rectangle', X + W/2 - 90, Y + H - 60, 180, 24,
    { backgroundColor: '#111827', borderRadius: 12, tag: 'Paddle' });
const ball = game.find('Ball') || game.spawn('circle', X + W/2 - 16, Y + H/2, 32, 32,
    { backgroundColor: '#dc2626', tag: 'Ball' });

let vx = 320, vy = -420;
game.hud('SCORE 0');

game.onTick((dt) => {
    // Paddle: held keys move it; touching/dragging anywhere overrides.
    if (game.key('left'))  paddle.moveBy(-560 * dt, 0);
    if (game.key('right')) paddle.moveBy( 560 * dt, 0);
    const p = game.pointer();
    if (p.down) paddle.centerAt(p.x, paddle.cy);
    paddle.moveTo(game.clamp(paddle.x, X, X + W - paddle.width), paddle.y);

    // Ball: bounce off walls and the paddle; speed up on every hit.
    ball.moveBy(vx * dt, vy * dt);
    if (ball.x <= X || ball.x + ball.width >= X + W) vx = -vx;
    if (ball.y <= Y) vy = Math.abs(vy);
    if (game.hit(ball, paddle) && vy > 0) {
        vy = -Math.abs(vy) * 1.04;
        vx *= 1.04;
        score++;
        game.hud('SCORE ' + score);
    }
    if (ball.y > Y + H) game.end('GAME OVER — ' + score);
});
`;

const CATCH = `// CATCH — slide the basket, catch the falling stars. 3 misses = game over.
const W = game.width, H = game.height, X = game.x, Y = game.y;
let score = 0, missed = 0;

const basket = game.find('Basket') || game.spawn('rectangle', X + W/2 - 70, Y + H - 70, 140, 36,
    { backgroundColor: '#92400e', borderRadius: 10, tag: 'Basket' });
const stars = [];
game.hud('CATCH 0');

game.onTick((dt, t) => {
    if (game.key('left'))  basket.moveBy(-520 * dt, 0);
    if (game.key('right')) basket.moveBy( 520 * dt, 0);
    const p = game.pointer();
    if (p.down) basket.centerAt(p.x, basket.cy);
    basket.moveTo(game.clamp(basket.x, X, X + W - basket.width), basket.y);

    // Rain stars, faster as time passes.
    if (Math.random() < dt * (1 + t / 15)) {
        stars.push(game.spawn('star', game.random(X, X + W - 44), Y - 44, 44, 44,
            { backgroundColor: '#f59e0b' }));
    }

    for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.moveBy(0, (220 + t * 8) * dt);
        if (game.hit(s, basket)) {
            s.destroy(); stars.splice(i, 1);
            score++; game.hud('CATCH ' + score);
        } else if (s.y > Y + H) {
            s.destroy(); stars.splice(i, 1);
            if (++missed >= 3) game.end('GAME OVER — ' + score);
        }
    }
});
`;

const BLANK = `// Your game! This code runs once when you press Play (like Flash's frame 1).
// The whole page is your stage. Drawn shapes are sprites: game.find('name')
// finds an element by id, tag, or its text.

const hero = game.spawn('circle', game.x + 100, game.y + 100, 60, 60,
    { backgroundColor: '#6366f1' });

game.onTick((dt) => {
    // Runs every frame. dt = seconds since the last frame.
    if (game.key('left'))  hero.moveBy(-300 * dt, 0);
    if (game.key('right')) hero.moveBy( 300 * dt, 0);
    if (game.key('up'))    hero.moveBy(0, -300 * dt);
    if (game.key('down'))  hero.moveBy(0,  300 * dt);
});

game.onKey('a', () => hero.color('#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')));
`;

// A tiny Angry-Birds — shapes only, custom projectile physics + a slingshot.
// Ported in spirit from the raylib "Slingshot" reference: drag the bird back,
// release to fire, knock the pigs off their perches by smashing the blocks.
const SLINGSHOT = `// SLINGSHOT — a tiny Angry Birds.
// Drag the bird back in the slingshot and release to fire. Pop every green pig.
// Space = next level / retry after a miss. Esc stops.
const W = game.width, H = game.height, X = game.x, Y = game.y;
const GROUND = Y + H - 56;
const GRAV = 1600, REST = 0.42, FRICT = 0.85, STOP = 24, DMG = 360, POWER = 10.5, MAXPULL = 145;
const AX = X + 150, AY = GROUND - 100;        // slingshot pouch anchor
const R = X + W - 40;                          // right-side reference

// —— scene: sky, grass, slingshot ——
game.spawn('rectangle', X, Y, W, H, { backgroundColor: '#bfe9ff' });
game.spawn('rectangle', X, GROUND, W, Y + H - GROUND, { backgroundColor: '#7cb342' });
game.spawn('rectangle', AX - 8, AY - 8, 16, GROUND - AY + 8, { backgroundColor: '#6d4c41', borderRadius: 5 });
game.spawn('circle', AX - 20, AY - 18, 14, 14, { backgroundColor: '#5d4037' });
game.spawn('circle', AX + 6, AY - 18, 14, 14, { backgroundColor: '#5d4037' });

// —— levels (pure data) ——
const LEVELS = [
  { birds: 3,
    pigs: [[R - 210, GROUND - 40], [R - 110, GROUND - 40]],
    blocks: [[R-232, GROUND-92, 26, 92], [R-84, GROUND-92, 26, 92], [R-232, GROUND-118, 174, 26]] },
  { birds: 4,
    pigs: [[R - 300, GROUND - 40], [R - 170, GROUND - 40], [R - 95, GROUND - 176]],
    blocks: [[R-322,GROUND-104,26,104],[R-140,GROUND-104,26,104],[R-322,GROUND-130,208,26],
             [R-120,GROUND-160,80,26],[R-118,GROUND-134,26,26]] },
];

let level = 0, bird = null, eye = null, beak = null;
let vx = 0, vy = 0, launched = false, aiming = false, flightT = 0;
let pigs = [], blocks = [], dots = [], birdsLeft = 0, cleared = false, over = false;
for (let i = 0; i < 11; i++) dots.push(game.spawn('circle', -60, -60, 8, 8, { backgroundColor: '#ffffff', opacity: 0 }));

const kill = (a) => { a.forEach(s => s && s.alive && s.destroy()); a.length = 0; };
const hud = () => game.hud('LVL ' + (level + 1) + '   BIRDS ' + birdsLeft + '   PIGS ' + pigs.length);

function loadLevel() {
  cleared = false; over = false;
  kill(pigs); kill(blocks);
  const L = LEVELS[level];
  birdsLeft = L.birds;
  L.blocks.forEach(a => blocks.push(game.spawn('rectangle', a[0], a[1], a[2], a[3],
    { backgroundColor: '#a1662f', strokeColor: '#7a4a1f', strokeWidth: 3, borderRadius: 3 })));
  L.pigs.forEach(a => pigs.push(game.spawn('circle', a[0], a[1], 40, 40,
    { backgroundColor: '#5bbf3a', strokeColor: '#3f8f28', strokeWidth: 3 })));
  loadBird(); hud();
}

function loadBird() {
  [bird, eye, beak].forEach(s => s && s.alive && s.destroy());
  bird = game.spawn('circle', AX - 22, AY - 22, 44, 44, { backgroundColor: '#e53935', strokeColor: '#b71c1c', strokeWidth: 3 });
  eye = game.spawn('circle', 0, 0, 10, 10, { backgroundColor: '#ffffff', strokeColor: '#333', strokeWidth: 2 });
  beak = game.spawn('triangle', 0, 0, 18, 13, { backgroundColor: '#fbc02d' });
  launched = false; aiming = false; vx = 0; vy = 0; flightT = 0;
  bird.centerAt(AX, AY); face();
}
const face = () => {
  if (eye && eye.alive) eye.centerAt(bird.cx + 9, bird.cy - 9);
  if (beak && beak.alive) beak.centerAt(bird.cx + 22, bird.cy + 2);
};

game.onPointerDown((px, py) => {
  if (launched || cleared || over) return;
  if (Math.abs(px - bird.cx) < 80 && Math.abs(py - bird.cy) < 80) aiming = true;
});
game.onKey('a', () => {
  if (cleared) { level = (level + 1) % LEVELS.length; loadLevel(); }
  else if (over) loadLevel();
});

loadLevel();

game.onTick((dt) => {
  const p = game.pointer();

  if (aiming) {
    let dx = p.x - AX, dy = p.y - AY;
    const d = Math.hypot(dx, dy) || 1;
    if (d > MAXPULL) { dx = dx / d * MAXPULL; dy = dy / d * MAXPULL; }
    bird.centerAt(AX + dx, AY + dy); face();
    let tvx = -dx * POWER, tvy = -dy * POWER, tx = bird.cx, ty = bird.cy; // preview parabola
    for (let i = 0; i < dots.length; i++) {
      tx += tvx * 0.035; ty += tvy * 0.035; tvy += GRAV * 0.035;
      dots[i].set({ x: tx - 4, y: ty - 4, opacity: 75 });
    }
    if (!p.down) { aiming = false; launched = true; vx = -dx * POWER; vy = -dy * POWER; dots.forEach(s => s.set({ opacity: 0 })); game.sound('powerup'); }
    return;
  }
  if (!launched) return;

  flightT += dt;
  vy += GRAV * dt;
  bird.moveBy(vx * dt, vy * dt); face();
  const speed = Math.hypot(vx, vy);

  let onGround = false;
  if (bird.y + bird.height >= GROUND) { onGround = true; bird.moveTo(bird.x, GROUND - bird.height); if (vy > 0) vy = -vy * REST; vx *= FRICT; if (Math.abs(vy) < STOP) vy = 0; }
  if (bird.x < X) { bird.moveTo(X, bird.y); vx = Math.abs(vx) * REST; }
  if (bird.y < Y) { bird.moveTo(bird.x, Y); vy = Math.abs(vy); }

  for (let i = pigs.length - 1; i >= 0; i--) {
    if (game.hit(bird, pigs[i])) { pigs[i].destroy(); pigs.splice(i, 1); game.score(1000); game.sound('explosion'); vx *= 0.7; vy *= 0.7; hud(); }
  }
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (!game.hit(bird, blocks[i])) continue;
    const b = blocks[i];
    if (speed > DMG) { b.destroy(); blocks.splice(i, 1); game.score(200); game.sound('hit'); vx *= 0.6; vy *= 0.6; }
    else {
      const ox = Math.min(bird.x + bird.width, b.x + b.width) - Math.max(bird.x, b.x);
      const oy = Math.min(bird.y + bird.height, b.y + b.height) - Math.max(bird.y, b.y);
      if (ox < oy) { bird.moveBy(bird.cx < b.x + b.width / 2 ? -ox : ox, 0); vx = -vx * REST; }
      else { bird.moveBy(0, bird.cy < b.y + b.height / 2 ? -oy : oy); vy = -vy * REST; }
    }
  }

  if (pigs.length === 0 && !cleared) { cleared = true; game.hud('LEVEL CLEAR!   Space = next'); game.sound('win'); return; }

  const settled = onGround && Math.abs(vx) < STOP && Math.abs(vy) < STOP && flightT > 0.4;
  const gone = bird.x > X + W + 60 || bird.y > Y + H + 140;
  if (settled || gone) {
    birdsLeft--;
    if (birdsLeft <= 0 && pigs.length > 0) { over = true; launched = false; game.hud('GAME OVER   Space = retry'); game.sound('lose'); }
    else if (pigs.length > 0) { loadBird(); hud(); }
  }
});
`;

// A tiny Flappy Bird — one button (Space / tap): flap to stay airborne, thread the
// scrolling pipe gaps. Hit a pipe or the ground and it's over; Space to retry.
const FLAPPY = `// FLAPPY — tap / Space to flap. Thread the pipes. Don't touch anything.
const W = game.width, H = game.height, X = game.x, Y = game.y;
const GROUND = Y + H - 46;
const GRAV = 2000, FLAP = 600, SPEED = 190, GAP = 210, PIPE_W = 84, SPAWN = 1.5, R = 24;

// —— scene ——
game.spawn('rectangle', X, Y, W, H, { backgroundColor: '#4ec0ca' });
game.spawn('rectangle', X, GROUND, W, Y + H - GROUND, { backgroundColor: '#ded895', strokeColor: '#c9c08a', strokeWidth: 3 });
const bird = game.spawn('circle', X + W * 0.28 - R, Y + H * 0.42 - R, R * 2, R * 2,
  { backgroundColor: '#ffdf00', strokeColor: '#e0a800', strokeWidth: 3 });
const eye = game.spawn('circle', 0, 0, 7, 7, { backgroundColor: '#222' });

let vy = 0, started = false, dead = false, score = 0, spawnT = 0, pipes = [];
const HOMEX = X + W * 0.28, HOMEY = Y + H * 0.42;
const msg = () => game.hud(dead ? 'GAME OVER — Space to retry' : (started ? '' : 'Tap / Space to flap'));
const face = () => eye.centerAt(bird.cx + 9, bird.cy - 8);

function reset() {
  pipes.forEach(p => { p.top.destroy(); p.bot.destroy(); }); pipes = [];
  bird.centerAt(HOMEX, HOMEY); face(); vy = 0; started = false; dead = false; spawnT = 0;
  if (score) game.score(-score); score = 0; msg();
}
function flap() {
  if (dead) { reset(); return; }
  started = true; vy = -FLAP; game.sound('blip');
}
function die() { dead = true; game.sound('lose'); msg(); }
function spawnPipe() {
  const gy = Y + 70 + Math.random() * ((GROUND - GAP - 70) - (Y + 70));
  const top = game.spawn('rectangle', X + W, Y, PIPE_W, gy - Y, { backgroundColor: '#5cb85c', strokeColor: '#3d8b3d', strokeWidth: 3 });
  const bot = game.spawn('rectangle', X + W, gy + GAP, PIPE_W, GROUND - (gy + GAP), { backgroundColor: '#5cb85c', strokeColor: '#3d8b3d', strokeWidth: 3 });
  pipes.push({ top, bot, passed: false });
}

game.onKey('a', flap);
game.onPointerDown(() => flap());
msg(); face();

game.onTick((dt) => {
  if (!started || dead) return;
  vy += GRAV * dt; bird.moveBy(0, vy * dt); face();
  if (bird.y < Y) { bird.moveTo(bird.x, Y); vy = 0; }
  if (bird.y + bird.height >= GROUND) { bird.moveTo(bird.x, GROUND - bird.height); die(); return; }

  spawnT += dt; if (spawnT >= SPAWN) { spawnT = 0; spawnPipe(); }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.top.moveBy(-SPEED * dt, 0); p.bot.moveBy(-SPEED * dt, 0);
    if (game.hit(bird, p.top) || game.hit(bird, p.bot)) { die(); return; }
    if (!p.passed && p.top.x + p.top.width < bird.x) { p.passed = true; score++; game.score(1); game.sound('coin'); }
    if (p.top.x + p.top.width < X - 10) { p.top.destroy(); p.bot.destroy(); pipes.splice(i, 1); }
  }
});
`;

export const GAME_TEMPLATES: GameTemplate[] = [
    { id: 'blank', name: 'Blank', script: BLANK },
    { id: 'pong', name: 'Pong', script: PONG },
    { id: 'catch', name: 'Catch the Stars', script: CATCH },
    { id: 'slingshot', name: 'Slingshot (Angry Birds)', script: SLINGSHOT },
    { id: 'flappy', name: 'Flappy', script: FLAPPY },
];
