class Triangle {
  constructor() {
    this.type = "triangle";
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the size of a point to a u_Size variable
    gl.uniform1f(u_Size, size);

    // Draw
    var d = this.size / 200.0; // Delta
    drawTriangle([xy[0], xy[1], xy[0] + d, xy[1], xy[0], xy[1] + d]);
  }
}

function drawTriangle(vertices) {
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3D(vertices) {
  var n = vertices.length / 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  // Draw
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

let vb = null;
let uvb = null;

let verts = null;
let uvs = null;

// Optional explicit init method
function initDrawTriangle3DUV() {
  if (!vb) {
    vb = gl.createBuffer();
    if (!vb) {
      console.log("Failed to create vertex buffer object");
      return false;
    }
  }

  if (!uvb) {
    uvb = gl.createBuffer();
    if (!uvb) {
      console.log("Failed to create UV buffer object");
      return false;
    }
  }

  if (!verts) {
    verts = new Float32Array(9);
  }
  if (!uvs) {
    uvs = new Float32Array(6);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, verts.byteLength, gl.DYNAMIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvb);
  gl.bufferData(gl.ARRAY_BUFFER, uvs.byteLength, gl.DYNAMIC_DRAW);

  return true;
}

function drawTriangle3DUV(vertices, uv) {
  var n = 3;

  if (!uvb || !vb || !verts || !uvs) {
    if (!initDrawTriangle3DUV()) {
      return -1;
    }
  }

  verts.set(vertices);
  uvs.set(uv);

  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvb);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, uvs);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}