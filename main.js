const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startBtn = document.getElementById('start-btn');

const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const livesEl = document.getElementById('lives');
const highScoreEl = document.getElementById('high-score');

// Load high score from localStorage
function getHighScore() {
  const saved = localStorage.getItem('retroGameHighScore');
  return saved ? parseInt(saved, 10) : 0;
}

function saveHighScore(score) {
  localStorage.setItem('retroGameHighScore', score.toString());
}

const state = {
  running: false,
  gameOver: false,
  lastTime: 0,
  score: 0,
  wave: 1,
  highScore: getHighScore(),
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 90,
  w: 36,
  h: 28,
  speed: 320,
  cooldown: 0,
  lives: 3,
};

const inputs = {
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false,
};

const bullets = [];
const enemies = [];
const particles = [];
const stars = new Array(90).fill(0).map(() => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  speed: 40 + Math.random() * 90,
  size: 1 + Math.random() * 2,
}));

let spawnTimer = 0;
let spawnInterval = 1.35;

function resetGame() {
  state.running = false;
  state.gameOver = false;
  state.lastTime = performance.now();
  state.score = 0;
  state.wave = 1;
  state.highScore = getHighScore(); // Refresh high score from storage
  player.x = canvas.width / 2;
  player.y = canvas.height - 90;
  player.lives = 3;
  player.cooldown = 0;
  spawnTimer = 0;
  spawnInterval = 1.35;
  bullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  updateHud();
  showOverlay('Retro Star Defender', 'Move with Arrow Keys or WASD. Shoot with Space. Press Enter or click Start to play.');
}

function startGame() {
  state.running = true;
  state.gameOver = false;
  hideOverlay();
  state.lastTime = performance.now();
  requestAnimationFrame(loop);
}

function gameOver() {
  state.running = false;
  state.gameOver = true;
  const isNewHighScore = state.score > state.highScore;
  const message = isNewHighScore
    ? `New High Score: ${state.score}! 🎉\nPress Enter or click Start to try again.`
    : `Score: ${state.score}\nHigh Score: ${state.highScore}\nPress Enter or click Start to try again.`;
  showOverlay('Game Over', message);
}

function showOverlay(title, message) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function updateHud() {
  scoreEl.textContent = state.score;
  waveEl.textContent = state.wave;
  
  // Render hearts for lives
  const maxLives = 3;
  let heartsHTML = '';
  for (let i = 0; i < maxLives; i++) {
    if (i < player.lives) {
      heartsHTML += '<span class="heart">♥</span>';
    } else {
      heartsHTML += '<span class="heart empty">♡</span>';
    }
  }
  livesEl.innerHTML = heartsHTML;
  
  highScoreEl.textContent = state.highScore;
}

function loop(timestamp) {
  if (!state.running) return;
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  updateStars(dt);
  handleInput(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateParticles(dt);
  checkCollisions();
  maybeIncreaseWave();
  updateHud();
}

function handleInput(dt) {
  const dirX = (inputs.left ? -1 : 0) + (inputs.right ? 1 : 0);
  const dirY = (inputs.up ? -1 : 0) + (inputs.down ? 1 : 0);

  player.x += dirX * player.speed * dt;
  player.y += dirY * player.speed * dt;
  player.x = clamp(player.x, player.w / 2, canvas.width - player.w / 2);
  player.y = clamp(player.y, player.h / 2, canvas.height - player.h / 2);

  if (player.cooldown > 0) player.cooldown -= dt;
  if (inputs.shoot && player.cooldown <= 0) {
    spawnBullet();
    player.cooldown = 0.22;
  }
}

function spawnBullet() {
  bullets.push({
    x: player.x,
    y: player.y - player.h / 2,
    w: 6,
    h: 16,
    speed: 520,
    color: '#37d6ff',
  });
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i];
    b.y -= b.speed * dt;
    if (b.y + b.h < 0) bullets.splice(i, 1);
  }
}

function updateEnemies(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(0.55, spawnInterval - state.wave * 0.05);
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    e.y += e.speed * dt;
    e.x += Math.sin(performance.now() * 0.002 + e.phase) * 40 * dt;
    if (e.y - e.h > canvas.height + 20) {
      enemies.splice(i, 1);
    }
  }
}

function spawnEnemy() {
  const baseSpeed = 80 + state.wave * 8;
  const type = Math.random();
  const isLarge = type > 0.7;
  const w = isLarge ? 48 : 36;
  const h = isLarge ? 34 : 26;
  enemies.push({
    x: 60 + Math.random() * (canvas.width - 120),
    y: -h,
    w,
    h,
    speed: baseSpeed + Math.random() * 60,
    hp: isLarge ? 2 : 1,
    phase: Math.random() * Math.PI * 2,
    points: isLarge ? 25 : 10, // Larger enemies worth more points
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateStars(dt) {
  for (const s of stars) {
    s.y += s.speed * dt * (1 + state.wave * 0.04);
    if (s.y > canvas.height) {
      s.y = -2;
      s.x = Math.random() * canvas.width;
    }
  }
}

function checkCollisions() {
  // Bullet vs enemy
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j -= 1) {
      const b = bullets[j];
      if (rectsIntersect(e, b)) {
        bullets.splice(j, 1);
        e.hp -= 1;
        spawnHitParticles(e.x, e.y, '#ffea61');
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          state.score += e.points || 10;
          // Update high score if needed
          if (state.score > state.highScore) {
            state.highScore = state.score;
            saveHighScore(state.highScore);
          }
          spawnHitParticles(e.x, e.y, '#ff5b4d', 14);
        }
        break;
      }
    }
  }

  // Enemy vs player
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    if (rectsIntersect(enemies[i], player)) {
      spawnHitParticles(player.x, player.y, '#ff5b4d', 16);
      enemies.splice(i, 1);
      loseLife();
    }
  }
}

function loseLife() {
  if (player.lives <= 0) return;
  player.lives -= 1;
  updateHud();
  if (player.lives <= 0) {
    gameOver();
  } else {
    spawnHitParticles(player.x, player.y, '#ff5b4d', 18);
  }
}

function maybeIncreaseWave() {
  const newWave = 1 + Math.floor(state.score / 80);
  if (newWave !== state.wave) {
    state.wave = newWave;
    spawnInterval = Math.max(0.85, spawnInterval - 0.06);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawParticles();
}

function drawStars() {
  for (const s of stars) {
    ctx.fillStyle = '#94eaff';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(s.x, s.y, s.size, s.size);
    ctx.globalAlpha = 1;
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#37d6ff';
  ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
  ctx.fillStyle = '#0b0f1f';
  ctx.fillRect(-player.w / 2 + 6, -player.h / 2 + 6, player.w - 12, player.h - 12);
  ctx.fillStyle = '#37d6ff';
  ctx.fillRect(-4, -player.h / 2 - 10, 8, 12);
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = '#37d6ff';
  for (const b of bullets) {
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  }
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    
    // Toilet bowl (white/cream colored, rounded)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, e.h * 0.15, e.w / 2, e.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Toilet bowl outline
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Toilet lid (on top, slightly rounded)
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(0, -e.h / 2 + e.h * 0.1, e.w / 2 * 0.9, e.h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.stroke();
    
    // Face/Head (Skibidi style - head popping out)
    const headSize = Math.min(e.w * 0.4, e.h * 0.35);
    const headY = -e.h / 2 - headSize * 0.3;
    
    // Head base (flesh colored)
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(0, headY, headSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Head outline
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Eyes (two circular eyes)
    ctx.fillStyle = '#000000';
    const eyeSize = headSize * 0.15;
    ctx.beginPath();
    ctx.arc(-headSize * 0.25, headY - headSize * 0.1, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headSize * 0.25, headY - headSize * 0.1, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth (wide smile)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, headY + headSize * 0.15, headSize * 0.3, 0, Math.PI);
    ctx.stroke();
    
    // Toilet seat (inside the bowl, darker)
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.ellipse(0, e.h * 0.15, e.w / 2 * 0.7, e.h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(p.life / p.maxLife, 0);
    ctx.fillRect(p.x, p.y, 3, 3);
    ctx.globalAlpha = 1;
  }
}

function spawnHitParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6,
      maxLife: 0.6,
      color,
    });
  }
}

function rectsIntersect(a, b) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function handleKey(event, isDown) {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') inputs.left = isDown;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') inputs.right = isDown;
  if (event.code === 'ArrowUp' || event.code === 'KeyW') inputs.up = isDown;
  if (event.code === 'ArrowDown' || event.code === 'KeyS') inputs.down = isDown;
  if (event.code === 'Space') {
    inputs.shoot = isDown;
    event.preventDefault();
  }
  if (event.code === 'Enter' && isDown) {
    if (!state.running) startGame();
  }
}

document.addEventListener('keydown', (e) => handleKey(e, true));
document.addEventListener('keyup', (e) => handleKey(e, false));
startBtn.addEventListener('click', () => {
  if (!state.running) startGame();
});

// Start in idle mode with instructions.
resetGame();

