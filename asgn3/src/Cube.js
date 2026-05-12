class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -1;
  }

  drawCube(M = this.matrix) {
    var rgba = this.color;

    // pass texture number
    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass in matrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

    // Front Face
    drawTriangle3DUV([0, 0, 0, 1, 1, 0, 1, 0, 0], [0, 0, 1, 1, 1, 0]);
    drawTriangle3DUV([0, 0, 0, 0, 1, 0, 1, 1, 0], [0, 0, 0, 1, 1, 1]);

    // Top Face
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.9,
      rgba[1] * 0.9,
      rgba[2] * 0.9,
      rgba[3],
    );
    drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
    drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);

    // Right Face
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.8,
      rgba[1] * 0.8,
      rgba[2] * 0.8,
      rgba[3],
    );
    drawTriangle3DUV([1, 0, 0, 1, 1, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
    drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 0, 1], [0, 0, 1, 1, 1, 0]);

    // Left Face
    drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 1, 0], [1, 0, 0, 1, 1, 1]);
    drawTriangle3DUV([0, 0, 0, 0, 0, 1, 0, 1, 1], [1, 0, 0, 0, 0, 1]);

    // Back Face
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.7,
      rgba[1] * 0.7,
      rgba[2] * 0.7,
      rgba[3],
    );
    drawTriangle3DUV([0, 0, 1, 1, 1, 1, 1, 0, 1], [1, 0, 0, 1, 0, 0]);
    drawTriangle3DUV([0, 0, 1, 0, 1, 1, 1, 1, 1], [1, 0, 1, 1, 0, 1]);

    // Bottom Face
    gl.uniform4f(
      u_FragColor,
      rgba[0] * 0.5,
      rgba[1] * 0.5,
      rgba[2] * 0.5,
      rgba[3],
    );
    drawTriangle3DUV([0, 0, 0, 1, 0, 1, 1, 0, 0], [0, 1, 1, 0, 1, 1]);
    drawTriangle3DUV([0, 0, 0, 0, 0, 1, 1, 0, 1], [0, 1, 0, 0, 1, 0]);
  }
}
