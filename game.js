// Initialize Game Settings
const gameSettings = {
    canvas: null,
    ctx: null,
    snake: [],
    food: {},
    leaderboard: [],
    specialFood: null,
    slowFood: null,
    freezeFood: null,
    shrinkFood: null,
    doublePointsFood: null,
    obstacles: [],
    dx: 1,
    dy: 0,
    nextDx: 1,
    nextDy: 0,
    score: 0,
    gameLoop: null,
    gameActive: false,
    gameSpeed: 150,
    bonusActive: false,
    slowActive: false,
    freezeActive: false,
    shrinkActive: false,
    doublePointsActive: false,
    totalScore: 0,
    speedLevel: 0,
    level: 1,
    width: 0,
    height: 0 
};

const COLORS = {
    snake: '#4CAF50',
    snakeHead: '#45a049',
    food: '#FF5722',
    obstacle: '#3F51B5',
    specialFood: '#FFD700',
    slowFood: '#9C27B0',
    freezeFood: '#00BCD4',
    shrinkFood: '#FFEB3B',
    doublePointsFood: '#E91E63',
    background: 'black',
    text: 'white',
    grid: 'rgba(255, 255, 255, 0.1)'
};

// Initialize the game
window.onload = () => {
    initGame(gameSettings, COLORS);
    window.addEventListener('resize', () => resizeCanvas(gameSettings));
    document.addEventListener('keydown', (event) => changeDirection(event, gameSettings));
    document.getElementById('newGameBtn').addEventListener('click', () => startNewGame(gameSettings));
    document.getElementById('snakeColor').addEventListener('input', (event) => {
        COLORS.snake = event.target.value;
        COLORS.snakeHead = event.target.value;
    });
    document.getElementById('bgColor').addEventListener('input', (event) => {
        COLORS.background = event.target.value;
    });

    // Fetch and display leaderboard
    fetchLeaderboard(gameSettings);
};

// Export gameSettings and COLORS for use in other modules
export { gameSettings, COLORS };