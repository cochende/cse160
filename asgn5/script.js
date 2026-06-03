import * as THREE from "three";
import GUI from "lil-gui";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return "#" + this.object[this.prop].getHexString();
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}

let scene;
let renderer;
let camera;
let texture;
let animatedShapes = [];
let canvas;
let loader;
let controls;
let objLoader;
let currentShapes = [];

// game
let itLight;
let itShape;
let points = 0;
let raycaster;
let mouse;

let cameraControls = {
  fov: 90,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 50,
};

function initGlobals() {
  // canvas and renderer
  canvas = document.querySelector("#c");
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // texture
  loader = new THREE.TextureLoader();
  const bg = loader.load("skybox.jpg", () => {
    bg.mapping = THREE.EquirectangularReflectionMapping;
    bg.colorSpace = THREE.SRGBColorSpace;
    scene.background = bg;
  });
  texture = loader.load("texture.jpg");
  texture.colorSpace = THREE.SRGBColorSpace;

  // camera init stuff
  camera = new THREE.PerspectiveCamera(
    cameraControls.fov,
    cameraControls.aspect,
    cameraControls.near,
    cameraControls.far,
  );
  camera.position.z = 2;
  camera.position.y = 2;

  controls = new OrbitControls(camera, canvas);
  controls.autoRotate = false;
  controls.autoRotateSpeed = 2;

  // click detection for game
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // scene init stuff
  scene = new THREE.Scene();

  const skyColor = 0xdfb368;
  const groundColor = 0xff248e;
  const intensity = 0.6;
  // const light = new THREE.AmbientLight(color, intensity);
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(light);

  const gui = new GUI();
  gui.addColor(new ColorGUIHelper(light, "color"), "value").name("skyColor");
  gui
    .addColor(new ColorGUIHelper(light, "groundColor"), "value")
    .name("groundColor");
  gui.add(light, "intensity", 0, 5, 0.01);

  const pointLight1 = new THREE.PointLight("#ff0c0c", 1.5, 100);
  pointLight1.position.set(-5, 2, 2);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight("#0c65ff", 1.5, 100);
  pointLight2.position.set(5, 2, 2);
  scene.add(pointLight2);

  const spotLight = new THREE.SpotLight(0xffffff, 1, 10, Math.PI / 12, 0.5, 1);
  spotLight.position.set(0, 5, -3);
  spotLight.target.position.set(0, 2, -3);
  scene.add(spotLight);
  scene.add(spotLight.target);

  const gltfLoader = new GLTFLoader();
  gltfLoader.load("car.glb", (gltf) => {
    const model = gltf.scene;
    model.position.set(3, 0, 3);
    model.scale.set(1, 1, 1);
    scene.add(model);
  });
}

function render(
  shape,
  material,
  color = "#ed6d6d",
  pos = [0, 0, 0],
  scale = [1, 1, 1],
  rot = [0, 0, 0],
) {
  // create geometry for shape
  let geometry;
  if (shape === "cube") {
    geometry = new THREE.BoxGeometry(1, 1, 1);
  } else if (shape === "sphere") {
    geometry = new THREE.SphereGeometry(0.5, 32, 32);
  } else if (shape === "cylinder") {
    geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  }

  // create texture for shape
  let mat;
  if (material === "basic") {
    mat = new THREE.MeshBasicMaterial({color: color});
  } else if (material === "phong") {
    mat = new THREE.MeshPhongMaterial({color: color});
  } else if (material === "texture") {
    mat = new THREE.MeshBasicMaterial({map: texture});
  }

  // create mesh and scale/rotate
  const mesh = new THREE.Mesh(geometry, mat);

  mesh.position.x = pos[0];
  mesh.position.y = pos[1];
  mesh.position.z = pos[2];

  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.rotation.set(rot[0], rot[1], rot[2]);

  scene.add(mesh);

  return mesh;
}

function renderLoop(time) {
  time *= 0.001;

  animatedShapes.forEach((cube, ndx) => {
    const speed = 1 + ndx * 0.1;
    const rot = time * speed;
    cube.rotation.y = rot;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}

// render: shape, mat, color, pos, scale, rot
function renderAllShapes() {
  let cube1 = render(
    "cube",
    "phong",
    "#6dd1ed",
    [-2, 0.5, 0],
    [1, 1, 1],
    [0, 0.5, 0],
  );
  let cyl1 = render(
    "cylinder",
    "basic",
    "#6dd1ed",
    [2, 0.5, 0],
    [1, 1, 1],
    [0, 0.5, 0],
  );
  let god = render(
    "sphere",
    "texture",
    "#6dd1ed",
    [0, 2, -3],
    [2, 2, 2],
    [0, 0, 0],
  );

  // floor stuff
  const planeSize = 40;
  const loader2 = new THREE.TextureLoader();
  const texture2 = loader.load("checker.jpg");
  texture2.wrapS = THREE.RepeatWrapping;
  texture2.wrapT = THREE.RepeatWrapping;
  texture2.magFilter = THREE.NearestFilter;
  texture2.colorSpace = THREE.SRGBColorSpace;
  const repeats = planeSize / 2;
  texture2.repeat.set(repeats, repeats);
  const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
  const planeMat = new THREE.MeshPhongMaterial({
    map: texture2,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(planeGeo, planeMat);
  mesh.rotation.x = Math.PI * -0.5;
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  animatedShapes.push(god);
}

function generateRandomShapes() {
  // clear shapes
  currentShapes.forEach((shape) => scene.remove(shape));
  currentShapes = [];

  // clear light
  if (itLight) scene.remove(itLight);

  const shapes = ["cube", "sphere", "cylinder"];
  const materials = ["phong", "basic"];

  // generate randoms shapes
  for (let i = 0; i < 20; i++) {
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomMaterial =
      materials[Math.floor(Math.random() * materials.length)];
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    const randomScale = 0.5 + Math.random() * 0.7; // 0.5 to 1.2
    const randomX = -10 + Math.random() * 20;
    const randomZ = -10 + Math.random() * 20;
    const randomY = 0.5 + Math.random() * 2;

    const shape = render(
      randomShape,
      randomMaterial,
      randomColor,
      [randomX, randomY, randomZ],
      [randomScale, randomScale, randomScale],
      [0, 0, 0],
    );

    currentShapes.push(shape);
  }

  itShape = currentShapes[Math.floor(Math.random() * currentShapes.length)];
  itLight = new THREE.PointLight("#00ff88", 1, 50);
  itLight.position.copy(itShape.position);
  scene.add(itLight);
}

function main() {
  initGlobals();
  renderAllShapes();
  requestAnimationFrame(renderLoop);

  generateRandomShapes();
  setInterval(generateRandomShapes, 5000);

  // listen for clicks
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (itShape) {
      const intersects = raycaster.intersectObject(itShape);
      if (intersects.length > 0) {
        points++;
        document.getElementById("points").innerText = `points- ${points}`;
      }
    }
  });
}

main();
