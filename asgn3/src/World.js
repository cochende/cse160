// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV); 
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV); 
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV); 
    } else {
      gl_FragColor = vec4(1, 0.2, 0.2, 1);
    }
  }`;

// general globals
let canvas;
let gl;

// state
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_whichTexture;
let g_camera;

// fps/performance
let g_lastFrame = performance.now();
let g_fps = 0;
let g_startTime = performance.now() / 1000;
let g_seconds = performance.now() / 1000 - g_startTime;

// canvas interaction
let g_globalAngle = -10;
let g_globalAngleX = 0;

// camera control state
var g_eye = [0, 0, 3];
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];

// camera control
let isDragging = false;
let lastX = 0;
let lastY = 0;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  g_camera = new Camera();
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (a_UV < 0) {
    console.log("Failed to get the storage location of a_UV");
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_ProjectionMatrix");
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  if (!u_ViewMatrix) {
    console.log("Failed to get the storage location of u_ViewMatrix");
  }

  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  if (!u_whichTexture) {
    console.log("Failed to get the storage location of u_whichTexture");
    return;
  }

  var u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler0");
  if (!u_Sampler) {
    console.log("Failed to load u_Sampler object");
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  if (!u_Sampler1) {
    console.log("Failed to get the storage location of u_Sampler1");
    return;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
  if (!u_Sampler2) {
    console.log("Failed to get the storage location of u_Sampler2");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
}

function addActionsForUI() {
  // Canvas mouse interaction
  canvas.onmousedown = function (e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  canvas.onmouseup = function () {
    isDragging = false;
  };

  canvas.onmouseleave = function () {
    isDragging = false;
  };

  canvas.onmousemove = function (ev) {
    if (!isDragging) return;
    const dx = ev.clientX - lastX;
    const dy = ev.clientY - lastY;
    lastX = ev.clientX;
    lastY = ev.clientY;

    g_camera.rotate(dx * g_camera.sensitivity);
    //g_camera.pitch(-dy * g_camera.sensitivity);
  };
}

function tick() {
  let now = performance.now();
  let delta = now - g_lastFrame;
  rot += 1;
  if (rot > 359) {
    rot = 0;
  }

  g_fps = 1000 / delta;
  g_lastFrame = now;

  g_seconds = now / 1000.0 - g_startTime;
  renderAllShapes();
  gameLoop();

  document.getElementById("fps").innerText = "fps: " + g_fps.toFixed(1);

  requestAnimationFrame(tick);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForUI();

  document.onkeydown = keydown;

  initTextures(gl, 0);
  initMap();
  spawnApple();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  requestAnimationFrame(tick);
}

function keydown(e) {
  g_camera.move(e);
}

function coordsEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

let rot = 0;

function renderAllShapes() {
  var projMat = new Matrix4();
  projMat.setPerspective(
    g_camera.fov,
    (g_camera.aspectRatio * canvas.width) / canvas.height,
    0.1,
    100,
  );
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.x,
    g_camera.eye.y,
    g_camera.eye.z,
    g_camera.at.x,
    g_camera.at.y,
    g_camera.at.z,
    g_camera.up.x,
    g_camera.up.y,
    g_camera.up.z,
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().setRotate(g_globalAngle, 0, 1, 0);

  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawObjs();
  drawMap();

  if (currentApple) {
    currentApple.draw();
  }
}

let g_floor, g_cube1, g_cube2, g_sky;
let cubes = [];

function drawObjs() {
  g_floor = new Cube();
  g_floor.color = [0.2, 0.6, 0.1, 1];
  g_floor.textureNum = -2;
  g_floor.matrix.translate(0, -0.75, 0);
  g_floor.matrix.scale(50, 0, 50);
  g_floor.matrix.translate(-0.5, 0, -0.5);
  g_floor.drawCube();

  var g_cube1 = new Cube();
  g_cube1.matrix = new Matrix4();
  g_cube1.matrix.setTranslate(0.4, 0, 0);
  g_cube1.matrix.rotate(rot, 1, 0, 0);
  g_cube1.matrix.rotate(rot, 0, 1, 0);
  g_cube1.matrix.rotate(-rot, 0, 0, 1);
  g_cube1.matrix.scale(0.3, 0.3, 0.3);
  g_cube1.drawCube(g_cube1.matrix);

  var g_cube2 = new Cube();
  g_cube2.textureNum = 0;
  g_cube2.matrix = new Matrix4();
  g_cube2.matrix.setTranslate(-0.4, 0, 0);
  g_cube2.matrix.rotate(rot, 1, 0, 0);
  g_cube2.matrix.rotate(rot, 0, 1, 0);
  g_cube2.matrix.rotate(rot, 0, 0, 1);
  g_cube2.matrix.scale(0.3, 0.3, 0.3);
  g_cube2.drawCube(g_cube2.matrix);

  var g_sky = new Cube();
  g_sky.textureNum = 1;
  g_sky.matrix.scale(50, 50, 50);
  g_sky.matrix.translate(-0.5, -0.5, -0.5);
  g_sky.drawCube();
}

function initTextures() {
  // Texture 0
  var image0 = new Image();
  image0.onload = function () {
    loadTexture(image0, 0);
  };
  image0.src = "dev.png";

  // Texture 1
  var image1 = new Image();
  image1.onload = function () {
    loadTexture(image1, 1);
  };
  image1.src = "sky.jpg";

  var image2 = new Image();
  image2.onload = function () {
    loadTexture(image2, 2);
  };
  image2.src = "d.png";

  return true;
}

function loadTexture(image, textureUnit) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  // Activate the appropriate texture unit
  if (textureUnit === 0) {
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u_Sampler0, 0);
  } else if (textureUnit === 1) {
    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(u_Sampler1, 1);
  } else if (textureUnit === 2) {
    gl.activeTexture(gl.TEXTURE2);
    gl.uniform1i(u_Sampler2, 2);
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  return true;
}

// map
var g_map = [
  [
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 1, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4,
  ],
  [
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4,
  ],
];

function initMap() {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      if (g_map[x][y] >= 1) {
        for (let i = 0; i < g_map[x][y]; i++) {
          let c = new Cube();
          c.textureNum = 2;
          c.matrix.translate(x - 15, -0.75 + i, y - 15);
          cubes.push(c);
        }
      }
    }
  }
}

function drawMap() {
  for (let cube of cubes) {
    cube.drawCube();
  }
}

// game logic

let points = 0;

class Apple {
  constructor(x, y) {
    this.mapX = x;
    this.mapY = y;
    this.spawnTime = performance.now() / 1000;
    this.collected = false;
  }

  getColor() {
    const age = performance.now() / 1000 - this.spawnTime;
    const maxAge = 30; // 30 seconds total
    const agePercent = Math.min(age / maxAge, 1.0); // 0 to 1

    const r = 1.0 - agePercent * 0.4;
    const g = agePercent * 0.3;
    const b = 0;

    return [r, g, b, 1.0];
  }

  getPoints() {
    const age = performance.now() / 1000 - this.spawnTime;
    if (age < 10) return 5;
    else if (age < 20) return 3;
    else return 1;
  }

  isExpired() {
    const age = performance.now() / 1000 - this.spawnTime;
    return age > 30;
  }

  draw() {
    if (this.collected || this.isExpired()) return;

    const appleCube = new Cube();
    appleCube.color = this.getColor();
    appleCube.textureNum = -2;

    const x = this.mapX - 15;
    const y = this.mapY - 15;

    const bounceAmount = 0.3 * Math.sin((performance.now() / 1000) * 3);
    const worldHeight = 0.5 + bounceAmount;

    appleCube.matrix.translate(x, worldHeight, y);

    const rotation = (performance.now() / 1000) * 50;

    appleCube.matrix.rotate(rotation, 1, 0, 1);
    appleCube.matrix.scale(0.25, 0.25, 0.25);
    appleCube.drawCube();
  }
}

let currentApple = null;

function spawnApple() {
  if (currentApple && !currentApple.collected && !currentApple.isExpired()) {
    return;
  }

  const mapWidth = 32;
  const mapHeight = 32;
  const x = Math.floor(Math.random() * (mapWidth - 15)) + 2;
  const y = Math.floor(Math.random() * (mapHeight - 15)) + 2;

  currentApple = new Apple(x, y);
  console.log(`Apple spawned at (${x}, ${y})`);
}

function tryCollectApple() {
  if (!currentApple || currentApple.collected || currentApple.isExpired()) {
    spawnApple();
    return false;
  }

  const appleWorldX = currentApple.mapX - 15;
  const appleWorldY = currentApple.mapY - 15;

  const camX = g_camera.eye.x;
  const camY = g_camera.eye.y;
  const camZ = g_camera.eye.z;

  const dx = camX - appleWorldX;
  const dy = camY - 0.5;
  const dz = camZ - appleWorldY;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const collisionRadius = 5;

  if (distance < collisionRadius) {
    const pointsEarned = currentApple.getPoints();
    points += pointsEarned;
    currentApple.collected = true;
    console.log(`Apple collected... +${pointsEarned} points. Total: ${points}`);

    setTimeout(() => {
      spawnApple();
    }, 100);
    return true;
  }
  return false;
}

function gameLoop() {
  tryCollectApple();

  let scoreText = `Points: ${points}`;
  if (currentApple && !currentApple.collected && !currentApple.isExpired()) {
    const age = performance.now() / 1000 - currentApple.spawnTime;
    const pointsValue = currentApple.getPoints();
    scoreText += ` | Apple: ${pointsValue}pts (${(30 - age).toFixed(1)}s)`;
  }

  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.innerText = scoreText;
  }
}
