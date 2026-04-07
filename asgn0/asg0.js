// DrawRectangle.js
const CANVAS_SIZE = 400;
const HALF_CANVAS = CANVAS_SIZE / 2;

let currentVectors = [];

function main() {
  // Retrieve <canvas> element <- (1)
  var canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return;
  }

  // Get the rendering context for 2DCG <- (2)
  var ctx = canvas.getContext("2d");

  ctx.fillStyle = "black"; // Set black
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); // Fill a rectangle with the color

  let v1 = new Vector3([2.25, 2.25, 0]);
  let v2 = new Vector3([-2.25, 2.25, 0]);
  drawVector(v1, "red");
  drawVector(v2, "blue");

  currentVectors.push(v1);
  currentVectors.push(v2);
}

function drawVector(v, color) {
  let ctx = document.getElementById("example").getContext("2d");
  // scale by 20
  let newCoords = v.elements.map((elem) => elem * 20);

  ctx.beginPath();
  // start at middle
  ctx.moveTo(HALF_CANVAS, HALF_CANVAS);

  // move to spot
  ctx.lineTo(HALF_CANVAS + newCoords[0], HALF_CANVAS - newCoords[1]);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function handleDrawEvent() {
  let ctx = document.getElementById("example").getContext("2d");
  // clear canvas
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  currentVectors.length = 0;

  //read values of v1
  let xInputV1 = document.getElementById("v1-x");
  let yInputV1 = document.getElementById("v1-y");

  let x1 = xInputV1.value;
  let y1 = yInputV1.value;

  //read values of v2
  let xInputV2 = document.getElementById("v2-x");
  let yInputV2 = document.getElementById("v2-y");

  let x2 = xInputV2.value;
  let y2 = yInputV2.value;

  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, "red");
  drawVector(v2, "blue");

  currentVectors.push(v1);
  currentVectors.push(v2);
}

function handleDrawOperationEvent() {
  handleDrawEvent();

  let op = document.getElementById("op").value;
  let scalar = document.getElementById("scalar").value;

  if (op == "add") {
    let v3 = new Vector3(currentVectors[0].elements);
    v3.add(currentVectors[1]);
    drawVector(v3, "green");
    currentVectors.push(v3);
  } else if (op == "sub") {
    let v3 = new Vector3(currentVectors[0].elements);
    v3.sub(currentVectors[1]);
    drawVector(v3, "green");
    currentVectors.push(v3);
  } else if (op == "mul") {
    let v3 = new Vector3(currentVectors[0].elements);
    v3.mul(scalar);
    drawVector(v3, "green");
    currentVectors.push(v3);

    let v4 = new Vector3(currentVectors[1].elements);
    v4.mul(scalar);
    drawVector(v4, "green");
    currentVectors.push(v4);
  } else if (op == "div") {
    let v3 = new Vector3(currentVectors[0].elements);
    v3.div(scalar);
    drawVector(v3, "green");
    currentVectors.push(v3);

    let v4 = new Vector3(currentVectors[1].elements);
    v4.div(scalar);
    drawVector(v4, "green");
    currentVectors.push(v4);
  } else if (op == "mag") {
    console.log("Magnitude v1: " + currentVectors[0].magnitude());
    console.log("Magnitude v2: " + currentVectors[1].magnitude());
  } else if (op == "norm") {
    let v3 = new Vector3(currentVectors[0].elements);
    v3.normalize();
    drawVector(v3, "green");
    currentVectors.push(v3);

    let v4 = new Vector3(currentVectors[1].elements);
    v4.normalize();
    drawVector(v4, "green");
    currentVectors.push(v4);
  } else if (op == "angl") {
    let angle = angleBetween(currentVectors[0], currentVectors[1]);
    console.log("Angle: " + angle);
  } else if (op == "area") {
    let area = areaTriangle(currentVectors[0], currentVectors[1]);
    console.log("Area of the triangle: " + area);
  }
}

function angleBetween(v1, v2) {
  theta = Vector3.dot(v1, v2);
  m = v1.magnitude() * v2.magnitude();
  theta /= m;
  theta = Math.acos(theta);
  let angle = (theta * 180) / Math.PI;
  return angle;
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  let parallelogram = cross.magnitude();
  let area = parallelogram / 2;
  return area;
}
