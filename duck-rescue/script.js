document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 400;
    canvas.height = 400;

    // Game Variables
    let mamaDuck = { x: 200, y: 200, baseSpeed: 3, boostSpeed: 7 };
    let ducklings = [];
    let lostDuckling = { x: 100, y: 100 };
    let history = []; // Path history for ducklings to follow
    let nest = { x: 340, y: 60, size: 40 };
    let score = 0;
    let highScore = localStorage.getItem("duckRescueHighScore") || 0;
    let isPaused = true; 
    let boostStamina = 100;
    let isBoosting = false;

    // Enemies
    let pikeFish = { x: -50, y: 150, speed: 2.2 };
    let crocodile = { x: 500, y: 300, speed: -1.0 };

    // Update Initial UI
    document.getElementById("highScoreDisplay").innerText = highScore;

    // --- CONTROLS ---
    let keys = {};
    window.addEventListener("keydown", (e) => { 
        keys[e.code] = true; 
        if(e.code === "Space") isBoosting = true;
    });
    window.addEventListener("keyup", (e) => { 
        keys[e.code] = false; 
        if(e.code === "Space") isBoosting = false;
    });

    // Mobile Swipe Logic
    let touchStartX = null;
    let touchStartY = null;

    canvas.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        
        // Tap Swan for Boost Check
        const rect = canvas.getBoundingClientRect();
        let tx = (touchStartX - rect.left) * (canvas.width / rect.width);
        let ty = (touchStartY - rect.top) * (canvas.height / rect.height);
        if(Math.hypot(mamaDuck.x - tx, mamaDuck.y - ty) < 50) isBoosting = true;
    }, {passive: false});

    canvas.addEventListener("touchmove", (e) => {
        if (!touchStartX || !touchStartY) return;
        e.preventDefault();
        let touchEndX = e.touches[0].clientX;
        let touchEndY = e.touches[0].clientY;
        
        keys["ArrowLeft"] = touchEndX < touchStartX - 20;
        keys["ArrowRight"] = touchEndX > touchStartX + 20;
        keys["ArrowUp"] = touchEndY < touchStartY - 20;
        keys["ArrowDown"] = touchEndY > touchStartY + 20;
    }, {passive: false});

    canvas.addEventListener("touchend", () => { 
        isBoosting = false; 
        keys = {}; 
        touchStartX = null; touchStartY = null; 
    });

    // Global UI Functions attached to window for HTML buttons
    window.togglePause = function() {
        isPaused = !isPaused;
        const overlay = document.getElementById("statusOverlay");
        if (overlay) {
            overlay.style.display = isPaused ? "flex" : "none";
            document.getElementById("statusTitle").innerText = "PAUSED";
            document.getElementById("highScoreText").innerText = "Best Rescue: " + highScore;
        }
    };

    window.quack = function() { 
        pikeFish.x = -150; // Scares the fish away temporarily
    };

    function spawnBaby() {
        lostDuckling.x = 40 + Math.random() * 320;
        lostDuckling.y = 40 + Math.random() * 320;
    }

    // --- ENGINE ---
    function update() {
        if (isPaused) return;

        // Boost/Stamina Logic
        let currentSpeed = (isBoosting && boostStamina > 0) ? mamaDuck.boostSpeed : mamaDuck.baseSpeed;
        if (isBoosting && boostStamina > 0) {
            boostStamina -= 1.5;
        } else {
            isBoosting = false;
            if (boostStamina < 100) boostStamina += 0.5;
        }
        document.getElementById("boostBar").style.width = boostStamina + "%";

        // Movement
        if (keys["ArrowUp"] || keys["KeyW"]) mamaDuck.y -= currentSpeed;
        if (keys["ArrowDown"] || keys["KeyS"]) mamaDuck.y += currentSpeed;
        if (keys["ArrowLeft"] || keys["KeyA"]) mamaDuck.x -= currentSpeed;
        if (keys["ArrowRight"] || keys["KeyD"]) mamaDuck.x += currentSpeed;

        // Boundary Clamp
        mamaDuck.x = Math.max(20, Math.min(380, mamaDuck.x));
        mamaDuck.y = Math.max(20, Math.min(380, mamaDuck.y));

        // Record History for Trail
        history.unshift({x: mamaDuck.x, y: mamaDuck.y});
        if (history.length > 200) history.pop();

        // Enemy AI
        pikeFish.x += pikeFish.speed;
        if (pikeFish.x > 450) { pikeFish.x = -50; pikeFish.y = 50 + Math.random() * 300; }
        crocodile.x += crocodile.speed;
        if (crocodile.x < -100) { crocodile.x = 500; crocodile.y = 50 + Math.random() * 300; }

        // Pick up Baby
        if (Math.hypot(mamaDuck.x - lostDuckling.x, mamaDuck.y - lostDuckling.y) < 25) {
            ducklings.push({});
            spawnBaby();
            document.getElementById("trailDisplay").innerText = ducklings.length;
        }

        // Deliver to Nest
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

        // Pike Fish Line Break Logic
        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx] && Math.hypot(history[idx].x - pikeFish.x, history[idx].y - pikeFish.y) < 20) {
                ducklings = ducklings.slice(0, i);
                document.getElementById("trailDisplay").innerText = ducklings.length;
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, 400, 400);

        // Draw Nest
        ctx.font = "45px serif";
        ctx.textAlign = "center";
        ctx.fillText("🪺", nest.x, nest.y + 15); 

        // Draw Enemies
        ctx.font = "30px serif";
        ctx.fillText("🐟", pikeFish.x, pikeFish.y); 
        ctx.font = "45px serif";
        ctx.fillText("🐊", crocodile.x, crocodile.y); 

        // Draw Mama Swan
        ctx.save();
        ctx.translate(mamaDuck.x, mamaDuck.y);
        if (keys["ArrowLeft"] || keys["KeyA"]) ctx.scale(-1, 1);
        if (isBoosting) { ctx.shadowBlur = 15; ctx.shadowColor = "white"; }
        ctx.font = "40px serif";
        ctx.fillText("🦢", 0, 15);
        ctx.restore();

        // Draw Duckling Trail
        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx]) {
                let bob = Math.sin(Date.now() * 0.01 + i) * 3;
                ctx.font = "20px serif";
                ctx.fillText("🐥", history[idx].x, history[idx].y + 7 + bob);
            }
        });
        
        // Draw the Lost Baby
        ctx.font = "24px serif";
        ctx.fillText("🐣", lostDuckling.x, lostDuckling.y + 10); 
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }
    
    spawnBaby();
    loop();
});
