class Camera {
  constructor() {
    this.eye = new Vector(0, 0, 3);
    this.at = new Vector(0, 0, -100);
    this.up = new Vector(0, 1, 0);
    this.r_diff = 0.05;
  }

  forward() {
    var f = this.at.subtract(this.eye);
    f = f.divide(f.length());
    this.at = this.at.add(f);
    this.eye = this.eye.add(f);
  }

  back() {
    var f = this.at.subtract(this.eye);
    f = f.divide(f.length());
    this.at = this.at.add(f);
    this.eye = this.eye.add(f);
  }

  left() {
    var f = this.at.subtract(this.eye);
    f = f.divide(f.length());
    var s = f.cross(this.up);
    s = s.divide(s.length());
    this.at = this.at.add(s);
    this.eye = this.eye.add(s);
  }

  right() {
    var f = this.at.subtract(this.eye);
    f = f.divide(f.length());
    var s = f.cross(this.up);
    s = s.divide(s.length());
    this.at = this.at.subtract(s);
    this.eye = this.eye.subtract(s);
  }

  r_left() {
    var f = this.eye.subtract(this.at);

    var cos = Math.cos(this.r_diff);
    var sin = Math.sin(this.r_diff);

    var newX = f.x * cos - f.z * sin;
    var newZ = f.x * sin + f.z * cos;

    this.eye = new Vector(this.at.x + newX, this.eye.y, this.at.z + newZ);
  }

  r_right() {
    var f = this.eye.subtract(this.at);

    var cos = Math.cos(-this.r_diff);
    var sin = Math.sin(-this.r_diff);

    var newX = f.x * cos - f.z * sin;
    var newZ = f.x * sin + f.z * cos;

    this.eye = new Vector(this.at.x + newX, this.eye.y, this.at.z + newZ);
  }
}
