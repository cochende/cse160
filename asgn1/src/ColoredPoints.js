// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
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
let u_Size;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_size = 5;
let g_selectedType = POINT;
let g_segments = 10;
let g_commandsLog = [];
let g_triangleHeight = 1.0;
let g_triangleRotation = 0;
let g_triangleRight = false;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
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

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get the storage location of u_Size");
    return;
  }
}

function addActionsForUI() {
  // sliders
  document.getElementById("red").addEventListener("mouseup", function () {
    g_selectedColor[0] = this.value / 100;
  });
  document.getElementById("green").addEventListener("mouseup", function () {
    g_selectedColor[1] = this.value / 100;
  });
  document.getElementById("blue").addEventListener("mouseup", function () {
    g_selectedColor[2] = this.value / 100;
  });
  document.getElementById("shapesize").addEventListener("mouseup", function () {
    g_size = this.value;
  });

  document.getElementById("clear").onclick = function () {
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById("point").onclick = function () {
    g_selectedType = POINT;
  };
  document.getElementById("triangle").onclick = function () {
    g_selectedType = TRIANGLE;
  };
  document.getElementById("circle").onclick = function () {
    g_selectedType = CIRCLE;
  };
  document
    .getElementById("circlecount")
    .addEventListener("mouseup", function () {
      g_segments = this.value;
    });
  document
    .getElementById("triangleRotation")
    .addEventListener("input", function () {
      g_triangleRotation = parseFloat(this.value);
    });
  document
    .getElementById("triangleRight")
    .addEventListener("change", function () {
      g_triangleRight = this.checked;
    });

  document.getElementById("undo").onclick = undo;
  document
    .getElementById("triangleHeight")
    .addEventListener("input", function () {
      g_triangleHeight = parseFloat(this.value);
    });
  document.getElementById("drawFromCommands").onclick = drawFromCommands;
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function coordsEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}

function click(ev) {
  let [x, y] = coordsEventToGL(ev);

  let point;
  let cmd = {};
  if (g_selectedType == POINT) {
    point = new Point();
    cmd.type = "point";
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
    cmd.type = "triangle";
    point.height = g_triangleHeight;
    cmd.height = g_triangleHeight;
    point.rotation = g_triangleRotation;
    cmd.rotation = g_triangleRotation;
    point.isRight = g_triangleRight;
    cmd.isRight = g_triangleRight;
  } else {
    point = new Circle();
    cmd.type = "circle";
    point.segments = g_segments;
    cmd.segments = g_segments;
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_size;

  // Log the command
  cmd.position = [x, y];
  cmd.color = g_selectedColor.slice();
  cmd.size = g_size;
  g_commandsLog.push(cmd);
  updateCommandsTextarea();

  g_shapesList.push(point);

  renderAllShapes();
}

function updateCommandsTextarea() {
  document.getElementById("commandsLog").value = JSON.stringify(
    g_commandsLog,
    null,
    2,
  );
}

function drawFromCommands() {
  try {
    let commands = JSON.parse(document.getElementById("commandsLog").value);
    g_shapesList = [];
    for (let cmd of commands) {
      let shape;
      if (cmd.type === "point") shape = new Point();
      else if (cmd.type === "triangle") {
        shape = new Triangle();
        shape.height = cmd.height || 1.0;
        shape.rotation = cmd.rotation || 0;
        shape.isRight = cmd.isRight || false;
      } else if (cmd.type === "circle") {
        shape = new Circle();
        shape.segments = cmd.segments || 10;
      }
      shape.position = cmd.position;
      shape.color = cmd.color;
      shape.size = cmd.size;
      g_shapesList.push(shape);
    }
    renderAllShapes();
  } catch (e) {
    alert("Invalid commands format!");
  }
}

function undo() {
  g_shapesList.pop();
  g_commandsLog.pop();
  updateCommandsTextarea();
  renderAllShapes();
}
