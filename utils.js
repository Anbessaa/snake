import { gameSettings, COLORS } from './game.js';
import { update, generateFood, generateSpecialFood, generateSlowFood, generateFreezeFood, generateShrinkFood, generateDoublePointsFood } from './snake.js';

const GRID_SIZE = 20;
const LEVEL_THRESHOLD = 2000;
const INITIAL_SPEED = 150;
const MAX_SPEED = 50;
const SPEED_INCREASE_THRESHOLD = 5000;
const SPEED_DECREASE_AMOUNT = 2;
const BONUS_DURATION = 5000;
const SLOW_DURATION = 5000;
const FREEZE_DURATION = 5000;
const SHRINK_DURATION = 5000;
const DOUBLE_POINTS_DURATION = 5000;
const OBSTACLE_COUNT = 5;
const LEADERBOARD_API_URL = 'https://api.example.com/leaderboard';

export function initGame(gameSettings, COLORS) {
    gameSettings.canvas = document.getElementById('gameCanvas');
    gameSettings.ctx = gameSettings.canvas.getContext('2d');
    resizeCanvas(gameSettings);
    loadTotalScore(gameSettings);
    drawStartScreen(gameSettings, COLORS);
    initTouchEvents(gameSettings);
    initKeyboardEvents(gameSettings);
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.ready();
    }
}

export async function fetchLeaderboard(gameSettings) {
    try {
        const response = await fetch(LEADERBOARD_API_URL);
        const data = await response.json();
        gameSettings.leaderboard = data;
        displayLeaderboard(gameSettings);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

export async function updateLeaderboard(gameSettings) {
    try {
        const response = await fetch(LEADERBOARD_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                score: gameSettings.totalScore,
                player: gameSettings.playerName
            })
        });
        const data = await response.json();
        gameSettings.leaderboard = data;
        displayLeaderboard(gameSettings);
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

function displayLeaderboard(gameSettings) {
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    leaderboardContainer.innerHTML = '<h2>Leaderboard</h2>';
    const ul = document.createElement('ul');
    gameSettings.leaderboard.forEach((entry) => {
        const li = document.createElement('li');
        li.textContent = `${entry.player}: ${entry.score}`;
        ul.appendChild(li);
    });
    leaderboardContainer.appendChild(ul);
}

export function gameOver(gameSettings) {
    gameSettings.gameActive = false;
    clearInterval(gameSettings.gameLoop);
    playSound('gameover');
    gameSettings.totalScore += gameSettings.score;
    localStorage.setItem('snakeTotalScore', gameSettings.totalScore.toString());
    const scoreText = `Score: ${gameSettings.score}`;
    const totalScoreText = `Total Score: ${gameSettings.totalScore}`;
    gameSettings.ctx.clearRect(0, 0, gameSettings.canvas.width, gameSettings.canvas.height);
    gameSettings.ctx.fillStyle = 'white';
    gameSettings.ctx.textAlign = 'center';
    gameSettings.ctx.font = 'bold 40px Arial';
    gameSettings.ctx.fillText('Game Over!', gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 - 50);
    gameSettings.ctx.font = '30px Arial';
    gameSettings.ctx.fillText(scoreText, gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 + 10);
    gameSettings.ctx.fillText(totalScoreText, gameSettings.canvas.width / 2, gameSettings.canvas.height / 2 + 50);
    updateScore(gameSettings);
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.sendData(JSON.stringify({action: 'gameOver', score: gameSettings.score, totalScore: gameSettings.totalScore}));
    }
    updateLeaderboard(gameSettings);
}

export function resizeCanvas(gameSettings) {
    const container = document.getElementById('gameContainer');
    const maxSize = Math.min(container.clientWidth, container.clientHeight) - 20; 
    gameSettings.width = Math.floor(maxSize / GRID_SIZE) * GRID_SIZE;
    gameSettings.height = Math.floor(maxSize / GRID_SIZE) * GRID_SIZE;
    gameSettings.canvas.width = gameSettings.width;
    gameSettings.canvas.height = gameSettings.height;

    if (gameSettings.gameActive) {
        drawGameElements(gameSettings);
    } else {
        drawStartScreen(gameSettings, gameSettings.COLORS);
    }
}

export function startNewGame(gameSettings) {
    resetGameState(gameSettings);
    gameSettings.gameLoop = setInterval(() => updateGame(gameSettings), gameSettings.gameSpeed);
}

function resetGameState(gameSettings) {
    gameSettings.snake = [{x: 10, y: 10}];
    generateFood(gameSettings);
    gameSettings.dx = 1;
    gameSettings.dy = 0;
    gameSettings.nextDx = 1;
    gameSettings.nextDy = 0;
    gameSettings.score = 0;
    gameSettings.gameActive = true;
    gameSettings.obstacles = generateObstacles(gameSettings);
    gameSettings.specialFood = null;
    gameSettings.slowFood = null;
    gameSettings.freezeFood = null;
    gameSettings.shrinkFood = null;
    gameSettings.doublePointsFood = null;
    gameSettings.bonusActive = false;
    gameSettings.slowActive = false;
    gameSettings.freezeActive = false;
    gameSettings.shrinkActive = false;
    gameSettings.doublePointsActive = false;
    gameSettings.gameSpeed = INITIAL_SPEED;
    gameSettings.speedLevel = 0;
    gameSettings.level = 1;
    if (gameSettings.gameLoop) clearInterval(gameSettings.gameLoop);
}

export function updateGame(gameSettings) {
    if (!gameSettings.gameActive) return;
    clearCanvas(gameSettings);
    moveSnake(gameSettings);
    drawGameElements(gameSettings);
    checkCollision(gameSettings);
    updateScore(gameSettings);
    updateGameSpeed(gameSettings);
    checkLevelProgress(gameSettings);
}

function checkLevelProgress(gameSettings) {
    if (gameSettings.score >= LEVEL_THRESHOLD * gameSettings.level) {
        gameSettings.level++;
        gameSettings.obstacles = generateObstacles(gameSettings); 
    }
}

function drawGameElements(gameSettings) {
    drawGrid(gameSettings);
    drawObstacles(gameSettings);
    drawSnake(gameSettings);
    drawFood(gameSettings);
    if (gameSettings.specialFood) drawSpecialFood(gameSettings);
    if (gameSettings.slowFood) drawSlowFood(gameSettings);
    if (gameSettings.freezeFood) drawFreezeFood(gameSettings);
    if (gameSettings.shrinkFood) drawShrinkFood(gameSettings);
    if (gameSettings.doublePointsFood) drawDoublePointsFood(gameSettings);
}

function clearCanvas(gameSettings) {
    gameSettings.ctx.fillStyle = gameSettings.COLORS.background;
    gameSettings.ctx.fillRect(0, 0, gameSettings.canvas.width, gameSettings.canvas.height);
}

function drawGrid(gameSettings) {
    gameSettings.ctx.strokeStyle = gameSettings.COLORS.grid;
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

function drawSnake(gameSettings) {
    gameSettings.snake.forEach((segment, index) => {
        if (index === 0) {
            drawSnakeHead(gameSettings, segment);
        } else {
            drawSnakeSegment(gameSettings, segment);
        }
    });
}

function drawSnakeHead(gameSettings, segment) {
    const x = segment.x * GRID_SIZE + GRID_SIZE / 2;
    const y = segment.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2;
    gameSettings.ctx.fillStyle = gameSettings.COLORS.snakeHead;
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameSettings.ctx.fill();
    drawSnakeEyes(gameSettings, x, y);
}

function drawSnakeEyes(gameSettings, x, y) {
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

function drawSnakeSegment(gameSettings, segment) {
    const x = segment.x * GRID_SIZE + GRID_SIZE / 2;
    const y = segment.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 1;
    gameSettings.ctx.fillStyle = gameSettings.COLORS.snake;
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameSettings.ctx.fill();
}

function drawFood(gameSettings) {
    drawFoodItem(gameSettings, gameSettings.food);
}

function drawSpecialFood(gameSettings) {
    drawFoodItem(gameSettings, gameSettings.specialFood, true);
}

function drawSlowFood(gameSettings) {
    drawFoodItem(gameSettings, gameSettings.slowFood, false, true);
}

function drawFreezeFood(gameSettings) {
    drawFoodItem(gameSettings, gameSettings.freezeFood, false, false, true);
}

function drawShrinkFood(gameSettings) {
    drawFoodItem(gameSettings, gameSettings.shrinkFood, false, false, false, true);
}

function drawDoublePointsFood(gameSettings) {
    drawFoodItem(gameSettings, gameSettings.doublePointsFood, false, false, false, false, true);
}

function drawFoodItem(gameSettings, foodItem, isSpecial = false, isSlow = false, isFreeze = false, isShrink = false, isDoublePoints = false) {
    const x = foodItem.x * GRID_SIZE + GRID_SIZE / 2;
    const y = foodItem.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 2;
    let fillColor = gameSettings.COLORS.food;
    if (isSpecial) fillColor = gameSettings.COLORS.specialFood;
    else if (isSlow) fillColor = gameSettings.COLORS.slowFood;
    else if (isFreeze) fillColor = gameSettings.COLORS.freezeFood;
    else if (isShrink) fillColor = gameSettings.COLORS.shrinkFood;
    else if (isDoublePoints) fillColor = gameSettings.COLORS.doublePointsFood;
    gameSettings.ctx.fillStyle = fillColor;
    gameSettings.ctx.beginPath();
    gameSettings.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameSettings.ctx.fill();
}

function moveSnake(gameSettings) {
    if (gameSettings.freezeActive) return;

    gameSettings.dx = gameSettings.nextDx;
    gameSettings.dy = gameSettings.nextDy;
    const head = {
        x: (gameSettings.snake[0].x + gameSettings.dx + gameSettings.width / GRID_SIZE) % (gameSettings.width / GRID_SIZE),
        y: (gameSettings.snake[0].y + gameSettings.dy + gameSettings.height / GRID_SIZE) % (gameSettings.height / GRID_SIZE)
    };
    gameSettings.snake.unshift(head);
    if (checkFoodCollision(head, gameSettings.food)) {
        gameSettings.score += gameSettings.food.value * (gameSettings.doublePointsActive ? 2 : 1);
        generateFood(gameSettings);
        playSound('eat');
    } else if (gameSettings.specialFood && checkFoodCollision(head, gameSettings.specialFood)) {
        gameSettings.score += 500 * (gameSettings.doublePointsActive ? 2 : 1);
        gameSettings.specialFood = null;
        activateBonus(gameSettings);
        playSound('special');
    } else if (gameSettings.slowFood && checkFoodCollision(head, gameSettings.slowFood)) {
        gameSettings.slowFood = null;
        activateSlow(gameSettings);
        playSound('slow');
    } else if (gameSettings.freezeFood && checkFoodCollision(head, gameSettings.freezeFood)) {
        gameSettings.freezeFood = null;
        activateFreeze(gameSettings);
        playSound('freeze');
    } else if (gameSettings.shrinkFood && checkFoodCollision(head, gameSettings.shrinkFood)) {
        gameSettings.shrinkFood = null;
        activateShrink(gameSettings);
        playSound('shrink');
    } else if (gameSettings.doublePointsFood && checkFoodCollision(head, gameSettings.doublePointsFood)) {
        gameSettings.doublePointsFood = null;
        activateDoublePoints(gameSettings);
        playSound('doublePoints');
    } else {
        gameSettings.snake.pop();
    }
}

function checkFoodCollision(head, foodItem) {
    return head.x === foodItem.x && head.y === foodItem.y;
}

function activateBonus(gameSettings) {
    gameSettings.bonusActive = true;
    setTimeout(() => {
        gameSettings.bonusActive = false;
    }, BONUS_DURATION);
}

function activateSlow(gameSettings) {
    gameSettings.slowActive = true;
    const currentSpeed = gameSettings.gameSpeed;
    gameSettings.gameSpeed = Math.min(200, gameSettings.gameSpeed * 1.5);
    clearInterval(gameSettings.gameLoop);
    gameSettings.gameLoop = setInterval(() => updateGame(gameSettings), gameSettings.gameSpeed);
    setTimeout(() => {
        gameSettings.slowActive = false;
        gameSettings.gameSpeed = currentSpeed;
        clearInterval(gameSettings.gameLoop);
        gameSettings.gameLoop = setInterval(() => updateGame(gameSettings), gameSettings.gameSpeed);
    }, SLOW_DURATION);
}

function activateFreeze(gameSettings) {
    gameSettings.freezeActive = true;
    setTimeout(() => {
        gameSettings.freezeActive = false;
    }, FREEZE_DURATION);
}

function activateShrink(gameSettings) {
    gameSettings.shrinkActive = true;
    gameSettings.snake = gameSettings.snake.slice(0, Math.max(3, Math.floor(gameSettings.snake.length / 2)));
    setTimeout(() => {
        gameSettings.shrinkActive = false;
    }, SHRINK_DURATION);
}

function activateDoublePoints(gameSettings) {
    gameSettings.doublePointsActive = true;
    setTimeout(() => {
        gameSettings.doublePointsActive = false;
    }, DOUBLE_POINTS_DURATION);
}

function generateObstacles(gameSettings) {
    const newObstacles = [];
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
                y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
            };
        } while (isFoodOnSnakeOrObstacle(gameSettings, obstacle) || isObstacleNearSnake(gameSettings, obstacle));
        newObstacles.push(obstacle);
    }
    return newObstacles;
}

function isFoodOnSnakeOrObstacle(gameSettings, food) {
    return gameSettings.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
           gameSettings.obstacles.some(obstacle => obstacle.x === food.x && obstacle.y === food.y);
}

function isObstacleNearSnake(gameSettings, obstacle) {
    const head = gameSettings.snake[0];
    const distance = Math.abs(obstacle.x - head.x) + Math.abs(obstacle.y - head.y);
    return distance < 3;
}

function drawObstacles(gameSettings) {
    gameSettings.ctx.fillStyle = gameSettings.COLORS.obstacle;
    gameSettings.obstacles.forEach(obstacle => {
        gameSettings.ctx.fillRect(obstacle.x * GRID_SIZE, obstacle.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });
}

function loadTotalScore(gameSettings) {
    const savedScore = localStorage.getItem('snakeTotalScore');
    if (savedScore) {
        gameSettings.totalScore = parseInt(savedScore, 10);
    }
    updateScore(gameSettings);
}

function updateScore(gameSettings) {
    const totalScoreElement = document.getElementById('totalScore');
    const currentScoreElement = document.getElementById('currentScore');
    const levelDisplay = document.getElementById('levelDisplay');
    if (totalScoreElement) {
        totalScoreElement.textContent = `Total Score: ${gameSettings.totalScore}`;
    }
    if (currentScoreElement) {
        currentScoreElement.textContent = `Current Score: ${gameSettings.score}`;
    }
    if (levelDisplay) {
        levelDisplay.textContent = `Level: ${gameSettings.level}`;
    }
}

function drawStartScreen(gameSettings, COLORS) {
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

function initTouchEvents(gameSettings) {
    let touchStartX, touchStartY;
    let isSwiping = false;
    gameSettings.canvas.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isSwiping = true;
    }, { passive: false });
    gameSettings.canvas.addEventListener('touchmove', function(e) {
        if (isSwiping) {
            e.preventDefault();
            let touchEndX = e.changedTouches[0].screenX;
            let touchEndY = e.changedTouches[0].screenY;
            handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY, gameSettings);
        }
    }, { passive: false });
    gameSettings.canvas.addEventListener('touchend', function(e) {
        isSwiping = false;
    }, { passive: false });
    document.body.style.overscrollBehavior = 'contain';
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.onEvent('viewportChanged', () => tg.expand());
    }
}

function handleSwipe(startX, startY, endX, endY, gameSettings) {
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

function initKeyboardEvents(gameSettings) {
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                if (gameSettings.dy !== 1) {
                    gameSettings.nextDx = 0;
                    gameSettings.nextDy = -1;
                }
                break;
            case 'ArrowDown':
                if (gameSettings.dy !== -1) {
                    gameSettings.nextDx = 0;
                    gameSettings.nextDy = 1;
                }
                break;
            case 'ArrowLeft':
                if (gameSettings.dx !== 1) {
                    gameSettings.nextDx = -1;
                    gameSettings.nextDy = 0;
                }
                break;
            case 'ArrowRight':
                if (gameSettings.dx !== -1) {
                    gameSettings.nextDx = 1;
                    gameSettings.nextDy = 0;
                }
                break;
        }
    });
}

function checkCollision(gameSettings) {
    const head = gameSettings.snake[0];
    
    // Check collision with obstacles
    if (gameSettings.obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
        gameOver(gameSettings);
        return;
    }
    
    // Check collision with self
    for (let i = 1; i < gameSettings.snake.length; i++) {
        if (head.x === gameSettings.snake[i].x && head.y === gameSettings.snake[i].y) {
            gameOver(gameSettings);
            return;
        }
    }
}

function updateGameSpeed(gameSettings) {
    if (gameSettings.score > SPEED_INCREASE_THRESHOLD * (gameSettings.speedLevel + 1)) {
        gameSettings.speedLevel++;
        gameSettings.gameSpeed = Math.max(MAX_SPEED, gameSettings.gameSpeed - SPEED_DECREASE_AMOUNT);
        clearInterval(gameSettings.gameLoop);
        gameSettings.gameLoop = setInterval(() => updateGame(gameSettings), gameSettings.gameSpeed);
    }
}

export function generateFood(gameSettings) {
    do {
        gameSettings.food = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE)),
            value: Math.floor(Math.random() * 10) + 1
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings, gameSettings.food));

    if (Math.random() < 0.1) generateSpecialFood(gameSettings);
    if (Math.random() < 0.05) generateSlowFood(gameSettings);
    if (Math.random() < 0.05) generateFreezeFood(gameSettings);
    if (Math.random() < 0.05) generateShrinkFood(gameSettings);
    if (Math.random() < 0.05) generateDoublePointsFood(gameSettings);
}

export function generateSpecialFood(gameSettings) {
    do {
        gameSettings.specialFood = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings, gameSettings.specialFood));
}

export function generateSlowFood(gameSettings) {
    do {
        gameSettings.slowFood = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings, gameSettings.slowFood));
}

export function generateFreezeFood(gameSettings) {
    do {
        gameSettings.freezeFood = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings, gameSettings.freezeFood));
}

export function generateShrinkFood(gameSettings) {
    do {
        gameSettings.shrinkFood = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings, gameSettings.shrinkFood));
}

export function generateDoublePointsFood(gameSettings) {
    do {
        gameSettings.doublePointsFood = {
            x: Math.floor(Math.random() * (gameSettings.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (gameSettings.height / GRID_SIZE))
        };
    } while (isFoodOnSnakeOrObstacle(gameSettings, gameSettings.doublePointsFood));
}

export { GRID_SIZE, LEVEL_THRESHOLD, INITIAL_SPEED, MAX_SPEED, SPEED_INCREASE_THRESHOLD, SPEED_DECREASE_AMOUNT };