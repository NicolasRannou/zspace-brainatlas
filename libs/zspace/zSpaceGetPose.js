window.ZSpace = (function () {
  "use strict";

  var leftViewDevice = null;
  var rightViewDevice = null;
  var leftProjectionDevice = null;
  var rightProjectionDevice = null;
  var stylusDevice = null;
  var stylusButtonsDevice = null;
  var swapStereo = false;
  var stereoEnable = true;
  var stylusGamepad = null;
  var canvasOffset = [0, 0];
  var canvas = null;
  var frameBufferTexture = null;
  var presenting = false;


  var zspace = function (gl, c, window) {
    this.gl = gl;
    canvas = c;
    this.window = window;

    this.frameBuffer = null;
    this.renderBuffer = null;
    
    this.frameBufferDepthTexture = null;

    this.nearClip = 0.1;
    this.farClip = 10000.0;
	this.viewerScale = 1.0;

    this.leftViewMatrix = mat4.create();
    this.rightViewMatrix = mat4.create();
    this.leftProjectionMatrix = mat4.create();
    this.rightProjectionMatrix = mat4.create();
    this.stylusCameraMatrix = mat4.create();

    this.currentWidth = 0;
    this.currentHeight = 0;

    this.buttonPressed = [0, 0, 0];
  }

  // Helper function to get an element's exact position
  function getPosition(canvas) {
    var xPos = 0;
    var yPos = 0;
    xPos = window.screenX + canvas.offsetLeft - screen.availLeft + canvasOffset[0];
    yPos = window.screenY + canvas.offsetTop + 75 + canvasOffset[1];

    return {
      x: xPos,
      y: yPos
    };
  }

  document.onkeydown = checkKey;
  function checkKey(e) {
    e = e || window.event;

    if (e.keyCode == '90') {
      swapStereo = !swapStereo;
    }

    if (e.keyCode == '77') {
        stereoEnable = !stereoEnable;
        if (!stereoEnable) {
            if (leftViewDevice != null) {
              leftViewDevice.requestPresent([{ source: canvas, rightSource: null }]);
              presenting = false;
            }
            return;
        } else {
            if (leftViewDevice != null) {
              leftViewDevice.requestPresent([{ source: canvas, rightSource: frameBufferTexture }]);
              presenting = true;
            }
        }
    }
  }

  function zSpaceConnectHandler(e) {
    console.log("zSpaceConnectHandler: ", e.gamepad);
    stylusGamepad = e.gamepad;
  }

  function zSpaceDisconnectHandler(e) {
    console.log("zSpaceDisconnectHandler: ", e.gamepad);
    stylusGamepad = null;
  }

  function onVRPresentChange() {
      if (leftViewDevice != null) {
          if (leftViewDevice.isPresenting) {
              console.log("onVRPresentChange: Presenting");
          } else {
              console.log("onVRPresentChange: Not Presenting");
          }
      }
  }

  function onVRRequestPresent() {
      if (leftViewDevice != null) {
          leftViewDevice.requestPresent([{ source: canvas, rightSource: frameBufferTexture }]).then(function () {
              // Nothing to do because we're handling things in onVRPresentChange.
            console.log("requestPresent success.");
            presenting = true;
          }, function () {
            console.log("requestPresent failed.");
            presenting = false;
          });
      }
  }

  function onVRExitPresent() {
      if (leftViewDevice != null) {
          if (!leftViewDevice.isPresenting) {
              return;
          }
          leftViewDevice.exitPresent().then(function () {
            presenting = false;
            console.log("exitPresent success.");
          }, function () {
            presenting = true;
            console.log("exitPresent failed.");
          });
      }
  }

  zspace.prototype.setViewerScale = function setViewerScale(scale) {
    this.viewerScale = scale;
  }

  zspace.prototype.setFarClip = function setFarClip(clip) {
    this.farClip = clip;
  }

  zspace.prototype.setCanvasOffset = function setCanvasOffset(x, y) {
    canvasOffset[0] = x;
    canvasOffset[1] = y;
  }

  zspace.prototype.setCanvas = function setCanvas(c) {
      canvas = c;
  }

  zspace.prototype.zspaceInit = function zspaceInit() {
    if (navigator.getVRDisplays) {
      navigator.getVRDisplays().then(function (displays) {
        if (displays.length > 0) {
          var i;
          for (i = 0; i < displays.length; i++) {
            if (displays[i].displayName == "ZSpace Left View") {
              leftViewDevice = displays[i];
            }
            if (displays[i].displayName == "ZSpace Right View") {
              rightViewDevice = displays[i];
            }
            if (displays[i].displayName == "ZSpace Left Projection") {
              leftProjectionDevice = displays[i];
            }
            if (displays[i].displayName == "ZSpace Right Projection") {
              rightProjectionDevice = displays[i];
            }
            if (displays[i].displayName == "ZSpace Stylus") {
             stylusDevice = displays[i];
            }

            if (displays[i].displayName == "ZSpace Stylus Buttons") {
              stylusButtonsDevice = displays[i];
            }
          }
        }
      });
    }

    this.window.addEventListener("gamepadconnected", zSpaceConnectHandler);
    this.window.addEventListener("gamepaddisconnected", zSpaceDisconnectHandler);
    this.window.addEventListener('vrdisplaypresentchange', onVRPresentChange, false);
    this.window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
    this.window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
  }

  zspace.prototype.allocateBuffers = function allocateBuffers() {

    if (this.frameBuffer == null) {
      this.frameBuffer = this.gl.createFramebuffer();
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
	
	if (this.renderBuffer != null) {
		this.gl.deleteRenderbuffer(this.renderBuffer);
		this.renderBuffer = null;
	}

    if (this.renderBuffer == null) {
      this.renderBuffer = this.gl.createRenderbuffer();
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);

      this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_STENCIL, canvas.clientWidth, canvas.clientHeight);
      this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_STENCIL_ATTACHMENT, this.gl.RENDERBUFFER, this.renderBuffer);

      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    }

    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);

    if (frameBufferTexture != null) {
      this.gl.deleteTexture(frameBufferTexture);
    }

    frameBufferTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, frameBufferTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, canvas.clientWidth, canvas.clientHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, frameBufferTexture, 0);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
  }

  zspace.prototype.zspaceLeftView = function zspaceLeftView() {
    if (!stereoEnable)
      return;

    if (swapStereo)
    {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
    }
    else
    {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    }
  }

  zspace.prototype.zspaceRightView = function zspaceRightView() {
    if (!stereoEnable)
      return;

    if (swapStereo) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    }
    else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
    }
  }

  zspace.prototype.zspaceFrameEnd = function zspaceFrameEnd() {
    if (!stereoEnable)
      return;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    if (presenting) {
        leftViewDevice.submitFrame();
    }
  }

  zspace.prototype.makeProjection = function makeProjection(projection, up, down, left, right) {
    var o = Math.tan(up);
    var u = Math.tan(down);
    var l = Math.tan(left);
    var e = Math.tan(right);
    var M = 2 / (l + e), s = 2 / (o + u);
    projection[0] = M;
    projection[1] = 0;
    projection[2] = 0;
    projection[3] = 0;
    projection[4] = 0;
    projection[5] = s;
    projection[6] = 0;
    projection[7] = 0;
    projection[8] = -((l - e) * M * .5);
    projection[9] = (o - u) * s * .5;
    projection[10] = this.farClip / (this.nearClip - this.farClip);
    projection[11] = -1;
    projection[12] = 0;
    projection[13] = 0;
    projection[14] = this.farClip * this.nearClip / (this.nearClip - this.farClip);
    projection[15] = 0;
  }

  zspace.prototype.zspaceUpdate = function zspaceUpdate() {
	  
	var displaySize = [0.521, 0.293];
    var displayResolution = [1920, 1080];
    var displayScaleFactor = [0.0, 0.0];
    displayScaleFactor[0] = displaySize[0] / displayResolution[0];
    displayScaleFactor[1] = displaySize[1] / displayResolution[1];

    if (this.currentWidth != canvas.clientWidth ||
        this.currentHeight != canvas.clientHeight) {
      this.currentWidth = canvas.clientWidth;
      this.currentHeight = canvas.clientHeight;
      this.allocateBuffers();
    }

    if (leftViewDevice != null && leftViewDevice.isPresenting) {
      leftViewDevice.requestPresent([{ source: canvas, rightSource: frameBufferTexture }]);
    }

    var canvasPosition = getPosition(canvas);
    var canvasWidth = canvas.clientWidth * displayScaleFactor[0] * this.viewerScale;
    var canvasHeight = canvas.clientHeight * displayScaleFactor[1] * this.viewerScale;

    var displayCenterX = displayResolution[0] * 0.5;
    var displayCenterY = displayResolution[1] * 0.5;
    var viewportCenterX = canvasPosition.x + (canvas.clientWidth * 0.5);
    var viewportCenterY = displayResolution[1] - (canvasPosition.y + (canvas.clientHeight * 0.5));

    var viewportShift = [0.0, 0.0, 0.0];
    viewportShift[0] = (viewportCenterX - displayCenterX) * displayScaleFactor[0];
    viewportShift[1] = (viewportCenterY - displayCenterY) * displayScaleFactor[1];
    var offsetTranslation = mat4.create();
    mat4.identity(offsetTranslation);
    mat4.translate(offsetTranslation, offsetTranslation, viewportShift);

	var viewScale = mat4.create();
	mat4.identity(viewScale);
	var scale = vec3.create();
	scale[0] = this.viewerScale; scale[1] = this.viewerScale; scale[2] = this.viewerScale; 
	mat4.scale(viewScale, viewScale, scale);

	var frameData = new VRFrameData();
	
    if (leftViewDevice) {
      var leftViewPose = leftViewDevice.getPose();
      leftViewDevice.getFrameData(frameData);
      if (leftViewPose && leftViewPose.orientation && leftViewPose.position) {
        var newPosition = vec3.create();
        vec3.transformMat4(newPosition, leftViewPose.position, offsetTranslation);
		    vec3.transformMat4(newPosition, newPosition, viewScale);
        mat4.fromRotationTranslation(this.leftViewMatrix, leftViewPose.orientation, newPosition);
      }
    }
    else {
      mat4.identity(this.leftViewMatrix);
    }

    if (rightViewDevice) {
      var rightViewPose = rightViewDevice.getPose();
      if (rightViewPose && rightViewPose.orientation && rightViewPose.position) {
        var newPosition = vec3.create();
        vec3.transformMat4(newPosition, rightViewPose.position, offsetTranslation);
		    vec3.transformMat4(newPosition, newPosition, viewScale);
        mat4.fromRotationTranslation(this.rightViewMatrix, rightViewPose.orientation, newPosition);
      }
    }
    else {
      mat4.identity(this.rightViewMatrix);
    }

    offsetTranslation[12] = -offsetTranslation[12];
    offsetTranslation[13] = -offsetTranslation[13];
	


    if (leftProjectionDevice) {
      var leftProjectionPose = leftProjectionDevice.getPose();
      if (leftProjectionPose && leftProjectionPose.orientation && leftProjectionPose.position) {

        var leftEye = vec3.create();
        vec3.transformMat4(leftEye, leftProjectionPose.position, offsetTranslation);
		    vec3.transformMat4(leftEye, leftEye, viewScale);

        var up = Math.atan((canvasHeight * 0.5 - leftEye[1]) / leftEye[2]);
        var down = Math.atan((canvasHeight * 0.5 + leftEye[1]) / leftEye[2]);
        var left = Math.atan((canvasWidth * 0.5 + leftEye[0]) / leftEye[2]);
        var right = Math.atan((canvasWidth * 0.5 - leftEye[0]) / leftEye[2]);
        this.makeProjection(this.leftProjectionMatrix, up, down, left, right);
      } else {
        mat4.frustum(this.leftProjectionMatrix, -0.1, 0.1, -0.1, 0.1, 0.1, 1000.0);
      }
    }

    if (rightProjectionDevice) {
      var rightProjectionPose = rightProjectionDevice.getPose();
      if (rightProjectionPose && rightProjectionPose.orientation && rightProjectionPose.position) {
        var rightEye = vec3.create();
        vec3.transformMat4(rightEye, rightProjectionPose.position, offsetTranslation);
		    vec3.transformMat4(rightEye, rightEye, viewScale);
		
        var up = Math.atan((canvasHeight * 0.5 - rightEye[1]) / rightEye[2]);
        var down = Math.atan((canvasHeight * 0.5 + rightEye[1]) / rightEye[2]);
        var left = Math.atan((canvasWidth * 0.5 + rightEye[0]) / rightEye[2]);
        var right = Math.atan((canvasWidth * 0.5 - rightEye[0]) / rightEye[2]);
        this.makeProjection(this.rightProjectionMatrix, up, down, left, right);
      } else {
        mat4.frustum(this.rightProjectionMatrix, -0.1, 0.1, -0.1, 0.1, 0.1, 1000.0);
      }
    }

    var gamepads = navigator.getGamepads();
    for (var i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        if (gamepads[i].id == "zSpace Stylus Gamepad") {
          stylusGamepad = gamepads[i];
        }
      }
    }

    if (stylusGamepad) {
      var stylusPose = stylusGamepad.pose;
      if (stylusPose != null) {
        console.log(stylusPose.position);
        var newPosition = vec3.create();
        vec3.transformMat4(newPosition, stylusPose.position, offsetTranslation);
        vec3.transformMat4(newPosition, newPosition, viewScale);
        mat4.fromRotationTranslation(this.stylusCameraMatrix, stylusPose.orientation, newPosition);

        //this.buttonPressed[0] = stylusGamepad.buttons[0].pressed ? 1 : 0;
        //this.buttonPressed[1] = stylusGamepad.buttons[1].pressed ? 1 : 0;
        //this.buttonPressed[2] = stylusGamepad.buttons[2].pressed ? 1 : 0;
        this.buttonPressed[0] = stylusGamepad.buttons[0].value;
        this.buttonPressed[1] = stylusGamepad.buttons[1].value;
        this.buttonPressed[2] = stylusGamepad.buttons[2].value;
      }
    }

    if (stylusDevice) {
      var stylusPose = stylusDevice.getPose();
      if (stylusPose && stylusPose.orientation && stylusPose.position) {
        var newPosition = vec3.create();
        vec3.transformMat4(newPosition, stylusPose.position, offsetTranslation);
        vec3.transformMat4(newPosition, newPosition, viewScale);
        mat4.fromRotationTranslation(this.stylusCameraMatrix, stylusPose.orientation, newPosition);
      }
    }
    else {
      mat4.identity(this.stylusCameraMatrix);
    }

    if (stylusButtonsDevice) {
      var stylusButtonsState = stylusButtonsDevice.getPose();
      if (stylusButtonsState && stylusButtonsState.position) {
        this.buttonPressed[0] = stylusButtonsState.position[0];
        this.buttonPressed[1] = stylusButtonsState.position[1];
        this.buttonPressed[2] = stylusButtonsState.position[2];
      }
    }
    else {
      this.buttonPressed[0] = 0;
      this.buttonPressed[1] = 0;
      this.buttonPressed[2] = 0;
    }
  }

  return zspace;
})();