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
  
  // X-wing body (central fuselage)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
  
  // Cockpit window
  ctx.fillStyle = '#37d6ff';
  ctx.fillRect(-player.w / 2 + 4, -player.h / 2 + 4, player.w - 8, player.h * 0.4);
  
  // X-wing wings (top and bottom)
  const wingLength = player.w * 0.6;
  const wingWidth = 4;
  
  // Top left wing
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-player.w / 2 - wingLength, -player.h / 2 - wingWidth, wingLength, wingWidth);
  // Top right wing
  ctx.fillRect(player.w / 2, -player.h / 2 - wingWidth, wingLength, wingWidth);
  // Bottom left wing
  ctx.fillRect(-player.w / 2 - wingLength, player.h / 2, wingLength, wingWidth);
  // Bottom right wing
  ctx.fillRect(player.w / 2, player.h / 2, wingLength, wingWidth);
  
  // Wing details (red stripes)
  ctx.fillStyle = '#ff5b4d';
  ctx.fillRect(-player.w / 2 - wingLength * 0.7, -player.h / 2 - wingWidth, wingLength * 0.3, wingWidth);
  ctx.fillRect(player.w / 2 + wingLength * 0.4, -player.h / 2 - wingWidth, wingLength * 0.3, wingWidth);
  ctx.fillRect(-player.w / 2 - wingLength * 0.7, player.h / 2, wingLength * 0.3, wingWidth);
  ctx.fillRect(player.w / 2 + wingLength * 0.4, player.h / 2, wingLength * 0.3, wingWidth);
  
  // Engine glow
  ctx.fillStyle = '#37d6ff';
  ctx.fillRect(-player.w / 2 + 2, player.h / 2, player.w - 4, 6);
  
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
    
    // TIE Fighter central pod (hexagonal/octagonal shape)
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    const sides = 8;
    const radius = Math.min(e.w, e.h) * 0.4;
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    // Central pod window (dark)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    const innerRadius = radius * 0.6;
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides;
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    // TIE Fighter solar panel wings (left and right)
    const panelWidth = e.w * 0.35;
    const panelHeight = e.h * 0.7;
    const panelOffset = e.w * 0.5;
    
    // Left solar panel
    ctx.fillStyle = '#222222';
    ctx.fillRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
    
    // Left panel details (grid lines)
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const y = -panelHeight / 2 + (panelHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(-panelOffset - panelWidth, y);
      ctx.lineTo(-panelOffset, y);
      ctx.stroke();
    }
    
    // Right solar panel
    ctx.fillStyle = '#222222';
    ctx.fillRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
    
    // Right panel details (grid lines)
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const y = -panelHeight / 2 + (panelHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(panelOffset, y);
      ctx.lineTo(panelOffset + panelWidth, y);
      ctx.stroke();
    }
    
    // Connecting struts
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, 0);
    ctx.lineTo(-panelOffset, 0);
    ctx.moveTo(radius * 0.7, 0);
    ctx.lineTo(panelOffset, 0);
    ctx.stroke();
    
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

