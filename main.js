// Get the canvas element from our HTML above
var canvas = document.getElementById("renderCanvas");

// Load the BABYLON 3D engine
var engine = new BABYLON.Engine(canvas, true);

var snake = {
  direction: 0,
  bodyLength: 0,
  head: {},
  body: [],
  materials: []
};

var time = 0;
var nextX;
var nextZ;
var running = false;

var collectables = [];

const WALL_SETTINGS = {
  height: 10,
  thickness: 1
};

const TIMER_SETTINGS = {
  PENDULUM: 2000,
  BOX: 1000,
  DIAMOND: 500
};

var boxImpostor;
var pendulumImpostors;
var objectIn = false;
var boxTimer = 1000;
var pendulumTimer = 2000;
var normalScale = 0.4;
var curveScale = 0.6;
var startLength = 50;
var speed = 0.2;
var moveSnake = true;
var score = 0;
var diamond;

var playerCamera;
var topCamera;

var gui;
var scoreText;

// This begins the creation of a function that we will 'call' just after it's built

var createScene = function () {

  var scene = new BABYLON.Scene(engine);
  scene.enablePhysics();
  //Create a light
  var light1 = new BABYLON.DirectionalLight("Dir0", new BABYLON.Vector3(0, -1, 0), scene);
  light1.intensity = 2;
  light1.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0);

  //Create an Arc Rotate Camera - aimed negative z this time
  //var arcCamera = new BABYLON.ArcRotateCamera("ArcRotateCamera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), scene);
  playerCamera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 45, -100), scene);
  playerCamera.rotationOffset = 180;
  playerCamera.radius = 30; // how far from the object to follow
  playerCamera.heightOffset = 15; // how high above the object to place the camera
  playerCamera.cameraAcceleration = 0.05; // how fast to move
  playerCamera.maxCameraSpeed = 20; // speed limit
  scene.activeCamera = playerCamera;

  topCamera = new BABYLON.ArcRotateCamera("ArcRotateCamera", -1.57, 0, 100, new BABYLON.Vector3(0, 0, 0), scene);

  snake.head = BABYLON.Mesh.CreateSphere("head", 10, 3);
  snake.head.position.x = 0;
  snake.head.position.y = 0.5;
  snake.head.position.z = 0;
  snake.head.scaling.z = 1.5;

  var materialSnake = new BABYLON.StandardMaterial("materialSnake", scene);
  materialSnake.diffuseTexture = new BABYLON.Texture("textures/schlange.jpg");

  for(var i = 0; i < 10; i++) {
    var snakeMaterial = new BABYLON.StandardMaterial("materialSnake" + i, scene);
    snakeMaterial.diffuseTexture = new BABYLON.Texture("textures/schlange" + i + ".jpg");
    snake.materials.push(snakeMaterial);
  }

  var material2 = new BABYLON.StandardMaterial("materialBox2", scene);
  material2.diffuseColor = new BABYLON.Color3(0.1, 1, 0.1);

  var wallMaterial1 = new BABYLON.StandardMaterial("materialWall", scene);
  wallMaterial1.diffuseTexture = new BABYLON.Texture("textures/holzboden-nahtlos.png", scene);
  wallMaterial1.diffuseTexture.uScale = 10.0;//Repeat 5 times on the Vertical Axes
  wallMaterial1.diffuseTexture.vSclae = 1.0;

  var wallMaterial2 = new BABYLON.StandardMaterial("materialWall", scene);
  wallMaterial2.diffuseTexture = new BABYLON.Texture("textures/holzboden-nahtlos.png", scene);
  wallMaterial2.diffuseTexture.uScale = 1.0;//Repeat 5 times on the Vertical Axes
  wallMaterial2.diffuseTexture.vScale = 10.0;

  snake.head.material = materialSnake;

  var northWall = BABYLON.MeshBuilder.CreateBox("northWall", WALL_SETTINGS.thickness, scene);
  northWall.position.x = 0;
  northWall.position.y = WALL_SETTINGS.height / 2 - 0.5;
  northWall.position.z = 40;
  northWall.scaling.x = 80;
  northWall.scaling.y = WALL_SETTINGS.height;
  northWall.physicsImpostor = new BABYLON.PhysicsImpostor(northWall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  northWall.material = wallMaterial1;

  var southWall = BABYLON.MeshBuilder.CreateBox("southWall", WALL_SETTINGS.thickness, scene);
  southWall.position.x = 0;
  southWall.position.y = WALL_SETTINGS.height / 2 - 0.5;
  southWall.position.z = -40;
  southWall.scaling.x = 80;
  southWall.scaling.y = WALL_SETTINGS.height;
  southWall.physicsImpostor = new BABYLON.PhysicsImpostor(southWall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  southWall.material = wallMaterial1;

  var westWall = BABYLON.MeshBuilder.CreateBox("westWall", WALL_SETTINGS.thickness, scene);
  westWall.position.y = WALL_SETTINGS.height / 2 - 0.5;
  westWall.position.x = -40;
  westWall.scaling.z = 80;
  westWall.scaling.y = WALL_SETTINGS.height;
  westWall.physicsImpostor = new BABYLON.PhysicsImpostor(westWall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  westWall.material = wallMaterial2;

  var eastWall = BABYLON.MeshBuilder.CreateBox("eastWall", WALL_SETTINGS.thickness, scene);
  eastWall.position.y = WALL_SETTINGS.height / 2 - 0.5;
  eastWall.position.x = 40;
  eastWall.scaling.z = 80;
  eastWall.scaling.y = WALL_SETTINGS.height;
  eastWall.physicsImpostor = new BABYLON.PhysicsImpostor(eastWall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
  eastWall.material = wallMaterial2;

  nextX = 0;
  nextZ = 0;

  playerCamera.lockedTarget = snake.head;

  var coinCollect = BABYLON.Mesh.CreateCylinder("boxCollect", 1, 4, 4, 20, 1, scene);
  coinCollect.position.y = 50;
  collectables.push(coinCollect);

  var pendTop = BABYLON.Mesh.CreateBox("pendulumTop", 3, scene);
  pendTop.position.y = 20;
  pendTop.position.z = 10;
  collectables.push(pendTop);

  var pendSwing = BABYLON.Mesh.CreateSphere("pendulum", 20, 3, scene);
  pendSwing.position.y = 2;
  pendSwing.position.z = 10;
  collectables.push(pendSwing);

  var loader = new BABYLON.AssetsManager(scene);
  var diamondLoader = loader.addMeshTask("diamond", "", "models/", "diamond.obj");
  diamondLoader.onSuccess = function(meshes) {
    diamond = meshes.loadedMeshes[0];
    diamond.scaling.x = 2;
    diamond.scaling.y = 2;
    diamond.scaling.z = 2;
    diamond.position.y = 2;
    diamond.position.z = -10;
    diamond.rotation.x = 1.57;
    diamond.rotation.z = 1.57;

    var diamondMaterial = new BABYLON.StandardMaterial("diamondMaterial", scene);
    diamondMaterial.diffuseTexture = new BABYLON.Texture("textures/diamant.png");
    diamond.material = diamondMaterial;

    var diamondTop = BABYLON.Mesh.CreateBox("diamondTop", 3, scene);
    diamondTop.position.y = 20;
    diamondTop.position.z = -10;
    collectables.push(diamondTop);

    collectables.push(diamond);
  };

  var snakeHeadLoader = loader.addMeshTask("snakehead", "", "models/", "snakeHead.obj");
  snakeHeadLoader.onSuccess = function(meshes) {
    snake.head.dispose();
    snake.head = meshes.loadedMeshes[0];
    var snakeHeadScaling = 1.5;
    snake.head.scaling.x = snakeHeadScaling;
    snake.head.scaling.y = snakeHeadScaling;
    snake.head.scaling.z = snakeHeadScaling;
    snake.head.position.y = snakeHeadScaling / 2;
    var snakeHeadMaterial = new BABYLON.StandardMaterial("snakeMaterial", scene);
    snakeHeadMaterial.diffuseTexture = new BABYLON.Texture("textures/schlange.jpg");
    snake.head.material = snakeHeadMaterial;
    playerCamera.lockedTarget = snake.head;
  };

  loader.load();


  var coinMaterial = new BABYLON.StandardMaterial("coinMaterial", scene);
  coinMaterial.diffuseTexture = new BABYLON.Texture("textures/tuxcoin.png");
  coinCollect.material = coinMaterial;

  var pearlMaterial = new BABYLON.StandardMaterial("pendulumMaterial", scene);
  pearlMaterial.diffuseTexture = new BABYLON.Texture("textures/blaue_perle.jpg");

  pendSwing.material = pearlMaterial;

  //Creation of a plane
  var plane = BABYLON.Mesh.CreatePlane("plane", 80, scene);
  plane.position.y = -0.5;
  plane.rotation.x = Math.PI / 2;
  plane.physicsImpostor = new BABYLON.PhysicsImpostor(
    plane,
    BABYLON.PhysicsImpostor.BoxImpostor,
    {
      mass: 0,
      restitution: 0.9
    },
    scene);

  var materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
  materialPlane.diffuseTexture = new BABYLON.Texture("textures/grass.png", scene);
  /*BABYLON.VideoTexture.CreateFromWebCam(scene, function(videoTexture) {
    materialPlane.diffuseTexture = videoTexture;
  }, { maxWidth: 256, maxHeight: 256 });*/
  materialPlane.bumpTexture = new BABYLON.Texture("textures/grassbump.png", scene);
  materialPlane.invertNormalMapX = true;
  materialPlane.invertNormalMapY = true;
  materialPlane.emissiveColor = new BABYLON.Color3(197/255, 228/255, 93/255);
  materialPlane.diffuseTexture.uScale = 20.0;
  materialPlane.diffuseTexture.vScale = 20.0;

  plane.material = materialPlane;
  //snake.body[0].material = materialBox;

  gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  scoreText = new BABYLON.GUI.TextBlock();
  scoreText.text = "Score: 0";
  scoreText.color = "white";
  scoreText.fontSize = 32;
  scoreText.left = "20px";
  scoreText.top = "10px";
  scoreText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  scoreText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
  gui.addControl(scoreText);

  return scene;
};

function directionToX(direction) {
  if(direction == 1) {
    return 1;
  } else if(direction == 3) {
    return -1;
  } else {
    return 0;
  }
}

function directionToZ(direction) {
  if(direction == 0) {
    return 1;
  } else if(direction == 2) {
    return -1;
  } else {
    return 0;
  }
}

function directionToRotation(direction) {
  if(direction == 1) {
    return 1.57;
  } else if(direction == 2) {
    return 3.14;
  } else if(direction == 3) {
    return 4.71;
  } else {
    return 0;
  }
}

var scene = createScene();

increaseSize(startLength);

scene.actionManager = new BABYLON.ActionManager(scene);

scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
  if (evt.sourceEvent.key == "d" || evt.sourceEvent.key == "ArrowRight") {
    if(snake.direction == 0) {
      snake.direction = 1;
    } else if(snake.direction == 1) {
      snake.direction = 2;
    } else if(snake.direction == 2) {
      snake.direction = 3;
    } else {
      snake.direction = 0;
    }
  } else if(evt.sourceEvent.key == "a" || evt.sourceEvent.key == "ArrowLeft") {
    if(snake.direction == 0) {
      snake.direction = 3;
    } else if(snake.direction == 1) {
      snake.direction = 0;
    } else if(snake.direction == 2) {
      snake.direction = 1;
    } else {
      snake.direction = 2;
    }
  } else if(evt.sourceEvent.key == " ") {
    running = !running;
  } else if(evt.sourceEvent.key == "v") {
    if(scene.activeCamera == playerCamera) {
      scene.activeCamera = topCamera;
    } else {
      scene.activeCamera = playerCamera;
    }
  }
}));


// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
  scene.render();

  if(running) {
    var rotating = 0;
    if (moveSnake) {
      // update the track "balls"
      for (var i = snake.body.length - 1; i > 0; i--) {
        snake.body[i].position.x = snake.body[i - 1].position.x;
        snake.body[i].position.y = snake.body[i - 1].position.y;
        snake.body[i].position.z = snake.body[i - 1].position.z;
        snake.body[i].direction = snake.body[i - 1].direction;

        if(i >= 2) {
          var zDiff = snake.body[i].position.z - snake.body[i - 2].position.z;
          var xDiff = snake.body[i].position.x - snake.body[i - 2].position.x;
          var newDir = snake.body[i].direction;
          if(rotating > 0) {
            rotating--;
          } else {
            snake.body[i].scaling.y = normalScale;
            if (newDir == 0 || newDir == 2) {
              //ZDirection
              snake.body[i].rotation.y = 0;
            } else {
              //Xdirection
              snake.body[i].rotation.y = 1.57;
            }
          }

          function snakeRotateRight(middle, pos) {
            if(pos < snake.body.length - 8) {
              var value = middle;
              for(var j = 1; j < 6; j++) {
                value -= 0.1333;
                snake.body[pos + j].rotation.y = value;
                snake.body[pos + j].scaling.y = 0.4;
              }
            }
            if(pos > 8) {
              var value = middle;
              for(var j = 1; j < 6; j++) {
                value += 0.1333;
                snake.body[pos - j].rotation.y = value;
                snake.body[pos - j].scaling.y = 0.4;
              }
              rotating = 5;
            }
          }

          function snakeRotateLeft(middle, pos) {
            if(pos < snake.body.length - 8) {
              var value = middle;
              for(var j = 1; j < 6; j++) {
                value += 0.1333;
                snake.body[pos + j].rotation.y = value;
                snake.body[pos + j].scaling.y = curveScale;
              }
            }
            snake.body[pos].rotation.y = middle;
            if(pos > 8) {
              var value = middle;
              for(var j = 1; j < 6; j++) {
                value -= 0.1333;
                snake.body[pos - j].rotation.y = value;
                snake.body[pos - j].scaling.y = curveScale;
              }
              rotating = 5;
            }
          }

          if(snake.body[i].direction != snake.body[i - 2].direction) {
            var oldDir = snake.body[i].direction;
            var newDir = snake.body[i - 2].direction;
            if(oldDir == 0 && newDir == 1) {
              //rotations to right
              snake.body[i].rotation.y = 0.79;
              snakeRotateRight(0.8, i);
            } else if(oldDir == 1 && newDir == 2) {
              //start 1.57
              snake.body[i].rotation.y = 2.36;
              snakeRotateRight(2.4, i);
              //end 3.14
            } else if(oldDir == 2 && newDir == 3) {
              snakeRotateRight(4.0, i);
              snake.body[i].rotation.y = 3.93;
            } else if(oldDir == 3 && newDir == 0) {
              snakeRotateRight(5.5, i);
              snake.body[i].rotation.y = 5.49;
              //rotations to left
            } else if(oldDir == 1 && newDir == 0) {
              snake.body[i].rotation.y = 0.79;
              snakeRotateLeft(0.8, i);
            } else if(oldDir == 2 && newDir == 1) {
              snake.body[i].rotation.y = 2.36;
              snakeRotateLeft(2.4, i);
            } else if(oldDir == 3 && newDir == 2) {
              snake.body[i].rotation.y = 3.93;
              snakeRotateLeft(4.0, i);
            } else if(oldDir == 0 && newDir == 3) {
              snake.body[i].rotation.y = 5.49;
              snakeRotateLeft(5.5, i);
            }

          }
        }

        if (time > 100 && i > 30) {
          if (snake.body[0].intersectsMesh(snake.body[i], false)) {
            // game over
            running = false;
          }
        }
      }

      if(snake.direction == 0 || snake.direction == 2) {
        snake.body[0].rotation.y = 0;
        snake.body[1].rotation.y = 0;
      } else {
        snake.body[0].rotation.y = 1.57;
        snake.body[1].rotation.y = 1.57;
      }

      snake.head.rotation.y = directionToRotation(snake.direction);

      snake.head.position.x = snake.body[0].position.x + directionToX(snake.body[0].direction) * 2.0;
      snake.head.position.z = snake.body[0].position.z + directionToZ(snake.body[0].direction) * 2.0;

      snake.body[0].position.x = nextX ;
      snake.body[0].position.z = nextZ;
      snake.body[0].direction = snake.direction;

      for(i = 0; i < collectables.length; i++) {
        if(snake.head.intersectsMesh(collectables[i], false)) {
          caughtElement(collectables[i]);
        }
      }
    }
    moveSnake = !moveSnake;


    function caughtElement(element) {
      if(element == collectables[0]) {
        increaseSize(5);
        score += boxTimer;
        shootBox();
      } else if(element == collectables[2]) {
        increaseSize(20);
        score += Math.round(pendulumImpostors[1].getLinearVelocity().length() * 200);
        swingPendulum();
      }
      updateScore();
    }

    function shootBox() {
      var extraBox = collectables[0];
      extraBox.position.y = 30;
      extraBox.position.x = Math.random() * 66 - 33;
      extraBox.position.z = Math.random() * 66 - 33;
      console.log("shootBox (" + extraBox.position.x + ", " + extraBox.position.z + ")");
      boxImpostor.applyImpulse(new BABYLON.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1), extraBox.getAbsolutePosition());
      boxTimer = TIMER_SETTINGS.BOX;
    }

    function updateScore() {
      console.log(score);
      scoreText.text = "Score: " + score;
    }

    function swingPendulum() {
      var zPos = Math.random() * 70 - 35;
      var xPos = Math.random() * 70 - 35;
      var power = Math.random() * 20 + 10;

      collectables[1].position.x = xPos;
      collectables[1].position.z = zPos;

      collectables[2].position.x = xPos;
      collectables[2].position.y = 2.0;
      collectables[2].position.z = zPos;

      pendulumImpostors[1].setLinearVelocity(new BABYLON.Vector3(0, 0, 0));

      if(Math.abs(xPos) > Math.abs(zPos)) {
        pendulumImpostors[1].applyImpulse(new BABYLON.Vector3(0, 0, power), collectables[2].getAbsolutePosition());
      } else {
        pendulumImpostors[1].applyImpulse(new BABYLON.Vector3(power, 0, 0), collectables[2].getAbsolutePosition());
      }

      pendulumImpostors[1].setAngularVelocity(new BABYLON.Quaternion(0, 0, 0, 0));
      pendulumTimer = TIMER_SETTINGS.PENDULUM;
    }

    nextX += directionToX(snake.direction) * speed;
    nextZ += directionToZ(snake.direction) * speed;
    snake.head.position.x = nextX;
    snake.head.position.z = nextZ;

    if (snake.direction == 0) {
      //scene.activeCamera.rotationOffset = 180;
      if(nextZ > 40) {
        nextZ = -40;
      }
    } else if (snake.direction == 1) {
      //scene.activeCamera.rotationOffset = 270;
      if(nextX > 40) {
        nextX = -40;
      }
    } else if (snake.direction == 2) {
      //scene.activeCamera.rotationOffset = 0;
      if(nextZ < -40) {
        nextZ = 40;
      }
    } else {
      //scene.activeCamera.rotationOffset = 90;
      if(nextX < -40) {
        nextX = 40;
      }
    }
    if(!objectIn) {
      if (time > 0 && time % 100 == 0) {
        if (boxImpostor == null) {
            boxImpostor = new BABYLON.PhysicsImpostor(collectables[0], BABYLON.PhysicsImpostor.CylinderImpostor, {
            mass: 1,
            restitution: 0.5
          }, scene);

        }
        objectIn = true;
        boxTimer = TIMER_SETTINGS.BOX;
      }
    } else {
      boxTimer--;
      if(boxTimer <= 0) {
        shootBox();
      }
      pendulumTimer--;
      if(pendulumTimer <= 0) {
        swingPendulum();
      }
    }

    if(pendulumImpostors == null) {
      var pendImpostor1 = new BABYLON.PhysicsImpostor(collectables[1], BABYLON.PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 0.1
      }, scene);

      var pendImpostor2 = new BABYLON.PhysicsImpostor(collectables[2], BABYLON.PhysicsImpostor.BoxImpostor, {
        mass: 1,
        restitution: 0.1
      }, scene);
      pendulumImpostors = [];
      pendulumImpostors.push(pendImpostor1);
      pendulumImpostors.push(pendImpostor2);

      var distanceJoint = new BABYLON.DistanceJoint({ maxDistance: 17 });
      pendImpostor2.addJoint(pendImpostor1, distanceJoint);
      pendImpostor2.applyImpulse(new BABYLON.Vector3(20, 0, 0), collectables[2].getAbsolutePosition());
      pendulumTimer = TIMER_SETTINGS.PENDULUM;
    }

    time++;
  } else {
    time = 1;
  }
});

function increaseSize(size) {
  var startNumber = snake.bodyLength;
  for(var i = 0; i < size; i++) {
    var bodyElement = BABYLON.Mesh.CreateCylinder("snakeElement"+startNumber, 1, 3, 3, 16, 1, scene, false);
    bodyElement.scaling.x = 0.8;
    bodyElement.scaling.y = normalScale;
    bodyElement.scaling.z = 0.8;
    bodyElement.position.y = 0.8;

    if(snake.body.length == 0) {
      bodyElement.rotation.x = 1.57;
      bodyElement.rotation.y = directionToRotation(snake.direction);
      bodyElement.direction = 0;
    } else {
      var lastElement = snake.body.length - 1;
      bodyElement.position.x = snake.body[lastElement].position.x - (directionToX(snake.body[lastElement].direction) * normalScale);
      bodyElement.position.z = snake.body[lastElement].position.z - (directionToZ(snake.body[lastElement].direction) * normalScale);
      bodyElement.direction = snake.body[lastElement].direction;

      bodyElement.rotation.x = 1.57;
      bodyElement.rotation.y = directionToRotation(snake.body[lastElement].direction);
    }
    bodyElement.material = snake.materials[i % 10];
    snake.body.push(bodyElement);
    snake.bodyLength++;
  }
}

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});