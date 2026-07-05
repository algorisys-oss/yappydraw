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

export const GAME_TEMPLATES: GameTemplate[] = [
    { id: 'blank', name: 'Blank', script: BLANK },
    { id: 'pong', name: 'Pong', script: PONG },
    { id: 'catch', name: 'Catch the Stars', script: CATCH },
];
