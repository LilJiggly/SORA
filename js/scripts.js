const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } =
  Matter;

// Engine and renderer setup
const engine = Engine.create();
// Letters fall to the bottom, but gently: light gravity + soft, low-drag bodies
// so they stay floaty when thrown around.
const FLOAT_GRAVITY = 0.5;
engine.world.gravity.y = FLOAT_GRAVITY;

const render = Render.create({
  element: document.getElementById("canvas-container"),
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent",
    showDebug: false,
    showBroadphase: false,
    showBounds: false,
    showVelocity: false,
    showAngleIndicator: false,
    showCollisions: false,
  },
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Freeze mode (F): everything holds still (no gravity, no motion, no bumping
// into each other) but you can still drag items around to place them.
let frozen = false;

function applyFreeze() {
  // Same negative collision group for every body, walls included = nothing
  // collides with anything, so nothing gets pushed around. Items stay
  // grabbable by the mouse.
  Composite.allBodies(engine.world).forEach((b) => {
    b.collisionFilter.group = frozen ? -1 : 0;
  });
  engine.world.gravity.scale = frozen ? 0 : 0.001;
}

// When bodies overlap under the cursor, the mouse grabs the LAST one in the
// world's list. Keep the balls and pills at the end so they win over a letter
// bubble that happens to sit underneath them.
function prioritizeUI() {
  engine.world.bodies.sort((a, b) => (a.uiType ? 1 : 0) - (b.uiType ? 1 : 0));
  Composite.setModified(engine.world, true, true, false); // drop the cached order
}

Matter.Events.on(engine, "beforeUpdate", () => {
  if (!frozen) return;
  Composite.allBodies(engine.world).forEach((b) => {
    if (b.isStatic) return;
    Matter.Body.setVelocity(b, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(b, 0);
  });
});

// Debug mode toggle
let showDebug = false;

// Colorway system with localStorage
let currentColorway = parseInt(localStorage.getItem("soraColorway")) || 0;
const colorways = [
  {
    name: "Classic",
    letters: {
      S: { color: "#333333", svg: "assets/s.svg" },
      O: { color: "#ff0000", svg: "assets/o.svg" },
      R: { color: "#333333", svg: "assets/r.svg" },
      A: { color: "#333333", svg: "assets/a.svg" },
    },
    bubbleColor: "rgba(0, 0, 0, 0.05)",
    bubbleBorder: "rgba(0, 0, 0, 0.1)",
    background: "white",
  },
  {
    name: "Dark",
    darkBackground: true, // UI borders/grid switch to white
    letters: {
      S: { color: "#ffffff", svg: "assets/s.svg" },
      O: { color: "#ff4444", svg: "assets/o.svg" },
      R: { color: "#ffffff", svg: "assets/r.svg" },
      A: { color: "#ffffff", svg: "assets/a.svg" },
    },
    bubbleColor: "rgba(255, 255, 255, 0.05)",
    bubbleBorder: "rgba(255, 255, 255, 0.1)",
    background: "#333",
  },
  {
    name: "Ocean",
    letters: {
      S: { color: "white", svg: "assets/s.svg" },
      O: { color: "white", svg: "assets/o.svg" },
      R: { color: "white", svg: "assets/r.svg" },
      A: { color: "white", svg: "assets/a.svg" },
    },
    bubbleColor: "rgba(255, 255, 255, 0.05)",
    bubbleBorder: "rgba(255, 255, 255, 0.1)",
    background: "linear-gradient(135deg, #2980b9 0%, #6bb6ff 100%)",
  },
  {
    name: "Shades",
    darkBackground: true, // UI borders/grid switch to white
    letters: {
      S: { color: "#f1f1f1", svg: "assets/s.svg" },
      O: { color: "#b4b4b4", svg: "assets/o.svg" },
      R: { color: "#505050", svg: "assets/r.svg" },
      A: { color: "#3a3a3a", svg: "assets/a.svg" },
    },
    bubbleColor: "rgba(255, 255, 255, 0.05)",
    bubbleBorder: "rgba(255, 255, 255, 0.1)",
    background: "#333",
  },
  {
    name: "Monochrome",
    darkBackground: true, // UI borders/grid switch to white
    letters: {
      S: { color: "#2c3e50", svg: "assets/s.svg" },
      O: { color: "#34495e", svg: "assets/o.svg" },
      R: { color: "#2c3e50", svg: "assets/r.svg" },
      A: { color: "#2c3e50", svg: "assets/a.svg" },
    },
    bubbleColor: "rgba(149, 165, 166, 0.15)",
    bubbleBorder: "rgba(149, 165, 166, 0.4)",
    background: "linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)",
  },
];

// Which of the four layout states the current window width falls into
function getStateName() {
  const width = window.innerWidth;
  if (width <= 480) return "Mobile";
  if (width <= 768) return "Tablet";
  if (width <= 1024) return "Small desktop";
  return "Large desktop";
}

// Update screen width indicator
function updateScreenIndicator() {
  const width = window.innerWidth;
  const screenTypeElement = document.getElementById("screen-type");

  if (width <= 480) {
    screenTypeElement.textContent = "Mobile (≤480px)";
    screenTypeElement.style.color = "#ff6b6b";
  } else if (width <= 768) {
    screenTypeElement.textContent = "Tablet (≤768px)";
    screenTypeElement.style.color = "#4ecdc4";
  } else if (width <= 1024) {
    screenTypeElement.textContent = "Small Desktop (≤1024px)";
    screenTypeElement.style.color = "#45b7d1";
  } else {
    screenTypeElement.textContent = "Large Desktop (>1024px)";
    screenTypeElement.style.color = "#96ceb4";
  }

  if (frozen) screenTypeElement.textContent += " · FROZEN";
}

// Get responsive settings based on screen width
function getResponsiveSettings() {
  const width = window.innerWidth;

  if (width <= 480) {
    // Mobile
    return {
      sizeMultiplier: 1.2,
      positions: {
        S: {
          x: 0.3,
          y: 0.25,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -5,
        },
        O: {
          x: 0.7,
          y: 0.45,
          rotation: 0.5,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 10,
        },
        R: {
          x: 0.3,
          y: 0.65,
          rotation: 0.7,
          sizeMultiplier: 0.9,
          offsetX: 3,
          offsetY: -5,
        },
        A: {
          x: 0.7,
          y: 0.85,
          rotation: -2,
          sizeMultiplier: 1.0,
          offsetX: -2,
          offsetY: -10,
        },
      },
    };
  } else if (width <= 768) {
    // Tablet
    return {
      sizeMultiplier: 1,
      positions: {
        S: {
          x: 0.3,
          y: 0.2,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -8,
        },
        O: {
          x: 0.7,
          y: 0.4,
          rotation: 0.3,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 15,
        },
        R: {
          x: 0.3,
          y: 0.6,
          rotation: 0.15,
          sizeMultiplier: 0.9,
          offsetX: 5,
          offsetY: -5,
        },
        A: {
          x: 0.7,
          y: 0.8,
          rotation: -0.3,
          sizeMultiplier: 1.0,
          offsetX: 0,
          offsetY: -2,
        },
      },
    };
  } else if (width <= 1024) {
    // Small desktop
    return {
      sizeMultiplier: 1.2,
      positions: {
        S: {
          x: 0.2,
          y: 0.25,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -10,
        },
        O: {
          x: 0.4,
          y: 0.6,
          rotation: 0.4,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 20,
        },
        R: {
          x: 0.6,
          y: 0.25,
          rotation: 0.2,
          sizeMultiplier: 0.9,
          offsetX: 5,
          offsetY: -5,
        },
        A: {
          x: 0.8,
          y: 0.75,
          rotation: -0.4,
          sizeMultiplier: 1.0,
          offsetX: 0,
          offsetY: -5,
        },
      },
    };
  } else {
    // Large desktop
    return {
      sizeMultiplier: 1.5,
      positions: {
        S: {
          x: 0.2,
          y: 0.25,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -10,
        },
        O: {
          x: 0.35,
          y: 0.7,
          rotation: 0.5,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 20,
        },
        R: {
          x: 0.65,
          y: 0.25,
          rotation: 0.25,
          sizeMultiplier: 0.9,
          offsetX: 5,
          offsetY: -10,
        },
        A: {
          x: 0.8,
          y: 0.7,
          rotation: -0.5,
          sizeMultiplier: 1.0,
          offsetX: 0,
          offsetY: -8,
        },
      },
    };
  }
  
}

// Spawn positions for the colorway balls and instruction pills, per screen
// size. x / y are fractions of the screen (0 to 1), like the letters above.
// Press L to see the grid with a marker for every one of these.
//   balls: one { x, y } per colorway, in the same order as the `colorways` list
//   pills: [ "Drag letters", "Double-click or press R to reset" ]
function getUISettings() {
  const width = window.innerWidth;

  if (width <= 480) {
    // Mobile
    return {
      balls: [
        { x: 0.8, y: 0.2 },
        { x: 0.85, y: 0.65 },
        { x: 0.2, y: 0.85 },
        { x: 0.1, y: 0.5 },
        { x: 0.1, y: 0.1 },
      ],
      pills: [
        { x: 0.25, y: 0.4 },
        { x: 0.7, y: 0.05 },
      ],
    };
  } else if (width <= 768) {
    // Tablet
    return {
      balls: [
        { x: 0.1, y: 0.45 },
        { x: 0.4, y: 0.4 },
        { x: 0.6, y: 0.6 },
        { x: 0.85, y: 0.6 },
        { x: 0.6, y: 0.1 },
      ],
      pills: [
        { x: 0.2, y: 0.85 },
        { x: 0.75, y: 0.15 },
      ],
    };
  } else if (width <= 1024) {
    // Small desktop
    return {
      balls: [
        { x: 0.4, y: 0.35 },
        { x: 0.9, y: 0.15 },
        { x: 0.5, y: 0.05 },
        { x: 0.1, y: 0.5 },
        { x: 0.8, y: 0.35 },
      ],
      pills: [
        { x: 0.1, y: 0.65 },
        { x: 0.8, y: 0.5 },
      ],
    };
  } else {
    // Large desktop
    return {
      balls: [
        { x: 0.9, y: 0.1 },
        { x: 0.4, y: 0.1 },
        { x: 0.45, y: 0.4 },
        { x: 0.9, y: 0.4 },
        { x: 0.05, y: 0.5 },
      ],
      pills: [
        { x: 0.55, y: 0.5 },
        { x: 0.15, y: 0.95 },
      ],
    };
  }
}

// Apply colorway to background
function applyBackgroundColorway() {
  document.body.style.background = colorways[currentColorway].background;
}

// Save colorway to localStorage
function saveColorway() {
  localStorage.setItem("soraColorway", currentColorway.toString());
  console.log("Saved colorway to localStorage:", currentColorway);
}

// Save custom letter colors to localStorage
function saveCustomColors() {
  localStorage.setItem("soraLetterColors", JSON.stringify(customLetterColors));
}

// Create wool texture pattern
function createWoolTexture(ctx, color) {
  // Create a small canvas for the wool pattern
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = 20;
  patternCanvas.height = 20;
  const patternCtx = patternCanvas.getContext("2d");

  // Base color
  patternCtx.fillStyle = color;
  patternCtx.fillRect(0, 0, 20, 20);

  // Add wool-like texture with random dots and lines
  patternCtx.globalCompositeOperation = "multiply";

  // Random wool fibers
  for (let i = 0; i < 15; i++) {
    patternCtx.strokeStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
    patternCtx.lineWidth = Math.random() * 2;
    patternCtx.beginPath();
    patternCtx.moveTo(Math.random() * 20, Math.random() * 20);
    patternCtx.lineTo(Math.random() * 20, Math.random() * 20);
    patternCtx.stroke();
  }

  // Add some lighter highlights
  patternCtx.globalCompositeOperation = "screen";
  for (let i = 0; i < 8; i++) {
    patternCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
    patternCtx.beginPath();
    patternCtx.arc(
      Math.random() * 20,
      Math.random() * 20,
      Math.random() * 2,
      0,
      Math.PI * 2
    );
    patternCtx.fill();
  }

  return ctx.createPattern(patternCanvas, "repeat");
}

// Walls: thick, so fast-moving bodies can't tunnel through them in one step
const WALL = 400;
function makeWalls() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return [
    Bodies.rectangle(w / 2, -WALL / 2, w + WALL * 2, WALL, { isStatic: true }), // top
    Bodies.rectangle(w / 2, h + WALL / 2, w + WALL * 2, WALL, { isStatic: true }), // bottom
    Bodies.rectangle(-WALL / 2, h / 2, WALL, h + WALL * 2, { isStatic: true }), // left
    Bodies.rectangle(w + WALL / 2, h / 2, WALL, h + WALL * 2, { isStatic: true }), // right
  ];
}
const walls = makeWalls();
Composite.add(engine.world, walls);

// Speed limit (px per physics step) so throws can't launch things through walls
const MAX_SPEED = 45;
Matter.Events.on(engine, "beforeUpdate", () => {
  if (frozen) return;
  Composite.allBodies(engine.world).forEach((b) => {
    if (b.isStatic) return;
    if (b.speed > MAX_SPEED) {
      const k = MAX_SPEED / b.speed;
      Matter.Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
    }
  });
});

// Safety net: anything that still ends up off screen goes back to its spawn
// point (letters, balls and pills all remember where they started).
Matter.Events.on(engine, "afterUpdate", () => {
  if (frozen) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  Composite.allBodies(engine.world).forEach((b) => {
    if (b.isStatic || !b.spawn) return;
    const { x, y } = b.position;
    if (x < 0 || x > w || y < 0 || y > h) {
      Matter.Body.setPosition(b, b.spawn);
      Matter.Body.setVelocity(b, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(b, 0);
    }
  });
});

// Load and parse SVG
async function loadSVG(svgPath) {
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = svgDoc.querySelector("svg");

    return {
      element: svgElement,
      paths: Array.from(svgElement.querySelectorAll("path")),
      viewBox: svgElement.getAttribute("viewBox"),
    };
  } catch (error) {
    console.error(`Error loading SVG ${svgPath}:`, error);
    return null;
  }
}

// Create physics body with circular bubble collision
async function createBubbleLetter(
  svgPath,
  x,
  y,
  baseSize,
  letterName,
  sizeMultiplier = 1.0
) {
  const svgData = await loadSVG(svgPath);

  if (!svgData) {
    console.error(`Failed to load SVG: ${svgPath}`);
    return null;
  }

  // Parse viewBox
  const viewBox = svgData.viewBox
    ? svgData.viewBox.split(" ").map(Number)
    : [0, 0, 200, 200];
  const [, , vbWidth, vbHeight] = viewBox;

  // Calculate scale to fit desired size with individual multiplier
  const actualSize = baseSize * sizeMultiplier;
  const scale = actualSize / Math.max(vbWidth, vbHeight);

  // Create circular collision body (bubble effect) - use base size for consistent bubbles
  const bubbleRadius = baseSize * 0.63; // Bubble size based on base size, not individual letter size
  const body = Bodies.circle(x, y, bubbleRadius, {
    restitution: 0.9, // Soft, bouncy feel
    friction: 0.75, // More grip against floor, walls and other circles
    frictionStatic: 1.0,
    frictionAir: 0.05, // Air drag gives a slow, drifting-through-water feel
    render: {
      // Hide the default circle rendering - we'll draw custom
      fillStyle: "transparent",
      strokeStyle: "transparent",
      lineWidth: 0,
    },
  });

  // Store SVG data and bubble info for custom rendering
  body.svgData = svgData;
  body.svgSize = actualSize;
  body.svgScale = scale;
  body.letterName = letterName;
  body.bubbleRadius = bubbleRadius;

  Composite.add(engine.world, body);
  return body;
}

// Custom render function with bubble effect
function customRender() {
  const ctx = render.canvas.getContext("2d");

  // Clear canvas
  ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);

  // Render all bodies
  // Draw balls and pills last so they sit on top of the letter bubbles
  const bodies = Composite.allBodies(engine.world)
    .slice()
    .sort((a, b) => (a.uiType ? 1 : 0) - (b.uiType ? 1 : 0));

  bodies.forEach((body) => {
    if (body.svgData) {
      // Draw bubble background
      ctx.save();
      ctx.translate(body.position.x, body.position.y);

      // Bubble gradient background with colorway
      const gradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        body.bubbleRadius
      );
      const bubbleColor = colorways[currentColorway].bubbleColor;
      gradient.addColorStop(0, bubbleColor.replace("0.15", "0.1"));
      gradient.addColorStop(0.7, bubbleColor.replace("0.15", "0.05"));
      gradient.addColorStop(1, bubbleColor);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, body.bubbleRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bubble border with colorway
      ctx.strokeStyle = colorways[currentColorway].bubbleBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      // Draw SVG letter with offset
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      // Apply individual letter offset
      ctx.translate(body.offsetX || 0, body.offsetY || 0);

      const scale = body.svgScale || 1;
      ctx.scale(scale, scale);

      const viewBox = body.svgData.viewBox
        ? body.svgData.viewBox.split(" ").map(Number)
        : [0, 0, 200, 200];
      const [, , vbWidth, vbHeight] = viewBox;
      ctx.translate(-vbWidth / 2, -vbHeight / 2);

      body.svgData.paths.forEach((path) => {
        const pathData = path.getAttribute("d");

        // Use color from colorway for this specific letter
        const fillColor =
          colorways[currentColorway].letters[body.letterName].color;

        const path2D = new Path2D(pathData);
        ctx.fillStyle = fillColor;
        ctx.fill(path2D);
      });

      ctx.restore();

      // Debug: Show collision circle
      if (showDebug) {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, body.bubbleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Center point
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    } else if (body.uiType) {
      drawUIBody(ctx, body);
    } else if (body.isStatic) {
      // Render walls
      ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
      ctx.fillRect(
        body.bounds.min.x,
        body.bounds.min.y,
        body.bounds.max.x - body.bounds.min.x,
        body.bounds.max.y - body.bounds.min.y
      );
    }
  });

  if (showGrid) drawGrid(ctx);
}

// Spawn-position grid (toggle with L). Lines sit every 10% of the screen,
// matching the x / y fractions used in getResponsiveSettings().
// The on/off state is remembered across refreshes.
let showGrid = localStorage.getItem("soraGrid") === "1";

function drawGrid(ctx) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dark = !!colorways[currentColorway].darkBackground;
  const line = dark ? "255,255,255" : "0,0,0";

  ctx.save();
  ctx.font = "11px monospace";

  // Minor lines every 5%, major lines every 10% with labels
  for (let i = 1; i < 20; i++) {
    const f = i / 20;
    const major = i % 2 === 0;
    ctx.strokeStyle = `rgba(${line}, ${major ? 0.3 : 0.12})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(w * f) + 0.5, 0);
    ctx.lineTo(Math.round(w * f) + 0.5, h);
    ctx.moveTo(0, Math.round(h * f) + 0.5);
    ctx.lineTo(w, Math.round(h * f) + 0.5);
    ctx.stroke();

    if (major) {
      ctx.fillStyle = `rgba(${line}, 0.7)`;
      ctx.fillText(f.toFixed(1), w * f + 3, 12);
      ctx.fillText(f.toFixed(1), 3, h * f - 3);
    }
  }

  // Crosshair + label at each letter's spawn point for this screen size
  const positions = getResponsiveSettings().positions;
  Object.entries(positions).forEach(([name, p]) => {
    const x = w * p.x;
    const y = h * p.y;
    ctx.strokeStyle = "#ff3b6b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
    ctx.fillStyle = "#ff3b6b";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${name} (${p.x}, ${p.y})`, x + 12, y - 8);
  });

  // Markers for the colorway balls and pills (from getUISettings)
  const ui = getUISettings();
  const marker = (x, y, label) => {
    ctx.strokeStyle = "#00b3b3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillStyle = "#00b3b3";
    ctx.font = "bold 11px monospace";
    ctx.fillText(label, x + 10, y + 14);
  };
  ui.balls.forEach((p, i) =>
    marker(w * p.x, h * p.y, `${colorways[i].name} (${p.x}, ${p.y})`)
  );
  ui.pills.forEach((p, i) =>
    marker(w * p.x, h * p.y, `pill ${i + 1} (${p.x}, ${p.y})`)
  );

  // Legend
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = `rgba(${line}, 0.75)`;
  ctx.fillText(
    `${getStateName()} ${w}x${h}   F freeze + drag to place (snaps to grid, Shift = free)   C copy code`,
    12,
    h - 12
  );

  ctx.restore();
}

// Override default render with custom bubble render
function renderLoop() {
  customRender();
  requestAnimationFrame(renderLoop);
}

// Start custom render loop
renderLoop();

// Store letter bodies
let letterBodies = [];

// Create letters with bubble collision
async function createLetters() {
  // Clear existing letters
  letterBodies.forEach((body) => Composite.remove(engine.world, body));
  letterBodies = [];

  // Get responsive settings based on screen width
  const responsiveSettings = getResponsiveSettings();

  // Update screen indicator
  updateScreenIndicator();

  // Calculate size as percentage of screen with responsive multiplier
  // Letters are smaller on desktop (>768px) than on tablet/mobile
  const screenScale = window.innerWidth > 768 ? 0.65 : 1;
  const baseSize =
    Math.min(window.innerWidth, window.innerHeight) * 0.35 * screenScale;
  const size = baseSize * responsiveSettings.sizeMultiplier;

  // Create letters with responsive positioning
  const letters = Object.entries(responsiveSettings.positions).map(
    ([name, settings]) => ({
      name,
      x: window.innerWidth * settings.x,
      y: window.innerHeight * settings.y,
      rotation: settings.rotation,
      sizeMultiplier: settings.sizeMultiplier,
      offsetX: settings.offsetX,
      offsetY: settings.offsetY,
    })
  );

  console.log("Creating bubble letters...");

  // Create letters with specific positions, rotations, sizes, and offsets
  for (const letter of letters) {
    // Get SVG path from current colorway
    const svgPath = colorways[currentColorway].letters[letter.name].svg;

    console.log(
      `Creating bubble ${letter.name} at (${letter.x}, ${letter.y}) with rotation ${letter.rotation}, size ${letter.sizeMultiplier}x`
    );
    const body = await createBubbleLetter(
      svgPath,
      letter.x,
      letter.y,
      size,
      letter.name,
      letter.sizeMultiplier
    );
    if (body) {
      // Set the specific rotation for this letter
      Matter.Body.setAngle(body, letter.rotation);

      // Remember the spawn point (used to recover if it ever leaves the screen)
      body.spawn = { x: letter.x, y: letter.y };

      // Store offset values for rendering
      body.offsetX = letter.offsetX || 0;
      body.offsetY = letter.offsetY || 0;

      letterBodies.push(body);
    }
  }

  console.log("Created", letterBodies.length, "bubble letters");
  prioritizeUI();
  applyFreeze();
}

// Mouse interaction
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.8,
    render: { visible: false },
    damping: 0.1,
  },
});
Composite.add(engine.world, mouseConstraint);

// Resize handler
async function handleResize() {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;

  // Replace the walls for the new window size
  Composite.remove(engine.world, walls);
  const newWalls = makeWalls();
  Composite.add(engine.world, newWalls);
  walls.length = 0;
  walls.push(...newWalls);
  applyFreeze();

  // Update screen indicator
  updateScreenIndicator();

  // Recreate letters and UI
  await createLetters();
  createUI();
}

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 100);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "r": // R to reset
      createLetters();
      break;
    case "l": // L to toggle spawn grid
      showGrid = !showGrid;
      localStorage.setItem("soraGrid", showGrid ? "1" : "0");
      break;
    case "f": // F to freeze / unfreeze the physics
      frozen = !frozen;
      applyFreeze();
      updateScreenIndicator();
      break;
    case "d": // D to toggle debug
      showDebug = !showDebug;
      console.log("Debug mode:", showDebug ? "ON" : "OFF");
      break;
  }
});

// ---------------------------------------------------------------------------
// Physics UI: colorway balls + instruction pills are real bodies you can throw
// ---------------------------------------------------------------------------
let uiBodies = [];
const measureCtx = document.createElement("canvas").getContext("2d");

// Pull the colors out of a CSS background string ("white", "#333",
// "linear-gradient(135deg, #2980b9 0%, #6bb6ff 100%)") for canvas drawing
function swatchColors(background) {
  const found = background.match(/#[0-9a-fA-F]{3,6}|\bwhite\b|\bblack\b/g);
  return found && found.length ? found : ["#ffffff"];
}

function createUI() {
  uiBodies.forEach((b) => Composite.remove(engine.world, b));
  uiBodies = [];

  const w = window.innerWidth;
  const small = w <= 768;
  const radius = small ? 22 : 26;
  const uiOptions = {
    // Much heavier than Matter's default density (0.001): a big letter dropping
    // onto a light ball (about 44:1 by mass) squashes it against the floor and
    // the solver can't settle, so the ball jitters. Heavier + less bouncy fixes it.
    density: 0.01,
    restitution: 0.3,
    friction: 0.5,
    frictionStatic: 1.0,
    frictionAir: 0.03,
    render: { fillStyle: "transparent", strokeStyle: "transparent", lineWidth: 0 },
  };

  // Colorway balls: dropped in from the top, spread around the centre
  const ui = getUISettings();
  const h = window.innerHeight;
  colorways.forEach((colorway, index) => {
    const spot = ui.balls[index] || { x: 0.5, y: 0.05 };
    const ball = Bodies.circle(w * spot.x, h * spot.y, radius, uiOptions);
    ball.spawn = { x: w * spot.x, y: h * spot.y };
    ball.uiType = "colorway";
    ball.colorwayIndex = index;
    ball.uiRadius = radius;
    ball.title = colorway.name;
    uiBodies.push(ball);
  });

  // Instruction pills
  const fontSize = small ? 12 : 14;
  const pillH = small ? 34 : 40;
  [
    { text: "Drag letters", x: w * ui.pills[0].x, y: h * ui.pills[0].y },
    {
      text: "Double-click or press R to reset",
      x: w * ui.pills[1].x,
      y: h * ui.pills[1].y,
    },
  ].forEach((p, pillIndex) => {
    measureCtx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const pillW = measureCtx.measureText(p.text).width + pillH;
    const pill = Bodies.rectangle(p.x, p.y, pillW, pillH, {
      ...uiOptions,
      chamfer: { radius: pillH / 2 },
    });
    pill.spawn = { x: p.x, y: p.y };
    pill.uiType = "pill";
    pill.pillIndex = pillIndex;
    pill.pillText = p.text;
    pill.pillW = pillW;
    pill.pillH = pillH;
    pill.pillFont = fontSize;
    uiBodies.push(pill);
  });

  Composite.add(engine.world, uiBodies);
  prioritizeUI();
  applyFreeze();
}

function drawUIBody(ctx, body) {
  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);

  if (body.uiType === "colorway") {
    const r = body.uiRadius;
    const colorway = colorways[body.colorwayIndex];
    const colors = swatchColors(colorway.background);
    let fill;
    if (colors.length === 1) {
      fill = colors[0];
    } else {
      fill = ctx.createLinearGradient(-r, -r, r, r);
      colors.forEach((c, i) => fill.addColorStop(i / (colors.length - 1), c));
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner disc: one slice per letter (S, O, R, A) in that letter's actual
    // colour, so colorways with similar backgrounds are still easy to tell apart
    const borderColor = colorways[currentColorway].darkBackground ? "#fff" : "#333";
    const letterColors = ["S", "O", "R", "A"].map((n) => colorway.letters[n].color);
    const inner = r * 0.52;
    letterColors.forEach((c, i) => {
      const a0 = -Math.PI / 2 + (i * Math.PI) / 2;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, inner, a0, a0 + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    });
    ctx.lineWidth = 1;
    ctx.strokeStyle = colorway.darkBackground ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(0, 0, inner, 0, Math.PI * 2);
    ctx.stroke();

    // Every ball gets the same border; the selected one gets an inner ring
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    ctx.stroke();
    if (body.colorwayIndex === currentColorway) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r - 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (body.uiType === "pill") {
    const pw = body.pillW;
    const ph = body.pillH;
    // Dark pill on light backgrounds, light pill on dark ones
    const darkBg = !!colorways[currentColorway].darkBackground;
    ctx.fillStyle = darkBg ? "rgba(255, 255, 255, 0.92)" : "rgba(51, 51, 51, 0.95)";
    ctx.beginPath();
    ctx.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = darkBg ? "#333" : "#fff";
    ctx.font = `500 ${body.pillFont}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(body.pillText, 0, 1);
  }
  ctx.restore();
}

// Tap a colorway ball (press + release without dragging) to pick it
const pressInfo = {};
Matter.Events.on(mouseConstraint, "startdrag", (e) => {
  pressInfo.body = e.body;
  pressInfo.x = e.body.position.x;
  pressInfo.y = e.body.position.y;
  pressInfo.time = performance.now();
});
Matter.Events.on(mouseConstraint, "enddrag", (e) => {
  const b = e.body;
  if (b !== pressInfo.body || b.uiType !== "colorway") return;
  const moved = Math.hypot(b.position.x - pressInfo.x, b.position.y - pressInfo.y);
  if (moved < 8 && performance.now() - pressInfo.time < 500) {
    switchColorway(b.colorwayIndex);
  }
});

// ---------------------------------------------------------------------------
// Layout editing: in freeze mode (F) dragged items snap to the grid, and C
// copies ready-to-paste position code for the current screen-size state.
// ---------------------------------------------------------------------------
const SNAP_STEP = 0.05; // matches the minor grid lines (every 5% of the screen)
let shiftHeld = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") shiftHeld = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") shiftHeld = false;
});

let grab = null;
Matter.Events.on(mouseConstraint, "startdrag", (e) => {
  grab = {
    body: e.body,
    dx: e.body.position.x - mouse.position.x,
    dy: e.body.position.y - mouse.position.y,
  };
});
// While frozen, the dragged item's centre snaps to the grid (hold Shift for
// free placement in 1% steps).
function snapGrabbed() {
  if (!grab) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const step = shiftHeld ? 0.01 : SNAP_STEP;
  const snap = (v, size) => {
    const unit = size * step;
    return Math.min(size, Math.max(0, Math.round(v / unit) * unit));
  };
  Matter.Body.setPosition(grab.body, {
    x: snap(mouse.position.x + grab.dx, w),
    y: snap(mouse.position.y + grab.dy, h),
  });
}

// On release, keep snapping for one more physics step (the last constraint
// pull would otherwise leave the item a pixel or two off the grid point)
Matter.Events.on(mouseConstraint, "enddrag", () => {
  if (grab) grab.ending = true;
});

Matter.Events.on(engine, "afterUpdate", () => {
  if (!frozen) {
    if (grab && grab.ending) grab = null;
    return;
  }
  snapGrabbed();
  if (grab && grab.ending) grab = null;
});

// Build paste-ready code for the current state from where things are now
function buildLayoutCode() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const f = (v) => +v.toFixed(2);
  const current = getResponsiveSettings().positions;
  const pos = (b) => `x: ${f(b.position.x / w)}, y: ${f(b.position.y / h)}`;

  const letterLines = letterBodies.map((b) => {
    const c = current[b.letterName];
    return `        ${b.letterName}: { ${pos(b)}, rotation: ${c.rotation}, sizeMultiplier: ${c.sizeMultiplier}, offsetX: ${c.offsetX}, offsetY: ${c.offsetY} },`;
  });
  const ballLines = uiBodies
    .filter((b) => b.uiType === "colorway")
    .sort((a, b) => a.colorwayIndex - b.colorwayIndex)
    .map((b) => `        { ${pos(b)} }, // ${colorways[b.colorwayIndex].name}`);
  const pillLines = uiBodies
    .filter((b) => b.uiType === "pill")
    .sort((a, b) => a.pillIndex - b.pillIndex)
    .map((b) => `        { ${pos(b)} }, // ${b.pillText}`);

  return [
    `// ${getStateName()} (${w}x${h}) - letters: paste into getResponsiveSettings() positions`,
    "      positions: {",
    ...letterLines,
    "      },",
    "",
    `// ${getStateName()} - balls and pills: paste into getUISettings()`,
    "      balls: [",
    ...ballLines,
    "      ],",
    "      pills: [",
    ...pillLines,
    "      ],",
  ].join("\n");
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.8)",
      color: "#fff",
      padding: "10px 18px",
      borderRadius: "20px",
      font: "600 13px -apple-system, BlinkMacSystemFont, sans-serif",
      zIndex: 20,
      pointerEvents: "none",
      transition: "opacity 0.3s",
      opacity: 0,
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = 1;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toast.style.opacity = 0), 2200);
}

document.addEventListener("keydown", async (e) => {
  if (e.key !== "c" || e.metaKey || e.ctrlKey) return;
  const code = buildLayoutCode();
  console.log(code);
  try {
    await navigator.clipboard.writeText(code);
    showToast(`Copied ${getStateName()} layout code`);
  } catch (err) {
    showToast("Couldn't copy - code is in the console");
  }
});

function resetAll() {
  createLetters();
  createUI();
}

// R resets everything
document.addEventListener("keydown", (e) => {
  if (e.key === "r") createUI();
});

// Double-click empty space to reset (not when double-tapping a ball or pill)
render.canvas.addEventListener("dblclick", () => {
  if (Matter.Query.point(uiBodies, mouse.position).length) return;
  resetAll();
});

// Switch colorway (keys 1-5 or tapping a ball)
function switchColorway(index) {
  if (index >= 0 && index < colorways.length) {
    currentColorway = index;
    applyBackgroundColorway();
    saveColorway();
    // Letters keep their positions: they are drawn with the current colorway
    // each frame, so only the colours change.
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "5") switchColorway(parseInt(e.key) - 1);
});

// Initialize
applyBackgroundColorway();
updateScreenIndicator();
createLetters();
createUI();
