const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Audio Objects
const bgMusic = new Audio("music.mp3");
bgMusic.loop = true; 

const eggSound = new Audio("se.mp3"); 
const eatSound = new Audio("se2.mp3"); 

// Scoreboard Elements Link
const currentScoreElement = document.getElementById("current-score");
const highScoreElement = document.getElementById("high-score");

// Volume Slider Event Logic
const volumeSlider = document.getElementById("volume-slider");
const volumeIcon = document.getElementById("volume-icon");

if (volumeSlider && volumeIcon) {
    volumeSlider.addEventListener("input", function() {
        bgMusic.volume = volumeSlider.value;
        eggSound.volume = volumeSlider.value; 
        eatSound.volume = volumeSlider.value; 
        if (parseFloat(volumeSlider.value) === 0) {
            volumeIcon.innerText = "🔇";
        } else {
            volumeIcon.innerText = "🔊";
        }
    });
}

// Easter Egg Interaction Trigger
const secretEgg = document.getElementById("secret-egg");
if (secretEgg) {
    secretEgg.addEventListener("click", function() {
        eggSound.currentTime = 0; 
        eggSound.play().catch(e => console.log("Easter egg sound blocked or file missing:", e));
    });
}

// Laptop sleep auto-fix
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "visible" && musicStarted && gameState === "playing") {
        bgMusic.play().catch(e => console.log(e));
    }
});

// Game Settings & Speeds
const gridSize = 20; 
const tileCount = canvas.width / gridSize;
const baseSpeed = 7; 

// Game State Tracker
let gameState = "start"; 
let musicStarted = false;

// Snake Setup
let snake = [{x: 10, y: 10}];
let dx = 1;  
let dy = 0;  

// Food Setup
let foodX = 5;
let foodY = 5;

// Visual Pulse Effects
let eatFlashTimer = 0; 

// Score Setup
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;

// Initialize Scoreboard Displays right away
if (highScoreElement) highScoreElement.innerText = "HIGH SCORE: " + highScore;

// Color Randomization Engine
const neonColors = ["#00ffff", "#00ff00", "#ffff00", "#ff0000", "#ff00ff", "#ff5500", "#aa00ff", "#00ffaa", "#ff0055"];

let tier0Color = "#00ffff"; 
let tier1Color = "#00ff00"; 
let tier2Color = "#ffff00"; 
let tier3Color = "#ff0000"; 
let tier4Color = "#ffffff"; 

function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * neonColors.length);
    return neonColors[randomIndex];
}

function randomizeGamePalette() {
    tier0Color = getRandomColor(); 
    tier1Color = getRandomColor(); 
    tier2Color = getRandomColor(); 
    tier3Color = getRandomColor(); 
    tier4Color = getRandomColor(); 
}

// Separate Game Movement Logic from Render Engine
function updateGame() {
    if (gameState === "playing") {
        moveSnake();
        
        if (eatFlashTimer > 0) {
            eatFlashTimer--;
        }

        if (hasGameEnded()) {
            gameState = "gameover";
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("snakeHighScore", highScore);
                if (highScoreElement) highScoreElement.innerText = "HIGH SCORE: " + highScore;
            }
        }
    }

    let adjustedSpeed = baseSpeed + (score * 0.05); 
    setTimeout(updateGame, 1000 / adjustedSpeed);
}

// Core Rendering Loop (60 FPS Graphics)
function drawEverything() {
    clearCanvas();

    if (gameState === "start") {
        drawStartScreen();
    } else if (gameState === "paused") {
        drawPauseScreen();
    } else if (gameState === "gameover") {
        drawGameOverScreen();
    } else if (gameState === "playing") {
        drawFood();
        drawSnake();
    }

    requestAnimationFrame(drawEverything);
}

function clearCanvas() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStartScreen() {
    ctx.fillStyle = "#00ffff";
    ctx.font = "24px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("Snaik by HypnoLaser", canvas.width / 2, 160); 
    
    ctx.fillStyle = "#ff00ff";
    ctx.font = "16px 'Courier New'";
    ctx.fillText("Press SPACEBAR to Play", canvas.width / 2, 230);
}

function drawPauseScreen() {
    drawFood();
    drawSnake();

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffaa00"; 
    ctx.font = "30px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("GAME PAUSED", canvas.width / 2, 170);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px 'Courier New'";
    ctx.fillText("Press ESC to Resume", canvas.width / 2, 230);
}

function drawGameOverScreen() {
    ctx.fillStyle = "#ff00ff";
    ctx.font = "30px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, 170);
    
    ctx.fillStyle = "#00ffff";
    ctx.font = "16px 'Courier New'";
    ctx.fillText("Press SPACEBAR to Restart", canvas.width / 2, 230);
}

function drawSnake() {
    let scoreTier = Math.floor(score / 100);
    let baseSnakeColor = tier0Color; 

    if (scoreTier === 1) baseSnakeColor = tier1Color; 
    if (scoreTier === 2) baseSnakeColor = tier2Color; 
    if (scoreTier === 3) baseSnakeColor = tier3Color; 
    if (scoreTier >= 4)  baseSnakeColor = tier4Color; 

    snake.forEach(part => {
        let finalColor = baseSnakeColor; 
        
        if (eatFlashTimer > 0 && eatFlashTimer % 2 === 0) {
            finalColor = "#ffaa00"; 
        }

        ctx.fillStyle = finalColor; 
        ctx.shadowBlur = 8;
        ctx.shadowColor = finalColor;
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
    ctx.shadowBlur = 0; 
}

function moveSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head); 

    const hasEatenFood = snake[0].x === foodX && snake[0].y === foodY;
    if (hasEatenFood) {
        score += 10;
        eatFlashTimer = 4; 
        
        // Update HTML interface live
        if (currentScoreElement) currentScoreElement.innerText = "SCORE: " + score;
        
        eatSound.currentTime = 0; 
        eatSound.play().catch(e => console.log("Eat sound blocked or file missing:", e));
        
        generateFood();
    } else {
        snake.pop(); 
    }
}

// Controls
document.addEventListener("keydown", handleKeyPress);

function handleKeyPress(event) {
    const key = event.key.toLowerCase(); 
    const keyCode = event.keyCode;       

    if (keyCode === 27 || key === "escape") {
        if (gameState === "playing") {
            gameState = "paused";
            bgMusic.pause(); 
        } else if (gameState === "paused") {
            gameState = "playing";
            bgMusic.play().catch(e => console.log(e));
        }
        return;
    }

    if (keyCode === 32) {
        if (!musicStarted) {
            bgMusic.play().catch(e => console.log("Audio file missing or blocked:", e));
            musicStarted = true;
        }
        
        if (gameState === "start" || gameState === "gameover") {
            resetGame();
            gameState = "playing";
        }
        return;
    }

    if (gameState !== "playing") return;

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if ((keyCode === 38 || key === 'w') && !goingDown) { dx = 0; dy = -1; }
    if ((keyCode === 40 || key === 's') && !goingUp) { dx = 0; dy = 1; }
    if ((keyCode === 37 || key === 'a') && !goingRight) { dx = -1; dy = 0; }
    if ((keyCode === 39 || key === 'd') && !goingLeft) { dx = 1; dy = 0; }
}

function drawFood() {
    ctx.fillStyle = "#ffffff"; 
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ffffff";
    ctx.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
}

function generateFood() {
    foodX = Math.floor(Math.random() * tileCount);
    foodY = Math.floor(Math.random() * tileCount);
    
    snake.forEach(part => {
        if (part.x === foodX && part.y === foodY) generateFood();
    });
}

function hasGameEnded() {
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= tileCount;
    const hitTopWall = snake[0].y < 0; 
    const hitBottomWall = snake[0].y >= tileCount;

    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

function resetGame() {
    snake = [{x: 10, y: 10}];
    dx = 1;
    dy = 0;
    score = 0;
    eatFlashTimer = 0;
    if (currentScoreElement) currentScoreElement.innerText = "SCORE: 0";
    randomizeGamePalette(); 
    generateFood();
}

// Start execution
randomizeGamePalette(); 
generateFood();
updateGame();   
drawEverything(); 
