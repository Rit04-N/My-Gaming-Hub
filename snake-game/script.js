const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20; 
let snake = [];
let food = {};
let direction = "RIGHT";
let nextDirection = "RIGHT";
let gameInterval;
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioContext(); }

function playSound(freq, type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function startGame() {
    initAudio();
    document.getElementById("gameOverOverlay").style.display = "none";
    score = 0;
    document.getElementById("scoreDisplay").innerText = "Apples: 0";
    direction = "RIGHT";
    nextDirection = "RIGHT";
    // Centered start for 600x600 area
    snake = [
        { x: 15 * box, y: 15 * box },
        { x: 14 * box, y: 15 * box },
        { x: 13 * box, y: 15 * box }
    ]; 
    spawnFood();
    if (gameInterval) clearInterval(gameInterval);
    // SLOWER SPEED: 150ms instead of 100ms
    gameInterval = setInterval(draw, 150); 
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * 29) * box,
        y: Math.floor(Math.random() * 29) * box
    };
}

document.addEventListener("keydown", (e) => {
    if (e.keyCode == 37 && direction != "RIGHT") nextDirection = "LEFT";
    else if (e.keyCode == 38 && direction != "DOWN") nextDirection = "UP";
    else if (e.keyCode == 39 && direction != "LEFT") nextDirection = "RIGHT";
    else if (e.keyCode == 40 && direction != "UP") nextDirection = "DOWN";
});

function drawSnakePart(part, index) {
    const isHead = index === 0;
    const radius = isHead ? 10 : 6; // Head is slightly bigger/rounder
    
    ctx.fillStyle = isHead ? "#2ecc71" : "#27ae60";
    
    // Draw rounded body part
    ctx.beginPath();
    ctx.roundRect(part.x + 1, part.y + 1, box - 2, box - 2, radius);
    ctx.fill();

    // Draw Eyes if it's the head
    if (isHead) {
        ctx.fillStyle = "white";
        // Left Eye
        if (direction === "UP" || direction === "DOWN") {
            ctx.beginPath(); ctx.arc(part.x + 6, part.y + 10, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(part.x + 14, part.y + 10, 3, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(part.x + 10, part.y + 6, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(part.x + 10, part.y + 14, 3, 0, Math.PI * 2); ctx.fill();
        }
    }
}

function draw() {
    direction = nextDirection;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render snake parts
    snake.forEach((part, index) => drawSnakePart(part, index));

    // Render Food (Apple)
    ctx.fillStyle = "#ff4d6d"; // Match Hub Pink
    ctx.beginPath();
    ctx.arc(food.x + box/2, food.y + box/2, box/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Small leaf on apple
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(food.x + box/2, food.y + 2, 2, 4);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction == "LEFT") snakeX -= box;
    if (direction == "UP") snakeY -= box;
    if (direction == "RIGHT") snakeX += box;
    if (direction == "DOWN") snakeY += box;

    if (snakeX == food.x && snakeY == food.y) {
        score++;
        playSound(400, "sine");
        document.getElementById("scoreDisplay").innerText = "Apples: " + score;
        spawnFood();
    } else {
        snake.pop(); 
    }

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(gameInterval);
        playSound(150, "sawtooth");
        showGameOver();
        return;
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}

function showGameOver() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
    }
    document.getElementById("finalScoreText").innerText = "Apples Eaten: " + score;
    document.getElementById("highScoreText").innerText = "High Score: " + highScore;
    document.getElementById("gameOverOverlay").style.display = "flex";
}
