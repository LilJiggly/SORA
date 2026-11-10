const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint } =
  Matter;

// Engine and renderer setup
const engine = Engine.create();
engine.world.gravity.y = 0.8;

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
Runner.run(Runner.create(), engine);

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
          x: 0.2,
          y: 0.2,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -5,
        },
        O: {
          x: 0.7,
          y: 0.4,
          rotation: 0.5,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 10,
        },
        R: {
          x: 0.25,
          y: 0.6,
          rotation: 0.7,
          sizeMultiplier: 0.9,
          offsetX: 3,
          offsetY: -5,
        },
        A: {
          x: 0.6,
          y: 0.8,
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
      sizeMultiplier: 1.2,
      positions: {
        S: {
          x: 0.2,
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
          offsetY: 20,
        },
        R: {
          x: 0.18,
          y: 0.6,
          rotation: 0.15,
          sizeMultiplier: 0.9,
          offsetX: 5,
          offsetY: -5,
        },
        A: {
          x: 0.82,
          y: 0.82,
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
          y: 0.2,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -10,
        },
        O: {
          x: 0.7,
          y: 0.4,
          rotation: 0.4,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 30,
        },
        R: {
          x: 0.15,
          y: 0.6,
          rotation: 0.2,
          sizeMultiplier: 0.9,
          offsetX: 5,
          offsetY: -5,
        },
        A: {
          x: 0.85,
          y: 0.8,
          rotation: -0.4,
          sizeMultiplier: 1.0,
          offsetX: 0,
          offsetY: -5,
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
          y: 0.2,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -10,
        },
        O: {
          x: 0.7,
          y: 0.4,
          rotation: 0.4,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 30,
        },
        R: {
          x: 0.15,
          y: 0.6,
          rotation: 0.2,
          sizeMultiplier: 0.9,
          offsetX: 5,
          offsetY: -5,
        },
        A: {
          x: 0.85,
          y: 0.8,
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
      sizeMultiplier: 1.2,
      positions: {
        S: {
          x: 0.2,
          y: 0.2,
          rotation: -1.1,
          sizeMultiplier: 0.9,
          offsetX: 0,
          offsetY: -10,
        },
        O: {
          x: 0.7,
          y: 0.4,
          rotation: 0.5,
          sizeMultiplier: 1.1,
          offsetX: 0,
          offsetY: 40,
        },
        R: {
          x: 0.2,
          y: 0.6,
          rotation: 0.25,
          sizeMultiplier: 0.9,
          offsetX: 5,
          offsetY: -10,
        },
        A: {
          x: 0.8,
          y: 0.8,
          rotation: -0.5,
          sizeMultiplier: 1.0,
          offsetX: 0,
          offsetY: -8,
        },
      },
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

// Create walls
const walls = [
  Bodies.rectangle(window.innerWidth / 2, -25, window.innerWidth, 50, {
    isStatic: true,
  }),
  Bodies.rectangle(
    window.innerWidth / 2,
    window.innerHeight + 25,
    window.innerWidth,
    50,
    { isStatic: true }
  ),
  Bodies.rectangle(-25, window.innerHeight / 2, 50, window.innerHeight, {
    isStatic: true,
  }),
  Bodies.rectangle(
    window.innerWidth + 25,
    window.innerHeight / 2,
    50,
    window.innerHeight,
    { isStatic: true }
  ),
];
Composite.add(engine.world, walls);

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
    restitution: 0.7, // Nice bouncy feel
    friction: 0.3,
    frictionAir: 0.02, // Slight air resistance
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
  const bodies = Composite.allBodies(engine.world);

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
  const baseSize = Math.min(window.innerWidth, window.innerHeight) * 0.35;
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

      // Store offset values for rendering
      body.offsetX = letter.offsetX || 0;
      body.offsetY = letter.offsetY || 0;

      letterBodies.push(body);
    }
  }

  console.log("Created", letterBodies.length, "bubble letters");
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

  // Remove old walls
  Composite.remove(engine.world, walls);

  // Create new walls
  const newWalls = [
    Bodies.rectangle(window.innerWidth / 2, -25, window.innerWidth, 50, {
      isStatic: true,
    }),
    Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 25,
      window.innerWidth,
      50,
      { isStatic: true }
    ),
    Bodies.rectangle(-25, window.innerHeight / 2, 50, window.innerHeight, {
      isStatic: true,
    }),
    Bodies.rectangle(
      window.innerWidth + 25,
      window.innerHeight / 2,
      50,
      window.innerHeight,
      { isStatic: true }
    ),
  ];

  Composite.add(engine.world, newWalls);
  walls.length = 0;
  walls.push(...newWalls);

  // Update screen indicator
  updateScreenIndicator();

  // Recreate letters
  await createLetters();
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
    case "d": // D to toggle debug
      showDebug = !showDebug;
      console.log("Debug mode:", showDebug ? "ON" : "OFF");
      break;
  }
});

// Double-click to reset
render.canvas.addEventListener("dblclick", () => {
  createLetters();
});

// Random shake every 10 seconds
setInterval(() => {
  letterBodies.forEach((body) => {
    const force = {
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.01,
    };
    Matter.Body.applyForce(body, body.position, force);
  });
}, 10000);

// Create colorway buttons
function createColorwayButtons() {
  const buttonsContainer = document.getElementById("colorway-buttons");

  colorways.forEach((colorway, index) => {
    const button = document.createElement("div");
    button.className = `colorway-btn ${
      index === currentColorway ? "active" : ""
    }`;
    button.title = colorway.name;
    button.style.background = colorway.background;

    button.addEventListener("click", () => {
      // Update active button
      document
        .querySelectorAll(".colorway-btn")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Switch colorway
      currentColorway = index;
      applyBackgroundColorway();
      saveColorway();

      console.log(`Switched to ${colorway.name} colorway`);
    });

    buttonsContainer.appendChild(button);
  });
}

// Switch colorway function
function switchColorway(index) {
  if (index >= 0 && index < colorways.length) {
    currentColorway = index;
    applyBackgroundColorway();

    // Update active button
    document.querySelectorAll(".colorway-btn").forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Number keys 1-5 for colorways
  if (e.key >= "1" && e.key <= "5") {
    const colorwayIndex = parseInt(e.key) - 1;
    if (colorwayIndex < colorways.length) {
      switchColorway(colorwayIndex);
    }
  }
});

// Switch colorway function
function switchColorway(index) {
  if (index >= 0 && index < colorways.length) {
    currentColorway = index;
    applyBackgroundColorway();
    saveColorway();

    // Update active button
    document.querySelectorAll(".colorway-btn").forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });

    // Recreate letters with new colorway
    createLetters();
  }
}

// Initialize
createColorwayButtons();
applyBackgroundColorway();
updateScreenIndicator();
createLetters();
