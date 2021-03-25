//Import Statements
import * as THREE from "../three/build/three.module.js";
import { VRButton } from "../three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../three/examples/jsm/loaders/GLTFLoader.js";
import WebXRPolyfill from "../webxr-polyfill/build/webxr-polyfill.module.js";
import { QueryArgs } from  "../three/external-files/js/util/query-args.js";
import { XRControllerModelFactory } from "../three/examples/jsm/webxr/XRControllerModelFactory.js";

if (QueryArgs.getBool('usePolyfill', true)) {
  let polyfill = new WebXRPolyfill();
}

//Loader
const preloader = document.querySelector('.preloader');
const fadeEffect = setInterval(() => {
  if (!preloader.style.opacity) {
    preloader.style.opacity = 1;
  }
  if (preloader.style.opacity > 0) {
    preloader.style.opacity -= 0.05;
  } else {
    clearInterval(fadeEffect);
    var elem = document.getElementById("preloader");
    elem.remove();
  }
}, 200);

//Web-GL scene Globals
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
let camParent = new THREE.Object3D();
camera.position.set(-1.716,-0.5,20.779);
camera.rotation.set(-11,-0.7,0);

//Character Initialisation
let model,neck,waist,possibleAnims,mixer,idle,clips;
let videoMove = false;
let clock = new THREE.Clock();
let currentlyAnimating = false;
let raycaster = new THREE.Raycaster();
let loaderAnim = document.getElementById('js-loader');
let objArr = [];

//Scene Loader
const loader = new GLTFLoader();
loader.load("../static/home-theater/theater.glb",function(Model){
  let model = Model.scene;
  model.position.set(0.05,-2.4,8);
  model.scale.x = model.scale.y = model.scale.z;
  scene.add(model);
});
    

//Renderer Setup
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType( "local" );
document.body.appendChild( renderer.domElement );

let VrButton;
document.body.appendChild(VrButton = VRButton.createButton( renderer ) );

//VR Controller Setup
const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip1 = renderer.xr.getControllerGrip(0);
const model1 = controllerModelFactory.createControllerModel( controllerGrip1 );
controllerGrip1.add( model1 );

const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
const model2 = controllerModelFactory.createControllerModel( controllerGrip2 );
controllerGrip2.add( model2 );



//VR Camera Settings
VrButton.addEventListener('VREntered', () => {
console.log('Entered VR');
camParent.add(camera);
camParent.position.set(-1.716,-0.5,18.5);
scene.add(camParent);
});

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping=true;
controls.update();

//Lightning
var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
var pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(25, 50, 25);
scene.add(pointLight);

//Character Loader
loader.load("../static/model/Stacy.glb",function(Model){
  model = Model.scene;
  model.name = "stacy";
  console.log(model.name);
  objArr.push(model);
  //Texture and Material
  let characterTexture = new THREE.TextureLoader().load("../static/model/stacy.jpg");
  characterTexture.flipY = false;
  const stacy_mtl = new THREE.MeshPhongMaterial({
      map: characterTexture,
      color: 0xffffff,
      skinning: true
    });

  let fileAnimations = Model.animations;
    model.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.material = stacy_mtl;
    }
    // Reference the neck and waist bones
    if (o.isBone && o.name === 'mixamorigNeck') { 
      neck = o;
    }
    if (o.isBone && o.name === 'mixamorigSpine') { 
      waist = o;
    }
  });
  
  model.scale.set(3.5,3.5,3.5);
  model.position.set(-4.5,-5,2.572)
  scene.add(model);

  //Anims
  loaderAnim.remove();
  mixer = new THREE.AnimationMixer(model);
  clips = fileAnimations.filter(val => val.name !== 'idle');
  let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');
  idleAnim.tracks.splice(3, 3);
  idleAnim.tracks.splice(9, 3);
  idle = mixer.clipAction(idleAnim);
  idle.play();
  possibleAnims = clips.map(val => {
  let clip = THREE.AnimationClip.findByName(clips, val.name);
  clip.tracks.splice(3, 3);
  clip.tracks.splice(9, 3);
  clip = mixer.clipAction(clip);
  return clip;
     }
    );
},
undefined,
function(error) {
  console.error(error);
}
);


//Video Player
const video = document.getElementById("video");
video.src = "../static/videos/video1.mp4";
video.addEventListener( 'play', function () {
this.currentTime = 3;
} );
const videoTexture = new THREE.VideoTexture(video);

//Animated Cubes and Video
let cube_count;
let material;
const meshes = [],
    materials = [],
    xgrid =40, 
    ygrid =20;

let videoCubeMesh;
let i, j, ox, oy, geometry;
const ux = 0.5 / xgrid;
const uy = 0.5 / ygrid;
const xsize = 11 / xgrid; //Cube Grids
const ysize = 6 / ygrid; //Cube Grids
const parameter = { color: 0xffffff, map: videoTexture};
cube_count = 0; 

for ( i=0; i < xgrid; i ++)
{
  for ( j = 0; j < ygrid; j++)
  {
      ox = i;
      oy = j;
      geometry = new THREE.BoxGeometry(xsize, ysize, xsize);   
      change_uvs(geometry, ux, uy, ox, oy);
      materials[cube_count] = new THREE.MeshLambertMaterial(parameter);
      material = materials[cube_count];
      material.hue = i / xgrid;
      material.saturation = 1 - j / ygrid;  
      material.color.setHSL(material.hue,material.saturation,0.5);
      videoCubeMesh = new THREE.Mesh(geometry, material);
      videoCubeMesh.position.x = ( i -xgrid / 2) * xsize;
      videoCubeMesh.position.y = ( j - ygrid / 2) * ysize;
      videoCubeMesh.position.z = 0;
      videoCubeMesh.scale.x = videoCubeMesh.scale.y = videoCubeMesh.scale.z;
      scene.add(videoCubeMesh);
      //console.log(videoCubeMesh);
      videoCubeMesh.dx = 0.001 * (0.5 - Math.random());
      videoCubeMesh.dy = 0.001 * (0.5 - Math.random());
      meshes[cube_count] = videoCubeMesh;
      meshes[cube_count].scale.x = 0.9;
      meshes[cube_count].scale.y = 0.9;
      meshes[cube_count].scale.z = 0.5;
      cube_count +=1; 
  }
}

renderer.autoClear = false;

//Window Resize function
window.addEventListener("resize", () => {
  var aspectRatio = window.innerWidth / window.innerHeight;
  camera.aspect = aspectRatio;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
  })

// Change UV function
function change_uvs( geometry, unitx, unity, offsetx, offsety ) 
{
  const uvs = geometry.attributes.uv.array;
  for ( let i = 0; i < uvs.length; i += 2 ) 
  {
      uvs[ i ] = ( uvs[ i ] + offsetx ) * unitx;
      uvs[ i + 1 ] = ( uvs[ i + 1 ] + offsety ) * unity;
  }
}

let h, counter = 1;

//Cubes Movement
function cube_move()
{
  const time = Date.now() * 0.00005;
  for ( let i = 0; i < cube_count; i ++ ) 
  {
      material = materials[ i ];
      h = ( 360 * ( material.hue + time ) % 360 ) / 360;
      material.color.setHSL( h, material.saturation, 0.5 );
  }
  if ( counter % 1000 > 200 ) 
  {
      for ( let i = 0; i < cube_count; i ++ ) 
      {
          videoCubeMesh = meshes[ i ];
          videoCubeMesh.rotation.x += 10 * videoCubeMesh.dx;
          videoCubeMesh.rotation.y += 10 * videoCubeMesh.dy;
          videoCubeMesh.position.x -= 10 * videoCubeMesh.dx;
          videoCubeMesh.position.y += 10 * videoCubeMesh.dy;
          videoCubeMesh.position.z += 48 * videoCubeMesh.dx;
      }
  }
  if ( counter % 1000 === 0 ) 
  {
      for ( let i = 0; i < cube_count; i ++ ) 
      {
          videoCubeMesh = meshes[ i ];
          videoCubeMesh.dx *= - 1;
          videoCubeMesh.dy *= - 1;
      }
  }
  counter ++;
}

//Get Mouse Degrees and Cursor Movement
document.addEventListener("mousemove", function(e) {
  var mousecoords = getMousePos(e);
    if (neck && waist) {
      moveJoint(mousecoords, neck, 50);
      moveJoint(mousecoords, waist, 30);
    }
});

function getMousePos(e) {
  return { x: e.clientX, y: e.clientY };
}

function moveJoint(mouse, joint, degreeLimit) {
  let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
  joint.rotation.y = THREE.Math.degToRad(degrees.x);
  joint.rotation.x = THREE.Math.degToRad(degrees.y);
}

function getMouseDegrees(x, y, degreeLimit) {
  let dx = 0,
      dy = 0,
      xdiff,
      xPercentage,
      ydiff,
      yPercentage;

  let w = { x: window.innerWidth, y: window.innerHeight };
  if (x <= w.x / 2) {
    xdiff = w.x / 2 - x;
    xPercentage = (xdiff / (w.x / 2)) * 100;
    dx = ((degreeLimit * xPercentage) / 100) * -1; 
  }
  
  if (x >= w.x / 2) {
    xdiff = x - w.x / 2;
    xPercentage = (xdiff / (w.x / 2)) * 100;
    dx = (degreeLimit * xPercentage) / 100;
  }

  if (y <= w.y / 2) {
    ydiff = w.y / 2 - y;
    yPercentage = (ydiff / (w.y / 2)) * 100;
    dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
  }

  if (y >= w.y / 2) {
    ydiff = y - w.y / 2;
    yPercentage = (ydiff / (w.y / 2)) * 100;
    dy = (degreeLimit * yPercentage) / 100;
  }
  return { x: dx, y: dy };
} 
let raycastMatrix = new THREE.Matrix4(); 
//Raycaster Physics

function objIntersection(controller){
raycastMatrix.extractRotation(controller.matrixWorld)
raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
raycaster.ray.direction.applyMatrix4(raycastMatrix);
raycaster.far=1;
vrRaycast();
}

function vrRaycast()
{
let intersects = raycaster.intersectObjects(scene.children, true);
if (intersects[0]) {
  console.log(intersects[0]);
  var object = intersects[0].object;
  console.log(object);
  if(!videoMove)
  {
    video.play();
    videoMove=true;
  }
  if (!currentlyAnimating) {
    currentlyAnimating = true;
    playOnClick();
  }
}
}

//Raycasting VR Controller
function onSelectStart( event ) {
objIntersection(event.target);
}


controllerGrip1.addEventListener( 'selectstart', onSelectStart );
controllerGrip2.addEventListener( 'selectstart', onSelectStart );

//Click to Change Anim
window.addEventListener("click", e => raycast(e));
window.addEventListener("touchend", e => raycast(e, true));

function raycast(e, touch = false) {
var mouse = {};
if (touch) {
  mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
  mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
} else {
  mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
  mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
}
raycaster.setFromCamera(mouse, camera);
var intersects = raycaster.intersectObjects(scene.children, true);

if (intersects[0]) {
  var object = intersects[0].object;

  if (object.name === 'stacy') {
    if (!currentlyAnimating) {
      currentlyAnimating = true;
      playOnClick();
    }
  }
}
}

function playOnClick() {
  let anim = Math.floor(Math.random() * possibleAnims.length) + 0;
  playModifierAnimation(idle, 0.25, possibleAnims[anim], 0.25);
}

function playModifierAnimation(from, fSpeed, to, tSpeed) {
  to.setLoop(THREE.LoopOnce);
  to.reset();
  to.play();
  from.crossFadeTo(to, fSpeed, true);
  setTimeout(function() {
    from.enabled = true;
    to.crossFadeTo(from, tSpeed, true);
    currentlyAnimating = false;
  }, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000));
} 

//Update Function
function update()
{
  renderer.render(scene, camera);
  if(videoMove==true)
  {
    cube_move();
  }
  if (mixer) {
      mixer.update(clock.getDelta());
    }

  var time = clock.getElapsedTime();
  if ( renderer.xr.isPresenting && time > 2 ) 
  {
    let linecolor = new THREE.Color();
    let lineMaterial = new THREE.LineBasicMaterial({ color: linecolor.setHex(Math.random() * 0xffffff)});
    let lineGeometry = new THREE.BufferGeometry().setFromPoints( [ 
      new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) 
    ] );;
    const line = new THREE.Line( lineGeometry,lineMaterial);
    line.name = 'line';
    line.scale.z = 5;
    controllerGrip1.add( line.clone() );
    controllerGrip2.add( line.clone() );
    camParent.add(controllerGrip1);
    camParent.add(controllerGrip2);
    }
    controls.update();
}

function animate() {
  renderer.setAnimationLoop(update);
}

animate();