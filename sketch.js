/**
 * @file Sage Slime - An interactive generative creature simulation.
 * @author Created collaboratively with Gemini
 * @date 2025-10-14
 */

// === GLOBAL VARIABLES & CONFIGURATION ===

// --- Slime Definition ---
// Defines the pixel art for the slime creature.
let slime = [
  "................",
  "......XXXX......",
  "....XXXXXXXX....",
  "...XXXXXXXXXX...",
  "..XXXXXXXXXXXX..",
  "..XXXXXXXXXXXX..",
  ".XXXXXXXXXXXXXX.",
  ".XXXXXXXXXXXXXX.",
  ".XXXXXXXXXXXXXX.",
  ".XXXXXXXXXXXXXX.",
  ".XXXXXXXXXXXXXX.",
  "..XXXXXXXXXXXX..",
  "...XXXXXXXXXX...",
  "      XX..XX    ",
  "      XX..XX    ",
  "................"
];

// --- Slime Properties ---
let initialPixelSize = 8;     // The starting size of each "pixel" of the slime.
let pixelSize = initialPixelSize; // The current size, which changes as the slime grows.
let y, vy, g;                 // Vertical position, velocity, and gravity.
let ground;                   // The Y-coordinate of the ground.
let stretchX = 1, stretchY = 1; // Animation variables for stretching and squashing.
let slimeX;                   // The slime's horizontal center position.
let moveSpeed = 1.5;          // The base movement speed.
let jumpStrength = 18;        // The initial upward velocity when jumping.
let moveDir = 0;              // The current movement direction: -1 (left), 0 (still), 1 (right).

// --- Flower Properties ---
let flowerX, flowerY;         // The flower's position.
let isFlowerHeld = false;     // Tracks if the user is currently dragging the flower.
let flowerRadius = 30;        // The clickable area around the flower's center.

// --- Game State ---
let slimeState = 'SEEKING';   // The slime's current behavior state: 'SEEKING', 'GROWING', 'PAUSED', 'IDLE'.
let growAmount = 2.0;         // How much `pixelSize` increases after eating a flower.
let targetPixelSize = 0;      // The target size the slime is growing towards.
let pauseTimer = 0;           // A countdown timer for the 'PAUSED' state.
let pauseDuration = 120;      // How long the pause lasts in frames (120 frames ≈ 2 seconds).
let idleTimer = 0;            // A countdown timer for the 'IDLE' state.
let idleDuration = 90;        // How long the idle "thinking" period lasts (90 frames ≈ 1.5 seconds).
let isPoweredUp = false;      // Toggles the slime's rainbow color effect.

// --- Background Effects ---
let fireflies = [];           // An array to hold all firefly particle objects.
let numFireflies = 50;        // The total number of fireflies in the scene.


/**
 * p5.js setup function, runs once at the start.
 * Initializes the canvas and all game objects.
 */
function setup() {
  let canvas = createCanvas(750, 750);
  canvas.parent("p5-canvas-container");
  noStroke();
  
  // Initialize slime's physical properties.
  y = 100;
  vy = 0;
  g = 0.8;
  ground = height - 150;
  slimeX = width / 2;

  // Create the first flower and the firefly particles.
  spawnFlower();
  
  for (let i = 0; i < numFireflies; i++) {
    fireflies.push({
      x: random(width),
      y: random(height),
      vx: random(-0.3, 0.3),
      vy: random(-0.3, 0.3),
      size: random(1, 3),
      flickerSpeed: random(0.01, 0.05),
      flickerOffset: random(TWO_PI)
    });
  }
}

/**
 * p5.js draw function, runs continuously in a loop.
 * The main engine of the simulation, rendering the scene and updating states.
 */
function draw() {
  background(15, 25, 10); // A dark, forest-like background color.
  
  drawFireflies();

  // If the flower is being dragged by the user, update its position to the mouse.
  if (isFlowerHeld) {
    flowerX = mouseX;
    flowerY = mouseY;
  }

  // The flower is only visible when the slime is looking for it, is idle, or when held.
  if (slimeState === 'SEEKING' || slimeState === 'IDLE' || isFlowerHeld) {
    push();
    translate(flowerX, flowerY);
    drawFlower();
    pop();
  }
  
  // Update all game logic, then render the slime.
  updateSlime();
  drawSlime();
}

/**
 * Handles all non-visual logic for the slime.
 * This includes its state machine, AI, physics, and animation parameter calculations.
 */
function updateSlime() {
  // Reset movement direction at the start of each frame.
  moveDir = 0;

  // --- State Machine ---
  // The slime's behavior is determined by its current state.
  switch (slimeState) {
    case 'SEEKING':
      let distanceX = flowerX - slimeX;
      let slimeWidth = slime[0].length * pixelSize;
      let slimeHeight = slime.length * pixelSize;
      let slimeCenterY = y + slimeHeight / 2;
      let distanceYFromCenter = flowerY - slimeCenterY;

      // Horizontal AI: Move towards the flower.
      if (abs(distanceX) > 5) {
        moveDir = sign(distanceX);
      }
      
      // Vertical AI: Jump only if the flower is out of standing reach and the slime is below it.
      let collisionZoneTop = slimeHeight * 0.2;
      if (distanceYFromCenter < -collisionZoneTop && abs(distanceX) < slimeWidth * 0.75 && abs(vy) < 1) {
        vy = -jumpStrength;
      }

      // Collision Detection: If the flower is within the slime's core.
      if (abs(distanceX) < slimeWidth * 0.15 && abs(distanceYFromCenter) < slimeHeight * 0.2) {
        isPoweredUp = true;
        targetPixelSize = pixelSize + growAmount;
        slimeState = 'GROWING';
      }
      break;
      
    case 'GROWING':
      // Smoothly grow towards the target size.
      pixelSize = lerp(pixelSize, targetPixelSize, 0.1);
      if (abs(pixelSize - targetPixelSize) < 0.1) {
        pixelSize = targetPixelSize; // Snap to final size.
        pauseTimer = pauseDuration;
        slimeState = 'PAUSED';
      }
      break;
      
    case 'PAUSED':
      // The slime pauses (and breathes) while colored.
      if (!isFlowerHeld) {
        pauseTimer--;
        if (pauseTimer <= 0) {
          isPoweredUp = false; // Return to green.
          idleTimer = idleDuration;
          spawnFlower();
          slimeState = 'IDLE';
        }
      }
      break;

    case 'IDLE':
      // The slime waits for a moment before starting its next hunt.
      idleTimer--;
      if (idleTimer <= 0) {
        slimeState = 'SEEKING';
      }
      break;
  }
  
  // --- Reset Logic ---
  // If the slime grows too large, it resets to its initial state.
  if (pixelSize * slime[0].length > width * 1.5) {
    pixelSize = initialPixelSize;
    isPoweredUp = false;
    slimeState = 'SEEKING';
    slimeX = width / 2;
  }
  
  // --- Animation & Physics Calculation ---
  let wave = sin(frameCount * 0.05);
  let stretchMag = 0.1;

  if (moveDir !== 0) {
    // Moving animation: wave-like crawl and stretch.
    slimeX += moveDir * moveSpeed * (1 + abs(wave) * 1.0);
    stretchX = 1 + stretchMag * wave * moveDir;
    stretchY = 1 - stretchMag * abs(wave) * 0.2;
  } else {
    // Idle animation: gentle breathing.
    stretchX = 1 + 0.05 * sin(frameCount * 0.05);
    stretchY = 1 - 0.05 * sin(frameCount * 0.05);
  }

  let currentWidth = slime[0].length * pixelSize;
  slimeX = constrain(slimeX, currentWidth / 2, width - currentWidth / 2);

  // Apply gravity and handle ground bouncing.
  vy += g;
  y += vy;
  if (y + slime.length * pixelSize > ground) {
    y = ground - slime.length * pixelSize;
    vy *= -0.65;
  }
}

/**
 * Renders the slime to the canvas based on its current properties.
 */
function drawSlime() {
  let slimeWidth = slime[0].length * pixelSize * stretchX;
  let startX = slimeX - slimeWidth / 2;
  
  // Determine body color based on the 'powered up' state.
  let bodyColor;
  if (isPoweredUp) {
    let hue = (frameCount * 5) % 360;
    colorMode(HSB, 360, 100, 100);
    bodyColor = color(hue, 80, 100);
  } else {
    colorMode(RGB);
    bodyColor = color(120, 220, 140);
  }

  // Draw the slime's body, pixel by pixel.
  for (let row = 0; row < slime.length; row++) {
    let waveOffset = sin(frameCount * 0.1 + row * 0.5) * pixelSize * 0.25 * moveDir;
    for (let col = 0; col < slime[row].length; col++) {
      if (slime[row][col] !== "X") continue;
      fill(bodyColor);
      rect(
        startX + col * pixelSize * stretchX + waveOffset,
        y + row * pixelSize * stretchY,
        pixelSize * stretchX,
        pixelSize * stretchY
      );
    }
  }
  
  colorMode(RGB); // Ensure color mode is reset for other elements.

  // Draw the eyes and eyebrows, which scale with the slime's size.
  let eyeY = y + 8 * pixelSize * stretchY;
  let eyeLX = startX + 8 * pixelSize * stretchX;
  let eyeRX = startX + 12 * pixelSize * stretchX;
  
  fill(255);
  ellipse(eyeLX, eyeY, pixelSize * 2.5, pixelSize * 2.5);
  ellipse(eyeRX, eyeY, pixelSize * 2.5, pixelSize * 2.5);

  let pupilSize = pixelSize * 1.5;
  let radius = pixelSize * 0.5;

  let angleL = atan2(mouseY - eyeY, mouseX - eyeLX);
  let pxL = eyeLX + cos(angleL) * radius;
  let pyL = eyeY + sin(angleL) * radius;
  fill(155);
  ellipse(pxL, pyL, pupilSize, pupilSize);
  fill(255);
  let highlightSize = pupilSize / 3;
  ellipse(pxL - highlightSize * 0.5, pyL - highlightSize * 0.5, highlightSize, highlightSize);

  let angleR = atan2(mouseY - eyeY, mouseX - eyeRX);
  let pxR = eyeRX + cos(angleR) * radius;
  let pyR = eyeY + sin(angleR) * radius;
  fill(155);
  ellipse(pxR, pyR, pupilSize, pupilSize);
  fill(255);
  ellipse(pxR - highlightSize * 0.5, pyR - highlightSize * 0.5, highlightSize, highlightSize);

  let offsetY = map(mouseY - eyeY, -100, 100, -pixelSize, pixelSize);
  offsetY = constrain(offsetY, -pixelSize, pixelSize);
  stroke(155);
  strokeWeight(pixelSize * 0.4);
  let eyeTop = eyeY - pixelSize * 1.8;
  line(eyeLX - pixelSize, eyeTop + offsetY, eyeLX + pixelSize, eyeTop + offsetY - pixelSize * 0.2);
  line(eyeRX - pixelSize, eyeTop + offsetY - pixelSize * 0.2, eyeRX + pixelSize, eyeTop + offsetY);
  noStroke();
}

/**
 * Renders a single animated flower with a glowing halo.
 */
function drawFlower() {
  push();
  angleMode(DEGREES);
  colorMode(HSB, 360, 100, 100, 100);

  // Calculate animation parameters for this frame.
  let baseHue = (frameCount * 0.1) % 360;
  let amplitude = map(sin(frameCount * 0.5), -1, 1, 5, 15);
  let baseFreq = map(cos(frameCount * 0.25), -1, 1, 3, 7);

  // Define the flower's structure.
  let numRings = 2;
  let baseRadius = 20;
  let radiusStep = 25;
  let freqStep = 3;
  let dotSize = 1.2;
  let hueStep = 30;

  // Draw the flower's petals.
  for (let r = 0; r < numRings; r++) {
    let radius = baseRadius + r * radiusStep;
    let freq = baseFreq + r * freqStep;
    let hueVal = (baseHue + r * hueStep) % 360;
    fill(hueVal, 80, 100, 80);
    for (let a = 0; a < 360; a += 0.5) {
      let angle = a;
      let sinValue = sin(angle * freq) * amplitude;
      let radDist = radius + sinValue;
      let x = cos(angle) * radDist;
      let y = sin(angle) * radDist;
      circle(x, y, dotSize);
    }
  }

  // Draw the flower's glowing halo.
  for (let i = 40; i > 0; i -= 4) {
    fill((baseHue + 45) % 360, 70, 100, 4);
    circle(0, 0, i * 2.5);
  }
  
  // Restore original drawing modes.
  angleMode(RADIANS);
  colorMode(RGB);
  pop();
}

/**
 * Updates and renders the background firefly particle system.
 */
function drawFireflies() {
  push();
  colorMode(HSB, 360, 100, 100, 100);
  for (let f of fireflies) {
    // Update position and wrap around edges.
    f.x += f.vx;
    f.y += f.vy;
    if (f.x < 0) f.x = width;
    if (f.x > width) f.x = 0;
    if (f.y < 0) f.y = height;
    if (f.y > height) f.y = 0;

    // Calculate flickering brightness and alpha.
    let flicker = sin(frameCount * f.flickerSpeed + f.flickerOffset);
    let brightness = map(flicker, -1, 1, 40, 100);
    let alpha = map(flicker, -1, 1, 30, 90);

    // Render with a soft halo effect.
    fill(90, 50, brightness, alpha * 0.5);
    circle(f.x, f.y, f.size * 2);
    fill(90, 50, brightness, alpha);
    circle(f.x, f.y, f.size);
  }
  colorMode(RGB);
  pop();
}

/**
 * Generates a new flower at a random position, ensuring it doesn't
 * spawn inside the slime's current bounding box.
 */
function spawnFlower() {
  let newX, newY;
  let slimeWidth = slime[0].length * pixelSize;
  let slimeHeight = slime.length * pixelSize;
  let safetyMargin = 50;
  let margin = 50;

  do {
    // Generate a candidate position.
    newX = random(margin, width - margin);
    newY = random(height / 2 - 200, ground - margin);
    // Loop until the position is outside the slime's area.
  } while (
    newX > slimeX - slimeWidth / 2 - safetyMargin &&
    newX < slimeX + slimeWidth / 2 + safetyMargin &&
    newY > y - safetyMargin &&
    newY < y + slimeHeight + safetyMargin
  );

  flowerX = newX;
  flowerY = newY;
}

/**
 * Handles all mouse click interactions.
 * This function decides whether to grab the flower or make the slime jump.
 */
function mousePressed() {
  // Check if the click was on the flower first.
  let d = dist(mouseX, mouseY, flowerX, flowerY);
  if (d < flowerRadius) {
    isFlowerHeld = !isFlowerHeld; // Toggle held state.
    if (isFlowerHeld) {
      // If grabbed, force the slime to pause.
      slimeState = 'PAUSED';
      pauseTimer = 0; 
      idleTimer = 0;
    } else {
      // If dropped, force the slime to enter its idle/thinking state.
      slimeState = 'IDLE';
      idleTimer = idleDuration;
    }
    return; // Stop further actions if the flower was clicked.
  }

  // If the flower wasn't clicked, perform a jump if the slime is able.
  if (slimeState !== 'PAUSED' && slimeState !== 'GROWING' && abs(vy) < 5) {
    vy = -jumpStrength;
  }
}

/**
 * A helper function that returns the sign of a number.
 * @param {number} n The input number.
 * @returns {number} -1 if n is negative, 1 if n is positive, 0 if n is zero.
 */
function sign(n) {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}

/**
 * A helper function for linear interpolation.

 */
function lerp(start, stop, amt) {
  return amt * (stop - start) + start;
}