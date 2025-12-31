const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;

// Game State
let mamaDuck = { x: 200, y: 200, baseSpeed: 3, boostSpeed: 7, size: 30 };
let ducklings = [];
let lostDuckling = { x: 100, y: 100 };
let history = [];
let nest = { x: 340, y: 60, size: 40 };
let score = 0;
let highScore = localStorage.getItem("duckRescueHighScore") || 0;
let isPaused = false;

// Boost Logic
let boostStamina = 100;
let isBoosting = false;

// Enemies
let pikeFish = { x: -50, y: 150, speed: 2.2 };
let crocodile = { x: 500, y: 300, speed: -1.0 };

// Controls State
let keys = {};
let touchStartX = null;
let touchStartY = null;

// Initialize Display
document.getElementById("highScoreDisplay").innerText = highScore;

// --- CONTROL LISTENERS ---

// Keyboard Controls (PC)
window.addEventListener("keydown", function(e) { 
    keys[e.code] = true;
    if (e.code === "Space") isBoosting = true;
});

window.addEventListener("keyup", function(e) { 
    keys[e.code] = false;
    if (e.code === "Space") isBoosting = false;
});

// Swipe Controls (Mobile)
canvas.addEventListener("touchstart", function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    
    // Tap Swan for Speed
    const rect = canvas.getBoundingClientRect();
    const tx = (touchStartX - rect.left) * (canvas.width / rect.width);
    const ty = (touchStartY - rect.top) * (canvas.height / rect.height);
    if (Math.hypot(mamaDuck.x - tx, mamaDuck.y - ty) < 40) isBoosting = true;
}, {passive: false});

canvas.addEventListener("touchmove", function(e) {
    e.preventDefault();
    if (!touchStartX || !touchStartY) return;

    let diffX = e.touches[0].clientX - touchStartX;
    let diffY = e.touches[0].clientY - touchStartY;

    // Reset directional keys
    keys["ArrowLeft"] = keys["ArrowRight"] = keys["ArrowUp"] = keys["ArrowDown"] = false;

    // Swipe Threshold Logic
    if (Math.abs(diffX) > 20) keys[diffX > 0 ? "ArrowRight" : "ArrowLeft"] = true;
    if (Math.abs(diffY) > 20) keys[diffY > 0 ? "ArrowDown" : "ArrowUp"] = true;
}, {passive: false});

canvas.addEventListener("touchend", function() {
    touchStartX = null;
    touchStartY = null;
    // We don't clear all keys immediately to allow for gliding stop
    isBoosting = false;
});

function togglePause() {
    isPaused = !isPaused;
    document.getElementById("statusOverlay").style.display = isPaused ? "flex" : "none";
    document.getElementById("highScoreText").innerText = "Best Rescue: " + highScore;
}

function quack() {
    pikeFish.x = -150; // Move fish away
}

function spawnBaby() {
    lostDuckling.x = 40 + Math.random() * 320;
    lostDuckling.y = 40 + Math.random() * 320;
}

// --- MAIN ENGINE ---

function update() {
    if (isPaused) return;

    // 1. Boost Mechanics
    let currentSpeed = mamaDuck.baseSpeed;
    if (isBoosting && boostStamina > 0) {
        currentSpeed = mamaDuck.boostSpeed;
        boostStamina -= 1.5;
    } else {
        isBoosting = false;
        if (boostStamina < 100) boostStamina += 0.5;
    }
    
    let bBar = document.getElementById("boostBar");
    if (bBar) bBar.style.width = boostStamina + "%";

    // 2. Movement
    if (keys["ArrowLeft"] || keys["KeyA"]) mamaDuck.x -= currentSpeed;
    if (keys["ArrowRight"] || keys["KeyD"]) mamaDuck.x += currentSpeed;
    if (keys["ArrowUp"] || keys["KeyW"]) mamaDuck.y -= currentSpeed;
    if (keys["ArrowDown"] || keys["KeyS"]) mamaDuck.y += currentSpeed;

    // Boundary Lock
    mamaDuck.x = Math.max(20, Math.min(380, mamaDuck.x));
    mamaDuck.y = Math.max(20, Math.min(380, mamaDuck.y));

    // 3. Update Trail History
    history.unshift({x: mamaDuck.x, y: mamaDuck.y});
    if (history.length > 200) history.pop();

    // 4. Enemy AI
    pikeFish.x += pikeFish.speed;
    if (pikeFish.x > 450) { pikeFish.x = -50; pikeFish.y = 50 + Math.random() * 300; }

    crocodile.x += crocodile.speed;
    if (crocodile.x < -100) { crocodile.x = 500; crocodile.y = 50 + Math.random() * 300; }

    // 5. Collision Check
    if (Math.hypot(mamaDuck.x - lostDuckling.x, mamaDuck.y - lostDuckling.y) < 25) {
        ducklings.push({});
        spawnBaby();
        document.getElementById("trailDisplay").innerText = ducklings.length;
    }

    if (Math.hypot(mamaDuck.x - nest.x, mamaDuck.y - nest.y) < nest.size && ducklings.length > 0) {
        score += ducklings.length;
        ducklings = [];
        document.getElementById("scoreDisplay").innerText = score;
        document.getElementById("trailDisplay").innerText = "0";
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("duckRescueHighScore", highScore);
            document.getElementById("highScoreDisplay").innerText = highScore;
        }
    }

    // 6. Fish vs Trail
    ducklings.forEach(function(d, i) {
        let idx = (i + 1) * 15;
        if (history[idx] && Math.hypot(history[idx].x - pikeFish.x, history[idx].y - pikeFish.y) < 20) {
            ducklings = ducklings.slice(0, i);
            document.getElementById("trailDisplay").innerText = ducklings.length;
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, 400, 400);

    // Goal Nest
    ctx.font = "45px serif";
    ctx.fillText("🪺", nest.x - 22, nest.y + 15);

    // Enemies
    ctx.font = "30px serif";
    ctx.fillText("🐟", pikeFish.x - 15, pikeFish.y + 10);
    ctx.font = "45px serif";
    ctx.fillText("🐊", crocodile.x - 22, crocodile.y + 15);

    // Mama Swan
    ctx.save();
    ctx.translate(mamaDuck.x, mamaDuck.y);
    if (keys["ArrowLeft"] || keys["KeyA"]) ctx.scale(-1, 1);
    
    if (isBoosting) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "white";
    }
    
    ctx.font = "40px serif";
    ctx.fillText("🦢", -20, 15);
    ctx.restore();

    // Baby Trail
    ducklings.forEach(function(d, i) {
        let idx = (i + 1) * 15;
        if (history[idx]) {
            let bob = Math.sin(Date.now() * 0.01 + i) * 3;
            ctx.font = "20px serif";
            ctx.fillText("🐥", history[idx].x - 10, history[idx].y + 7 + bob);
        }
    });

    // Lost Egg/Baby
    ctx.font = "24px serif";
    ctx.fillText("🐣", lostDuckling.x - 12, lostDuckling.y + 10);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

spawnBaby();
loop();
