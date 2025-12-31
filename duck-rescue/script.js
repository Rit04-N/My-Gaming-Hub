const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;

// Game Settings
let mamaDuck = { x: 200, y: 200 };
let target = { x: 200, y: 200 };
let ducklings = [];
let lostDuckling = { x: 100, y: 100 };
let history = [];
let nest = { x: 340, y: 60, size: 40 };
let score = 0;
let highScore = localStorage.getItem("duckRescueHighScore") || 0;
let isPaused = false;

// Enemies
let pikeFish = { x: -50, y: 150, speed: 2.2 };
let crocodile = { x: 500, y: 300, speed: -1.0 };

// Setup Displays
document.getElementById("highScoreDisplay").innerText = highScore;

// --- INPUTS ---
function updateTarget(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    target.x = (clientX - rect.left) * (canvas.width / rect.width);
    target.y = (clientY - rect.top) * (canvas.height / rect.height);
}

canvas.addEventListener("mousemove", updateTarget);
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); updateTarget(e); }, {passive: false});

function togglePause() {
    isPaused = !isPaused;
    document.getElementById("statusOverlay").style.display = isPaused ? "flex" : "none";
    document.getElementById("highScoreText").innerText = "Best Rescue: " + highScore;
}

function quack() {
    // Scare effect: moves pike fish back to start
    pikeFish.x = -100;
}

function spawnBaby() {
    lostDuckling.x = 40 + Math.random() * 320;
    lostDuckling.y = 40 + Math.random() * 320;
}

// --- CORE ENGINE ---
function update() {
    if (isPaused) return;

    // Mama Movement
    mamaDuck.x += (target.x - mamaDuck.x) * 0.1;
    mamaDuck.y += (target.y - mamaDuck.y) * 0.1;

    // History for trail
    history.unshift({x: mamaDuck.x, y: mamaDuck.y});
    if (history.length > 200) history.pop();

    // Pike Fish (The Thief)
    pikeFish.x += pikeFish.speed;
    if (pikeFish.x > 450) {
        pikeFish.x = -50;
        pikeFish.y = 50 + Math.random() * 300;
    }

    // Crocodile (The Wall)
    crocodile.x += crocodile.speed;
    if (crocodile.x < -100) {
        crocodile.x = 500;
        crocodile.y = 50 + Math.random() * 300;
    }

    // Collect Baby
    if (Math.hypot(mamaDuck.x - lostDuckling.x, mamaDuck.y - lostDuckling.y) < 25) {
        ducklings.push({});
        spawnBaby();
        document.getElementById("trailDisplay").innerText = ducklings.length;
    }

    // Nest Delivery
    if (Math.hypot(mamaDuck.x - nest.x, mamaDuck.y - nest.y) < nest.size) {
        if (ducklings.length > 0) {
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
    }

    // Fish hits trail
    ducklings.forEach((_, i) => {
        let idx = (i + 1) * 15;
        if (history[idx] && Math.hypot(history[idx].x - pikeFish.x, history[idx].y - pikeFish.y) < 20) {
            ducklings = ducklings.slice(0, i); // Scares away tail
            document.getElementById("trailDisplay").innerText = ducklings.length;
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, 400, 400);

    // Goal
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
    if (target.x < mamaDuck.x) ctx.scale(-1, 1);
    ctx.font = "40px serif";
    ctx.fillText("🦢", -20, 15);
    ctx.restore();

    // Babies
    ducklings.forEach((_, i) => {
        let idx = (i + 1) * 15;
        if (history[idx]) {
            let bob = Math.sin(Date.now() * 0.01 + i) * 3;
            ctx.font = "20px serif";
            ctx.fillText("🐥", history[idx].x - 10, history[idx].y + 7 + bob);
        }
    });

    // Lost Baby
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
