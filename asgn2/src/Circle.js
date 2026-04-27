class Circle {
  constructor() {
    this.type = "circle";
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 10;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Pass in size of the point

    var d = this.size / 200.0;
    let angleStep = 360 / this.segments;
    for (var a = 0; a < 360; a = a + angleStep) {
      let centerPt = [xy[0], xy[1]];
      let a1 = a;
      let a2 = a + angleStep;
      let v1 = [
        Math.cos((a1 * Math.PI) / 180) * d,
        Math.sin((a1 * Math.PI) / 180) * d,
      ];
      let v2 = [
        Math.cos((a2 * Math.PI) / 180) * d,
        Math.sin((a2 * Math.PI) / 180) * d,
      ];

      let p1 = [centerPt[0] + v1[0], centerPt[1] + v1[1]];
      let p2 = [centerPt[0] + v2[0], centerPt[1] + v2[1]];

      drawTriangle([xy[0], xy[1], p1[0], p1[1], p2[0], p2[1]]);
    }
  }
}
