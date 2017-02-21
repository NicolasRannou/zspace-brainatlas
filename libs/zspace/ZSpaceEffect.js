/**
* An Effect to enable zSpace Display
*/

THREE.ZSpaceEffect = function ( renderer ) {

	var leftCamera = new THREE.PerspectiveCamera();
	leftCamera.layers.enable( 1 );
	leftCamera.matrixAutoUpdate = false;

	var rightCamera = new THREE.PerspectiveCamera();
	rightCamera.layers.enable( 2 );
	rightCamera.matrixAutoUpdate = false;
	
	var zspace = new ZSpace(renderer.context, renderer.context.canvas);
	zspace.zspaceInit();
	zspace.setCanvasOffset(310, 0);

	var leftViewMatrix = new THREE.Matrix4();
	var rightViewMatrix = new THREE.Matrix4();
	var leftProjectionMatrix = new THREE.Matrix4();
	var rightProjectionMatrix = new THREE.Matrix4();
	var cameraViewMatrix = new THREE.Matrix4();
	var stylusCameraMatrix = new THREE.Matrix4();
	var stylusWorldMatrix = new THREE.Matrix4();
	var stylusLocalMatrix = new THREE.Matrix4();
	var invCameraMatrix = new THREE.Matrix4();
	
	var raycaster = new THREE.Raycaster();
	var intersects = null;
	var stylusLine = null;
	var stylusLength = 0.5;

	var buttonPressed = 0;
	var objectHit = null;
	var draggingObject = null;
	var startOffset = new THREE.Vector4();
	var startScale = new THREE.Vector3();
	var startRotation = new THREE.Quaternion();

	this.setSize = function ( width, height ) {
		renderer.setSize( width, height );
	};

	this.setViewerScale = function (scale) {
	  zspace.setViewerScale(scale);
	};

	this.setFarClip = function (clip) {
	  zspace.setFarClip(clip);
	};

	this.processStylus = function (camera, scene) {
	  var position = new THREE.Vector3();
	  var direction = new THREE.Vector3();
	  

	  for (var i = 0; i < 16; i++) {
	    stylusCameraMatrix.elements[i] = zspace.stylusCameraMatrix[i];
	  }
	  invCameraMatrix.getInverse(camera.matrixWorld);

	  stylusWorldMatrix.multiplyMatrices(camera.matrixWorld, stylusCameraMatrix);
	  stylusLocalMatrix.multiplyMatrices(stylusWorldMatrix, invCameraMatrix);

	  position.x = stylusWorldMatrix.elements[12];
	  position.y = stylusWorldMatrix.elements[13];
	  position.z = stylusWorldMatrix.elements[14];

	  direction.x = -stylusWorldMatrix.elements[8];
	  direction.y = -stylusWorldMatrix.elements[9];
	  direction.z = -stylusWorldMatrix.elements[10];
	  direction.normalize();

	  raycaster.set(position, direction);
	  
	  if (draggingObject == null) {
	    intersects = raycaster.intersectObjects(scene.children, true);

	    var hit = false;
	    stylusLength = 0.5 * zspace.viewerScale;
	    objectHit = null;
	    for (var i = 0; i < intersects.length; i++) {
	      if (intersects[i].object != stylusLine) {
	        stylusLength = intersects[i].distance;
	        objectHit = intersects[i].object;
	        hit = true;
	        break;
	      }
	    }
	  }


	  var position4 = new THREE.Vector4();
	  var direction4 = new THREE.Vector4();
	  position4.copy(position);
	  direction4.copy(direction);
	  // Get the current stylus button state
	  var currentButtonPressed = zspace.buttonPressed[0];

	  // If the button state changed, we need to update some state
	  if (currentButtonPressed != buttonPressed)
	  {
	    // If it is pressed, and we are hitting an object, start a drag.
	    if (currentButtonPressed == 1 && objectHit != null)
	    {
	      // This code figures out the beginning offset and from the end
	      // of the virtual stylus and the center of the grabbed object.
	      // It also computes the starting cumulative rotation of the stylus
	      // and the grabbed object.  These will be used to compute the correct
	      // modelview transform of the object while it is dragged.
	      var quat = new THREE.Quaternion();
	      quat.setFromRotationMatrix (objectHit.matrixWorld);
	      quat.inverse();
	      var matrix = new THREE.Matrix4();
	      matrix.makeRotationFromQuaternion(quat);

		  startScale.setFromMatrixScale ( objectHit.matrixWorld );

	      var objectPosition = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
	      objectPosition.applyMatrix4(objectHit.matrixWorld);
	      var stylusEnd = new THREE.Vector4();
	      stylusEnd.copy(position4);
	      stylusEnd.addScaledVector(direction4, stylusLength);

	      var offset = new THREE.Vector4();
	      offset.subVectors(objectPosition, stylusEnd);
	      startOffset.copy(offset);
	      startOffset.applyMatrix4(matrix);

	      var rotation = new THREE.Quaternion();
	      rotation.setFromRotationMatrix (stylusWorldMatrix);
	      rotation.inverse();
	      quat.setFromRotationMatrix (objectHit.matrixWorld);
	      startRotation.multiplyQuaternions(rotation, quat);

	      // This tracks the object that we are currently dragging.
	      draggingObject = objectHit;
	    }
	    else
	    {
	      // Button Release Event - just stop any drag operation.
	      draggingObject = null;
	    }
	    // Update last know stylus button state
	    buttonPressed = currentButtonPressed;
	  }
	  else if (draggingObject != null)
	  {
	    // If the button state hasn't changed, but we are dragging, we need to
	    // process the drag operation.
	    var stylusEnd = new THREE.Vector4();
	    stylusEnd.copy(position4);
	    stylusEnd.addScaledVector(direction4, stylusLength);
	    var rotation = new THREE.Quaternion();
	    rotation.setFromRotationMatrix (stylusWorldMatrix);
	    var newRotation = new THREE.Quaternion();
	    newRotation.multiplyQuaternions(rotation, startRotation);

	    var matrix = new THREE.Matrix4();
	    matrix.makeRotationFromQuaternion (newRotation);
	    var offset = new THREE.Vector4();
	    offset.copy(startOffset);
	    offset.applyMatrix4(matrix);

	    // Set the modelview matrix to be the new rotation and offset as calculated above.
	    var newOffset = new THREE.Vector4();
	    newOffset.addVectors(offset, stylusEnd);

	    var newScale = new THREE.Vector3();
		newScale.copy(startScale);

	    if (draggingObject.parent != null) {
	      var parentTransform = new THREE.Matrix4();
	      var newTransform = new THREE.Matrix4();
	      var localTransform = new THREE.Matrix4();

	      parentTransform.getInverse(draggingObject.parent.matrixWorld);
	      newTransform.compose(newOffset, newRotation, startScale);
	      localTransform.multiplyMatrices(parentTransform, newTransform);
	      localTransform.decompose(newOffset, newRotation, newScale);
	    }

	    draggingObject.position.copy(newOffset);
	    draggingObject.quaternion.copy(newRotation);
		draggingObject.scale.copy(newScale);
		draggingObject.updateMatrix();
	    draggingObject.updateMatrixWorld();
	  }

	  var endPosition = new THREE.Vector3(0.0, 0.0, -stylusLength);
	  if (stylusLine == null) {
	    var material = new THREE.LineBasicMaterial({ color: 0xffffff });
	    var geometry = new THREE.Geometry();
	    geometry.vertices.push(new THREE.Vector3(), endPosition);

	    stylusLine = new THREE.Line(geometry, material);
	    scene.add(stylusLine);
	  }

	  stylusLine.matrix.copy(camera.matrixWorld);
	  stylusLine.position.setFromMatrixPosition(stylusWorldMatrix);
	  stylusLine.quaternion.setFromRotationMatrix(stylusWorldMatrix);
	  stylusLine.updateMatrixWorld();
	  stylusLine.geometry.vertices[1].copy(endPosition);
	  stylusLine.geometry.verticesNeedUpdate = true;

	  if (hit) {
	    stylusLine.material.color.set(0xff0000);
	  } else {
	    stylusLine.material.color.set(0xffff00);
	  }
	};

	this.render = function ( scene, camera ) {
		var projectionMatrix = camera.projectionMatrix.clone();
		
		var gl = renderer.context;
		
		scene.updateMatrixWorld();
		camera.updateMatrixWorld();

		zspace.zspaceUpdate();

		this.processStylus(camera, scene);
		
		scene.updateMatrixWorld();
		camera.updateMatrixWorld();
		
		var size = renderer.getSize();
		
		gl.viewport( 0, 0, size.width, size.height );
		gl.clearColor(0.1, 0.2, 0.3, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
		
		for (var i=0; i<16; i++) {
		  leftViewMatrix.elements[i] = zspace.leftViewMatrix[i];
		  rightViewMatrix.elements[i] = zspace.rightViewMatrix[i];
		  leftProjectionMatrix.elements[i] = zspace.leftProjectionMatrix[i];
		  rightProjectionMatrix.elements[i] = zspace.rightProjectionMatrix[i];
		}
		
		cameraViewMatrix.copy(camera.matrixWorld);
		var invLeftViewMatrix = new THREE.Matrix4();
		invLeftViewMatrix.getInverse(leftViewMatrix);
		var invRightViewMatrix = new THREE.Matrix4();
		invRightViewMatrix.getInverse(rightViewMatrix);

		zspace.zspaceLeftView();
		leftCamera.matrixWorld.multiplyMatrices(cameraViewMatrix, invLeftViewMatrix);
		leftCamera.projectionMatrix.copy( leftProjectionMatrix );
		renderer.render( scene, leftCamera );

		zspace.zspaceRightView();
		rightCamera.matrixWorld.multiplyMatrices(cameraViewMatrix, invRightViewMatrix);
		rightCamera.projectionMatrix.copy( rightProjectionMatrix );
		renderer.render( scene, rightCamera );

		zspace.zspaceFrameEnd();
	};

};
