// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec3 u_cameraPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  varying vec4 v_VertPos;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightColor;
  uniform bool u_lightOn;
  uniform bool u_lightType;
  uniform vec3 u_spotlightDir;
  uniform float u_spotlightCutoff;
  uniform float u_spotlightOuterCutoff;

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
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    }

    vec3 lv = u_lightPos - vec3(v_VertPos);
    vec3 L = normalize(lv);
    vec3 N = normalize(v_Normal);
    vec3 R = reflect(-L, N);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    float nDotL = max(dot(N, L), 0.0);
    float spec = pow(max(dot(E, R), 0.0), 10.0);

    if (u_lightType) {
        vec3 spotDir = normalize(u_spotlightDir);
        float spotAngle = dot(-L, spotDir);  // negative L points toward light
        float spotIntensity = 0.0;
        
        if (spotAngle > u_spotlightOuterCutoff) {
          spotIntensity = smoothstep(u_spotlightOuterCutoff, u_spotlightCutoff, spotAngle);
        }

        // Scale the point light calculations by the spotlight intensity
        nDotL *= spotIntensity;
        spec *= spotIntensity;
    }

    vec3 diffuse = vec3(gl_FragColor) * nDotL * u_lightColor;
    vec3 ambient = vec3(gl_FragColor) * 0.3 * u_lightColor;

    if (u_lightOn) {
      if (u_whichTexture != -2) {
        gl_FragColor = vec4(vec3(spec) * u_lightColor + diffuse + ambient, 1.0);
      } else {
        gl_FragColor = vec4(diffuse + ambient, 1.0);
      }
    }
  }`;

// general globals
let canvas;
let gl;

let g_spotlightDir = [0, -1, 0];
let u_spotlightDir;
let u_spotlightCutoff;
let u_spotlightOuterCutoff;

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
let a_Normal;
let g_normalOn;
let g_lightPos = [0, 1, -2];
let u_lightPos;
let u_cameraPos;
let g_lightColor = [2, 2, 0];
let u_lightColor;
let g_lightOn = true;
let g_lightType = false;

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

  u_lightColor = gl.getUniformLocation(gl.program, "u_lightColor");
  u_spotlightDir = gl.getUniformLocation(gl.program, "u_spotlightDir");
  u_spotlightCutoff = gl.getUniformLocation(gl.program, "u_spotlightCutoff");
  u_spotlightOuterCutoff = gl.getUniformLocation(
    gl.program,
    "u_spotlightOuterCutoff",
  );

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

  u_lightOn = gl.getUniformLocation(gl.program, "u_lightOn");
  if (!u_lightOn) {
    console.log("Failed to get the storage location of u_lightOn");
    return;
  }

  u_lightType = gl.getUniformLocation(gl.program, "u_lightType");
  if (!u_lightOn) {
    console.log("Failed to get the storage location of u_lightType");
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
  if (!u_cameraPos) {
    console.log("Failed to get the storage location of u_cameraPos");
    return;
  }

  // Get the storage location of u_lightPos
  u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_lightPos");
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

  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (!a_Normal) {
    console.log("Failed to get the storage location of a_Normal");
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

  document.getElementById("normalOn").onclick = function () {
    g_normalOn = true;
  };

  document.getElementById("normalOff").onclick = function () {
    g_normalOn = false;
  };

  document.getElementById("lsX").addEventListener("mousemove", function (ev) {
    if (ev.buttons == 1) {
      g_lightPos[0] = this.value / 100;
      renderAllShapes();
    }
  });
  document.getElementById("lsY").addEventListener("mousemove", function (ev) {
    if (ev.buttons == 1) {
      g_lightPos[1] = this.value / 100;
      renderAllShapes();
    }
  });
  document.getElementById("lsZ").addEventListener("mousemove", function (ev) {
    if (ev.buttons == 1) {
      g_lightPos[2] = this.value / 100;
      renderAllShapes();
    }
  });

  document.getElementById("lightOn").onclick = function () {
    g_lightOn = !g_lightOn;
  };

  document.getElementById("switchlight").onclick = function () {
    g_lightType = !g_lightType;
  };

  document
    .getElementById("colorslide")
    .addEventListener("input", function (ev) {
      var val = this.value / 100;
      g_lightColor = [val, val * 0.5, 1 - val];
    });
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
  document.getElementById("fps").innerText = "fps: " + g_fps.toFixed(1);

  g_lightPos[0] = Math.cos(g_seconds);

  requestAnimationFrame(tick);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForUI();

  document.onkeydown = keydown;

  initTextures(gl, 0);
  initMap();

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

  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);
  gl.uniform1f(u_lightOn, g_lightOn);
  gl.uniform1f(u_lightType, g_lightType);
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);

  gl.uniform3f(
    u_spotlightDir,
    g_spotlightDir[0],
    g_spotlightDir[1],
    g_spotlightDir[2],
  );
  gl.uniform1f(u_spotlightCutoff, 0.95); // inner cone (cos of angle)
  gl.uniform1f(u_spotlightOuterCutoff, 0.85); // outer cone

  g_light = new Cube();
  g_light.textureNum = -2;
  g_light.color = [2, 2, 0, 1];
  g_light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  g_light.matrix.scale(-0.1, -0.1, -0.1);
  g_light.matrix.translate(-0.5, -0.5, -0.5);
  g_light.drawCube();

  drawObjs();
  //drawMap();
}

let g_floor, g_cube1, g_cube2, g_sky;
let cubes = [];

function drawObjs() {
  g_floor = new Cube();
  g_floor.textureNum = g_normalOn ? 3 : -2;
  g_floor.matrix.translate(0, -0.75, 0);
  g_floor.matrix.scale(10, 0, 10);
  g_floor.matrix.translate(-0.5, 0, -0.5);
  g_floor.drawCube();

  var g_cube1 = new Cube();
  g_cube1.textureNum = g_normalOn ? 3 : 0;
  g_cube1.matrix = new Matrix4();
  g_cube1.matrix.setTranslate(0.4, 0, 0);
  g_cube1.matrix.rotate(rot, 1, 0, 0);
  g_cube1.matrix.rotate(rot, 0, 1, 0);
  g_cube1.matrix.rotate(-rot, 0, 0, 1);
  g_cube1.matrix.scale(0.3, 0.3, 0.3);
  g_cube1.drawCube(g_cube1.matrix);

  var g_cube2 = new Cube();
  g_cube2.textureNum = g_normalOn ? 3 : 0;
  g_cube2.matrix = new Matrix4();
  g_cube2.matrix.setTranslate(-0.4, 0, 0);
  g_cube2.matrix.rotate(rot, 1, 0, 0);
  g_cube2.matrix.rotate(rot, 0, 1, 0);
  g_cube2.matrix.rotate(rot, 0, 0, 1);
  g_cube2.matrix.scale(0.3, 0.3, 0.3);
  g_cube2.drawCube(g_cube2.matrix);

  var g_sky = new Cube();
  g_sky.textureNum = g_normalOn ? 3 : -2;
  g_sky.matrix.scale(-7.5, -7.5, -7.5);
  g_sky.matrix.translate(-0.5, -0.5, -0.5);
  g_sky.drawCube();

  var sphere = new Sphere();
  sphere.textureNum = g_normalOn ? 3 : -3;
  sphere.matrix.translate(1, 0.5, -3);
  sphere.drawSphere();
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
