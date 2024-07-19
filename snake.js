// snake.js
const LEVEL_THRESHOLD = 2000;  // Score needed to progress to next level

function update() {
    if (!gameSettings.gameActive) return;
    clearCanvas();
    moveSnake();
    drawGameElements();
    checkCollision();
    updateScore();
    updateGameSpeed();
    checkLevelProgress();
}

function checkLevelProgress() {
    if (gameSettings.score >= LEVEL_THRESHOLD * (gameSettings.level + 1)) {
        gameSettings.level++;
        generateObstacles();  // Add more obstacles for new level
        // Optionally increase game speed or other difficulty adjustments
    }
}

// snake.js
import { gameSettings, COLORS } from './game.js';

const LEVEL_THRESHOLD = 2000;  // Score needed to progress to next level
const FREEZE_DURATION = 5000;
const SHRINK_DURATION = 5000;
const DOUBLE_POINTS_DURATION = 5000;

export function generateFood() {
    do {
        gameSettings.food = {
            x: Math.floor(Math.random() * (gameSettings.width / gameSettings.GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / gameSettings.GRID_SIZE)),
            value: Math.floor(Math.random() * 10) * 100 + 100
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.food));

    // Generate special foods with different probabilities
    if (Math.random() < 0.1 && !gameSettings.specialFood) generateSpecialFood();
    if (Math.random() < 0.05 && !gameSettings.slowFood) generateSlowFood();
    if (Math.random() < 0.05 && !gameSettings.freezeFood) generateFreezeFood();
    if (Math.random() < 0.05 && !gameSettings.shrinkFood) generateShrinkFood();
    if (Math.random() < 0.05 && !gameSettings.doublePointsFood) generateDoublePointsFood();
}

export function generateFreezeFood() {
    do {
        gameSettings.freezeFood = {
            x: Math.floor(Math.random() * (gameSettings.width / gameSettings.GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / gameSettings.GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.freezeFood));
}

export function generateShrinkFood() {
    do {
        gameSettings.shrinkFood = {
            x: Math.floor(Math.random() * (gameSettings.width / gameSettings.GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / gameSettings.GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.shrinkFood));
}

export function generateDoublePointsFood() {
    do {
        gameSettings.doublePointsFood = {
            x: Math.floor(Math.random() * (gameSettings.width / gameSettings.GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / gameSettings.GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings.doublePointsFood));
}

function drawGameElements() {
    drawGrid();
    drawObstacles();
    drawSnake();
    drawFood();
    if (gameSettings.specialFood) drawSpecialFood();
    if (gameSettings.slowFood) drawSlowFood();
    if (gameSettings.freezeFood) drawFreezeFood();
    if (gameSettings.shrinkFood) drawShrinkFood();
    if (gameSettings.doublePointsFood) drawDoublePointsFood();
}

function drawFreezeFood() {
    drawFoodItem(gameSettings.freezeFood, false, false, true);
}

function drawShrinkFood() {
    drawFoodItem(gameSettings.shrinkFood, false, false, false, true);
}

function drawDoublePointsFood() {
    drawFoodItem(gameSettings.doublePointsFood, false, false, false, false, true);
}

function drawFoodItem(foodItem, isSpecial = false, isSlow = false, isFreeze = false, isShrink = false, isDoublePoints = false) {
    const x = foodItem.x * gameSettings.GRID_SIZE + gameSettings.GRID_SIZE / 2;
    const y = foodItem.y * gameSettings.GRID_SIZE + gameSettings.GRID_SIZE / 2;
    const radius = gameSettings.GRID_SIZE / 2 - 2;

    let fillColor;
    if (isSpecial) fillColor = COLORS.specialFood;
    else if (isSlow) fillColor = COLORS.slowFood;
    else if (isFreeze) fillColor = COLORS.freezeFood;
    else if (isShrink) fillColor = COLORS.shrinkFood;
    else if (isDoublePoints) fillColor = COLORS.doublePointsFood;
    else fillColor = COLORS.food;

    gameSettings.ctx.fillStyle = fillColor;
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameSettings.ctx.fill();
}

function moveSnake() {
    gameSettings.dx = gameSettings.nextDx;
    gameSettings.dy = gameSettings.nextDy;

    const head = {
        x: (gameSettings.snake[0].x + gameSettings.dx + gameSettings.width / gameSettings.GRID_SIZE) % (gameSettings.width / gameSettings.GRID_SIZE),
        y: (gameSettings.snake[0].y + gameSettings.dy + gameSettings.height / gameSettings.GRID_SIZE) % (gameSettings.height / gameSettings.GRID_SIZE)
    };
    gameSettings.snake.unshift(head);

    if (checkFoodCollision(head, gameSettings.food)) {
        gameSettings.score += gameSettings.food.value * (gameSettings.doublePointsActive ? 2 : 1);
        generateFood();
        playSound('eat');
    } else if (gameSettings.specialFood && checkFoodCollision(head, gameSettings.specialFood)) {
        gameSettings.score += 500 * (gameSettings.doublePointsActive ? 2 : 1);
        gameSettings.specialFood = null;
        activateBonus();
        playSound('special');
    } else if (gameSettings.slowFood && checkFoodCollision(head, gameSettings.slowFood)) {
        gameSettings.slowFood = null;
        activateSlow();
        playSound('slow');
    } else if (gameSettings.freezeFood && checkFoodCollision(head, gameSettings.freezeFood)) {
        gameSettings.freezeFood = null;
        activateFreeze();
        playSound('freeze');
    } else if (gameSettings.shrinkFood && checkFoodCollision(head, gameSettings.shrinkFood)) {
        gameSettings.shrinkFood = null;
        activateShrink();
        playSound('shrink');
    } else if (gameSettings.doublePointsFood && checkFoodCollision(head, gameSettings.doublePointsFood)) {
        gameSettings.doublePointsFood = null;
        activateDoublePoints();
        playSound('doublePoints');
    } else {
        gameSettings.snake.pop();
    }
}

function activateFreeze() {
    gameSettings.freezeActive = true;
    gameSettings.dx = 0;
    gameSettings.dy = 0;
    setTimeout(() => {
        gameSettings.freezeActive = false;
    }, FREEZE_DURATION);
}

function activateShrink() {
    gameSettings.shrinkActive = true;
    gameSettings.snake = gameSettings.snake.slice(0, Math.floor(gameSettings.snake.length / 2));
    setTimeout(() => {
        gameSettings.shrinkActive = false;
    }, SHRINK_DURATION);
}

function activateDoublePoints() {
    gameSettings.doublePointsActive = true;
    setTimeout(() => {
        gameSettings.doublePointsActive = false;
    }, DOUBLE_POINTS_DURATION);
}

export { generateSpecialFood, generateSlowFood };
