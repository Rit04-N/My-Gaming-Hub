const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let gameRunning = false;
let isPaused = false;
let score = 0;
let animationId;
let frame = 0;

const GROUND_Y = 220;

// Player Settings
let player = { 
    x: 50, 
    y: GROUND_Y, 
    width: 40, 
    height: 40, 
    dy: 0, 
    jumpPower: -10, 
    doubleJumpPower: -12, 
    gravity: 0.6, 
    grounded: true, 
    jumpCount: 0 
};

let obstacles = [];
let hearts = [];

function updateGame() {
    if (!gameRunning || isPaused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Physics Logic
    player.dy += player.gravity; 
    player.y += player.dy;

    if (player.y > GROUND_Y) { 
        player.y = GROUND_Y; 
        player.dy = 0; 
        player.grounded = true; 
        player.jumpCount = 0; 
    }
    
    // Spawn Logic (Cacti and Hearts)
    if (frame % 90 === 0) {
        if (Math.random() < 0.3) {
            obstacles.push({ x: canvas.width, y: GROUND_Y + 10, width: 20, height: 30 });
        } else {
            hearts.push({ 
                x: canvas.width, 
                y: [GROUND_Y + 10, 140, 60][Math.floor(Math.random()*3)], 
                width: 30, 
                height: 30 
            });
        }
    }

    // Draw Player
    ctx.font = "40px Arial"; 
    ctx.fillText("🐰", player.x, player.y + 40);
    
    // Move and Draw Obstacles
    ctx.font = "30px Arial";
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 5;
        ctx.fillText("🌵", obstacles[i].x, obstacles[i].y + 30);
        
        if (checkCollision(player, obstacles[i])) {
            gameOver();
        }
        if (obstacles[i].x < -50) obstacles.splice(i, 1);
    }

    // Move and Draw Hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
        hearts[i].x -= 5; 
        ctx.fillText("💖", hearts[i].x, hearts[i].y + 30);
        
        if (checkCollision(player, hearts[i])) {
            hearts.splice(i, 1); 
            score++; 
            document.getElementById("scoreDisplay").innerText = "Hearts: " + score;
        }
        if (hearts[i] && hearts[i].x < -50) hearts.splice(i, 1);
    }

    frame++; 
    animationId = requestAnimationFrame(updateGame);
}

function checkCollision(p, obj) {
    return (p.x < obj.x + obj.width &&
            p.x + p.width > obj.x &&
            p.y < obj.y + obj.height &&
            p.y + p.height > obj.y);
}

function jump() {
    if (!gameRunning || isPaused) return;
    if (player.grounded) { 
        player.dy = player.jumpPower; 
        player.grounded = false; 
        player.jumpCount = 1; 
    } else if (player.jumpCount === 1) { 
        player.dy = player.doubleJumpPower; 
        player.jumpCount = 2; 
    }
}

function startGame() {
    if (gameRunning && !isPaused) return;
    if (isPaused) { isPaused = false; updateGame(); return; }
    
    // Reset Game State
    player.y = GROUND_Y;
    obstacles = [];
    hearts = [];
    score = 0;
    frame = 0;
    gameRunning = true;
    document.getElementById("scoreDisplay").innerText = "Hearts: 0";
    updateGame();
}

function pauseGame() {
    isPaused = !isPaused;
    if (isPaused) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillText("PAUSED", canvas.width/2 - 50, canvas.height/2);
    } else {
        updateGame();
    }
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    alert("Game Over! Score: " + score);
}

// Input Listeners
document.addEventListener("keydown", (e) => { if (e.code === "Space") jump(); });
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); });
