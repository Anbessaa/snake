// Constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREASE_THRESHOLD = 5000;
const MAX_SPEED = 50;
const SPEED_DECREASE_AMOUNT = 2;
const BONUS_DURATION = 5000;
const SLOW_DURATION = 5000;

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
    speedLevel: 0
};

// Colors
var COLORS = {
    snake: ['#4CAF50', '#8BC34A', '#CDDC39'],
    food: ['#FF5722', '#FFC107', '#FF9800'],
    obstacle: '#3F51B5',
    specialFood: '#FFD700',
    slowFood: '#9C27B0',
    background: 'black',
    text: 'white'
};

function init() {
    gameSettings.canvas = document.getElementById('gameCanvas');
    gameSettings.ctx = gameSettings.canvas.getContext('2d');
    gameSettings.canvas.width = CANVAS_WIDTH;
    gameSettings.canvas.height = CANVAS_HEIGHT;
    
    document.addEventListener('keydown', changeDirection);
    document.getElementById('newGameBtn').addEventListener('click', startNewGame);
    
    loadTotalScore();
    drawStartScreen();
    initTouchEvents();
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
    drawScore();
    updateGameSpeed();
}

function drawGameElements() {
    drawObstacles();
    drawSnake();
    drawFood();
    if (gameSettings.specialFood) drawSpecialFood();
    if (gameSettings.slowFood) drawSlowFood();
}

function clearCanvas() {
    gameSettings.ctx.fillStyle = COLORS.background;
    gameSettings.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawSnake() {
    gameSettings.snake.forEach((segment, index) => {
        gameSettings.ctx.fillStyle = COLORS.snake[index % COLORS.snake.length];
        gameSettings.ctx.beginPath();
        gameSettings.ctx.arc(segment.x * GRID_SIZE + GRID_SIZE / 2, segment.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 1, 0, 2 * Math.PI);
        gameSettings.ctx.fill();
    });

    const head = gameSettings.snake[0];
    gameSettings.ctx.fillStyle = 'black';
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(head.x * GRID_SIZE + GRID_SIZE * 0.3, head.y * GRID_SIZE + GRID_SIZE * 0.3, GRID_SIZE * 0.15, 0, 2 * Math.PI);
    gameSettings.ctx.arc(head.x * GRID_SIZE + GRID_SIZE * 0.7, head.y * GRID_SIZE + GRID_SIZE * 0.3, GRID_SIZE * 0.15, 0, 2 * Math.PI);
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
    gameSettings.ctx.fillStyle = isSpecial ? COLORS.specialFood : (isSlow ? COLORS.slowFood : foodItem.color);
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(foodItem.x * GRID_SIZE + GRID_SIZE / 2, foodItem.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, 2 * Math.PI);
    gameSettings.ctx.fill();
    gameSettings.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(foodItem.x * GRID_SIZE + GRID_SIZE * 0.35, foodItem.y * GRID_SIZE + GRID_SIZE * 0.35, GRID_SIZE * 0.15, 0, 2 * Math.PI);
    gameSettings.ctx.fill();
}

function moveSnake() {
    gameSettings.dx = gameSettings.nextDx;
    gameSettings.dy = gameSettings.nextDy;

    const head = {
        x: (gameSettings.snake[0].x + gameSettings.dx + CANVAS_WIDTH / GRID_SIZE) % (CANVAS_WIDTH / GRID_SIZE),
        y: (gameSettings.snake[0].y + gameSettings.dy + CANVAS_HEIGHT / GRID_SIZE) % (CANVAS_HEIGHT / GRID_SIZE)
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
            x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
            color: COLORS.food[Math.floor(Math.random() * COLORS.food.length)],
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
            x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.specialFood));
}

function generateSlowFood() {
    do {
        gameSettings.slowFood = {
            x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
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

function drawScore() {
    gameSettings.ctx.fillStyle = COLORS.text;
    gameSettings.ctx.font = '20px Arial';
    gameSettings.ctx.textAlign = 'left';
    gameSettings.ctx.fillText(`Score: ${gameSettings.score}`, 10, 30);
}

function gameOver() {
    gameSettings.gameActive = false;
    clearInterval(gameSettings.gameLoop);
    playSound('gameover');
    
    gameSettings.totalScore += gameSettings.score;
    localStorage.setItem('snakeTotalScore', gameSettings.totalScore);
    
    const scoreText = `Score: ${gameSettings.score}`;
    const totalScoreText = `Total Score: ${gameSettings.totalScore}`;
    
    gameSettings.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameSettings.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    gameSettings.ctx.fillStyle = COLORS.text;
    gameSettings.ctx.font = 'bold 40px Arial';
    gameSettings.ctx.textAlign = 'center';
    gameSettings.ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    gameSettings.ctx.font = '30px Arial';
    gameSettings.ctx.fillText(scoreText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    gameSettings.ctx.fillText(totalScoreText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    
    updateTotalScoreDisplay();
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
    const obstacleCount = 5;
    const newObstacles = [];
    for (let i = 0; i < obstacleCount; i++) {
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
                y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE))
            };
        } while (isFoodOnSnakeOrObstacle(obstacle));
        newObstacles.push(obstacle);
    }
    return newObstacles;
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
    updateTotalScoreDisplay();
}

function updateTotalScoreDisplay() {
    const totalScoreElement = document.getElementById('totalScore');
    if (totalScoreElement) {
        totalScoreElement.textContent = `Total Score: ${gameSettings.totalScore}`;
    }
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
    gameSettings.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameSettings.ctx.fillStyle = COLORS.text;
    gameSettings.ctx.font = '30px Arial';
    gameSettings.ctx.textAlign = 'center';
    gameSettings.ctx.fillText('Snake Game', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    gameSettings.ctx.font = '20px Arial';
    gameSettings.ctx.fillText('Press "New Game" to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function playSound(soundType) {
    // TODO: Implement sound playback
    console.log(`Playing sound: ${soundType}`);
}

window.onload = init;