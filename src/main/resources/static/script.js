/**
 * TIC-TAC-TOE CLIENT SCRIPT
 * Communicates with Java Spring Boot REST API.
 * The Java backend is the single source of truth for all game rules and states.
 */

// API Base Endpoints
const API = {
    STATE: '/api/game/state',
    START: '/api/game/start',
    MOVE: '/api/game/move',
    RESET: '/api/game/reset',
    NEW_ROUND: '/api/game/new-round'
};

// DOM Elements
const cells = document.querySelectorAll('.cell');
const statusMessage = document.getElementById('statusMessage');
const turnIndicator = document.getElementById('turnIndicator');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDrawsEl = document.getElementById('scoreDraws');
const cardPlayerX = document.getElementById('cardPlayerX');
const cardPlayerO = document.getElementById('cardPlayerO');
const btnNewGame = document.getElementById('btnNewGame');
const btnResetGame = document.getElementById('btnResetGame');
const btnSoundToggle = document.getElementById('btnSoundToggle');
const soundIcon = document.getElementById('soundIcon');
const notificationBanner = document.getElementById('notificationBanner');
const notificationText = document.getElementById('notificationText');
const confettiCanvas = document.getElementById('confettiCanvas');

// Local State Cached from Backend
let currentGameState = null;
let soundEnabled = true;
let isProcessing = false;
let notificationTimeout = null;

// ==========================================================================
// Web Audio Synthesizer (Zero External Dependencies)
// ==========================================================================
const AudioController = {
    ctx: null,

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
    },

    playTone(frequency, duration, type = 'sine') {
        if (!soundEnabled) return;
        try {
            this.init();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.debug('Audio error: ', e);
        }
    },

    playMove(symbol) {
        if (symbol === 'X') {
            this.playTone(520, 0.12, 'triangle');
        } else {
            this.playTone(400, 0.12, 'sine');
        }
    },

    playWin() {
        if (!soundEnabled) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => this.playTone(freq, 0.28, 'sine'), idx * 110);
        });
    },

    playDraw() {
        if (!soundEnabled) return;
        this.playTone(330, 0.18, 'sawtooth');
        setTimeout(() => this.playTone(260, 0.28, 'sawtooth'), 120);
    },

    playError() {
        if (!soundEnabled) return;
        this.playTone(180, 0.15, 'square');
    }
};

// ==========================================================================
// Confetti Animation System
// ==========================================================================
const Confetti = {
    canvas: confettiCanvas,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    celebrate() {
        this.init();
        if (!this.ctx) return;
        this.particles = [];
        const colors = ['#00f2fe', '#4facfe', '#ff0844', '#ffb199', '#7928ca', '#ff0080', '#fbbf24', '#10b981'];

        for (let i = 0; i < 90; i++) {
            this.particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 12,
                alpha: 1,
                decay: Math.random() * 0.015 + 0.008
            });
        }

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.render();
    },

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let activeCount = 0;
        this.particles.forEach(p => {
            if (p.alpha <= 0) return;
            activeCount++;

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35; // Gravity
            p.vx *= 0.98; // Friction
            p.rotation += p.rotationSpeed;
            p.alpha -= p.decay;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
            this.ctx.restore();
        });

        if (activeCount > 0) {
            this.animationId = requestAnimationFrame(() => this.render());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

// ==========================================================================
// REST API Communication Handlers
// ==========================================================================

/**
 * Fetch current state of the game from Java backend.
 */
async function fetchGameState() {
    try {
        const response = await fetch(API.STATE);
        if (!response.ok) {
            throw new Error(`Failed to load game state (HTTP ${response.status})`);
        }
        const state = await response.json();
        updateUI(state);
    } catch (error) {
        showNotification(error.message || 'Error connecting to Java backend.');
    }
}

/**
 * Make a move on the board by sending row and col to Java REST API.
 */
async function handleCellClick(event) {
    if (isProcessing) return;

    const cell = event.currentTarget;
    const row = parseInt(cell.getAttribute('data-row'), 10);
    const col = parseInt(cell.getAttribute('data-col'), 10);

    // Frontend pre-check: prevent clicking already filled cell or finished game
    if (cell.classList.contains('cell-x') || cell.classList.contains('cell-o')) {
        showNotification('This cell is already occupied!');
        AudioController.playError();
        return;
    }

    if (currentGameState && currentGameState.status !== 'IN_PROGRESS') {
        showNotification('Game is over! Click "New Game" to start a new round.');
        AudioController.playError();
        return;
    }

    isProcessing = true;
    hideNotification();

    try {
        const response = await fetch(API.MOVE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ row, col })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle HTTP 400 or 409 from Java GlobalExceptionHandler
            const errorMsg = data.message || `Move rejected (HTTP ${response.status})`;
            showNotification(errorMsg);
            AudioController.playError();
            return;
        }

        // Successfully updated from backend
        const lastPlayer = currentGameState ? currentGameState.currentPlayer : 'X';
        AudioController.playMove(lastPlayer);
        updateUI(data);

        // Sound & celebratory effects on state transitions
        if (data.status === 'X_WON' || data.status === 'O_WON') {
            AudioController.playWin();
            Confetti.celebrate();
        } else if (data.status === 'DRAW') {
            AudioController.playDraw();
        }
    } catch (error) {
        showNotification('Network error: Unable to reach Java backend server.');
        AudioController.playError();
    } finally {
        isProcessing = false;
    }
}

/**
 * Start a new round while preserving session scores.
 */
async function startNewGame() {
    if (isProcessing) return;
    isProcessing = true;
    hideNotification();

    try {
        const response = await fetch(API.NEW_ROUND, {
            method: 'POST',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`Failed to start new round (HTTP ${response.status})`);
        }
        const state = await response.json();
        updateUI(state);
    } catch (error) {
        showNotification(error.message || 'Error starting new game.');
    } finally {
        isProcessing = false;
    }
}

/**
 * Reset the entire game and wipe all scores back to zero.
 */
async function resetEntireGame() {
    if (isProcessing) return;
    isProcessing = true;
    hideNotification();

    try {
        const response = await fetch(`${API.RESET}?resetScores=true`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`Failed to reset game (HTTP ${response.status})`);
        }
        const state = await response.json();
        updateUI(state);
    } catch (error) {
        showNotification(error.message || 'Error resetting game.');
    } finally {
        isProcessing = false;
    }
}

// ==========================================================================
// UI Rendering Functions
// ==========================================================================

/**
 * Synchronizes the entire HTML DOM with the GameState returned from Java.
 * @param {Object} state GameState JSON object
 */
function updateUI(state) {
    currentGameState = state;

    // 1. Update Scoreboard
    scoreXEl.textContent = state.scoreX;
    scoreOEl.textContent = state.scoreO;
    scoreDrawsEl.textContent = state.draws;

    // 2. Active Turn Card Glow
    cardPlayerX.classList.remove('active-x');
    cardPlayerO.classList.remove('active-o');

    if (state.status === 'IN_PROGRESS') {
        if (state.currentPlayer === 'X') {
            cardPlayerX.classList.add('active-x');
        } else {
            cardPlayerO.classList.add('active-o');
        }
    }

    // 3. Status & Turn Message
    statusMessage.textContent = state.message;
    turnIndicator.className = 'turn-indicator';

    if (state.status === 'X_WON') {
        turnIndicator.classList.add('turn-win');
    } else if (state.status === 'O_WON') {
        turnIndicator.classList.add('turn-win');
    } else if (state.status === 'DRAW') {
        turnIndicator.classList.add('turn-draw');
    } else {
        turnIndicator.classList.add(state.currentPlayer === 'X' ? 'turn-x' : 'turn-o');
    }

    // 4. Update Board Cells
    const winningSet = new Set();
    if (state.winningLine && Array.isArray(state.winningLine)) {
        state.winningLine.forEach(coord => {
            winningSet.add(`${coord[0]}-${coord[1]}`);
        });
    }

    cells.forEach(cell => {
        const row = parseInt(cell.getAttribute('data-row'), 10);
        const col = parseInt(cell.getAttribute('data-col'), 10);
        const symbol = state.board[row][col];
        const coordKey = `${row}-${col}`;

        // Reset cell styling
        cell.className = 'cell';
        cell.textContent = symbol || '';

        if (symbol === 'X') {
            cell.classList.add('cell-x');
        } else if (symbol === 'O') {
            cell.classList.add('cell-o');
        }

        // Winning cell highlight
        if (winningSet.has(coordKey)) {
            cell.classList.add('cell-win');
        }

        // Disable button if game ended or occupied
        if (state.status !== 'IN_PROGRESS' || symbol !== '') {
            cell.disabled = true;
        } else {
            cell.disabled = false;
        }
    });
}

/**
 * Display error banner with automated fadeout.
 */
function showNotification(msg) {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationText.textContent = msg;
    notificationBanner.classList.add('show');
    notificationTimeout = setTimeout(hideNotification, 3500);
}

function hideNotification() {
    notificationBanner.classList.remove('show');
}

/**
 * Toggle sound effects.
 */
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    btnSoundToggle.title = soundEnabled ? 'Mute Sounds' : 'Unmute Sounds';
}

// ==========================================================================
// Event Listeners & Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Attach click listener to each cell
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Control buttons
    btnNewGame.addEventListener('click', startNewGame);
    btnResetGame.addEventListener('click', resetEntireGame);
    btnSoundToggle.addEventListener('click', toggleSound);

    // Initial load from backend
    fetchGameState();
});
