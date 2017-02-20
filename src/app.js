//license. By downloading these data, you agree to acknowledge our contribution in any of your publications that 
// result form the use of this atlas. Please acknowledge the following grants: P41 RR013218, R01 MH050740.

let zSpaceReady = true;
// if (navigator.getVRDisplays) {
//     navigator.getVRDisplays().then(function (displays) {
//         if (displays.length > 0) {
//             var i;
//             for (i = 0; i < displays.length; i++) {
//                 if (displays[i].displayName == "ZSpace Display") {
//                     zSpaceReady = true;
//                 }
//             }
//         }
//     });
// }

let fixed = false;
let clipping = true;

let dataInfo = [
    ['amygdaloid_body_L', {
        location: './data/models/amygdaloid_body_L.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['amygdaloid_body_R', {
        location: './data/models/amygdaloid_body_R.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x884423,
    }],
    ['angular_gyrus_inferior_parietal_lobule_R', {
        location: './data/models/angular_gyrus_inferior_parietal_lobule_R.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x884423,
    }],
    ['angular_gyrus_inferior_parietal_lobule_L', {
        location: './data/models/angular_gyrus_inferior_parietal_lobule_L.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['anterior_commissure', {
        location: './data/models/anterior_commissure.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['anterior_substantia_perforata_L', {
        location: './data/models/anterior_substantia_perforata_L.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x884423,
    }],
    ['anterior_substantia_perforata_R', {
        location: './data/models/anterior_substantia_perforata_R.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['atlas', {
        location: './data/models/atlas.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['axis', {
        location: './data/models/axis.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['caudate_nucleus_L', {
        location: './data/models/caudate_nucleus_L.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['caudate_nucleus_R', {
        location: './data/models/caudate_nucleus_R.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['cerebellar_hemisphere_L', {
        location: './data/models/cerebellar_hemisphere_L.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
    ['cerebellar_hemisphere_R', {
        location: './data/models/cerebellar_hemisphere_R.vtk',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234488,
    }],
];

let data = new Map(dataInfo);

// switch zSpace on

// Initialize app
const container = document.getElementById('container');
const renderer = new THREE.WebGLRenderer();
renderer.setSize(container.offsetWidth, container.offsetHeight);
renderer.setClearColor(0x353535, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.localClippingEnabled = clipping;
container.appendChild(renderer.domElement);

const effect = new THREE.ZSpaceEffect(renderer);
effect.setSize(container.offsetWidth, container.offsetHeight);
effect.setViewerScale(1000.0);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45, container.offsetWidth / container.offsetHeight, 0.1, 100000);
camera.position.x = 150;
camera.position.y = 400;
camera.position.z = -350;
camera.up.set(-0.42, 0.86, 0.26);

const controls = new THREE.TrackballControls(camera, container);
controls.rotateSpeed = 5.5;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;

const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.copy( camera.position );
scene.add(light);

// clip plane!
const geometry = new THREE.PlaneGeometry( 300, 300, 32 );
const material = new THREE.MeshBasicMaterial( {
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.1,} );
const plane = new THREE.Mesh( geometry, material );
scene.add(plane);
const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

// start rendering loop
function animate() {
  // render
  renderer.localClippingEnabled = clipping;
  controls.update();
  light.position.copy(camera.position);

  if(!fixed) {
    plane.rotation.x += 0.005;
    plane.rotation.y += 0.005;
  }

  // update clip plane
  var vector = new THREE.Vector3();
  plane.getWorldDirection(vector);
  clipPlane.set(vector);

  if(!zSpaceReady) {
    //effect.render(scene, camera);
    renderer.render(scene, camera);
  } else {
    effect.render( scene, camera );
  }

  // request new frame
  requestAnimationFrame(function() {
      animate();
  });
}
animate();

function loader(object) {
    // load the data!
    const vtkLoader = new THREE.VTKLoader();
    vtkLoader.load(object.location, function(geometry) {
        object.material = new THREE.MeshLambertMaterial({
            color: object.color,
            clippingPlanes: [clipPlane],
        });
        const mesh = new THREE.Mesh(geometry, object.material);
        scene.add(mesh);
    });
}

data.forEach(function(object, key) {
  loader(object);
});