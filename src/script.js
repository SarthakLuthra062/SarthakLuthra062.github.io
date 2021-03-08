//Import Statements
import * as THREE from "../three/build/three.module.js";
import { VRButton } from "../three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../three/examples/jsm/loaders/GLTFLoader.js";
import WebXRPolyfill from "../webxr-polyfill/build/webxr-polyfill.module.js";
import { QueryArgs } from  "../three/external-files/js/util/query-args.js";

if (QueryArgs.getBool('usePolyfill', true)) {
    let polyfill = new WebXRPolyfill();
  }

//Web-GL scene Globals
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(-1.716,-0.5,20.779);
camera.rotation.set(-11,-0.7,0);

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
document.body.appendChild( VRButton.createButton( renderer ) );

//VR Camera Settings

if(renderer.xr.isPresenting ==true){
  console.log("YES");
  camera.position.set(-1.716,-0.5,20.779);
}

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

//Video Player
const video = document.getElementById("video");
video.src = [ 'https://www.youtube.com/embed/', '2d9oB0vaQQ4', '?rel=0' ].join( '' );
video.crossOrigin = 'anonymous';
video.addEventListener( 'play', function () {
this.currentTime = 3;
} );
video.play();
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
        console.log(videoCubeMesh);
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

//Adding a Button
let playButton = document.getElementById("startButton");
playButton.onclick = function(){
    if(video.paused){
        playButton.visible = false;
        video.play();
    }
};
playButton.translation = [0.025,0.275,-4.2];
playButton.scale = [5,5,5];

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
            /*videoCubeMesh.rotation.x += 10 * videoCubeMesh.dx;
            videoCubeMesh.rotation.y += 10 * videoCubeMesh.dy;
            videoCubeMesh.position.x -= 10 * videoCubeMesh.dx;
            videoCubeMesh.position.y += 10 * videoCubeMesh.dy;
            videoCubeMesh.position.z += 48 * videoCubeMesh.dx;*/
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

//Update Function
function update()
{
    renderer.render(scene, camera);
    cube_move();
    if (mixer) {
        mixer.update(clock.getDelta());
      }
    controls.update()
}

function animate() {
    renderer.setAnimationLoop(update);
}

animate();