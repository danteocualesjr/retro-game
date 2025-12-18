// Get DOM elements - will be set when DOM is ready
let canvas, ctx, overlay, overlayTitle, overlayMessage, startBtn, soundToggleBtn, pauseToggleBtn;
let scoreEl, waveEl, levelEl, livesEl, highScoreEl, fireModeEl, shieldEl;

function initDOM() {
  console.log('initDOM called, document.readyState:', document.readyState);
  
  // Check if document.body exists (DOM must be ready)
  if (!document.body) {
    console.error('document.body not ready yet');
    return false;
  }
  
  canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element not found!');
    console.error('Available canvas elements:', document.querySelectorAll('canvas').length);
    console.error('Body children:', document.body.children.length);
    // Try querySelector as fallback
    canvas = document.querySelector('canvas#game');
    if (!canvas) {
      return false;
    }
  }
  console.log('Canvas found:', canvas, 'Width:', canvas.width, 'Height:', canvas.height);
  
  try {
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context!');
      return false;
    }
    console.log('Context created:', ctx);
  } catch (e) {
    console.error('Error getting context:', e);
    return false;
  }

  overlay = document.getElementById('overlay');
  overlayTitle = document.getElementById('overlay-title');
  overlayMessage = document.getElementById('overlay-message');
  startBtn = document.getElementById('start-btn');
  soundToggleBtn = document.getElementById('sound-toggle');
  pauseToggleBtn = document.getElementById('pause-toggle');

  scoreEl = document.getElementById('score');
  waveEl = document.getElementById('wave');
  levelEl = document.getElementById('level');
  livesEl = document.getElementById('lives');
  highScoreEl = document.getElementById('high-score');
  fireModeEl = document.getElementById('fire-mode');
  shieldEl = document.getElementById('shield');
  
  console.log('Elements found:', {
    overlay: !!overlay,
    overlayTitle: !!overlayTitle,
    overlayMessage: !!overlayMessage,
    startBtn: !!startBtn,
    soundToggleBtn: !!soundToggleBtn,
    scoreEl: !!scoreEl,
    waveEl: !!waveEl,
    levelEl: !!levelEl,
    livesEl: !!livesEl,
    highScoreEl: !!highScoreEl
  });
  
  // Only require canvas, overlay, and startBtn - others are optional for now
  if (!canvas || !ctx) {
    console.error('Required canvas/context not found!', {
      canvas: !!canvas,
      ctx: !!ctx
    });
    return false;
  }
  
  if (!overlay || !startBtn) {
    console.warn('Overlay or startBtn not found, but continuing...', {
      overlay: !!overlay,
      startBtn: !!startBtn
    });
    // Don't fail completely, just warn
  }
  
  console.log('DOM elements initialized successfully');
  return true;
}

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
  // Laser blaster sound (darker, more menacing)
  shoot() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth'; // More aggressive than sine
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.1);
  },

  // TIE Fighter explosion (deeper, more ominous)
  explosion() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const osc3 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'triangle';
    // Much lower frequencies for ominous feel
    osc1.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.4);
    osc2.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
    osc3.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc3.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.4);
    osc2.stop(audioCtx.currentTime + 0.4);
    osc3.stop(audioCtx.currentTime + 0.4);
  },

  // Enemy hit sound (darker)
  hit() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.08);
  },

  // Player hit sound (more menacing)
  playerHit() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    // Lower, more ominous frequencies
    osc1.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
    osc2.frequency.setValueAtTime(90, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);
    osc2.stop(audioCtx.currentTime + 0.3);
  },

  // Game over sound (deeply ominous)
  gameOver() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    // Very low, menacing frequencies
    osc1.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.8);
    osc2.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.8);
    osc2.stop(audioCtx.currentTime + 0.8);
  },

  // Boss defeat sound (ominous but with slight victory)
  bossDefeat() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const osc3 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'triangle';
    // Start low and ominous, rise slightly
    osc1.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.6);
    osc2.frequency.setValueAtTime(50, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.6);
    osc3.frequency.setValueAtTime(40, audioCtx.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc3.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.6);
    osc2.stop(audioCtx.currentTime + 0.6);
    osc3.stop(audioCtx.currentTime + 0.6);
  },

  // Boss shooting sound (deep, menacing)
  bossShoot() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    // Very low, menacing frequencies
    osc1.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);
    osc2.frequency.setValueAtTime(90, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.12);
    osc2.stop(audioCtx.currentTime + 0.12);
  },

  // Boss bomb deployment sound (ominous warning)
  bossBomb() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    // Deep, descending tone
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  },

  // Shield activate sound (energizing, protective)
  shieldActivate() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sine';
    osc2.type = 'triangle';
    // Rising, protective tone
    osc1.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3);
    osc2.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);
    osc2.stop(audioCtx.currentTime + 0.3);
  },

  // Shield deactivate sound (fading energy)
  shieldDeactivate() {
    if (!audioCtx || !soundEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    // Fading tone
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  },

  // Shield block sound (deflection)
  shieldBlock() {
    if (!audioCtx || !soundEnabled) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.type = 'sine';
    osc2.type = 'triangle';
    // Sharp, metallic deflection sound
    osc1.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
    osc2.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 0.1);
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

      osc.type = 'sawtooth'; // More ominous than square
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration * 0.8);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
      musicOscillators.push(osc);
    }, delay);
  };

  // Ominous, dark melody pattern (lower frequencies, minor key)
  const melody = [
    { freq: 196, dur: 0.4 }, // G (lower octave)
    { freq: 220, dur: 0.4 }, // A
    { freq: 247, dur: 0.4 }, // B
    { freq: 262, dur: 0.5 }, // C
    { freq: 247, dur: 0.4 }, // B
    { freq: 220, dur: 0.4 }, // A
    { freq: 196, dur: 0.6 }, // G
    { freq: 165, dur: 0.4 }, // E (lower, more ominous)
    { freq: 175, dur: 0.4 }, // F
    { freq: 196, dur: 0.5 }, // G
    { freq: 147, dur: 0.5 }, // D (even lower, adds tension)
    { freq: 165, dur: 0.4 }, // E
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
  paused: false,
  gameOver: false,
  lastTime: 0,
  score: 0,
  wave: 1,
  level: 1,
  highScore: getHighScore(),
  enemiesKilled: 0,
  bossSpawned: false,
  bodyguardsActive: false,
  
};

// Fire mode definitions
const fireModes = {
  normal: {
    name: 'Normal',
    cooldown: 0.22,
    damage: 1,
    bulletWidth: 6,
    bulletHeight: 16,
    bulletSpeed: 520,
    bulletColor: '#37d6ff',
    count: 1,
    spread: 0,
  },
  rapid: {
    name: 'Rapid',
    cooldown: 0.08,
    damage: 1,
    bulletWidth: 5,
    bulletHeight: 14,
    bulletSpeed: 580,
    bulletColor: '#90e0ff',
    count: 1,
    spread: 0,
  },
  wide: {
    name: 'Wide',
    cooldown: 0.25,
    damage: 1,
    bulletWidth: 5,
    bulletHeight: 15,
    bulletSpeed: 500,
    bulletColor: '#2d9eff',
    count: 3,
    spread: 20, // degrees
  },
  wild: {
    name: 'Wild',
    cooldown: 0.18,
    damage: 1,
    bulletWidth: 4,
    bulletHeight: 12,
    bulletSpeed: 550,
    bulletColor: '#ff5b4d',
    count: 5,
    spread: 35, // degrees, random spread
  },
  powerful: {
    name: 'Powerful',
    cooldown: 0.35,
    damage: 3,
    bulletWidth: 10,
    bulletHeight: 24,
    bulletSpeed: 480,
    bulletColor: '#ffaa00',
    count: 1,
    spread: 0,
  },
  rapidWide: {
    name: 'Rapid Wide',
    cooldown: 0.12,
    damage: 1,
    bulletWidth: 5,
    bulletHeight: 14,
    bulletSpeed: 560,
    bulletColor: '#00ff88',
    count: 4,
    spread: 25, // degrees
  },
  overwhelming: {
    name: 'Overwhelming',
    cooldown: 0.45,
    damage: 12,
    bulletWidth: 16,
    bulletHeight: 32,
    bulletSpeed: 540,
    bulletColor: '#ff00ff',
    count: 7,
    spread: 40, // degrees, maximum coverage - no enemy can escape
  },
  homing: {
    name: 'Homing',
    cooldown: 0.06, // Super rapid fire
    damage: 1,
    bulletWidth: 6,
    bulletHeight: 14,
    bulletSpeed: 600,
    bulletColor: '#00ffff',
    count: 5,
    spread: 30, // Wide spread
    homing: true, // Bullets track enemies
  },
  wideHoming: {
    name: 'Wide Homing',
    cooldown: 0.08, // Rapid fire
    damage: 1,
    bulletWidth: 5,
    bulletHeight: 12,
    bulletSpeed: 580,
    bulletColor: '#00ffaa',
    count: 8, // More bullets
    spread: 50, // Much wider spread
    homing: true, // Bullets track enemies
  },
};

const player = {
  x: 450, // Will be updated when canvas is ready
  y: 510, // Will be updated when canvas is ready
  w: 36,
  h: 28,
  speed: 320,
  cooldown: 0,
  lives: 3,
  fireMode: 'normal', // Current fire mode
  shield: {
    active: false,
  },
};

const inputs = {

  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false,
  shield: false,
  
};

const bullets = [];
const enemyBullets = []; // Boss bullets
const bombs = []; // Boss bombs
const enemies = [];
const particles = [];
const stars = []; // Will be initialized when canvas is ready
const bodyguards = []; // Player's bodyguard spaceships
const bodyguardBullets = []; // Bullets fired by bodyguards
const asteroids = []; // Floating asteroids

let spawnTimer = 0;
let spawnInterval = 1.35;

function resetGame() {
  if (!canvas) {
    console.error('Cannot reset game: canvas not initialized');
    return;
  }

  state.running = false;
  state.paused = false;
  state.gameOver = false;
  state.lastTime = performance.now();
  state.score = 0;
  state.wave = 1;
  state.level = 1;
  state.enemiesKilled = 0;
  state.bossSpawned = false;
  state.bodyguardsActive = false;
  state.highScore = getHighScore(); // Refresh high score from storage
  player.x = canvas.width / 2;
  player.y = canvas.height - 90;
  player.lives = 3;
  player.cooldown = 0;
  player.fireMode = 'normal';
  player.shield.active = false;
  player.shield.shieldKeyPressed = false;
  spawnTimer = 0;
  spawnInterval = 1.35;
  bullets.length = 0;
  enemyBullets.length = 0;
  bombs.length = 0;
  enemies.length = 0;
  particles.length = 0;
  bodyguards.length = 0;
  bodyguardBullets.length = 0;
  asteroids.length = 0;
  
  // Initialize stars if not already done or if array is empty
  if (stars.length === 0 && canvas && canvas.width && canvas.height) {
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 40 + Math.random() * 90,
        size: 1 + Math.random() * 2,
      });
    }
    console.log('Stars initialized:', stars.length);
  }
  
  updateHud();
  showOverlay('Retro Star Defender', 'Move with Arrow Keys or WASD. Shoot with Space. Press Enter or click Start to play.');
}

function startGame() {
  try {
    console.log('startGame called, current state:', state);
    console.log('Canvas:', canvas, 'Context:', ctx);
    console.log('Document readyState:', document.readyState);
    
    // Ensure DOM is initialized - try to initialize if not already done
    if (!canvas || !ctx) {
      console.log('Canvas not initialized, attempting to initialize DOM...');
      console.log('Canvas element in DOM?', !!document.getElementById('game'));
      
      // Try to initialize
      const initSuccess = initDOM();
      console.log('initDOM result:', initSuccess);
      console.log('After initDOM - Canvas:', canvas, 'Context:', ctx);
      
      if (!initSuccess) {
        console.error('Failed to initialize DOM elements');
        console.error('Available canvas elements:', document.querySelectorAll('canvas').length);
        console.error('Game element:', document.getElementById('game'));
        alert('Game initialization failed. The canvas element may not be ready. Please refresh the page.');
        return;
      }
    }
    
    // Final check
    if (!canvas || !ctx) {
      console.error('Canvas or context still not initialized after initDOM()');
      console.error('Canvas element exists?', !!document.getElementById('game'));
      console.error('Canvas variable:', canvas);
      console.error('Context variable:', ctx);
      alert('Game not initialized. Please refresh the page.');
      return;
    }
    
    console.log('Canvas and context verified:', canvas, ctx);
    
    // Initialize stars if not already done
    if (stars.length === 0 && canvas && canvas.width && canvas.height) {
      console.log('Initializing stars...');
      for (let i = 0; i < 90; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 40 + Math.random() * 90,
          size: 1 + Math.random() * 2,
        });
      }
      console.log('Stars initialized:', stars.length);
    }
    
    // Initialize some asteroids
    if (asteroids.length === 0 && canvas && canvas.width && canvas.height) {
      console.log('Initializing asteroids...');
      for (let i = 0; i < 4; i++) {
        spawnAsteroid();
      }
      console.log('Asteroids initialized:', asteroids.length);
    }
    
    state.running = true;
    state.paused = false;
    state.gameOver = false;
    
    // Hide overlay immediately
    console.log('Hiding overlay...');
    hideOverlay();
    
    state.lastTime = performance.now();
    
    // Initialize audio and start music if sound is enabled
    if (soundEnabled) {
      try {
        initAudio();
        startBackgroundMusic();
      } catch (audioError) {
        console.warn('Audio initialization failed:', audioError);
        // Continue without audio
      }
    }
    
    // Start the game loop
    console.log('Starting game loop...');
    requestAnimationFrame(loop);
    console.log('Game loop started, state.running:', state.running);
    
    // Force a redraw to make sure game is visible
    draw();
  } catch (error) {
    console.error('Error in startGame:', error);
    console.error('Error stack:', error.stack);
    state.running = false;
    showOverlay('Error', 'Failed to start game: ' + error.message + '. Please refresh the page.');
  }
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
  if (overlay && overlayTitle && overlayMessage) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    overlay.classList.remove('hidden');
    console.log('Overlay shown:', title);
  } else {
    console.error('Overlay elements not found in showOverlay()', {overlay, overlayTitle, overlayMessage});
  }
}

function hideOverlay() {
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    overlay.style.visibility = 'hidden';
    overlay.style.pointerEvents = 'none';
    console.log('Overlay hidden, classes:', overlay.className);
  } else {
    console.error('Overlay element not found in hideOverlay()');
  }
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
  
  // Update fire mode display
  if (fireModeEl) {
    const mode = fireModes[player.fireMode] || fireModes.normal;
    fireModeEl.textContent = mode.name;
    fireModeEl.style.color = mode.bulletColor;
  }
  
  // Update shield display
  if (shieldEl) {
    const s = player.shield;
    if (s.active) {
      shieldEl.textContent = '🛡️ ON';
      shieldEl.style.color = '#37d6ff';
      shieldEl.style.textShadow = '0 0 8px rgba(55, 214, 255, 0.8)';
    } else {
      shieldEl.textContent = '🛡️ OFF';
      shieldEl.style.color = '#888';
      shieldEl.style.textShadow = 'none';
    }
  }
}

function loop(timestamp) {

  if (!state.running) return;
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  if (!state.paused) {
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
  
}

function update(dt) {
  updateStars(dt);
  handleInput(dt);
  updateBullets(dt);
  updateEnemyBullets(dt);
  updateBombs(dt);
  updateEnemies(dt);
  updateBodyguards(dt);
  updateBodyguardBullets(dt);
  updateParticles(dt);
  updateAsteroids(dt);
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

  const mode = fireModes[player.fireMode] || fireModes.normal;
  if (player.cooldown > 0) player.cooldown -= dt;
  if (inputs.shoot && player.cooldown <= 0) {
    spawnBullet();
    player.cooldown = mode.cooldown;
  }
  
  // Shield toggle management - permanent toggle
  const s = player.shield;
  
  // Toggle shield on/off when Shift is first pressed (not held)
  if (inputs.shield && !s.shieldKeyPressed) {
    s.active = !s.active;
    s.shieldKeyPressed = true;
    if (s.active) {
      sounds.shieldActivate();
    } else {
      sounds.shieldDeactivate();
    }
  }
  
  // Reset flag when Shift is released to allow toggling again
  if (!inputs.shield) {
    s.shieldKeyPressed = false;
  }
}

function spawnBullet() {
  const mode = fireModes[player.fireMode] || fireModes.normal;
  const baseAngle = -Math.PI / 2; // Straight up
  
  // For homing mode, find available enemies to target
  const availableEnemies = enemies.filter(e => !e.isBoss && e.y < canvas.height);
  
  // Spawn bullets based on fire mode
  for (let i = 0; i < mode.count; i++) {
    let angle = baseAngle;
    let targetEnemy = null;
    
    // Calculate spread for wide/wild modes
    if (mode.spread > 0) {
      if (mode.name === 'Wild') {
        // Random spread for wild mode
        const spreadRange = (mode.spread * Math.PI) / 180;
        angle = baseAngle + (Math.random() - 0.5) * spreadRange;
      } else {
        // Evenly distributed spread for wide mode
        const spreadStep = (mode.spread * Math.PI) / 180;
        const offset = (i - (mode.count - 1) / 2) * spreadStep / (mode.count - 1 || 1);
        angle = baseAngle + offset;
      }
    }
    
    // For homing bullets, assign targets
    if (mode.homing && availableEnemies.length > 0) {
      // Assign each bullet to a different enemy if possible
      const targetIndex = i % availableEnemies.length;
      targetEnemy = availableEnemies[targetIndex];
      
      // For wide homing, start with spread then home in
      // For regular homing, aim directly at target
      if (mode.name === 'Wide Homing') {
        // Keep the spread angle, bullets will home in via updateBullets
        // This creates a wide initial spread that then converges
      } else {
        // Regular homing: calculate initial angle toward target
        const dx = targetEnemy.x - player.x;
        const dy = targetEnemy.y - (player.y - player.h / 2);
        angle = Math.atan2(dy, dx);
      }
    }
    
    const bullet = {
      x: player.x,
      y: player.y - player.h / 2,
      w: mode.bulletWidth,
      h: mode.bulletHeight,
      speed: mode.bulletSpeed,
      color: mode.bulletColor,
      damage: mode.damage,
      vx: Math.cos(angle) * mode.bulletSpeed,
      vy: Math.sin(angle) * mode.bulletSpeed,
    };
    
    // Add homing properties if this is a homing bullet
    if (mode.homing && targetEnemy) {
      bullet.homing = true;
      bullet.target = targetEnemy;
      bullet.turnRate = 4.0; // How fast the bullet can turn (radians per second)
    }
    
    bullets.push(bullet);
  }
  
  sounds.shoot();
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const b = bullets[i];
    
    // Update homing bullets to track their targets
    if (b.homing && b.target) {
      // Check if target still exists and is valid
      const targetIndex = enemies.indexOf(b.target);
      if (targetIndex === -1 || b.target.hp <= 0) {
        // Target destroyed or removed, find a new target
        const availableEnemies = enemies.filter(e => !e.isBoss && e.y < canvas.height);
        if (availableEnemies.length > 0) {
          // Find closest enemy
          let closestEnemy = availableEnemies[0];
          let closestDist = Math.sqrt(
            Math.pow(b.x - closestEnemy.x, 2) + Math.pow(b.y - closestEnemy.y, 2)
          );
          for (const enemy of availableEnemies) {
            const dist = Math.sqrt(
              Math.pow(b.x - enemy.x, 2) + Math.pow(b.y - enemy.y, 2)
            );
            if (dist < closestDist) {
              closestDist = dist;
              closestEnemy = enemy;
            }
          }
          b.target = closestEnemy;
        } else {
          // No targets available, continue in current direction
          b.homing = false;
        }
      }
      
      // If we have a valid target, steer toward it
      if (b.target && b.homing) {
        const dx = b.target.x - b.x;
        const dy = b.target.y - b.y;
        const targetAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(b.vy, b.vx);
        
        // Calculate angle difference
        let angleDiff = targetAngle - currentAngle;
        
        // Normalize angle to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Turn toward target (limited by turn rate)
        const maxTurn = b.turnRate * dt;
        const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
        const newAngle = currentAngle + turnAmount;
        
        // Update velocity
        b.vx = Math.cos(newAngle) * b.speed;
        b.vy = Math.sin(newAngle) * b.speed;
      }
    }
    
    // Support both old style (straight up) and new style (with vx/vy)
    if (b.vx !== undefined && b.vy !== undefined) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    } else {
      b.y -= b.speed * dt;
    }
    // Remove if off screen
    if (b.y + b.h < 0 || b.x < -b.w || b.x > canvas.width + b.w || b.y > canvas.height + b.h) {
      bullets.splice(i, 1);
    }
  }
}

function updateEnemyBullets(dt) {
  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Remove if off screen
    if (b.y - b.h > canvas.height || b.x < -b.w || b.x > canvas.width + b.w) {
      enemyBullets.splice(i, 1);
    }
  }
}

function updateBombs(dt) {
  for (let i = bombs.length - 1; i >= 0; i -= 1) {
    const bomb = bombs[i];
    bomb.y += bomb.speed * dt;
    bomb.rotation += dt * 3; // Rotating bomb
    if (bomb.y - bomb.h > canvas.height) bombs.splice(i, 1);
  }
}

function spawnBossBullet(boss) {
  // Calculate direction to player
  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = 200 + state.level * 20;
  
  enemyBullets.push({
    x: boss.x,
    y: boss.y + boss.h / 2,
    w: 8,
    h: 12,
    speed: speed,
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
    color: '#ff5b4d',
  });
  
  sounds.bossShoot();
}

function spawnBossBomb(boss) {
  // Drop bomb straight down
  bombs.push({
    x: boss.x,
    y: boss.y + boss.h / 2,
    w: 16,
    h: 16,
    speed: 150 + state.level * 15,
    rotation: 0,
    color: '#ffaa00',
  });
  
  sounds.bossBomb();
}

function updateEnemies(dt) {
  // Spawn boss when enough enemies are killed for current level
  // Each level requires different number of enemies before boss appears
  const enemiesNeededForBoss = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60][state.level - 1] || 60;
  
  // Check if we should spawn boss (enough enemies killed AND no regular enemies left)
  const hasBoss = enemies.some(e => e.isBoss);
  const hasRegularEnemies = enemies.some(e => !e.isBoss);
  
  if (!state.bossSpawned && state.enemiesKilled >= enemiesNeededForBoss && !hasRegularEnemies && !hasBoss) {
    spawnBoss();
  }
  
  // Spawn regular enemies only if:
  // 1. Boss hasn't spawned yet, OR
  // 2. Boss is alive but we want some regular enemies too (only in later levels)
  if (!state.bossSpawned || (hasBoss && state.level >= 4 && enemies.length < 3)) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = Math.max(0.55, spawnInterval - state.wave * 0.05);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    
    // Boss moves differently - stays on screen and moves in a pattern
    if (e.isBoss) {
      // Initialize boss movement pattern if not set
      if (e.bossPattern === undefined) {
        e.bossPattern = {
          centerY: canvas.height * 0.3, // Stay in upper third of screen
          amplitudeX: canvas.width * 0.3, // Move side to side
          amplitudeY: canvas.height * 0.15, // Move up and down slightly
          phaseX: 0,
          phaseY: 0,
        };
      }
      
      // Update boss position with figure-8 like pattern
      e.bossPattern.phaseX += dt * 0.8; // Horizontal movement speed
      e.bossPattern.phaseY += dt * 0.5; // Vertical movement speed
      
      e.x = canvas.width / 2 + Math.sin(e.bossPattern.phaseX) * e.bossPattern.amplitudeX;
      e.y = e.bossPattern.centerY + Math.sin(e.bossPattern.phaseY) * e.bossPattern.amplitudeY;
      
      // Keep boss within screen bounds
      e.x = Math.max(e.w / 2, Math.min(canvas.width - e.w / 2, e.x));
      e.y = Math.max(e.h / 2, Math.min(canvas.height * 0.6, e.y));
      
      // Boss shooting logic
      if (e.shootCooldown !== undefined) {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          spawnBossBullet(e);
          e.shootCooldown = 1.5 - (state.level * 0.1); // Faster shooting at higher levels
        }
      }
      
      // Boss bomb deployment logic
      if (e.bombCooldown !== undefined) {
        e.bombCooldown -= dt;
        if (e.bombCooldown <= 0) {
          spawnBossBomb(e);
          e.bombCooldown = 3 - (state.level * 0.2); // More frequent bombs at higher levels
        }
      }
    } else {
      // Regular enemies move down
      e.y += e.speed * dt;
      e.x += Math.sin(performance.now() * 0.002 + e.phase) * 40 * dt;
      
      // Remove regular enemies when they go off screen
      if (e.y - e.h > canvas.height + 20) {
        enemies.splice(i, 1);
      }
    }
  }
}

// Enemy types: 0 = TIE Fighter, 1 = TIE Interceptor, 2 = TIE Bomber, 3 = TIE Advanced, 4 = TIE Defender, 5 = Boss
function spawnEnemy() {
  const baseSpeed = 80 + state.wave * 8 + (state.level - 1) * 10;
  const rand = Math.random();
  
  // Level-specific enemy composition
  let enemyType = 0;
  let typeChance = rand;
  
  switch (state.level) {
    case 1:
      // Level 1: Only TIE Fighters
      enemyType = 0;
      break;
    case 2:
      // Level 2: TIE Fighters (60%) + TIE Interceptors (40%)
      if (typeChance < 0.6) {
        enemyType = 0; // TIE Fighter
      } else {
        enemyType = 1; // TIE Interceptor
      }
      break;
    case 3:
      // Level 3: TIE Fighters (40%) + TIE Interceptors (30%) + TIE Bombers (30%)
      if (typeChance < 0.4) {
        enemyType = 0; // TIE Fighter
      } else if (typeChance < 0.7) {
        enemyType = 1; // TIE Interceptor
      } else {
        enemyType = 2; // TIE Bomber
      }
      break;
    case 4:
      // Level 4: Mix of all types + TIE Advanced
      if (typeChance < 0.3) {
        enemyType = 0; // TIE Fighter
      } else if (typeChance < 0.5) {
        enemyType = 1; // TIE Interceptor
      } else if (typeChance < 0.7) {
        enemyType = 2; // TIE Bomber
      } else {
        enemyType = 3; // TIE Advanced
      }
      break;
    case 5:
      // Level 5: Elite enemies - TIE Advanced and TIE Defender
      if (typeChance < 0.4) {
        enemyType = 3; // TIE Advanced
      } else if (typeChance < 0.7) {
        enemyType = 2; // TIE Bomber
      } else {
        enemyType = 4; // TIE Defender
      }
      break;
    case 6:
      // Level 6: Mostly TIE Advanced and TIE Defender
      if (typeChance < 0.3) {
        enemyType = 3; // TIE Advanced
      } else if (typeChance < 0.6) {
        enemyType = 4; // TIE Defender
      } else if (typeChance < 0.8) {
        enemyType = 2; // TIE Bomber
      } else {
        enemyType = 1; // TIE Interceptor
      }
      break;
    case 7:
      // Level 7: Heavy on TIE Defender
      if (typeChance < 0.5) {
        enemyType = 4; // TIE Defender
      } else if (typeChance < 0.75) {
        enemyType = 3; // TIE Advanced
      } else {
        enemyType = 2; // TIE Bomber
      }
      break;
    case 8:
      // Level 8: Elite mix - mostly TIE Defender
      if (typeChance < 0.6) {
        enemyType = 4; // TIE Defender
      } else if (typeChance < 0.85) {
        enemyType = 3; // TIE Advanced
      } else {
        enemyType = 2; // TIE Bomber
      }
      break;
    case 9:
      // Level 9: Almost all TIE Defender
      if (typeChance < 0.75) {
        enemyType = 4; // TIE Defender
      } else if (typeChance < 0.9) {
        enemyType = 3; // TIE Advanced
      } else {
        enemyType = 2; // TIE Bomber
      }
      break;
    case 10:
      // Level 10: Ultimate challenge - all TIE Defender
      enemyType = 4; // TIE Defender only
      break;
    default:
      // For levels beyond 10, use level 10 distribution
      enemyType = 4;
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
    case 3: // TIE Advanced (balanced elite)
      w = 40;
      h = 30;
      hp = 2;
      points = 25;
      speed = baseSpeed * 1.1 + Math.random() * 70;
      break;
    case 4: // TIE Defender (fast and tough)
      w = 44;
      h = 32;
      hp = 4;
      points = 50;
      speed = baseSpeed * 1.2 + Math.random() * 90;
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
    type: 5, // Boss type (separate from regular enemies)
    isBoss: true,
    shootCooldown: 0, // Cooldown for shooting
    bombCooldown: 0, // Cooldown for bombs
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

// Asteroid functions
function spawnAsteroid() {
  const size = 20 + Math.random() * 30; // Random size between 20-50
  const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
  let x, y;
  const speed = 30 + Math.random() * 50; // Random speed
  const angle = Math.random() * Math.PI * 2; // Random direction
  
  switch (side) {
    case 0: // Top
      x = Math.random() * canvas.width;
      y = -size;
      break;
    case 1: // Right
      x = canvas.width + size;
      y = Math.random() * canvas.height;
      break;
    case 2: // Bottom
      x = Math.random() * canvas.width;
      y = canvas.height + size;
      break;
    case 3: // Left
      x = -size;
      y = Math.random() * canvas.height;
      break;
  }
  
  asteroids.push({
    x,
    y,
    size,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 2, // Random rotation speed
    shape: generateAsteroidShape(size), // Generate random shape
  });
}

function generateAsteroidShape(size) {
  // Generate a random polygon shape for the asteroid
  const points = 6 + Math.floor(Math.random() * 4); // 6-9 points
  const shape = [];
  for (let i = 0; i < points; i++) {
    const angle = (Math.PI * 2 * i) / points;
    const radius = size * (0.7 + Math.random() * 0.3); // Vary radius for irregular shape
    shape.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return shape;
}

function updateAsteroids(dt) {
  // Spawn new asteroids occasionally
  if (Math.random() < 0.01 * dt) { // Spawn chance per second
    if (asteroids.length < 8) { // Max 8 asteroids at once
      spawnAsteroid();
    }
  }
  
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    
    // Update position
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.rotation += a.rotationSpeed * dt;
    
    // Wrap around screen edges
    if (a.x < -a.size * 2) a.x = canvas.width + a.size;
    if (a.x > canvas.width + a.size * 2) a.x = -a.size;
    if (a.y < -a.size * 2) a.y = canvas.height + a.size;
    if (a.y > canvas.height + a.size * 2) a.y = -a.size;
  }
}

function drawAsteroids() {
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);
    
    // Draw asteroid with rocky appearance
    ctx.fillStyle = '#555555';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    
    // Draw main shape
    ctx.beginPath();
    ctx.moveTo(a.shape[0].x, a.shape[0].y);
    for (let i = 1; i < a.shape.length; i++) {
      ctx.lineTo(a.shape[i].x, a.shape[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Add some detail lines for rocky texture
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    for (let i = 0; i < a.shape.length; i++) {
      const next = (i + 1) % a.shape.length;
      if (Math.random() > 0.7) { // Random detail lines
        ctx.beginPath();
        ctx.moveTo(a.shape[i].x * 0.5, a.shape[i].y * 0.5);
        ctx.lineTo(a.shape[next].x * 0.5, a.shape[next].y * 0.5);
        ctx.stroke();
      }
    }
    
    // Add some highlights
    ctx.fillStyle = '#777777';
    ctx.beginPath();
    ctx.arc(a.shape[0].x * 0.3, a.shape[0].y * 0.3, a.size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// Bodyguard functions
function spawnBodyguards() {
  if (state.bodyguardsActive || bodyguards.length > 0) {
    console.log('Bodyguards already active or exist, skipping spawn');
    return;
  }
  
  console.log('Spawning bodyguards at player position:', player.x, player.y);
  state.bodyguardsActive = true;
  
  // Create two bodyguards - positioned independently
  bodyguards.push({
    x: player.x - 100,
    y: player.y - 80,
    w: 28,
    h: 22,
    cooldown: 0,
    shootInterval: 0.15, // Rapid fire - shoot every 0.15 seconds
    patrolPhase: 0, // Start at different phases for variety
  });
  
  bodyguards.push({
    x: player.x + 100,
    y: player.y - 80,
    w: 28,
    h: 22,
    cooldown: 0,
    shootInterval: 0.3,
    patrolPhase: Math.PI, // Start at opposite phase
  });
  
  sounds.shieldActivate(); // Use shield sound for bodyguard spawn
}

function despawnBodyguards() {
  state.bodyguardsActive = false;
  bodyguards.length = 0;
  bodyguardBullets.length = 0;
  sounds.shieldDeactivate(); // Use shield sound for bodyguard despawn
}

function updateBodyguards(dt) {
  if (!state.bodyguardsActive) return;
  
  // Update bodyguard positions - move independently
  for (let i = 0; i < bodyguards.length; i++) {
    const bg = bodyguards[i];
    
    // Initialize movement properties if not set
    if (bg.vx === undefined) {
      bg.vx = (i === 0 ? -1 : 1) * 150; // Left bodyguard moves left, right moves right
      bg.vy = -80; // Move upward slightly
      bg.patrolPhase = Math.random() * Math.PI * 2; // Random starting phase
    }
    
    // Independent movement - patrol pattern around player area
    const centerX = player.x;
    const centerY = player.y - 100; // Stay above player
    const patrolRadius = 120;
    const patrolSpeed = 1.5;
    
    bg.patrolPhase += dt * patrolSpeed;
    
    // Circular patrol pattern around player area
    const offsetX = Math.cos(bg.patrolPhase) * patrolRadius;
    const offsetY = Math.sin(bg.patrolPhase) * patrolRadius * 0.6; // Flatten the ellipse
    
    const targetX = centerX + offsetX;
    const targetY = centerY + offsetY;
    
    // Smoothly move toward patrol position
    const dx = targetX - bg.x;
    const dy = targetY - bg.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      const speed = 300; // Movement speed
      bg.x += (dx / distance) * speed * dt;
      bg.y += (dy / distance) * speed * dt;
    }
    
    // Keep bodyguards on screen and in reasonable bounds
    bg.x = Math.max(bg.w / 2, Math.min(canvas.width - bg.w / 2, bg.x));
    bg.y = Math.max(bg.h / 2, Math.min(canvas.height - bg.h / 2, bg.y));
    
    // Bodyguard shooting logic - Wide rapid fire
    bg.cooldown -= dt;
    if (bg.cooldown <= 0) {
      // Find nearest enemy to shoot at
      let nearestEnemy = null;
      let nearestDist = Infinity;
      
      for (const enemy of enemies) {
        if (enemy.isBoss) continue; // Don't target bosses
        const dist = Math.sqrt(
          Math.pow(bg.x - enemy.x, 2) + Math.pow(bg.y - enemy.y, 2)
        );
        if (dist < nearestDist && enemy.y < canvas.height) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }
      
      if (nearestEnemy) {
        // Wide rapid fire - shoot 4 bullets in a spread pattern
        const dx = nearestEnemy.x - bg.x;
        const dy = nearestEnemy.y - bg.y;
        const baseAngle = Math.atan2(dy, dx);
        const spreadAngle = 20 * (Math.PI / 180); // 20 degree spread
        const bulletCount = 4;
        const speed = 500;
        
        for (let i = 0; i < bulletCount; i++) {
          // Calculate spread offset
          const offset = (i - (bulletCount - 1) / 2) * (spreadAngle / (bulletCount - 1));
          const angle = baseAngle + offset;
          
          bodyguardBullets.push({
            x: bg.x,
            y: bg.y - bg.h / 2,
            w: 4,
            h: 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#00ff88',
            damage: 1,
          });
        }
        
        sounds.shoot();
        bg.cooldown = bg.shootInterval;
      }
    }
  }
}

function updateBodyguardBullets(dt) {
  for (let i = bodyguardBullets.length - 1; i >= 0; i -= 1) {
    const b = bodyguardBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    
    // Remove if off screen
    if (b.y + b.h < 0 || b.x < -b.w || b.x > canvas.width + b.w || b.y > canvas.height + b.h) {
      bodyguardBullets.splice(i, 1);
    }
  }
}

function drawBodyguards() {
  for (const bg of bodyguards) {
    ctx.save();
    ctx.translate(bg.x, bg.y);
    
    // Draw smaller X-wing style bodyguard
    // Body
    ctx.fillStyle = '#88ff88';
    ctx.fillRect(-bg.w / 2, -bg.h / 2, bg.w, bg.h);
    
    // Cockpit
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(-bg.w / 2 + 3, -bg.h / 2 + 3, bg.w - 6, bg.h * 0.4);
    
    // Wings (smaller)
    const wingLength = bg.w * 0.5;
    const wingWidth = 3;
    ctx.fillStyle = '#88ff88';
    ctx.fillRect(-bg.w / 2 - wingLength, -bg.h / 2 - wingWidth, wingLength, wingWidth);
    ctx.fillRect(bg.w / 2, -bg.h / 2 - wingWidth, wingLength, wingWidth);
    ctx.fillRect(-bg.w / 2 - wingLength, bg.h / 2, wingLength, wingWidth);
    ctx.fillRect(bg.w / 2, bg.h / 2, wingLength, wingWidth);
    
    // Engine glow
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(-bg.w / 2 + 2, bg.h / 2, bg.w - 4, 4);
    
    ctx.restore();
  }
}

function drawBodyguardBullets() {
  for (const b of bodyguardBullets) {
    ctx.save();
    ctx.fillStyle = b.color || '#00ff88';
    ctx.shadowBlur = 6;
    ctx.shadowColor = b.color || '#00ff88';
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function checkCollisions() {
  // Bullet vs asteroid
  for (let i = asteroids.length - 1; i >= 0; i -= 1) {
    const a = asteroids[i];
    for (let j = bullets.length - 1; j >= 0; j -= 1) {
      const b = bullets[j];
      if (circleRectIntersect(a, b)) {
        bullets.splice(j, 1);
        spawnHitParticles(b.x, b.y, b.color || '#ffea61', 8);
        sounds.hit();
      }
    }
  }
  
  // Bullet vs enemy
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j -= 1) {
      const b = bullets[j];
      if (rectsIntersect(e, b)) {
        bullets.splice(j, 1);
        const damage = b.damage || 1;
        e.hp -= damage;
        spawnHitParticles(e.x, e.y, b.color || '#ffea61');
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
          
          // Play appropriate sound
          if (wasBoss) {
            sounds.bossDefeat();
            // Advance to next level after a short delay
            setTimeout(() => {
              if (state.running) advanceLevel();
            }, 1000);
          } else {
            sounds.explosion();
          }
        }
        break;
      }
    }
  }
  
  // Bodyguard bullets vs enemy
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    for (let j = bodyguardBullets.length - 1; j >= 0; j -= 1) {
      const b = bodyguardBullets[j];
      if (rectsIntersect(e, b)) {
        bodyguardBullets.splice(j, 1);
        const damage = b.damage || 1;
        e.hp -= damage;
        spawnHitParticles(e.x, e.y, b.color || '#00ff88');
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
          
          // Play appropriate sound
          if (wasBoss) {
            sounds.bossDefeat();
            setTimeout(() => {
              if (state.running) advanceLevel();
            }, 1000);
          } else {
            sounds.explosion();
          }
        }
        break;
      }
    }
  }

  // Enemy vs player
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    if (rectsIntersect(enemies[i], player)) {
      if (player.shield.active) {
        // Shield blocks the hit
        spawnHitParticles(player.x, player.y, '#37d6ff', 12);
        enemies.splice(i, 1);
        sounds.shieldBlock();
      } else {
        spawnHitParticles(player.x, player.y, '#ff5b4d', 16);
        enemies.splice(i, 1);
        loseLife();
      }
    }
  }
  
  // Enemy bullets vs player
  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = enemyBullets[i];
    if (rectsIntersect(b, player)) {
      if (player.shield.active) {
        // Shield blocks the bullet
        spawnHitParticles(b.x, b.y, '#37d6ff', 8);
        enemyBullets.splice(i, 1);
        sounds.shieldBlock();
      } else {
        enemyBullets.splice(i, 1);
        spawnHitParticles(player.x, player.y, '#ff5b4d', 12);
        sounds.playerHit();
        loseLife();
      }
    }
  }
  
  // Bombs vs player
  for (let i = bombs.length - 1; i >= 0; i -= 1) {
    const bomb = bombs[i];
    if (rectsIntersect(bomb, player)) {
      if (player.shield.active) {
        // Shield blocks the bomb
        spawnHitParticles(bomb.x, bomb.y, '#37d6ff', 15);
        bombs.splice(i, 1);
        sounds.shieldBlock();
      } else {
        bombs.splice(i, 1);
        spawnHitParticles(player.x, player.y, '#ffaa00', 20);
        sounds.explosion();
        loseLife();
      }
    }
  }
  
  // Asteroids vs player
  for (let i = asteroids.length - 1; i >= 0; i -= 1) {
    const a = asteroids[i];
    if (circleRectIntersect(a, player)) {
      if (player.shield.active) {
        // Shield blocks the asteroid
        spawnHitParticles(a.x, a.y, '#37d6ff', 12);
        // Bounce asteroid away
        const dx = a.x - player.x;
        const dy = a.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          a.vx += (dx / dist) * 100;
          a.vy += (dy / dist) * 100;
        }
        sounds.shieldBlock();
      } else {
        spawnHitParticles(player.x, player.y, '#888888', 16);
        sounds.playerHit();
        loseLife();
        // Bounce asteroid away
        const dx = a.x - player.x;
        const dy = a.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          a.vx += (dx / dist) * 150;
          a.vy += (dy / dist) * 150;
        }
      }
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
  if (state.level >= 10) {
    // Game complete!
    showOverlay('Victory!', `You've completed all 10 levels! Final Score: ${state.score}. Press Enter to play again.`);
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
  if (!ctx || !canvas) {
    console.error('Cannot draw: ctx or canvas not initialized');
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawAsteroids();
  drawPlayer();
  drawBodyguards();
  drawBullets();
  drawBodyguardBullets();
  drawEnemyBullets();
  drawBombs();
  drawEnemies();
  drawParticles();
  
  // Draw pause overlay if paused
  if (state.paused && state.running) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#37d6ff';
    ctx.font = '32px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#37d6ff';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
  }
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
  
  // Draw shield if active
  if (player.shield.active) {
    const shieldSize = Math.max(player.w, player.h) * 3.0; // Wider shield
    const shieldAlpha = 0.4 + (Math.sin(Date.now() / 100) * 0.2);
    
    // Outer shield glow
    ctx.strokeStyle = `rgba(55, 214, 255, ${shieldAlpha})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#37d6ff';
    ctx.beginPath();
    ctx.arc(0, 0, shieldSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner shield ring
    ctx.strokeStyle = `rgba(144, 224, 255, ${shieldAlpha * 0.7})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, shieldSize / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
  }
  
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
  for (const b of bullets) {
    ctx.save();
    ctx.fillStyle = b.color || '#37d6ff';
    // Add glow effect for different fire modes
    ctx.shadowBlur = 8;
    ctx.shadowColor = b.color || '#37d6ff';
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawEnemyBullets() {
  for (const b of enemyBullets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBombs() {
  for (const bomb of bombs) {
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    ctx.rotate(bomb.rotation);
    // Bomb body
    ctx.fillStyle = bomb.color;
    ctx.fillRect(-bomb.w / 2, -bomb.h / 2, bomb.w, bomb.h);
    // Bomb details
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(-bomb.w / 2 + 2, -bomb.h / 2 + 2, bomb.w - 4, bomb.h - 4);
    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = bomb.color;
    ctx.fillRect(-bomb.w / 2, -bomb.h / 2, bomb.w, bomb.h);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// Get level-based color scheme for enemies
function getLevelColors(level) {
  const colorSchemes = {
    1: { // Level 1 - Standard gray
      pod: '#333333',
      panel: '#222222',
      stroke: '#444444',
      accent: '#555555',
    },
    2: { // Level 2 - Slightly blue tint
      pod: '#334455',
      panel: '#223344',
      stroke: '#445566',
      accent: '#556677',
    },
    3: { // Level 3 - Purple tint
      pod: '#443355',
      panel: '#332244',
      stroke: '#554466',
      accent: '#665577',
    },
    4: { // Level 4 - Red/orange tint
      pod: '#553333',
      panel: '#442222',
      stroke: '#664444',
      accent: '#775555',
    },
    5: { // Level 5 - Dark with red accents
      pod: '#552222',
      panel: '#331111',
      stroke: '#773333',
      accent: '#994444',
    },
    6: { // Level 6 - Cyan/blue
      pod: '#225555',
      panel: '#113333',
      stroke: '#337777',
      accent: '#449999',
    },
    7: { // Level 7 - Green tint
      pod: '#335522',
      panel: '#223311',
      stroke: '#557733',
      accent: '#779944',
    },
    8: { // Level 8 - Yellow/gold
      pod: '#555522',
      panel: '#333311',
      stroke: '#777733',
      accent: '#999944',
    },
    9: { // Level 9 - Orange/red intense
      pod: '#772222',
      panel: '#551111',
      stroke: '#994444',
      accent: '#bb6666',
    },
    10: { // Level 10 - Final boss - Dark purple/red
      pod: '#661133',
      panel: '#440011',
      stroke: '#882244',
      accent: '#aa3366',
    },
  };
  
  // For levels beyond 10, cycle through colors or use level 10
  return colorSchemes[level] || colorSchemes[Math.min(level, 10)] || colorSchemes[10];
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    
    const enemyType = e.type || 0;
    const isBoss = e.isBoss || false;
    const level = state.level;
    
    if (isBoss) {
      // Boss: Large Star Destroyer-like ship
      drawBoss(e);
    } else {
      switch (enemyType) {
        case 0:
          drawTIEFighter(e, level);
          break;
        case 1:
          drawTIEInterceptor(e, level);
          break;
        case 2:
          drawTIEBomber(e, level);
          break;
        case 3:
          drawTIEAdvanced(e, level);
          break;
        case 4:
          drawTIEDefender(e, level);
          break;
        default:
          drawTIEFighter(e, level);
      }
    }
    
    ctx.restore();
  }
}

function drawTIEFighter(e, level = 1) {
  const colors = getLevelColors(level);
  
  // TIE Fighter central pod
  ctx.fillStyle = colors.pod;
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
  
  // Central pod window
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
  
  // Solar panel wings
  const panelWidth = e.w * 0.35;
  const panelHeight = e.h * 0.7;
  const panelOffset = e.w * 0.5;
  
  // Left panel
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  
  // Right panel
  ctx.fillRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  
  // Connecting struts
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.7, 0);
  ctx.lineTo(-panelOffset, 0);
  ctx.moveTo(radius * 0.7, 0);
  ctx.lineTo(panelOffset, 0);
  ctx.stroke();
}

function drawTIEInterceptor(e, level = 1) {
  const colors = getLevelColors(level);
  
  // Similar to TIE Fighter but with angled wings
  ctx.fillStyle = colors.pod;
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
  
  // Angled solar panels (diamond shape)
  const panelSize = e.w * 0.4;
  const panelOffset = e.w * 0.5;
  
  // Left panel (rotated)
  ctx.save();
  ctx.translate(-panelOffset - panelSize / 2, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-panelSize / 2, -panelSize / 2, panelSize, panelSize);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(-panelSize / 2, -panelSize / 2, panelSize, panelSize);
  ctx.restore();
  
  // Right panel (rotated)
  ctx.save();
  ctx.translate(panelOffset + panelSize / 2, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-panelSize / 2, -panelSize / 2, panelSize, panelSize);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(-panelSize / 2, -panelSize / 2, panelSize, panelSize);
  ctx.restore();
  
  // Struts
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.7, 0);
  ctx.lineTo(-panelOffset, 0);
  ctx.moveTo(radius * 0.7, 0);
  ctx.lineTo(panelOffset, 0);
  ctx.stroke();
}

function drawTIEBomber(e, level = 1) {
  const colors = getLevelColors(level);
  
  // Larger, bulkier TIE Bomber
  ctx.fillStyle = colors.panel;
  ctx.beginPath();
  const sides = 8;
  const radius = Math.min(e.w, e.h) * 0.45;
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
  
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  const innerRadius = radius * 0.5;
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
  
  // Larger solar panels
  const panelWidth = e.w * 0.4;
  const panelHeight = e.h * 0.8;
  const panelOffset = e.w * 0.55;
  
  // Left panel
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  
  // Right panel
  ctx.fillRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  
  // Thicker struts
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.8, 0);
  ctx.lineTo(-panelOffset, 0);
  ctx.moveTo(radius * 0.8, 0);
  ctx.lineTo(panelOffset, 0);
  ctx.stroke();
  
  // Bomber details (bomb launchers)
  ctx.fillStyle = '#ff5b4d';
  ctx.fillRect(-panelOffset - panelWidth + 4, panelHeight / 2 - 8, 6, 6);
  ctx.fillRect(panelOffset + panelWidth - 10, panelHeight / 2 - 8, 6, 6);
}

function drawTIEAdvanced(e, level = 1) {
  const colors = getLevelColors(level);
  
  // TIE Advanced - Elite version with solar panels and enhanced design
  ctx.fillStyle = colors.pod;
  ctx.beginPath();
  const sides = 8;
  const radius = Math.min(e.w, e.h) * 0.45;
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
  
  // Enhanced window with glow
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  const innerRadius = radius * 0.55;
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
  
  // Glowing center
  ctx.fillStyle = '#ff5b4d';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Solar panels with enhanced design
  const panelWidth = e.w * 0.38;
  const panelHeight = e.h * 0.75;
  const panelOffset = e.w * 0.52;
  
  // Left panel
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  
  // Right panel
  ctx.fillRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  
  // Panel grid pattern
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = -panelHeight / 2 + (panelHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(-panelOffset - panelWidth, y);
    ctx.lineTo(-panelOffset, y);
    ctx.moveTo(panelOffset, y);
    ctx.lineTo(panelOffset + panelWidth, y);
    ctx.stroke();
  }
  
  // Enhanced struts
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.75, 0);
  ctx.lineTo(-panelOffset, 0);
  ctx.moveTo(radius * 0.75, 0);
  ctx.lineTo(panelOffset, 0);
  ctx.stroke();
}

function drawTIEDefender(e, level = 1) {
  const colors = getLevelColors(level);
  
  // TIE Defender - Most advanced, with triple solar panels
  ctx.fillStyle = colors.pod;
  ctx.beginPath();
  const sides = 8;
  const radius = Math.min(e.w, e.h) * 0.5;
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
  
  // Advanced window
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
  
  // Pulsing center glow
  ctx.fillStyle = '#37d6ff';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Triple solar panel design (left, center, right)
  const panelWidth = e.w * 0.3;
  const panelHeight = e.h * 0.8;
  const panelOffset = e.w * 0.5;
  
  // Left panel
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  
  // Center panel (smaller, between struts)
  const centerPanelWidth = e.w * 0.2;
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-centerPanelWidth / 2, -panelHeight / 2, centerPanelWidth, panelHeight);
  ctx.strokeStyle = colors.stroke;
  ctx.strokeRect(-centerPanelWidth / 2, -panelHeight / 2, centerPanelWidth, panelHeight);
  
  // Right panel
  ctx.fillRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  
  // Enhanced grid pattern
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = -panelHeight / 2 + (panelHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(-panelOffset - panelWidth, y);
    ctx.lineTo(-centerPanelWidth / 2, y);
    ctx.moveTo(centerPanelWidth / 2, y);
    ctx.lineTo(panelOffset + panelWidth, y);
    ctx.stroke();
  }
  
  // Triple struts
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.8, 0);
  ctx.lineTo(-panelOffset, 0);
  ctx.moveTo(0, -radius * 0.3);
  ctx.lineTo(0, -panelHeight / 2);
  ctx.moveTo(radius * 0.8, 0);
  ctx.lineTo(panelOffset, 0);
  ctx.stroke();
}

function drawBoss(e) {
  const level = state.level;
  const colors = getLevelColors(level);
  
  // Giant TIE Fighter Boss - similar to regular TIE fighters but much bigger and more menacing
  const width = e.w;
  const height = e.h;
  
  // Central pod (much larger than regular TIE fighters)
  ctx.fillStyle = colors.pod;
  ctx.beginPath();
  const sides = 8;
  const radius = Math.min(width, height) * 0.5;
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
  
  // Central pod outline (thicker for boss)
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Central pod window (larger and more menacing)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  const innerRadius = radius * 0.55;
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
  
  // Glowing center (pulsing red/orange)
  const glowIntensity = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;
  ctx.fillStyle = `rgba(255, 91, 77, ${glowIntensity})`;
  ctx.globalAlpha = glowIntensity;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Massive solar panel wings (much larger than regular TIE fighters)
  const panelWidth = width * 0.45;
  const panelHeight = height * 0.9;
  const panelOffset = width * 0.55;
  
  // Left solar panel
  ctx.fillStyle = colors.panel;
  ctx.fillRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 4;
  ctx.strokeRect(-panelOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
  
  // Left panel grid pattern (more detailed for boss)
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const y = -panelHeight / 2 + (panelHeight / 7) * i;
    ctx.beginPath();
    ctx.moveTo(-panelOffset - panelWidth, y);
    ctx.lineTo(-panelOffset, y);
    ctx.stroke();
  }
  // Vertical lines
  for (let i = 1; i < 4; i++) {
    const x = -panelOffset - panelWidth + (panelWidth / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, -panelHeight / 2);
    ctx.lineTo(x, panelHeight / 2);
    ctx.stroke();
  }
  
  // Right solar panel
  ctx.fillStyle = colors.panel;
  ctx.fillRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 4;
  ctx.strokeRect(panelOffset, -panelHeight / 2, panelWidth, panelHeight);
  
  // Right panel grid pattern
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const y = -panelHeight / 2 + (panelHeight / 7) * i;
    ctx.beginPath();
    ctx.moveTo(panelOffset, y);
    ctx.lineTo(panelOffset + panelWidth, y);
    ctx.stroke();
  }
  // Vertical lines
  for (let i = 1; i < 4; i++) {
    const x = panelOffset + (panelWidth / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, -panelHeight / 2);
    ctx.lineTo(x, panelHeight / 2);
    ctx.stroke();
  }
  
  // Thick connecting struts (more prominent for boss)
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.8, 0);
  ctx.lineTo(-panelOffset, 0);
  ctx.moveTo(radius * 0.8, 0);
  ctx.lineTo(panelOffset, 0);
  ctx.stroke();
  
  // Boss weapon ports (visual indication of shooting capability)
  ctx.fillStyle = '#ff5b4d';
  ctx.globalAlpha = 0.8;
  // Left weapon port
  ctx.fillRect(-radius * 0.6, -radius * 0.3, 8, 8);
  // Right weapon port
  ctx.fillRect(radius * 0.6 - 8, -radius * 0.3, 8, 8);
  // Bottom bomb launcher
  ctx.fillRect(-6, radius * 0.4, 12, 6);
  ctx.globalAlpha = 1;
  
  // HP bar for boss
  if (e.maxHp) {
    const barWidth = width * 1.2;
    const barHeight = 8;
    const hpPercent = e.hp / e.maxHp;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(-barWidth / 2, -height / 2 - 30, barWidth, barHeight);
    
    // HP bar with gradient effect
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(-barWidth / 2, -height / 2 - 30, barWidth * hpPercent, barHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-barWidth / 2, -height / 2 - 30, barWidth, barHeight);
    
    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS HP: ${e.hp}/${e.maxHp}`, 0, -height / 2 - 45);
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

function circleRectIntersect(circle, rect) {
  // Check if circle (asteroid) intersects with rectangle (player/bullet)
  const closestX = Math.max(rect.x - rect.w / 2, Math.min(circle.x, rect.x + rect.w / 2));
  const closestY = Math.max(rect.y - rect.h / 2, Math.min(circle.y, rect.y + rect.h / 2));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx * dx + dy * dy) < (circle.size * circle.size);
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
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    inputs.shield = isDown;
    event.preventDefault();
  }
  if (event.code === 'Enter' && isDown) {
    if (!state.running) startGame();
  }
  if (event.code === 'KeyP' && isDown && state.running) {
    // Toggle pause with P key
    state.paused = !state.paused;
    if (pauseToggleBtn) {
      if (state.paused) {
        pauseToggleBtn.textContent = '▶️';
        pauseToggleBtn.title = 'Resume';
        stopBackgroundMusic();
      } else {
        pauseToggleBtn.textContent = '⏸️';
        pauseToggleBtn.title = 'Pause';
        if (soundEnabled) {
          startBackgroundMusic();
        }
      }
    }
    event.preventDefault();
  }
  
  // Fire mode switching (1-9 keys)
  if (isDown && state.running) {
    const modeKeys = {
      'Digit1': 'normal',
      'Digit2': 'rapid',
      'Digit3': 'wide',
      'Digit4': 'wild',
      'Digit5': 'powerful',
      'Digit6': 'rapidWide',
      'Digit7': 'overwhelming',
      'Digit8': 'homing',
      'Digit9': 'wideHoming',
    };
    if (modeKeys[event.code]) {
      player.fireMode = modeKeys[event.code];
      updateHud();
      event.preventDefault();
    }
  }
  
  // Toggle bodyguards with key 0 (Digit0)
  if (event.code === 'Digit0' && isDown) {
    if (!state.running) {
      console.log('Bodyguards: Game not running');
      return;
    }
    console.log('Bodyguards toggle pressed, current state:', state.bodyguardsActive);
    if (!state.bodyguardsActive) {
      console.log('Spawning bodyguards...');
      spawnBodyguards();
      console.log('Bodyguards spawned, count:', bodyguards.length);
    } else {
      console.log('Despawning bodyguards...');
      despawnBodyguards();
    }
    event.preventDefault();
  }
}

// Wait for DOM to be ready, then initialize
function initializeGame() {
  if (!initDOM()) {
    console.error('Failed to initialize DOM elements');
    return;
  }
  
  // Set up event listeners
  document.addEventListener('keydown', (e) => {
    handleKey(e, true);
    // Direct Enter key handler as backup
    if (e.code === 'Enter' && !state.running) {
      console.log('Enter key pressed, starting game...');
      e.preventDefault();
      startGame();
    }
  });
  document.addEventListener('keyup', (e) => handleKey(e, false));
  
  // Handle button click - multiple methods to ensure it works
  if (startBtn) {
    console.log('Setting up start button event listeners...');
    
    // Primary click handler
    const handleStartClick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Start button clicked! state.running:', state.running);
      
      if (!state.running) {
        console.log('Calling startGame()...');
        try {
          startGame();
          console.log('Game started successfully');
        } catch (error) {
          console.error('Error starting game:', error);
          alert('Error starting game: ' + error.message);
        }
      } else {
        console.log('Game already running, ignoring click');
      }
      return false;
    };
    
    // Add multiple event types to ensure it works
    startBtn.onclick = handleStartClick;
    startBtn.addEventListener('click', handleStartClick, false);
    startBtn.addEventListener('click', handleStartClick, true); // Capture phase too
    
    // Also handle mousedown as backup
    startBtn.addEventListener('mousedown', function(e) {
      if (!state.running) {
        e.preventDefault();
        startGame();
      }
    });
    
    // Make sure nested elements don't block clicks
    const btnText = startBtn.querySelector('.btn-text');
    const btnGlow = startBtn.querySelector('.btn-glow');
    [btnText, btnGlow].forEach(el => {
      if (el) {
        el.style.pointerEvents = 'none'; // Let clicks pass through to button
      }
    });
    
    console.log('Start button event listeners set up');
  } else {
    console.error('Start button not found!');
  }

  // Pause toggle functionality
  if (pauseToggleBtn) {
    pauseToggleBtn.addEventListener('click', () => {
      if (!state.running) return;
      
      state.paused = !state.paused;
      
      if (state.paused) {
        pauseToggleBtn.textContent = '▶️';
        pauseToggleBtn.title = 'Resume';
        stopBackgroundMusic();
      } else {
        pauseToggleBtn.textContent = '⏸️';
        pauseToggleBtn.title = 'Pause';
        if (soundEnabled) {
          startBackgroundMusic();
        }
      }
    });
  }
  
  // Sound toggle functionality
  if (soundToggleBtn) {
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
  }
  
  // Initialize the game
  resetGame();
}

// Initialize DOM immediately if possible, otherwise wait
function ensureInitialized() {
  if (!canvas || !ctx) {
    console.log('Ensuring DOM is initialized...');
    if (!initDOM()) {
      console.warn('initDOM failed, will retry on DOMContentLoaded');
      return false;
    }
    console.log('DOM initialized successfully');
    return true;
  }
  return true;
}

// Initialize DOM elements IMMEDIATELY when script loads (script is at end of body, so DOM should be ready)
// This ensures canvas/ctx are available even if button is clicked before initializeGame() runs
console.log('Script loading, document.readyState:', document.readyState);

// Try to initialize DOM immediately - don't wait
let domInitialized = false;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    domInitialized = initDOM();
    if (domInitialized) {
      console.log('DOM initialized successfully on DOMContentLoaded');
      initializeGame();
    } else {
      console.error('Failed to initialize DOM on DOMContentLoaded');
    }
  });
} else {
  // DOM already ready, initialize immediately
  console.log('DOM already ready, initializing immediately...');
  domInitialized = initDOM();
  if (domInitialized) {
    console.log('DOM initialized successfully immediately');
    initializeGame();
  } else {
    console.error('Failed to initialize DOM immediately, will retry...');
    setTimeout(() => {
      domInitialized = initDOM();
      if (domInitialized) {
        console.log('DOM initialized successfully on retry');
        initializeGame();
      } else {
        console.error('Failed to initialize DOM on retry');
      }
    }, 100);
  }
}

// Make startGame globally accessible immediately for inline onclick handler
window.startGame = startGame;

// Also expose a test function for debugging
window.testGame = function() {
  console.log('Testing game initialization...');
  console.log('Canvas:', canvas);
  console.log('Context:', ctx);
  console.log('Start button:', startBtn);
  console.log('State:', state);
  console.log('Player:', player);
  if (startBtn) {
    console.log('Button click test - calling startGame directly...');
    startGame();
  } else {
    console.error('Start button not found!');
  }
};

