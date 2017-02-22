let zSpaceEffect = null;
let fixed = true;
let clipping = true;
let stackHelper = null;
let dataInfo = [
    ['adi', {
        location: 'https://cdn.rawgit.com/FNNDSC/data/master/stl/adi_brain/WM.stl',
        label: 'Amygdaloid Left',
        loaded: false,
        material: null,
        color: 0x234576,
    }],
];
let data = new Map(dataInfo);

// Initialize app
const container = document.getElementById('container');
const renderer = new THREE.WebGLRenderer();
renderer.setSize(container.offsetWidth, container.offsetHeight);
renderer.setClearColor(0x353535, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.localClippingEnabled = clipping;
container.appendChild(renderer.domElement);

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

function isZSpaceReady(){
  if(navigator.getVRDisplays) {
    navigator.getVRDisplays().then(function (displays) {
      if(displays.length > 0) {
        let displayDevice = null;
        let stylusDevice = null;
        let stylusButtonsDevice = null;

        for(let i = 0; i < displays.length; i++) {
          if(displays[i].displayName == "ZSpace Display") {
            displayDevice = displays[i];
          }
          
          if(displays[i].displayName == "ZSpace Stylus") {
            stylusDevice = displays[i];
          }
          
          if(displays[i].displayName == "ZSpace Stylus Buttons") {
            stylusButtonsDevice = displays[i];
          }
        }

        if(displayDevice !== null && stylusDevice!== null && stylusButtonsDevice!==null) {
          zSpaceEffect = new THREE.ZSpaceEffect(renderer);
          zSpaceEffect.setSize(container.offsetWidth, container.offsetHeight);
          zSpaceEffect.setViewerScale(1000.0);
        }
      }
    });
  }
}

isZSpaceReady();

// clip plane!
// hack to have different front/back colors/opacities in the same mesh
const geometry = new THREE.PlaneGeometry(300, 300, 32);
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
const sliceGeometry = geometry.clone();

// callbacks
function onWindowResize(){
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
  
  if(zSpaceEffect) {
    zSpaceEffect.setSize(container.offsetWidth, container.offsetHeight);
  }
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

  if(zSpaceEffect) {
    zSpaceEffect.render(scene, camera);
  } else {
    renderer.render( scene, camera );
  }

  // request new frame
  requestAnimationFrame(function() {
      animate();
  });
}
animate();

function loadSTLObject(object) {
    const stlLoader = new THREE.STLLoader();
    stlLoader.load(object.location, function(geometry) {
      object.material = new THREE.MeshLambertMaterial({
        color: object.color,
        clippingPlanes: [clipPlane],
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, object.material);
      const RASToLPS = new THREE.Matrix4();
      RASToLPS.set(-1, 0, 0, 0,
                    0, -1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1);
      mesh.applyMatrix(RASToLPS);
      scene.add(mesh);
    });
}

data.forEach(function(object, key) {
 loadSTLObject(object);
});

// VJS classes we will be using in this lesson
var LoadersVolume = AMI.default.Loaders.Volume;
var ControlsTrackball = AMI.default.Controls.Trackball;
var HelpersStack = AMI.default.Helpers.Stack;
// Setup loader
var loader = new LoadersVolume(container);

var t1 = [
    '36444280', '36444294', '36444308', '36444322', '36444336',
    '36444350', '36444364', '36444378', '36444392', '36444406',
    '36444490', '36444504', '36444518', '36444532', '36746856',
    '36746870', '36746884', '36746898', '36746912', '36746926',
    '36746940', '36746954', '36746968', '36746982', '36746996',
    '36747010', '36747024', '36748200', '36748214', '36748228',
    '36748270', '36748284', '36748298', '36748312', '36748326',
    '36748340', '36748354', '36748368', '36748382', '36748396',
    '36748410', '36748424', '36748438', '36748452', '36748466',
    '36748480', '36748494', '36748508', '36748522', '36748242',
    '36748256', '36444434', '36444448', '36444462', '36444476',
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
})
.catch(function(error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
});