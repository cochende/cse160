class Camera {
  constructor(canvas) {
    this.eye = new Vector(0, 0, 3);
    this.at = new Vector(0, 0, -100);
    this.up = new Vector(0, 1, 0);
    this.controls = {
      forward: 87,
      backward: 83,
      left: 68,
      right: 65,
      look_right: 81,
      look_left: 69,
    };

    this.canvas = canvas;
    this.speed = 0.1;
    this.panAmt = 3;

    this.fov = 100;
    this.aspectRatio = 1;
    this.sensitivity = 0.2;
  }

  move(key) {
    if (key.keyCode == this.controls.forward) {
      this.forward();
    } else if (key.keyCode == this.controls.backward) {
      this.back();
    } else if (key.keyCode == this.controls.left) {
      this.left();
    } else if (key.keyCode == this.controls.right) {
      this.right();
    } else if (key.keyCode == this.controls.look_left) {
      this.panLeft();
    } else if (key.keyCode == this.controls.look_right) {
      this.panRight();
    }
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
    this.at = this.at.subtract(f);
    this.eye = this.eye.subtract(f);
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

  panLeft() {
    this.rotate(this.panAmt);
  }

  panRight() {
    this.rotate(-this.panAmt);
  }

  pitch(deg) {
    var f = this.at.subtract(this.eye);

    const rads = (Math.PI * deg) / 180;
    const cos = Math.cos(rads);
    const sin = Math.sin(rads);

    const x_prime = f.x;
    const y_prime = f.y * cos - f.z * sin;
    const z_prime = f.y * sin + f.z * cos;

    this.at = new Vector(
      this.eye.x + x_prime,
      this.eye.y + y_prime,
      this.eye.z + z_prime,
    );
  }

  rotate(deg) {
    var f = this.at.subtract(this.eye);
    const rads = (Math.PI * deg) / 180;
    const cos = Math.cos(rads);
    const sin = Math.sin(rads);

    const x_prime = f.x * cos - f.z * sin;
    const y_prime = f.y;
    const z_prime = f.x * sin + f.z * cos;

    this.at = new Vector(
      this.eye.x + x_prime,
      this.eye.y + y_prime,
      this.eye.z + z_prime,
    );
  }
}
