//license. By downloading these data, you agree to acknowledge our contribution in any of your publications that 
// result form the use of this atlas. Please acknowledge the following grants: P41 RR013218, R01 MH050740.

let zSpaceReady = true;
let fixed = true;
let clipping = true;
let stackHelper = null;
let ready = false;
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
camera.position.x = 589;
camera.position.y = -344;
camera.position.z = 302;
camera.up.set(-0.439, 0.243, 0.855);

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
    opacity: 0.2,} );
const materialBack = new THREE.MeshBasicMaterial( {
    color: 0xffffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.8,} );
const material = new THREE.MultiMaterial([materialFront, materialBack]);
const plane = new THREE.Mesh( geometry, material );
plane.position.z = 20;
plane.rotation.x = 1.07;
plane.rotation.y = 1.07;
scene.add(plane);
const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

const sliceGeometry = new THREE.PlaneGeometry( 300, 300, 32 );

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
  normal.negate();
  let coplanar =
    plane.geometry.vertices[0].clone()
	.applyMatrix4(plane.matrixWorld);
  clipPlane.setFromNormalAndCoplanarPoint(normal, coplanar);

  //if(ready) {
    effect.render(scene, camera);
    //renderer.render(scene, camera);
  //}
//  else {
 //   effect.render( scene, camera );
 // }

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
        });
        const mesh = new THREE.Mesh(geometry, object.material);
        //scene.add(mesh);
    });
}

//data.forEach(function(object, key) {
//  loader(object);
//});

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
    });
    const mesh = new THREE.Mesh(geometry, object.material);
	var RASToLPS = new THREE.Matrix4();
    RASToLPS.set(-1, 0, 0, 0,
                  0, -1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1);
    mesh.applyMatrix(RASToLPS);
    scene.add(mesh);
});

// VJS classes we will be using in this lesson
var LoadersVolume = AMI.default.Loaders.Volume;
var ControlsTrackball = AMI.default.Controls.Trackball;
var HelpersStack = AMI.default.Helpers.Stack;
// Setup loader
var loader = new LoadersVolume(container);

var t1 = [
    '36747136', '36747150', '36747164', '36747178',
    '36747192', '36747206', '36747220', '36747234', '36747248', '36747262',
    '36747276', '36747290', '36747304', '36747318', '36747332', '36747346',
    '36747360', '36747374', '36747388', '36747402', '36747416', '36747430',
    '36747444', '36747458', '36747472', '36747486', '36747500', '36747514',
    '36747528', '36747542', '36747556', '36747570', '36747584', '36747598',
    '36747612', '36747626', '36747640', '36747654', '36747668', '36747682',
    '36747696', '36747710', '36747724', '36747738', '36747752', '36747766',
    '36747780', '36747794', '36747808', '36747822', '36747836', '36747850',
    '36747864', '36747878', '36747892', '36747906', '36747920', '36747934',
    '36747948', '36747962', '36747976', '36747990', '36748004', '36748018',
    '36748032', '36748046', '36748060', '36748074', '36748088', '36748102',
    '36748116', '36748130', '36748144', '36748158', '36748172', '36748186',
    '36748578', '36748592',
    '36748606', '36748620', '36748634', '36748648', '36748662', '36748676',
    '36748690', '36748704', '36748718', '36748732', '36748746', '36748760',
    '36748774', '36748788', '36748802', '36748816', '36748830', '36748844',
    '36748858', '36748872', '36748886', '36748900', '36748914', '36748928',
    '36748942', '36748956', '36748970', '36748984', '36748998', '36749012',
    '36749026', '36749040', '36749054', '36749068', '36749082', '36749096',
    '36749110', '36749124', '36749138', '36749152', '36749166', '36749180',
    '36749194', '36749208', '36749222', '36749236', '36749250', '36749264',
    '36749278', '36749292', '36749306', '36749320', '36749334', '36749348',
    '36749362', '36749376', '36749390', '36749404', '36749418', '36749432',
    '36749446', '36749460', '36749474', '36749488', '36749502', '36749516',
    '36749530', '36749544', '36749558', '36749572', '36749586', '36749600',
    '36749614', '36749628', '36749642', '36749656', '36749670', '36749684',
    '36749698', '36749712', '36749726', '36749740', '36749754', '36749768',
    '36749782', '36749796', '36749810', '36749824', '36749838', '36749852',
    '36749866', '36749880', '36749894', '36749908', '36749922', '36749936',
    '36749950', '36749964',
];

var files = t1.map(function(v) {
    return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
  });


loader.load(files)
.then(function() {
    // merge files into clean series/stack/frame structure
    var series = loader.data[0].mergeSeries(loader.data);
    loader.free();
    loader = null;

    // be carefull that series and target stack exist!
    stackHelper = new HelpersStack(series[0].stack[0]);
	const stack = stackHelper.stack;
	
	const sliceMesh = new THREE.Mesh(sliceGeometry, stackHelper.slice._material);
	
	// box geometry
	let boxGeometry = new THREE.BoxGeometry(
	  stack.dimensionsIJK.x,
	  stack.dimensionsIJK.y,
	  stack.dimensionsIJK.z);
	let offset = new THREE.Vector3(-0.5, -0.5, -0.5);
	boxGeometry.applyMatrix(
	  new THREE.Matrix4().makeTranslation(
	    stack.halfDimensionsIJK.x + offset.x,
		stack.halfDimensionsIJK.y + offset.y,
		stack.halfDimensionsIJK.z + offset.z
	));
	let boxMaterial = new THREE.MeshBasicMaterial({
		color: 0xFFFFFF,
	});
	
	let boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
	boxMesh.applyMatrix(stack.ijk2LPS);
	let boxHelper = new THREE.BoxHelper(boxMesh, 0xFFFFFF);
	boxHelper.ignoreRaycast = true;
	scene.add(boxHelper);
	
	
    stackHelper.border.color = 0xFFEB3B;

    scene.add(sliceMesh);

    // center camera and interactor to center of bouding box
    // for nicer experience
    var centerLPS = stackHelper.stack.worldCenter();
    camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    camera.updateProjectionMatrix();
    controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
	ready = true;
})
.catch(function(error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
});