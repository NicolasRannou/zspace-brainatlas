//license. By downloading these data, you agree to acknowledge our contribution in any of your publications that 
// result form the use of this atlas. Please acknowledge the following grants: P41 RR013218, R01 MH050740.

let zSpaceReady = true;
let fixed = true;
let clipping = true;

// overwritte raycast to work on multmaterial

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
camera.position.x = -432;
camera.position.y = 488;
camera.position.z = 317;
camera.up.set(0.4282, -0.3174, 0.8362);

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
for (var i = 0, len = geometry.faces.length; i < len; i++) {
    var face = geometry.faces[i].clone();
    face.materialIndex = 1;
    geometry.faces.push(face);
    geometry.faceVertexUvs[0].push(geometry.faceVertexUvs[0][i].slice(0));
}
const materialFront = new THREE.MeshBasicMaterial( {
    color: 0xffffff,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 0.6,} );
const materialBack = new THREE.MeshBasicMaterial( {
    color: 0xffffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.2,} );
const material = new THREE.MultiMaterial([materialFront, materialBack]);
const plane = new THREE.Mesh( geometry, material );
plane.position.z = -10;
scene.add(plane);
const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

// callbacks
function onWindowResize(){
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
  
  effect.setSize(container.offsetWidth, container.offsetHeight);
}

window.addEventListener('resize', onWindowResize);


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
  var normal = new THREE.Vector3();
  plane.getWorldDirection(normal);
  let coplanar =
    plane.geometry.vertices[0].clone()
	.applyMatrix4(plane.matrixWorld);
  clipPlane.setFromNormalAndCoplanarPoint(normal, coplanar);

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
			side: THREE.DoubleSide,
			shininess: 100,
        });
        const mesh = new THREE.Mesh(geometry, object.material);
        scene.add(mesh);
    });
}

data.forEach(function(object, key) {
  loader(object);
});

let object = data['adi'] = {
        location: 'https://cdn.rawgit.com/FNNDSC/data/master/stl/adi_brain/WM.stl',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234576,
    }

	// test if STL works
const stlLoader = new THREE.STLLoader();
stlLoader.load('https://cdn.rawgit.com/FNNDSC/data/master/stl/adi_brain/WM.stl', function(geometry) {
    object.material = new THREE.MeshLambertMaterial({
        color: object.color,
        clippingPlanes: [clipPlane],
		side: THREE.DoubleSide,
		shininess: 100,
    });
    const mesh = new THREE.Mesh(geometry, object.material);
    scene.add(mesh);
});