// Constants
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREASE_THRESHOLD = 5000;
const MAX_SPEED = 50;
const SPEED_DECREASE_AMOUNT = 2;
const BONUS_DURATION = 5000;
const SLOW_DURATION = 5000;
const OBSTACLE_COUNT = 5;

// Game settings
var gameSettings = {
    canvas: null,
    ctx: null,
    snake: [],
    food: {},
    specialFood: null,
    slowFood: null,
    obstacles: [],
    dx: 1,
    dy: 0,
    nextDx: 1,
    nextDy: 0,
    score: 0,
    gameLoop: null,
    gameActive: false,
    gameSpeed: INITIAL_SPEED,
    bonusActive: false,
    slowActive: false,
    totalScore: 0,
    speedLevel: 0,
    width: 0,
    height: 0 
};

// Colors
var COLORS = {
    snake: '#4CAF50',
    snakeHead: '#45a049',
    food: '#FF5722',
    obstacle: '#3F51B5',
    specialFood: '#FFD700',
    slowFood: '#9C27B0',
    background: 'black',
    text: 'white',
    grid: 'rgba(255, 255, 255, 0.1)'
};

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

function init() {
    gameSettings.canvas = document.getElementById('gameCanvas');
    gameSettings.ctx = gameSettings.canvas.getContext('2d');
    
    resizeCanvas();
    
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('keydown', changeDirection);
    document.getElementById('newGameBtn').addEventListener('click', startNewGame);
    
    loadTotalScore();
    drawStartScreen();
    initTouchEvents();

    // Expand the Telegram Mini App to its maximum allowed height
    tg.expand();

    // Notify Telegram that the Mini App is ready
    tg.ready();
}

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const maxSize = Math.min(container.clientWidth, container.clientHeight) - 20; // 20px for margins

    gameSettings.width = Math.floor(maxSize / GRID_SIZE) * GRID_SIZE;
    gameSettings.height = Math.floor(maxSize / GRID_SIZE) * GRID_SIZE;

    gameSettings.canvas.width = gameSettings.width;
    gameSettings.canvas.height = gameSettings.height;

    if (gameSettings.gameActive) {
        drawGameElements();
    } else {
        drawStartScreen();
    }
}

function startNewGame() {
    resetGameState();
    gameSettings.gameLoop = setInterval(update, gameSettings.gameSpeed);
}

function resetGameState() {
    gameSettings.snake = [{x: 10, y: 10}];
    generateFood();
    gameSettings.dx = 1;
    gameSettings.dy = 0;
    gameSettings.nextDx = 1;
    gameSettings.nextDy = 0;
    gameSettings.score = 0;
    gameSettings.gameActive = true;
    gameSettings.obstacles = generateObstacles();
    gameSettings.specialFood = null;
    gameSettings.slowFood = null;
    gameSettings.bonusActive = false;
    gameSettings.slowActive = false;
    gameSettings.gameSpeed = INITIAL_SPEED;
    gameSettings.speedLevel = 0;
    if (gameSettings.gameLoop) clearInterval(gameSettings.gameLoop);
}

function update() {
    if (!gameSettings.gameActive) return;
    clearCanvas();
    moveSnake();
    drawGameElements();
    checkCollision();
    updateScore();
    updateGameSpeed();
}

function drawGameElements() {
    drawGrid();
    drawObstacles();
    drawSnake();
    drawFood();
    if (gameSettings.specialFood) drawSpecialFood();
    if (gameSettings.slowFood) drawSlowFood();
}

function clearCanvas() {
    gameSettings.ctx.fillStyle = COLORS.background;
    gameSettings.ctx.fillRect(0, 0, gameSettings.canvas.width, gameSettings.canvas.height);
}

function drawGrid() {
    gameSettings.ctx.strokeStyle = COLORS.grid;
    gameSettings.ctx.lineWidth = 0.5;

    for (let x = 0; x <= gameSettings.width; x += GRID_SIZE) {
        gameSettings.ctx.beginPath();
        gameSettings.ctx.moveTo(x, 0);
        gameSettings.ctx.lineTo(x, gameSettings.height);
        gameSettings.ctx.stroke();
    }

    for (let y = 0; y <= gameSettings.height; y += GRID_SIZE) {
        gameSettings.ctx.beginPath();
        gameSettings.ctx.moveTo(0, y);
        gameSettings.ctx.lineTo(gameSettings.width, y);
        gameSettings.ctx.stroke();
    }
}

function drawSnake() {
    gameSettings.snake.forEach((segment, index) => {
        if (index === 0) {
            drawSnakeHead(segment);
        } else {
            drawSnakeSegment(segment);
        }
    });
}

function drawSnakeHead(segment) {
    const x = segment.x * GRID_SIZE + GRID_SIZE / 2;
    const y = segment.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2;

    gameSettings.ctx.fillStyle = COLORS.snakeHead;
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameSettings.ctx.fill();

    // Draw eyes
    const eyeRadius = GRID_SIZE / 10;
    const eyeOffset = GRID_SIZE / 4;
    gameSettings.ctx.fillStyle = 'white';
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x - eyeOffset, y - eyeOffset, eyeRadius, 0, Math.PI * 2);
    gameSettings.ctx.arc(x + eyeOffset, y - eyeOffset, eyeRadius, 0, Math.PI * 2);
    gameSettings.ctx.fill();

    gameSettings.ctx.fillStyle = 'black';
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x - eyeOffset, y - eyeOffset, eyeRadius / 2, 0, Math.PI * 2);
    gameSettings.ctx.arc(x + eyeOffset, y - eyeOffset, eyeRadius / 2, 0, Math.PI * 2);
    gameSettings.ctx.fill();
}

function drawSnakeSegment(segment) {
    const x = segment.x * GRID_SIZE + GRID_SIZE / 2;
    const y = segment.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 1;

    gameSettings.ctx.fillStyle = COLORS.snake;
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameSettings.ctx.fill();
}

function drawFood() {
    drawFoodItem(gameSettings.food);
}

function drawSpecialFood() {
    drawFoodItem(gameSettings.specialFood, true);
}

function drawSlowFood() {
    drawFoodItem(gameSettings.slowFood, false, true);
}

function drawFoodItem(foodItem, isSpecial = false, isSlow = false) {
    const x = foodItem.x * GRID_SIZE + GRID_SIZE / 2;
    const y = foodItem.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 2;

    gameSettings.ctx.fillStyle = isSpecial ? COLORS.specialFood : (isSlow ? COLORS.slowFood : COLORS.food);
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameSettings.ctx.fill();
}

function moveSnake() {
    gameSettings.dx = gameSettings.nextDx;
    gameSettings.dy = gameSettings.nextDy;

    const head = {
        x: (gameSettings.snake[0].x + gameSettings.dx + gameSettings.width / GRID_SIZE) % (gameSettings.width / GRID_SIZE),
        y: (gameSettings.snake[0].y + gameSettings.dy + gameSettings.height / GRID_SIZE) % (gameSettings.height / GRID_SIZE)
    };
    gameSettings.snake.unshift(head);

    if (checkFoodCollision(head, gameSettings.food)) {
        gameSettings.score += gameSettings.food.value;
        generateFood();
        playSound('eat');
    } else if (gameSettings.specialFood && checkFoodCollision(head, gameSettings.specialFood)) {
        gameSettings.score += 500;
        gameSettings.specialFood = null;
        activateBonus();
        playSound('special');
    } else if (gameSettings.slowFood && checkFoodCollision(head, gameSettings.slowFood)) {
        gameSettings.slowFood = null;
        activateSlow();
        playSound('slow');
    } else {
        gameSettings.snake.pop();
    }
}

function checkFoodCollision(head, foodItem) {
    return head.x === foodItem.x && head.y === foodItem.y;
}

function changeDirection(event) {
    const KEY = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        A: 65,
        W: 87,
        D: 68,
        S: 83
    };
    
    const newDirection = {
        [KEY.LEFT]: {dx: -1, dy: 0},
        [KEY.UP]: {dx: 0, dy: -1},
        [KEY.RIGHT]: {dx: 1, dy: 0},
        [KEY.DOWN]: {dx: 0, dy: 1},
        [KEY.A]: {dx: -1, dy: 0},
        [KEY.W]: {dx: 0, dy: -1},
        [KEY.D]: {dx: 1, dy: 0},
        [KEY.S]: {dx: 0, dy: 1}
    };
    
    const keyPressed = event.keyCode;
    if (newDirection[keyPressed]) {
        if (gameSettings.dx + newDirection[keyPressed].dx !== 0 || 
            gameSettings.dy + newDirection[keyPressed].dy !== 0) {
            gameSettings.nextDx = newDirection[keyPressed].dx;
            gameSettings.nextDy = newDirection[keyPressed].dy;
        }
    }
}

function generateFood() {
    do {
        gameSettings.food = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE)),
            value: Math.floor(Math.random() * 10) * 100 + 100
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.food));

    if (Math.random() < 0.1 && !gameSettings.specialFood) {
        generateSpecialFood();
    }
    if (Math.random() < 0.05 && !gameSettings.slowFood) {
        generateSlowFood();
    }
}

function generateSpecialFood() {
    do {
        gameSettings.specialFood = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.specialFood));
}

function generateSlowFood() {
    do {
        gameSettings.slowFood = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.slowFood));
}

function isFoodOnSnakeOrObstacle(food) {
    return gameSettings.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
           gameSettings.obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y);
}

function checkCollision() {
    const head = gameSettings.snake[0];
    if (gameSettings.bonusActive) return;
    
    if (gameSettings.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ||
        gameSettings.obstacles.some(obstacle => head.x === obstacle.x && head.y === obstacle.y)) {
        gameOver();
    }
}

function updateScore() {
    const totalScoreElement = document.getElementById('totalScore');
    const currentScoreElement = document.getElementById('currentScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = `Total Score: ${gameSettings.totalScore}`;
    }
    if (currentScoreElement) {
        currentScoreElement.textContent = `Current Score: ${gameSettings.score}`;
    }
}

function gameOver() {
    gameSettings.gameActive = false;
    clearInterval(gameSettings.gameLoop);
    playSound('gameover');
    
    gameSettings.totalScore += gameSettings.score;
    localStorage.setItem('snakeTotalScore', gameSettings.totalScore);
    
    const scoreText = `Score: ${gameSettings.score}`;
    const totalScoreText = `Total Score: ${gameSettings.totalScore}`;
    
    gameSettings.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    gameSettings.ctx.fillRect(0, 0, gameSettings.canvas.width, gameSettings.canvas.height);
    
    gameSettings.ctx.fillStyle = 'black';
    gameSettings.ctx.font = 'bold 40px Arial';
    gameSettings.ctx.textAlign = 'center';
    gameSettings.ctx.fillText('Game Over!', gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 - 50);
    
    gameSettings.ctx.font = '30px Arial';
    gameSettings.ctx.fillText(scoreText, gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 + 10);
    gameSettings.ctx.fillText(totalScoreText, gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 + 50);
    
    updateScore();

    // Send the score to the bot
    tg.sendData(JSON.stringify({action: 'gameOver', score: gameSettings.score, totalScore: gameSettings.totalScore}));
}

function updateGameSpeed() {
    var newSpeedLevel = Math.floor(gameSettings.score / SPEED_INCREASE_THRESHOLD);
    if (newSpeedLevel > gameSettings.speedLevel) {
        gameSettings.speedLevel = newSpeedLevel;
        gameSettings.gameSpeed = Math.max(MAX_SPEED, INITIAL_SPEED - (gameSettings.speedLevel * SPEED_DECREASE_AMOUNT));
        clearInterval(gameSettings.gameLoop);
        gameSettings.gameLoop = setInterval(update, gameSettings.gameSpeed);
        console.log('Speed increased. New speed: ' + gameSettings.gameSpeed);
    }
}

function generateObstacles() {
    const newObstacles = [];
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
                y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
            };
        } while (isFoodOnSnakeOrObstacle(obstacle) || isObstacleNearSnake(obstacle));
        newObstacles.push(obstacle);
    }
    return newObstacles;
}

function isObstacleNearSnake(obstacle) {
    const head = gameSettings.snake[0];
    const distance = Math.abs(obstacle.x - head.x) + Math.abs(obstacle.y - head.y);
    return distance < 3; // Минимальное расстояние от головы змеи до препятствия
}

function drawObstacles() {
    gameSettings.ctx.fillStyle = COLORS.obstacle;
    gameSettings.obstacles.forEach(obstacle => {
        gameSettings.ctx.fillRect(obstacle.x * GRID_SIZE, obstacle.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });
}

function activateBonus() {
    gameSettings.bonusActive = true;
    setTimeout(() => {
        gameSettings.bonusActive = false;
    }, BONUS_DURATION);
}

function activateSlow() {
    gameSettings.slowActive = true;
    const currentSpeed = gameSettings.gameSpeed;
    gameSettings.gameSpeed = Math.min(200, gameSettings.gameSpeed * 1.5);
    clearInterval(gameSettings.gameLoop);
    gameSettings.gameLoop = setInterval(update, gameSettings.gameSpeed);
    setTimeout(() => {
        gameSettings.slowActive = false;
        gameSettings.gameSpeed = currentSpeed;
        clearInterval(gameSettings.gameLoop);
        gameSettings.gameLoop = setInterval(update, gameSettings.gameSpeed);
    }, SLOW_DURATION);
}

function loadTotalScore() {
    const savedScore = localStorage.getItem('snakeTotalScore');
    if (savedScore) {
        gameSettings.totalScore = parseInt(savedScore, 10);
    }
    updateScore();
}

function initTouchEvents() {
    let touchStartX, touchStartY;
    gameSettings.canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    gameSettings.canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;
        handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, false);
}

function handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) < minSwipeDistance) return;
        if (deltaX > 0 && gameSettings.dx !== -1) {
            gameSettings.nextDx = 1;
            gameSettings.nextDy = 0;
        } else if (deltaX < 0 && gameSettings.dx !== 1) {
            gameSettings.nextDx = -1;
            gameSettings.nextDy = 0;
        }
    } else {
        if (Math.abs(deltaY) < minSwipeDistance) return;
        if (deltaY > 0 && gameSettings.dy !== -1) {
            gameSettings.nextDx = 0;
            gameSettings.nextDy = 1;
        } else if (deltaY < 0 && gameSettings.dy !== 1) {
            gameSettings.nextDx = 0;
            gameSettings.nextDy = -1;
        }
    }
}

function drawStartScreen() {
    gameSettings.ctx.fillStyle = COLORS.background;
    gameSettings.ctx.fillRect(0, 0, gameSettings.canvas.width, gameSettings.canvas.height);
    gameSettings.ctx.fillStyle = COLORS.text;
    gameSettings.ctx.font = '30px Arial';
    gameSettings.ctx.textAlign = 'center';
    gameSettings.ctx.fillText('Snake Game', gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 - 30);
    gameSettings.ctx.font = '20px Arial';
    gameSettings.ctx.fillText('Press "New Game" to start', gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 + 20);
}

function playSound(soundType) {
    // TODO: Implement sound playback
    console.log(`Playing sound: ${soundType}`);
}

window.onload = init;
