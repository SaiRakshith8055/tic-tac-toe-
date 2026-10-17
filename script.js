/**
 * TIC-TAC-TOE CLIENT SCRIPT
 * Communicates with Java Spring Boot REST API when running on backend server,
 * with automatic seamless offline/static fallback for deployments like Vercel.
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

// Local State & Mode
let currentGameState = null;
let soundEnabled = true;
let isProcessing = false;
let notificationTimeout = null;
let useBackendApi = true;

// ==========================================================================
// Fallback In-Memory Engine (Ensures Game Works on Static Hosts like Vercel)
// ==========================================================================
const LocalGameEngine = {
    board: [["", "", ""], ["", "", ""], ["", "", ""]],
    currentPlayer: "X",
    status: "IN_PROGRESS",
    winner: null,
    scoreX: 0,
    scoreO: 0,
    draws: 0,
    winningLine: null,
    message: "Player X's Turn",

    getState() {
        return {
            board: this.board.map(r => [...r]),
            currentPlayer: this.currentPlayer,
            status: this.status,
            winner: this.winner,
            scoreX: this.scoreX,
            scoreO: this.scoreO,
            draws: this.draws,
            winningLine: this.winningLine ? this.winningLine.map(c => [...c]) : null,
            message: this.message
        };
    },

    makeMove(row, col) {
        if (row < 0 || row > 2 || col < 0 || col > 2) {
            throw new Error("Invalid move coordinates.");
        }
        if (this.status !== "IN_PROGRESS") {
            throw new Error("Game is over. Start a new round!");
        }
        if (this.board[row][col] !== "") {
            throw new Error(`Cell (${row}, ${col}) is already occupied.`);
        }

        this.board[row][col] = this.currentPlayer;

        // Check winning lines
        const win = this.checkWin(this.currentPlayer);
        if (win) {
            this.winningLine = win;
            this.winner = this.currentPlayer;
            if (this.currentPlayer === "X") {
                this.status = "X_WON";
                this.scoreX++;
            } else {
                this.status = "O_WON";
                this.scoreO++;
            }
            this.message = `Player ${this.winner} Wins!`;
            return this.getState();
        }

        // Check draw
        if (this.isFull()) {
            this.status = "DRAW";
            this.winner = null;
            this.winningLine = null;
            this.draws++;
            this.message = "It's a Draw!";
            return this.getState();
        }

        // Switch turn
        this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
        this.message = `Player ${this.currentPlayer}'s Turn`;
        return this.getState();
    },

    startNewRound() {
        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        this.currentPlayer = "X";
        this.status = "IN_PROGRESS";
        this.winner = null;
        this.winningLine = null;
        this.message = "Player X's Turn";
        return this.getState();
    },

    resetAll() {
        this.scoreX = 0;
        this.scoreO = 0;
        this.draws = 0;
        return this.startNewRound();
    },

    isFull() {
        return this.board.every(row => row.every(cell => cell !== ""));
    },

    checkWin(symbol) {
        // Rows
        for (let r = 0; r < 3; r++) {
            if (this.board[r][0] === symbol && this.board[r][1] === symbol && this.board[r][2] === symbol) {
                return [[r, 0], [r, 1], [r, 2]];
            }
        }
        // Cols
        for (let c = 0; c < 3; c++) {
            if (this.board[0][c] === symbol && this.board[1][c] === symbol && this.board[2][c] === symbol) {
                return [[0, c], [1, c], [2, c]];
            }
        }
        // Diagonals
        if (this.board[0][0] === symbol && this.board[1][1] === symbol && this.board[2][2] === symbol) {
            return [[0, 0], [1, 1], [2, 2]];
        }
        if (this.board[0][2] === symbol && this.board[1][1] === symbol && this.board[2][0] === symbol) {
            return [[0, 2], [1, 1], [2, 0]];
        }
        return null;
    }
};

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
            p.vy += 0.35;
            p.vx *= 0.98;
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
// REST API Communication Handlers with Automatic Fallback
// ==========================================================================

/**
 * Fetch current state of the game.
 */
async function fetchGameState() {
    try {
        const response = await fetch(API.STATE);
        if (response.ok) {
            useBackendApi = true;
            const state = await response.json();
            updateUI(state);
            return;
        }
    } catch (e) {
        // Backend not reachable, switch to fallback
    }

    useBackendApi = false;
    updateUI(LocalGameEngine.getState());
}

/**
 * Handle cell click.
 */
async function handleCellClick(event) {
    if (isProcessing) return;

    const cell = event.currentTarget;
    const row = parseInt(cell.getAttribute('data-row'), 10);
    const col = parseInt(cell.getAttribute('data-col'), 10);

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

    if (useBackendApi) {
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
                const errorMsg = data.message || `Move rejected (HTTP ${response.status})`;
                showNotification(errorMsg);
                AudioController.playError();
                return;
            }

            processMoveSuccess(data);
            return;
        } catch (error) {
            // If backend failed mid-game, switch seamlessly to local engine
            useBackendApi = false;
        } finally {
            isProcessing = false;
        }
    }

    // Local engine fallback (e.g. static hosting on Vercel)
    try {
        const data = LocalGameEngine.makeMove(row, col);
        processMoveSuccess(data);
    } catch (err) {
        showNotification(err.message);
        AudioController.playError();
    } finally {
        isProcessing = false;
    }
}

function processMoveSuccess(data) {
    const lastPlayer = currentGameState ? currentGameState.currentPlayer : 'X';
    AudioController.playMove(lastPlayer);
    updateUI(data);

    if (data.status === 'X_WON' || data.status === 'O_WON') {
        AudioController.playWin();
        Confetti.celebrate();
    } else if (data.status === 'DRAW') {
        AudioController.playDraw();
    }
}

/**
 * Start a new round while preserving session scores.
 */
async function startNewGame() {
    if (isProcessing) return;
    isProcessing = true;
    hideNotification();

    if (useBackendApi) {
        try {
            const response = await fetch(API.NEW_ROUND, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                const state = await response.json();
                updateUI(state);
                isProcessing = false;
                return;
            }
        } catch (e) {
            useBackendApi = false;
        }
    }

    updateUI(LocalGameEngine.startNewRound());
    isProcessing = false;
}

/**
 * Reset the entire game and wipe all scores back to zero.
 */
async function resetEntireGame() {
    if (isProcessing) return;
    isProcessing = true;
    hideNotification();

    if (useBackendApi) {
        try {
            const response = await fetch(`${API.RESET}?resetScores=true`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                const state = await response.json();
                updateUI(state);
                isProcessing = false;
                return;
            }
        } catch (e) {
            useBackendApi = false;
        }
    }

    updateUI(LocalGameEngine.resetAll());
    isProcessing = false;
}

// ==========================================================================
// UI Rendering Functions
// ==========================================================================

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

    if (state.status === 'X_WON' || state.status === 'O_WON') {
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

        cell.className = 'cell';
        cell.textContent = symbol || '';

        if (symbol === 'X') {
            cell.classList.add('cell-x');
        } else if (symbol === 'O') {
            cell.classList.add('cell-o');
        }

        if (winningSet.has(coordKey)) {
            cell.classList.add('cell-win');
        }

        if (state.status !== 'IN_PROGRESS' || symbol !== '') {
            cell.disabled = true;
        } else {
            cell.disabled = false;
        }
    });
}

function showNotification(msg) {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationText.textContent = msg;
    notificationBanner.classList.add('show');
    notificationTimeout = setTimeout(hideNotification, 3500);
}

function hideNotification() {
    notificationBanner.classList.remove('show');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    btnSoundToggle.title = soundEnabled ? 'Mute Sounds' : 'Unmute Sounds';
}

// ==========================================================================
// Event Listeners & Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    btnNewGame.addEventListener('click', startNewGame);
    btnResetGame.addEventListener('click', resetEntireGame);
    btnSoundToggle.addEventListener('click', toggleSound);

    fetchGameState();
});
