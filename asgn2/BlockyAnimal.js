// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ModelMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// globals
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_size = 5;
let g_selectedType = POINT;
let g_segments = 10;
let g_triangleHeight = 1.0;
let g_triangleRotation = 0;
let g_triangleRight = false;

var g_shapesList = [];

let g_globalAngle = -10;
let g_wingAngle = 0;
let g_secondaryWingAngle = 0;
let g_flyBounce = 0;

let g_startTime = performance.now() / 1000;
let g_seconds = performance.now() / 1000 - g_startTime;
let g_modelScale = 0.3;

let g_flightSpeed = 1.5;

let g_globalAngleX = 0;
let g_isDragging = false;
let g_lastMouseX = -1;
let g_lastMouseY = -1;

let g_pokeAnimation = false;
let g_pokeStartTime = 0;
let g_pokeRotate = 0;
let g_pokeDuration = 1.0;

let g_model = new Matrix4();

let g_lastFrame = performance.now();
let g_fps = 0;

let treeX = [];
let treeY = [];

let animate = true;

let g_legJoint1 = 20;
let g_legJoint2 = 0;
let g_footJoint = -215

function toggleAnimation() {
  const btn = document.getElementById("animationBtn");
  if (animate) {
    btn.innerHTML = "off";
    animate = false;
  } else {
    btn.innerHTML = "on";
    animate = true;
  }
}

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

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  // Get the storage location of matrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
}

function addActionsForUI() {
  // sliders
  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderAllShapes();
    });

    document.getElementById("legJoint1Slide").addEventListener("input", function () {
    g_legJoint1 = this.value;
    renderAllShapes();
  });
  
  document.getElementById("legJoint2Slide").addEventListener("input", function () {
    g_legJoint2 = this.value;
    renderAllShapes();
  });
  
  document.getElementById("footJointSlide").addEventListener("input", function () {
    g_footJoint = this.value;
    renderAllShapes();
  });

  //dragging and clicking

  canvas.onmousedown = function (ev) {
    g_isDragging = true;
  };
  canvas.onmouseup = function (ev) {
    g_isDragging = false;
  };

  canvas.onmousemove = function (ev) {
    if (g_isDragging) {
      let [x, y] = coordsEventToGL(ev);
      g_globalAngle = -x * 180;
      g_globalAngleX = y * 180;

      renderAllShapes();
    }
  };

  canvas.onmousedown = function (ev) {
    if (ev.shiftKey) {
      g_pokeAnimation = true;
      g_pokeStartTime = g_seconds;
    } else {
      g_isDragging = true;
    }
  };
}

function tick() {
  let now = performance.now();
  let delta = now - g_lastFrame;

  g_fps = 1000 / delta;
  g_lastFrame = now;

  g_seconds = now / 1000.0 - g_startTime;

  updateAnimationAngles();
  renderAllShapes();

  document.getElementById("fps").innerText = "fps: " + g_fps.toFixed(1);

  requestAnimationFrame(tick);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForUI();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  requestAnimationFrame(tick);
}

function coordsEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function updateAnimationAngles() {
  if (animate) {
    g_wingAngle = 45 * Math.sin(8 * g_seconds);
    g_secondaryWingAngle = 20 * Math.sin(8 * g_seconds);
    g_legJoint1 = 10*Math.sin(g_seconds);
    let dt = 0.01;
    let amt = g_flightSpeed * dt;

    for (let i = 0; i < treeY.length; i++) {
      treeY[i] += amt;
      treeX[i] += amt / 10;
      if (treeY[i] > 1.0) {
        treeY[i] = -1.0;
      }
      if (treeX[i] > 1.0) {
        treeX[i] = -1.0;
      }
    }
    if (g_pokeAnimation) {
      let elapsed = g_seconds - g_pokeStartTime;
      let t = elapsed / g_pokeDuration;
      t = Math.min(t, 1);

      if (elapsed < g_pokeDuration) {
        g_wingAngle = 40;
        g_pokeRotate = 360 * t;
        g_pokeHeight = Math.sin(elapsed * 3.5) * 0.4;
      } else {
        g_pokeAnimation = false;
        g_pokeHeight = 0;
      }
    } else {
      g_pokeHeight = 0;
      g_pokeRotate = 0;
    }
  }
}

function renderAllShapes() {
  var globalRotMat = new Matrix4().setRotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  white = [1.0, 1.0, 1.0, 1.0];
  black = [0.0, 0.0, 0.0, 1.0];
  orange = [1.0, 0.5, 0, 1];
  brown = [0.5, 0.25, 0, 1];
  green = [0, 0.6, 0, 1];

  var body = new Cube();
  body.matrix = new Matrix4(g_model);
  body.matrix.setTranslate(0, g_pokeHeight, 0.0);
  body.matrix.rotate(g_pokeRotate, 0, 0, 1);
  var bodyMat = new Matrix4(body.matrix);
  body.matrix.scale(0.2, 0.2, 0.4);
  body.drawCube(body.matrix, brown);

  var body2 = new Cube();
  body2.matrix = new Matrix4(bodyMat);
  body2.matrix.translate(0, -0.1, 0.3);
  var b2Mat = new Matrix4(body2.matrix);
  body2.matrix.scale(0.25, 0.35, 0.4);
  body2.drawCube(body2.matrix, brown);

  var leftWing = new Cube();
  leftWing.matrix = new Matrix4(bodyMat);
  leftWing.matrix.translate(0.2, 0.15, 0.1);
  leftWing.matrix.rotate(g_wingAngle, 0, 0, 1);
  var leftWingMat = new Matrix4(leftWing.matrix);
  leftWing.matrix.scale(0.5, 0.05, 0.6);
  leftWing.drawCube(leftWing.matrix, brown);

  var rightWing = new Cube();
  rightWing.matrix = new Matrix4(bodyMat);
  rightWing.matrix.translate(0, 0.15, 0.1);
  rightWing.matrix.rotate(-g_wingAngle, 0, 0, 1);
  rightWing.matrix.translate(-0.5, 0, 0);
  rightWing.matrix.scale(0.5, 0.05, 0.6);
  rightWing.drawCube(rightWing.matrix, brown);

  var tail = new Cube();
  tail.matrix = new Matrix4(b2Mat);
  tail.matrix.translate(0, 0.05, 0.4);
  tail.matrix.rotate(-5, 1, 0, 0);
  var tm = new Matrix4(tail.matrix);
  tail.matrix.scale(0.25, 0.3, 0.4);
  tail.drawCube(tail.matrix, brown);

  var neck = new Cube();
  neck.matrix = new Matrix4(bodyMat);
  neck.matrix.translate(0.05, 0.03, -0.15);
  var nm = new Matrix4(neck.matrix);
  neck.matrix.scale(0.1, 0.15, 0.4);
  neck.drawCube(neck.matrix, white);

  var head = new Cube();
  head.matrix = new Matrix4(nm);
  head.matrix.translate(0, 0, -0.2);
  var hm = new Matrix4(head.matrix);
  head.matrix.scale(0.2, 0.25, 0.3);
  head.drawCube(head.matrix, white);

  var rightEye = new Cube();
  rightEye.matrix = new Matrix4(hm);
  rightEye.matrix.translate(-0.01, 0.12, -0.01);
  rightEye.matrix.scale(0.05, 0.05, 0.05);
  rightEye.drawCube(rightEye.matrix, black);

  var leftEye = new Cube();
  leftEye.matrix = new Matrix4(hm);
  leftEye.matrix.translate(0.16, 0.12, -0.01);
  leftEye.matrix.scale(0.05, 0.05, 0.05);
  leftEye.drawCube(leftEye.matrix, black);

  var beak = new Cube();
  beak.matrix = new Matrix4(hm);
  beak.matrix.translate(0.05, 0.0, -0.2);
  beak.matrix.scale(0.1, 0.2, 0.3);
  beak.drawCube(beak.matrix, orange);

  var leg1 = new Cube();
  leg1.matrix = new Matrix4(bodyMat);
  leg1.matrix.translate(0.18, 0, 0.6);
  leg1.matrix.rotate(g_legJoint1, 1, 0, 0); 
  var leg1Mat = new Matrix4(leg1.matrix);
  leg1.matrix.scale(0.05, -0.15, 0.05);
  leg1.drawCube(leg1.matrix, orange);

  var leg2 = new Cube();
  leg2.matrix = new Matrix4(leg1Mat);
  leg2.matrix.translate(0, -0.15, 0);
  leg2.matrix.rotate(g_legJoint2, 1, 0, 0);
  var l2mat = new Matrix4(leg2.matrix);
  leg2.matrix.scale(0.05, -0.1, 0.05);
  leg2.drawCube(leg2.matrix, orange);

  var foot = new Cube();
  foot.matrix = new Matrix4(l2mat);
  foot.matrix.translate(-0.01, -0.08, .01);
  foot.matrix.rotate(g_footJoint, 1, 0, 0);
  foot.matrix.scale(0.07, 0.03, 0.13);
  foot.drawCube(foot.matrix, orange);

  var leg4 = new Cube();
  leg4.matrix = new Matrix4(bodyMat);
  leg4.matrix.translate(0.02, 0, 0.6);
  leg4.matrix.rotate(20, 1, 0, 0);
  leg4.matrix.rotate(Math.sin(g_seconds * 0.1) * 10, 1, 0, 0);
  var leg4Mat = new Matrix4(leg4.matrix);
  leg4.matrix.scale(0.05, -0.15, 0.05);
  leg4.drawCube(leg4.matrix, orange);

  var leg3 = new Cube();
  leg3.matrix = new Matrix4(leg4Mat);
  leg3.matrix.translate(0, -0.15, 0);
  leg3.matrix.rotate(Math.abs(g_wingAngle * 0.1) * 0.5, 1, 0, 0);
  var l3mat = new Matrix4(leg3.matrix);

  leg3.matrix.scale(0.05, -0.1, 0.05);
  leg3.drawCube(leg3.matrix, orange);

  var foot2 = new Cube();
  foot2.matrix = new Matrix4(l3mat);
  foot2.matrix.translate(-0.01, -0.16, -0.1);
  foot2.matrix.rotate(-25, 1, 0, 0);
  foot2.matrix.scale(0.07, 0.03, 0.13);
  foot2.drawCube(foot2.matrix, orange);
  drawForest(2, 2, 50);
}

function drawForest(max_x, max_y, trees) {
  if (treeX.length == 0) {
    for (let i = 0; i < trees; i++) {
      let x = (Math.random() - 0.5) * max_x;
      let y = (Math.random() - 0.5) * max_y;

      treeX.push(x);
      treeY.push(y);
    }
  }

  for (let i = 0; i < treeX.length; i++) {
    drawTree(treeX[i], treeY[i]);
  }
}

function drawTree(x, y) {
  let tree = new Cone();
  tree.color = green;
  tree.matrix.translate(x, -0.9, y);
  tree.matrix.scale(0.04, 0.2, 0.04);
  tree.render();
}
