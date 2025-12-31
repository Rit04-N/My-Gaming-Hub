// --- GLOBAL GAME VARIABLES ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;

// Game State
let gameActive = false;
let isPaused = true;
let animationFrameId;

// Entities
let mamaDuck = { x: 200, y: 200, baseSpeed: 3, boostSpeed: 7 };
let ducklings = [];
let history = []; // Snake-like trail
let lostDuckling = { x: 100, y: 100 };
let nest = { x: 340, y: 60, size: 40 };
let pikeFish = { x: -50, y: 150, speed: 2.2 };
let crocodile = { x: 500, y: 300, speed: -1.2 };

// Stats
let score = 0;
let highScore = localStorage.getItem("duckRescueHighScore") || 0;
let lives = 5;
let deadDucklings = 0;
let boostStamina = 100;
let isBoosting = false;

// Inputs
let keys = {};
let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, radius: 40 };
let lastTapTime = 0;

// --- INITIAL SETUP ---
updateUI(); // Show initial 0s

// --- CORE FUNCTIONS (Attached to Window for HTML Access) ---

window.startGame = function() {
    // 1. Reset Game State
    gameActive = true;
    isPaused = false;
    score = 0;
    lives = 5;
    deadDucklings = 0;
    ducklings = [];
    history = [];
    boostStamina = 100;
    
    // 2. Reset Positions
    mamaDuck.x = 200; mamaDuck.y = 200;
    crocodile.x = 500; crocodile.y = 300;
    pikeFish.x = -100;
    
    // 3. Reset UI
    document.getElementById("statusOverlay").style.display = "none";
    document.getElementById("finalDeathText").style.display = "none";
    
    // 4. Start Loop
    spawnBaby();
    updateUI();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    loop();
};

window.togglePause = function() {
    if (!gameActive) return;
    isPaused = !isPaused;
    
    const overlay = document.getElementById("statusOverlay");
    if (isPaused) {
        overlay.style.display = "flex";
        document.getElementById("statusTitle").innerText = "PAUSED";
        const btn = document.querySelector(".start-btn");
        btn.innerText = "RESUME";
        btn.onclick = window.togglePause; // Re-bind button to unpause
    } else {
        overlay.style.display = "none";
        loop();
    }
};

// --- HELPER FUNCTIONS ---

function spawnBaby() {
    lostDuckling.x = 40 + Math.random() * 320;
    lostDuckling.y = 40 + Math.random() * 320;
}

function updateUI() {
    document.getElementById("scoreDisplay").innerText = score;
    document.getElementById("highScoreDisplay").innerText = highScore;
    document.getElementById("deathDisplay").innerText = deadDucklings;
    
    // Draw Hearts
    let hearts = ""; 
    for(let i=0; i<lives; i++) hearts += "❤";
    document.getElementById("livesDisplay").innerText = hearts;
}

function loseLife() {
    lives--;
    updateUI();
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Safe Respawn
        mamaDuck.x = 200; 
        mamaDuck.y = 200;
        // Push enemies away safely
        crocodile.x = 500; 
        pikeFish.x = -100;
        // Reset inputs
        keys = {}; 
        joystick.active = false;
    }
}

function gameOver() {
    gameActive = false;
    isPaused = true;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("duckRescueHighScore", highScore);
    }
    
    const overlay = document.getElementById("statusOverlay");
    overlay.style.display = "flex";
    document.getElementById("statusTitle").innerText = "GAME OVER";
    document.getElementById("highScoreText").innerText = "High Score: " + highScore;
    
    const dText = document.getElementById("finalDeathText");
    dText.innerText = "Total Casualties: " + deadDucklings;
    dText.style.display = "block";
    
    const btn = document.querySelector(".start-btn");
    btn.innerText = "▶ TRY AGAIN";
    btn.onclick = window.startGame;
}

// --- GAME LOOP ---

function update() {
    if (isPaused || !gameActive) return;

    // 1. Boost Logic
    let speed = (isBoosting && boostStamina > 0) ? mamaDuck.boostSpeed : mamaDuck.baseSpeed;
    if (isBoosting && boostStamina > 0) boostStamina -= 1.5;
    else { isBoosting = false; if (boostStamina < 100) boostStamina += 0.5; }
    const bar = document.getElementById("boostBar");
    if(bar) bar.style.width = boostStamina + "%";

    // 2. Movement
    if (keys["ArrowUp"] || keys["KeyW"]) mamaDuck.y -= speed;
    if (keys["ArrowDown"] || keys["KeyS"]) mamaDuck.y += speed;
    if (keys["ArrowLeft"] || keys["KeyA"]) mamaDuck.x -= speed;
    if (keys["ArrowRight"] || keys["KeyD"]) mamaDuck.x += speed;

    mamaDuck.x = Math.max(20, Math.min(380, mamaDuck.x));
    mamaDuck.y = Math.max(20, Math.min(380, mamaDuck.y));

    // 3. Trail History
    history.unshift({x: mamaDuck.x, y: mamaDuck.y});
    if (history.length > 300) history.pop(); // Keep history manageable

    // 4. Enemy Movement
    pikeFish.x += pikeFish.speed;
    if (pikeFish.x > 450) { pikeFish.x = -50; pikeFish.y = 50 + Math.random() * 300; }
    
    crocodile.x += crocodile.speed;
    if (crocodile.x < -100) { crocodile.x = 500; crocodile.y = 50 + Math.random() * 300; }

    // --- COLLISIONS ---

    // A. Crocodile eats Mama
    if (Math.hypot(mamaDuck.x - crocodile.x, mamaDuck.y - crocodile.y) < 30) {
        loseLife();
        return; 
    }

    // B. Crocodile eats Ducklings (Predator Logic)
    // We iterate backwards to safely splice
    for (let i = ducklings.length - 1; i >= 0; i--) {
        let idx = (i + 1) * 15;
        if (history[idx]) {
            let dist = Math.hypot(history[idx].x - crocodile.x, history[idx].y - crocodile.y);
            if (dist < 25) {
                // Eaten!
                let lostCount = ducklings.length - i;
                deadDucklings += lostCount;
                ducklings = ducklings.slice(0, i); // Cut the tail
                updateUI();
                break; // Stop checking, tail is gone
            }
        }
    }

    // C. Pike Fish (Line Breaker)
    for (let i = ducklings.length - 1; i >= 0; i--) {
        let idx = (i + 1) * 15;
        if (history[idx]) {
            let dist = Math.hypot(history[idx].x - pikeFish.x, history[idx].y - pikeFish.y);
            if (dist < 20) {
                ducklings = ducklings.slice(0, i); // Just breaks, doesn't kill
                break;
            }
        }
    }

    // D. Pick up Baby
    if (Math.hypot(mamaDuck.x - lostDuckling.x, mamaDuck.y - lostDuckling.y) < 30) {
        ducklings.push({});
        spawnBaby();
    }

    // E. Deposit at Nest
    if (Math.hypot(mamaDuck.x - nest.x, mamaDuck.y - nest.y) < nest.size && ducklings.length > 0) {
        score += ducklings.length;
        ducklings = [];
        updateUI();
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("duckRescueHighScore", highScore);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, 400, 400);

    // Text Setup
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Static Objects
    ctx.font = "45px serif"; ctx.fillText("🪺", nest.x, nest.y); 
    ctx.font = "30px serif"; ctx.fillText("🐟", pikeFish.x, pikeFish.y); 
    ctx.font = "45px serif"; ctx.fillText("🐊", crocodile.x, crocodile.y); 

    // Mama Swan
    ctx.save();
    ctx.translate(mamaDuck.x, mamaDuck.y);
    if (keys["ArrowLeft"] || keys["KeyA"]) ctx.scale(-1, 1);
    if (isBoosting) { ctx.shadowBlur = 15; ctx.shadowColor = "white"; }
    ctx.font = "40px serif"; 
    ctx.fillText("🦢", 0, 0); // Correctly centered
    ctx.restore();

    // Ducklings
    ducklings.forEach((d, i) => {
        let idx = (i + 1) * 15;
        if (history[idx]) {
            let bob = Math.sin(Date.now() * 0.01 + i) * 3;
            ctx.font = "20px serif";
            ctx.fillText("🐥", history[idx].x, history[idx].y + bob);
        }
    });

    // Lost Baby
    ctx.font = "24px serif"; 
    ctx.fillText("🐣", lostDuckling.x, lostDuckling.y); 

    // Joystick Visual
    if (joystick.active) {
        ctx.beginPath(); 
        ctx.arc(joystick.baseX, joystick.baseY, joystick.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; 
        ctx.fill();
        ctx.beginPath(); 
        ctx.arc(joystick.stickX, joystick.stickY, 20, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; 
        ctx.fill();
    }
}

function loop() {
    if (!isPaused && gameActive) {
        update();
        draw();
        animationFrameId = requestAnimationFrame(loop);
    }
}

// --- INPUT LISTENERS ---

window.addEventListener("keydown", (e) => { 
    keys[e.code] = true; 
    if(e.code === "Space") isBoosting = true;
});
window.addEventListener("keyup", (e) => { 
    keys[e.code] = false; 
    if(e.code === "Space") isBoosting = false;
});

// Mobile Logic
canvas.addEventListener("touchstart", (e) => {
    if(!gameActive) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const tx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const ty = (touch.clientY - rect.top) * (canvas.height / rect.height);

    const currentTime = Date.now();
    if (currentTime - lastTapTime < 300) isBoosting = true;
    lastTapTime = currentTime;

    joystick.active = true;
    joystick.baseX = tx; joystick.baseY = ty;
    joystick.stickX = tx; joystick.stickY = ty;
}, {passive: false});

canvas.addEventListener("touchmove", (e) => {
    if(!gameActive || !joystick.active) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const tx = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const ty = (touch.clientY - rect.top) * (canvas.height / rect.height);

    const dist = Math.hypot(tx - joystick.baseX, ty - joystick.baseY);
    const angle = Math.atan2(ty - joystick.baseY, tx - joystick.baseX);
    const moveDist = Math.min(dist, joystick.radius);

    joystick.stickX = joystick.baseX + Math.cos(angle) * moveDist;
    joystick.stickY = joystick.baseY + Math.sin(angle) * moveDist;

    const thres = 10;
    keys["ArrowLeft"] = (tx < joystick.baseX - thres);
    keys["ArrowRight"] = (tx > joystick.baseX + thres);
    keys["ArrowUp"] = (ty < joystick.baseY - thres);
    keys["ArrowDown"] = (ty > joystick.baseY + thres);
}, {passive: false});

canvas.addEventListener("touchend", () => { 
    joystick.active = false; isBoosting = false; keys = {}; 
});
