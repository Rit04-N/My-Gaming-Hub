function update() {
        if (isPaused) return;

        // ... (Keep movement and boost logic the same) ...

        // Crocodile Movement
        crocodile.x += crocodile.speed;
        if (crocodile.x < -100) { 
            crocodile.x = 500; 
            crocodile.y = 50 + Math.random() * 300; 
        }

        // --- NEW PREDATOR LOGIC ---

        // 1. Check if Crocodile eats Mama Swan
        if (Math.hypot(mamaDuck.x - crocodile.x, mamaDuck.y - crocodile.y) < 30) {
            gameOver("The Crocodile caught you!");
            return;
        }

        // 2. Check if Crocodile eats Ducklings in the trail
        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx]) {
                let distToCroc = Math.hypot(history[idx].x - crocodile.x, history[idx].y - crocodile.y);
                if (distToCroc < 25) {
                    // Crocodile eats the duckling and everything behind it!
                    ducklings = ducklings.slice(0, i);
                    document.getElementById("trailDisplay").innerText = ducklings.length;
                }
            }
        });

        // 3. Pike Fish still breaks the line (as before)
        pikeFish.x += pikeFish.speed;
        if (pikeFish.x > 450) { 
            pikeFish.x = -50; 
            pikeFish.y = 50 + Math.random() * 300; 
        }
        
        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx] && Math.hypot(history[idx].x - pikeFish.x, history[idx].y - pikeFish.y) < 20) {
                ducklings = ducklings.slice(0, i);
                document.getElementById("trailDisplay").innerText = ducklings.length;
            }
        });

        // ... (Keep pickup and delivery logic) ...
    }
