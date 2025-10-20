//Slime Definition
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

// Slime Properties
let initialPixelSize = 8;
let pixelSize = initialPixelSize;
let y, vy, g;
let ground;
let stretchX = 1, stretchY = 1;
let slimeX;
let moveSpeed = 1.5;
let jumpStrength = 18;
let moveDir = 0;

// Flower Properties
let flowerX, flowerY;
let isFlowerHeld = false;
let flowerRadius = 30;

// Game State
let slimeState = 'SEEKING';   // 'SEEKING', 'GROWING', 'PAUSED', 'SHRINKING', 'IDLE', 'POKED'
let growAmount = 2.0;
let targetPixelSize = 0;
let pauseTimer = 0;
let pauseDuration = 120;
let idleTimer = 0;
let idleDuration = 90;
let pokeTimer = 0;
let pokeDuration = 45;
let isPoweredUp = false;
let flowerEatCount = 0;
let maxEatCount = 10;

// Background Effects
let fireflies = [];
let numFireflies = 50;


function setup() {
  let canvas = createCanvas(750, 750);
  canvas.parent("p5-canvas-container");
  noStroke();

  y = 100;
  vy = 0;
  g = 0.8;
  ground = height - 150;
  slimeX = width / 2;

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

function draw() {
  background(15, 25, 10);

  drawFireflies();

  if (isFlowerHeld) {
    flowerX = mouseX;
    flowerY = mouseY;
  }

  if (slimeState === 'SEEKING' || slimeState === 'IDLE' || isFlowerHeld) {
    push();
    translate(flowerX, flowerY);
    drawFlower();
    pop();
  }

  updateSlime();
  drawSlime();
}

function handleStateSeeking() {
  let distanceX = flowerX - slimeX;
  let slimeWidth = slime[0].length * pixelSize;
  let slimeHeight = slime.length * pixelSize;
  let slimeCenterY = y + slimeHeight / 2;
  let distanceYFromCenter = flowerY - slimeCenterY;

  if (abs(distanceX) > 5) {
    moveDir = sign(distanceX);
  }

  let collisionZoneTop = slimeHeight * 0.2;
  if (distanceYFromCenter < -collisionZoneTop && abs(distanceX) < slimeWidth * 0.75 && abs(vy) < 1) {
    vy = -jumpStrength;
  }

  if (abs(distanceX) < slimeWidth * 0.15 && abs(distanceYFromCenter) < slimeHeight * 0.2) {
    isPoweredUp = true;
    targetPixelSize = pixelSize + growAmount;
    slimeState = 'GROWING';
    flowerEatCount++;
  }
}

function handleStateGrowing() {
  pixelSize = lerp(pixelSize, targetPixelSize, 0.1);
  if (abs(pixelSize - targetPixelSize) < 0.1) {
    pixelSize = targetPixelSize;
    pauseTimer = pauseDuration;
    slimeState = 'PAUSED';
  }
}

function handleStatePaused() {
  if (!isFlowerHeld) {
    pauseTimer--;
    if (pauseTimer <= 0) {
      isPoweredUp = false;
      if (flowerEatCount >= maxEatCount) {
        slimeState = 'SHRINKING';
      } else {
        idleTimer = idleDuration;
        spawnFlower();
        slimeState = 'IDLE';
      }
    }
  }
}

function handleStateShrinking() {
  pixelSize = lerp(pixelSize, initialPixelSize, 0.05);
  if (pixelSize - initialPixelSize < 0.1) {
    pixelSize = initialPixelSize;
    flowerEatCount = 0;
    idleTimer = idleDuration;
    spawnFlower();
    slimeState = 'IDLE';
  }
}

function handleStateIdle() {
  idleTimer--;
  if (idleTimer <= 0) {
    slimeState = 'SEEKING';
  }
}

function handleStatePoked() {
  pokeTimer--;
  if (pokeTimer <= 0) {
    slimeState = 'IDLE';
    idleTimer = idleDuration / 2;
  }
}

const stateActions = {
  'SEEKING': handleStateSeeking,
  'GROWING': handleStateGrowing,
  'PAUSED': handleStatePaused,
  'SHRINKING': handleStateShrinking,
  'IDLE': handleStateIdle,
  'POKED': handleStatePoked
};


function setup() {
  createCanvas(750, 750);
  noStroke();

  y = 100;
  vy = 0;
  g = 0.8;
  ground = height - 150;
  slimeX = width / 2;

  spawnFlower();

  for (let i = 0; i < numFireflies; i++) {
    fireflies.push({
      x: random(width), y: random(height),
      vx: random(-0.3, 0.3), vy: random(-0.3, 0.3),
      size: random(1, 3),
      flickerSpeed: random(0.01, 0.05),
      flickerOffset: random(TWO_PI)
    });
  }
}

function draw() {
  background(15, 25, 10);

  drawFireflies();

  if (isFlowerHeld) {
    flowerX = mouseX;
    flowerY = mouseY;
  }

  if (slimeState === 'SEEKING' || slimeState === 'IDLE' || isFlowerHeld) {
    push();
    translate(flowerX, flowerY);
    drawFlower();
    pop();
  }

  updateSlime();
  drawSlime();
}

function updateSlime() {
  moveDir = 0;

  const action = stateActions[slimeState];
  if (action) {
    action();
  }

  let wave = sin(frameCount * 0.05);
  let stretchMag = 0.1;

  if (slimeState === 'POKED') {
    let wobbleFrequency = 0.4;
    let maxWobble = 0.2;
    let currentWobble = map(pokeTimer, pokeDuration, 0, maxWobble, 0);
    stretchX = 1 + sin(frameCount * wobbleFrequency) * currentWobble;
    stretchY = 1 - sin(frameCount * wobbleFrequency) * currentWobble;
  } else if (moveDir !== 0) {
    slimeX += moveDir * moveSpeed * (1 + abs(wave) * 1.0);
    stretchX = 1 + stretchMag * wave * moveDir;
    stretchY = 1 - stretchMag * abs(wave) * 0.2;
  } else {
    stretchX = 1 + 0.05 * sin(frameCount * 0.05);
    stretchY = 1 - 0.05 * sin(frameCount * 0.05);
  }

  let currentWidth = slime[0].length * pixelSize;
  slimeX = constrain(slimeX, 50, width - 50);

  vy += g;
  y += vy;
  if (y + slime.length * pixelSize > ground) {
    y = ground - slime.length * pixelSize;
    vy *= -0.65;
  }
}

function drawSlime() {
  let slimeWidth = slime[0].length * pixelSize * stretchX;
  let startX = slimeX - slimeWidth / 2;

  let bodyColor;
  if (isPoweredUp) {
    let hue = (frameCount * 5) % 360;
    colorMode(HSB, 360, 100, 100);
    bodyColor = color(hue, 80, 100);
  } else {
    colorMode(RGB);
    bodyColor = color(120, 220, 140);
  }

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

  colorMode(RGB);

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

function drawFlower() {
  push();
  angleMode(DEGREES);
  colorMode(HSB, 360, 100, 100, 100);

  let baseHue = (frameCount * 0.1) % 360;
  let amplitude = map(sin(frameCount * 0.5), -1, 1, 5, 15);
  let baseFreq = map(cos(frameCount * 0.25), -1, 1, 3, 7);

  let numRings = 2;
  let baseRadius = 8;
  let radiusStep = 15;
  let freqStep = 3;
  let dotSize = 1.2;
  let hueStep = 30;

  for (let r = 0; r < numRings; r++) {
    let radius = baseRadius + r * radiusStep;
    let freq = baseFreq + r * freqStep;
    let hueVal = (baseHue + r * hueStep) % 360;
    fill(hueVal, 80, 100, 80);
    for (let a = 0; a < 360; a += 2) {
      let angle = a;
      let sinValue = sin(angle * freq) * amplitude;
      let radDist = radius + sinValue;
      let x = cos(angle) * radDist;
      let y = sin(angle) * radDist;
      circle(x, y, dotSize);
    }
  }

  for (let i = 40; i > 0; i -= 4) {
    fill((baseHue + 45) % 360, 70, 100, 4);
    circle(0, 0, i * 2.5);
  }

  angleMode(RADIANS);
  colorMode(RGB);
  pop();
}

function drawFireflies() {
  push();
  colorMode(HSB, 360, 100, 100, 100);
  for (let f of fireflies) {
    f.x += f.vx;
    f.y += f.vy;
    if (f.x < 0) f.x = width;
    if (f.x > width) f.x = 0;
    if (f.y < 0) f.y = height;
    if (f.y > height) f.y = 0;

    let flicker = sin(frameCount * f.flickerSpeed + f.flickerOffset);
    let brightness = map(flicker, -1, 1, 40, 100);
    let alpha = map(flicker, -1, 1, 30, 90);

    fill(90, 50, brightness, alpha * 0.5);
    circle(f.x, f.y, f.size * 2);
    fill(90, 50, brightness, alpha);
    circle(f.x, f.y, f.size);
  }
  colorMode(RGB);
  pop();
}

function spawnFlower() {
  let newX, newY;
  let slimeWidth = slime[0].length * pixelSize;
  let slimeHeight = slime.length * pixelSize;
  let safetyMargin = 50;
  let margin = 50;

  do {
    newX = random(margin, width - margin);
    newY = random(height / 2 - 200, ground - margin);
  } while (
    newX > slimeX - slimeWidth / 2 - safetyMargin &&
    newX < slimeX + slimeWidth / 2 + safetyMargin &&
    newY > y - safetyMargin &&
    newY < y + slimeHeight + safetyMargin
  );

  flowerX = newX;
  flowerY = newY;
}

function keyPressed() {
  if (key === ' ') {
    if (slimeState !== 'PAUSED' && slimeState !== 'GROWING' && slimeState !== 'POKED' && abs(vy) < 5) {
      vy = -jumpStrength;
    }
  }
}

function mousePressed() {
  let d = dist(mouseX, mouseY, flowerX, flowerY);
  if (d < flowerRadius) {
    isFlowerHeld = !isFlowerHeld;
    if (isFlowerHeld) {
      slimeState = 'PAUSED';
      pauseTimer = 0;
      idleTimer = 0;
    } else {
      slimeState = 'IDLE';
      idleTimer = idleDuration;
    }
    return;
  }

  let slimeW = slime[0].length * pixelSize;
  let slimeH = slime.length * pixelSize;
  if (mouseX > slimeX - slimeW / 2 && mouseX < slimeX + slimeW / 2 &&
    mouseY > y && mouseY < y + slimeH) {
    slimeState = 'POKED';
    pokeTimer = pokeDuration;
    return;
  }
}

function sign(n) {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}

function lerp(start, stop, amt) {
  return amt * (stop - start) + start;
}
