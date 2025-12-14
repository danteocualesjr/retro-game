const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startBtn = document.getElementById('start-btn');
const soundToggleBtn = document.getElementById('sound-toggle');

const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const highScoreEl = document.getElementById('high-score');

// Audio Context and Sound System
let audioCtx = null;
let musicOscillators = [];
let musicPlaying = false;
let musicInterval = null;
let soundEnabled = true; // Sound toggle state

// Initialize audio context (requires user interaction)
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

const sounds = {
  // Laser blaster sound (X-wing shooting)
  shoot() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
  },

  // TIE Fighter explosion
  explosion() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    osc2.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);
    osc2.stop(audioCtx.currentTime + 0.3);
  },

  // Enemy hit sound
  hit() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
  },

  // Player hit sound
  playerHit() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  },

  // Game over sound
  gameOver() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.6);
  }
};

// Background music - Star Wars style retro theme
function startBackgroundMusic() {
  if (musicPlaying || !audioCtx || !soundEnabled) return;
  musicPlaying = true;
  
  const playNote = (freq, duration, delay = 0) => {
    setTimeout(() => {
      if (!musicPlaying || !state.running) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration * 0.8);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
      musicOscillators.push(osc);
    }, delay);
  };

  // Star Wars inspired melody pattern
  const melody = [
    { freq: 392, dur: 0.3 }, // G
    { freq: 440, dur: 0.3 }, // A
    { freq: 494, dur: 0.3 }, // B
    { freq: 523, dur: 0.4 }, // C
    { freq: 494, dur: 0.3 }, // B
    { freq: 440, dur: 0.3 }, // A
    { freq: 392, dur: 0.5 }, // G
    { freq: 330, dur: 0.3 }, // E
    { freq: 349, dur: 0.3 }, // F
    { freq: 392, dur: 0.4 }, // G
  ];

  let currentTime = 0;
  const playMelody = () => {
    if (!musicPlaying || !state.running) return;
    
    melody.forEach((note, i) => {
      playNote(note.freq, note.dur, currentTime + i * 350);
    });
    
    currentTime += melody.length * 350;
    musicInterval = setTimeout(playMelody, currentTime);
  };

  playMelody();
}

function stopBackgroundMusic() {
  musicPlaying = false;
  if (musicInterval) {
    clearTimeout(musicInterval);
    musicInterval = null;
  }
  musicOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {}
  });
  musicOscillators = [];
}

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
  level: 1,
  highScore: getHighScore(),
  enemiesKilled: 0,
  bossSpawned: false,
  
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
  state.level = 1;
  state.enemiesKilled = 0;
  state.bossSpawned = false;
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
  
  // Initialize audio and start music if sound is enabled
  if (soundEnabled) {
    initAudio();
    startBackgroundMusic();
  }
  
  requestAnimationFrame(loop);

}

function gameOver() {

  state.running = false;
  state.gameOver = true;
  stopBackgroundMusic();
  sounds.gameOver();
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
  levelEl.textContent = state.level;
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
  sounds.shoot();
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i];
    b.y -= b.speed * dt;
    if (b.y + b.h < 0) bullets.splice(i, 1);
  }
}

function updateEnemies(dt) {
  // Spawn boss when enough enemies are killed for current level
  const enemiesNeededForBoss = 15 + state.level * 5;
  if (!state.bossSpawned && state.enemiesKilled >= enemiesNeededForBoss && enemies.length === 0) {
    spawnBoss();
  }
  
  // Spawn regular enemies if boss not spawned or boss is alive
  const hasBoss = enemies.some(e => e.isBoss);
  if (!hasBoss || (hasBoss && enemies.length < 2)) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = Math.max(0.55, spawnInterval - state.wave * 0.05);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    
    // Boss moves differently (slower, more deliberate)
    if (e.isBoss) {
      e.y += e.speed * dt;
      e.x += Math.sin(performance.now() * 0.001 + e.phase) * 60 * dt;
    } else {
      e.y += e.speed * dt;
      e.x += Math.sin(performance.now() * 0.002 + e.phase) * 40 * dt;
    }
    
    if (e.y - e.h > canvas.height + 20) {
      enemies.splice(i, 1);
    }
  }
}

// Enemy types: 0 = TIE Fighter, 1 = TIE Interceptor, 2 = TIE Bomber, 3 = Boss
function spawnEnemy() {
  const baseSpeed = 80 + state.wave * 8 + (state.level - 1) * 10;
  const rand = Math.random();
  
  // Determine enemy type based on level and random chance
  let enemyType = 0; // Default: TIE Fighter
  if (rand < 0.5) {
    enemyType = 0; // TIE Fighter (50%)
  } else if (rand < 0.75 && state.level >= 2) {
    enemyType = 1; // TIE Interceptor (25% from level 2+)
  } else if (rand < 0.9 && state.level >= 3) {
    enemyType = 2; // TIE Bomber (15% from level 3+)
  }
  
  let w, h, hp, points, speed;
  
  switch (enemyType) {
    case 0: // TIE Fighter
      w = 36;
      h = 26;
      hp = 1;
      points = 10;
      speed = baseSpeed + Math.random() * 60;
      break;
    case 1: // TIE Interceptor (faster, more agile)
      w = 32;
      h = 24;
      hp = 1;
      points = 15;
      speed = baseSpeed * 1.3 + Math.random() * 80;
      break;
    case 2: // TIE Bomber (slower, more HP)
      w = 48;
      h = 34;
      hp = 3;
      points = 30;
      speed = baseSpeed * 0.7 + Math.random() * 40;
      break;
  }
  
  enemies.push({
    x: 60 + Math.random() * (canvas.width - 120),
    y: -h,
    w,
    h,
    speed,
    hp,
    phase: Math.random() * Math.PI * 2,
    points,
    type: enemyType,
    isBoss: false,
  });
}

function spawnBoss() {
  if (state.bossSpawned) return;
  state.bossSpawned = true;
  
  const bossSize = 80 + state.level * 10;
  const bossHp = 10 + state.level * 5;
  const bossPoints = 100 * state.level;
  
  enemies.push({
    x: canvas.width / 2,
    y: -bossSize,
    w: bossSize,
    h: bossSize * 0.8,
    speed: 60 + state.level * 5,
    hp: bossHp,
    maxHp: bossHp,
    phase: 0,
    points: bossPoints,
    type: 3, // Boss type
    isBoss: true,
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
          const wasBoss = e.isBoss;
          enemies.splice(i, 1);
          state.score += e.points || 10;
          state.enemiesKilled += 1;
          
          // Update high score if needed
          if (state.score > state.highScore) {
            state.highScore = state.score;
            saveHighScore(state.highScore);
          }
          
          spawnHitParticles(e.x, e.y, '#ff5b4d', wasBoss ? 30 : 14);
          sounds.explosion(); // Play explosion sound
          
          // If boss was defeated, advance to next level
          if (wasBoss) {
            advanceLevel();
          }
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

function advanceLevel() {
  if (state.level >= 5) {
    // Game complete!
    showOverlay('Victory!', `You've completed all 5 levels! Final Score: ${state.score}. Press Enter to play again.`);
    state.running = false;
    return;
  }
  
  state.level += 1;
  state.enemiesKilled = 0;
  state.bossSpawned = false;
  state.wave = 1;
  updateHud();
  
  // Show level transition message
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');
  overlayTitle.textContent = `Level ${state.level}!`;
  overlayMessage.textContent = `Prepare for battle! Boss incoming...`;
  overlay.classList.remove('hidden');
  
  setTimeout(() => {
    if (state.running) {
      overlay.classList.add('hidden');
    }
  }, 2000);
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

// Sound toggle functionality
soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  
  if (soundEnabled) {
    soundToggleBtn.textContent = '🔊';
    soundToggleBtn.classList.remove('muted');
    // Initialize audio if not already done
    if (!audioCtx && state.running) {
      initAudio();
      startBackgroundMusic();
    }
  } else {
    soundToggleBtn.textContent = '🔇';
    soundToggleBtn.classList.add('muted');
    stopBackgroundMusic();
  }
});

// Start in idle mode with instructions.
resetGame();

