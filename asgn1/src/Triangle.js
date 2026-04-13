class Triangle {
  constructor() {
    this.type = "triangle";
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.height = 1.0;
    this.rotation = 0;
    this.isRight = false;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;
    var height = this.height;
    var height = this.height || 1.0;
    var rotation = ((this.rotation || 0) * Math.PI) / 180;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, size);

    var d = this.size / 200.0;

    let v;
    if (this.isRight) {
      // right triangle, just set verticies to left and up
      v = [
        [0, 0],
        [d, 0],
        [0, d * height],
      ];
    } else {
      // equilateral triangle, put last vert halfway above the middle of the two
      v = [
        [0, 0],
        [d, 0],
        [d / 2, d * height],
      ];
    }

    // add rotation
    // not gonna pretend like i know EXACTLY how it works. found rotation formula on google
    // and associated stackoverflow post w it
    v = v.map(([vx, vy]) => {
      let x = vx - d / 2;
      let y = vy - (d * height) / 3;
      let rx = x * Math.cos(rotation) - y * Math.sin(rotation);
      let ry = x * Math.sin(rotation) + y * Math.cos(rotation);
      return [xy[0] + rx, xy[1] + ry];
    });

    drawTriangle([v[0][0], v[0][1], v[1][0], v[1][1], v[2][0], v[2][1]]);
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
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
