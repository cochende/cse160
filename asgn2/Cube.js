class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }

  drawCube(M = this.matrix, color) {
    this.color = color;
    var rgba = this.color;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Pass in matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

    // front face

    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.9,
      rgba[1] * 0.9,
      rgba[2] * 0.9,
      rgba[3],
    );

    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0]);
    drawTriangle3D([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0]);

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // top face
    drawTriangle3D([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0]);

    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.8,
      rgba[1] * 0.8,
      rgba[2] * 0.8,
      rgba[3],
    );

    // side faces
    drawTriangle3D([1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0]);
    drawTriangle3D([1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0]);

    drawTriangle3D([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0]);

    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.7,
      rgba[1] * 0.7,
      rgba[2] * 0.7,
      rgba[3],
    );

    // back face
    drawTriangle3D([0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0]);

    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.5,
      rgba[1] * 0.5,
      rgba[2] * 0.5,
      rgba[3],
    );

    // bottom fcae
    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0]);
    drawTriangle3D([0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0]);
  }
}

class Cone {
  constructor() {
    this.type = "cone";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 12;
  }

  render() {
    var rgba = this.color;

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    let delta = (2 * Math.PI) / this.segments;

    for (var i = 0; i < this.segments; i++) {

      let angle1 = i * delta;
      let angle2 = (i + 1) * delta;

      let x1 = Math.cos(angle1);
      let z1 = Math.sin(angle1);
      let x2 = Math.cos(angle2);
      let z2 = Math.sin(angle2);

      gl.uniform4f(
        u_FragColor,
        rgba[0] * 0.9,
        rgba[1] * 0.9,
        rgba[2] * 0.9,
        rgba[3],
      );
      drawTriangle3D([
        0,
        1,
        0,
        x1,
        0,
        z1,
        x2,
        0,
        z2,
      ]);

      gl.uniform4f(
        u_FragColor,
        rgba[0] * 0.5,
        rgba[1] * 0.5,
        rgba[2] * 0.5,
        rgba[3],
      );
      drawTriangle3D([
        0,
        0,
        0,
        x2,
        0,
        z2,
        x1,
        0,
        z1,
      ]);
    }
  }
}
