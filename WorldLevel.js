class WorldLevel {
  constructor(json) {
    this.schemaVersion = json.schemaVersion ?? 1;

    this.w = json.world?.w ?? 2400;
    this.h = json.world?.h ?? 1600;
    this.bg = json.world?.bg ?? [235, 235, 235];
    this.gridStep = json.world?.gridStep ?? 160;

    this.obstacles = json.obstacles ?? [];

    // NEW: camera tuning knob from JSON (data-driven)
    this.camLerp = json.camera?.lerp ?? 0.12;
    
    // Generate random stars for the night sky across entire world
    this.stars = this.generateStars(500);
    
    // Generate yellow swirls for atmosphere
    this.swirls = this.generateSwirls(80);
    
    // Generate 5 large prominent yellow stars
    this.largeStars = this.generateLargeStars(5);
    
    // Generate celestial items below each star
    this.celestialItems = this.generateCelestialItems();
    
    // Player reference for visibility checks
    this.player = null;
    
    // Camera position for reveal checks
    this.cameraX = 0;
    this.cameraY = 0;
    
    // Track which stars have been revealed
    this.revealedStars = new Set();
  }
  
  generateStars(count) {
    let stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: random(this.w),
        y: random(this.h),
        size: random(2, 6),
        brightness: random(200, 255),
        glowSize: random(8, 20),
        twinkleSpeed: random(0.02, 0.08),
        phase: random(TWO_PI)
      });
    }
    return stars;
  }
  
  generateSwirls(count) {
    let swirls = [];
    for (let i = 0; i < count; i++) {
      swirls.push({
        x: random(this.w),
        y: random(this.h),
        radius: random(8, 20),
        opacity: random(40, 100),
        speed: random(0.01, 0.025),
        rotation: random(TWO_PI),
        tightness: random(8, 14)
      });
    }
    return swirls;
  }
  
  generateLargeStars(count) {
    let largeStars = [];
    let positions = [];
    
    // Generate vertically spread large stars positioned close together horizontally
    for (let i = 0; i < count; i++) {
      let x, y, validPosition;
      do {
        // Keep X values close together (near the center horizontally)
        x = random(this.w * 0.4, this.w * 0.6);
        // Spread Y values across the full canvas vertically
        y = random(200, this.h - 200);
        validPosition = true;
        
        // Check distance from other large stars
        for (let pos of positions) {
          if (dist(x, y, pos.x, pos.y) < 300) {
            validPosition = false;
            break;
          }
        }
      } while (!validPosition);
      
      positions.push({ x, y });
      largeStars.push({
        x: x,
        y: y,
        size: random(12, 24),
        brightness: 255,
        glowSize: random(40, 60),
        twinkleSpeed: random(0.01, 0.04),
        phase: random(TWO_PI)
      });
    }
    return largeStars;
  }
  
  generateCelestialItems() {
    const items = [
      { x: this.largeStars[0].x, y: this.largeStars[0].y + 100, type: 'moon' },
      { x: this.largeStars[1].x, y: this.largeStars[1].y + 100, type: 'purple-cloud' },
      { x: this.largeStars[2].x, y: this.largeStars[2].y + 100, type: 'venus' },
      { x: this.largeStars[3].x, y: this.largeStars[3].y + 100, type: 'orange-cloud' },
      { x: this.largeStars[4].x, y: this.largeStars[4].y + 100, type: 'neptune' }
    ];
    return items;
  }

  drawBackground() {
    background(220);
  }

  drawWorld() {
    // Indigo blue night sky background
    noStroke();
    fill(25, 20, 80);
    rect(0, 0, this.w, this.h);
    
    // Draw yellow swirls for atmosphere and escapism
    for (const swirl of this.swirls) {
      push();
      translate(swirl.x, swirl.y);
      rotate(frameCount * swirl.speed + swirl.rotation);
      
      noFill();
      stroke(255, 220, 100, swirl.opacity);
      strokeWeight(1.5);
      
      // Draw tight spiral swirl pattern
      beginShape();
      for (let i = 0; i < TWO_PI; i += 0.15) {
        let x = cos(i) * swirl.radius * sin(i / TWO_PI * swirl.tightness);
        let y = sin(i) * swirl.radius * sin(i / TWO_PI * swirl.tightness);
        vertex(x, y);
      }
      endShape();
      
      pop();
    }

    // Draw regular twinkling stars
    for (const star of this.stars) {
      // Calculate twinkling effect
      let twinkle = sin(frameCount * star.twinkleSpeed + star.phase) * 0.5 + 0.5;
      let currentOpacity = star.brightness * twinkle;
      
      push();
      translate(star.x, star.y);
      
      // Draw glow halo
      fill(100, 150, 255, 30 * twinkle);
      noStroke();
      circle(0, 0, star.glowSize);
      
      // Draw bright star shape
      fill(255, 255, 255, currentOpacity);
      this.drawStar(0, 0, star.size * 1.5, star.size * 0.6, 5);
      
      // Add a subtle inner glow
      fill(200, 220, 255, 100 * twinkle);
      this.drawStar(0, 0, star.size * 0.8, star.size * 0.3, 5);
      
      pop();
    }
    
    // Draw celestial items BEHIND the large stars
    if (this.player) {
      for (let i = 0; i < this.celestialItems.length; i++) {
        const item = this.celestialItems[i];
        const star = this.largeStars[i];
        // Draw if PLAYER is very close to star center (within 50 pixels)
        if (dist(this.player.x, this.player.y, star.x, star.y) < 50) {
          switch(item.type) {
            case 'moon':
              this.drawMoon(item.x, item.y);
              break;
            case 'purple-cloud':
              this.drawPurpleCloud(item.x, item.y);
              break;
            case 'venus':
              this.drawVenus(item.x, item.y);
              break;
            case 'orange-cloud':
              this.drawOrangeCloud(item.x, item.y);
              break;
            case 'neptune':
              this.drawNeptune(item.x, item.y);
              break;
          }
        }
      }
    }
    
    // Draw large yellow stars - always visible
    for (let i = 0; i < this.largeStars.length; i++) {
      const star = this.largeStars[i];
      
      // Mark as revealed if PLAYER is very close to star center (within 50 pixels)
      if (this.player && dist(this.player.x, this.player.y, star.x, star.y) < 50) {
        this.revealedStars.add(i);
      }
      
      // Always draw the star
      // Calculate twinkling effect
      let twinkle = sin(frameCount * star.twinkleSpeed + star.phase) * 0.5 + 0.5;
      let currentOpacity = star.brightness * twinkle;
      
      push();
      translate(star.x, star.y);
      
      // Draw golden yellow glow halo
      fill(255, 200, 100, 40 * twinkle);
      noStroke();
      circle(0, 0, star.glowSize);
      
      // Draw bright yellow star shape
      fill(255, 240, 100, currentOpacity);
      this.drawStar(0, 0, star.size * 1.5, star.size * 0.6, 5);
      
      // Add a warm inner glow
      fill(255, 255, 200, 120 * twinkle);
      this.drawStar(0, 0, star.size * 0.8, star.size * 0.3, 5);
      
      pop();
    }
  }
  
  drawStar(x, y, radius1, radius2, points) {
    beginShape();
    for (let i = 0; i < points * 2; i++) {
      let radius = i % 2 === 0 ? radius1 : radius2;
      let angle = TWO_PI / (points * 2) * i - PI / 2;
      let sx = x + cos(angle) * radius;
      let sy = y + sin(angle) * radius;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
  
  drawMoon(x, y) {
    push();
    noStroke();
    fill(240, 235, 220);
    circle(x, y, 40);
    
    // Draw crescent by covering part with background color
    fill(25, 20, 80);
    circle(x + 10, y, 40);
    
    pop();
  }
  
  drawPurpleCloud(x, y) {
    push();
    noStroke();
    fill(180, 150, 220, 200);
    
    // Draw swirling cloud shape
    circle(x - 20, y - 15, 25);
    circle(x + 5, y - 25, 30);
    circle(x + 25, y - 15, 25);
    circle(x + 10, y + 5, 28);
    circle(x - 5, y + 10, 20);
    
    pop();
  }
  
  drawVenus(x, y) {
    push();
    noStroke();
    
    // Bright glow
    fill(255, 250, 150, 80);
    circle(x, y, 50);
    
    // Bright pale yellow circle
    fill(255, 250, 180);
    circle(x, y, 30);
    
    pop();
  }
  
  drawOrangeCloud(x, y) {
    push();
    noStroke();
    fill(255, 180, 100, 80);
    
    // Hazy cloud shape
    circle(x - 15, y, 35);
    circle(x + 10, y - 10, 30);
    circle(x + 20, y + 5, 25);
    circle(x, y + 15, 28);
    
    pop();
  }
  
  drawNeptune(x, y) {
    push();
    noStroke();
    
    // Multiple blue layers for Neptune
    fill(100, 180, 255, 100);
    circle(x, y, 50);
    
    fill(80, 150, 220, 150);
    circle(x, y, 38);
    
    fill(120, 180, 255);
    circle(x, y, 28);
    
    // Add some subtle swirls
    stroke(100, 160, 240, 100);
    strokeWeight(2);
    noFill();
    circle(x - 8, y - 5, 15);
    circle(x + 10, y + 8, 12);
    
    pop();
  }

  drawHUD(player, camX, camY) {
    noStroke();
    fill(255, 255, 255);
    text("The Star-Filled Experience", 12, 20);
    text(
      "camLerp(JSON): " +
        this.camLerp +
        "  Player: " +
        (player.x | 0) +
        "," +
        (player.y | 0) +
        "  Cam: " +
        (camX | 0) +
        "," +
        (camY | 0),
      12,
      40,
    );
  }
}
