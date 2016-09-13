/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com

/*
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
  app.use(express.static(__dirname + '/public'));

});
*/

var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();


var express = require('express');

var app = express();
var http = require('http').Server(app);

var io = require('socket.io')(http);

http.listen(appEnv.port, function(){
  console.log('listening on *:' + appEnv.port);
});

app.use(express.static(__dirname + '/public'));

//Global Variables
var canvasWidth = 500;
var canvasHeight = 500;
var gamePaused = false;
var INITIALMAXSIZE = 10;
var gameCountDown = true;

var gameTimer = 0;

var globalCounter = 18;

//Snake Classes
function SnakeBody(x, y) {
  this.x = x;
  this.y = y;
}
function Snake(body, size, color, dir, score){
  this.id = 0;
  this.size = size;
  this.score = score;
  this.maxSize = 10;
  this.body = [];
  for(var i = 0; i < size; i++) {
    this.body.push(body[i]);
  }
  this.color = color;
  this.direction = dir;
  this.addBody = function (x, y) {
    var obj = new SnakeBody(x, y);
    this.body.push(obj);
    this.size = this.size + 1;
  }
}


//move snake depending on direction
function move(snake) {
  var currentX = snake.body[0].x;
  var currentY = snake.body[0].y;

  if(snake.direction == 1) {
    currentX = currentX - 10;
  }
  else if(snake.direction == 2) {
    currentY = currentY - 10;
  }
  else if(snake.direction == 3) {
    currentX = currentX + 10;
  }
  else {
    currentY = currentY + 10;
  }
  for(var i = snake.body.length - 1; i > 0; i--) {
    snake.body[i].x = snake.body[i - 1].x;
    snake.body[i].y = snake.body[i - 1].y;
  }
  snake.body[0].x = currentX;
  snake.body[0].y = currentY;
}

//Resets Game to original positions
function resetGame() {

  //Snake 1
  var body = [];
  var initialX = Math.floor(canvasWidth / 4);
  initialX = initialX - (initialX % 10);
  var initialY = Math.floor(canvasHeight / 2);
  initialY = initialY - (initialY % 10);
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(initialX + ((INITIALMAXSIZE - i - 1) * 10), initialY);
    body.push(obj);
  }

  snake1 = new Snake(body, INITIALMAXSIZE, "blue", 2, 0);

  var body2 = [];
  initialX = Math.floor(3 * canvasWidth / 4);
  initialX = initialX - (initialX % 10);
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(initialX + ((INITIALMAXSIZE - i - 1) * 10), initialY);
    body2.push(obj);
  }

  snake2 = new Snake(body2, INITIALMAXSIZE, "red", 4, 0);

  //Default
  canvasWidth = 1500;
  canvasHeight = 1500;
  //Get Canvas Info from Both
  io.emit("getCanvasInfo");

  //Regenerate food
  mfood = foodGenerator();
  io.emit("foodInfo", mfood);

  //Get Canvas Info from Both
  io.emit("getCanvasInfo");

}

function resetRound() {

  //Snake 1
  var body = [];
  var initialX = Math.floor(canvasWidth / 4);
  initialX = initialX - (initialX % 10);
  var initialY = Math.floor(canvasHeight / 2);
  initialY = initialY - (initialY % 10);
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(initialX + ((INITIALMAXSIZE - i - 1) * 10), initialY);
    body.push(obj);
  }

  snake1.body = body;
  snake1.direction = 2;
  //snake1 = new Snake(body, 10, "blue", 4, 0);

  var body2 = [];
  initialX = Math.floor(3 * canvasWidth / 4);
  initialX = initialX - (initialX % 10);
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(initialX + ((INITIALMAXSIZE - i - 1) * 10), initialY);
    body2.push(obj);
  }

  snake2.body = body2;
  snake2.direction = 4;

  //Regenerate food
  mfood = foodGenerator();
  io.emit("foodInfo", mfood);

  globalCounter = 18;
  gameCountDown = true;

  //Get Canvas Info from Both
  io.emit("getCanvasInfo");

}

//intializing Snake1
var body = [];
var initialX = Math.floor(canvasWidth / 4);
initialX = initialX - (initialX % 10);
var initialY = Math.floor(canvasHeight / 2);
initialY = initialY - (initialY % 10);
for(var i = 0; i < INITIALMAXSIZE; i++) {
  var obj = new  SnakeBody(initialX  + ((INITIALMAXSIZE - i - 1) * 10), initialY);
  body.push(obj);
}
var snake1 = new Snake(body, INITIALMAXSIZE, "blue", 2, 0);

//Initialize Snake2
initialX = Math.floor(3 * canvasWidth / 4);
initialX = initialX - (initialX % 10);

var body2 = [];
for(var i = 0; i < INITIALMAXSIZE; i++) {
  var obj = new  SnakeBody(initialX + ((INITIALMAXSIZE - i - 1) * 10), initialY);
  body2.push(obj);
}
var snake2 = new Snake(body2, INITIALMAXSIZE, "red", 4, 0);

//Initialize Food

var mfood = [0, 20];
mfood = foodGenerator();
var oldFood = [];
var oldDirection = -1;


var clients = [];

//Io Connection for Starting Interval and other events
var interval;
//move snake every few seconds
io.sockets.on('connection', function(socket) {


    socket.on("disconnect", function() {

        //Remove client Id from Array
        var index = clients.indexOf(socket.id);


        if (index > -1) {
          clients.splice(index, 1);
          console.log("Spliced at: " + index);
        }
        io.emit("connectionIssue");
        console.log('user disconnected');
        resetGame();
        //io.emit("connectionIssue");
    });

    //Maximum 2 clients
    if (clients.length == 2) {
      clients = [];
      io.emit("connectionIssue");
    }

    clients.push(socket.id);
    //Get Canvas Info from Both
    io.emit("getCanvasInfo");
    canvasWidth = 0;

    //Testing
    console.log("CLIENT 1: " + clients[0] + "   CLIENT 2: " + clients[1]);

    //Wait for 2 clients
    if (clients.length > 1) {
      //Clear Timer to prevent increasing speed
      snake1.id = clients[0];
      snake2.id = clients[1];
      clearInterval(interval);

      //Get Canvas Info from Both
      io.emit("getCanvasInfo");

      //Handle Client Event. Called  by Client
      socket.on("canvasDimension", function(canvasDimension) {

          if (canvasWidth == 0) {
            canvasWidth = canvasDimension[0];
            canvasHeight = canvasDimension[1];
          }
          //Canvas heights already initialized, time to Optimize
          else {

            if (canvasDimension[0] < canvasWidth) {
                canvasWidth = canvasDimension[0];
            }
            if (canvasDimension[1] < canvasHeight) {
              canvasHeight = canvasDimension[1];
            }
            var edgeX = canvasWidth;
            var edgeY = canvasHeight;
            var edge = [edgeX, edgeY];
            io.emit("canvasInfo", edge);
          }

          //Testing
          console.log("Canvas Info: Width: " + canvasWidth + " Height: " + canvasHeight);

          mfood = foodGenerator();
          io.emit("foodInfo", mfood);

          console.log("FOOD: " + mfood[0] + " " + mfood[1]);
      });
      //Set Interval


        var speed = 65;

        interval = setInterval(function() {

            if (gameCountDown == true) {
                globalCounter--;
                console.log("COUNTER: " + globalCounter);

                var tempTime = Math.floor(globalCounter/6) + 1;

                var text = "Round Starts in: " + tempTime;

                io.emit('setRoundInfo', text);
                if (globalCounter == 0) {
                  gameCountDown = false;
                  io.emit('countdownOver');
                }
            }
            if (globalCounter == false && gamePaused == false && clients.length > 1) {


                move(snake1);
                move(snake2);

                //console.log("Canvas Info: Width: " + canvasWidth + " Height: " + canvasHeight);
                //console.log("")

                //Testing
                //console.log("Canvas Width: " + canvasWidth + "Snake 1: " + snake1.body[0].x + " " + snake1.body[0].y);
                //console.log("Snake 2: " + snake2.body[0].x);
                console.log("SNAKE 1 Direction: " + snake1.direction);

                //Send to everyone
                io.emit('snake1', snake1);
                io.emit('snake2', snake2);
                io.emit('gameStatus', "Game in Progress");


                collisionDetect();
            }

            if (gamePaused == true) {
              io.emit('gameStatus', "Game Paused");
            }

        }, speed);

        //Receive Direction Info from Client
          socket.on("direction", function(direction) {

              if (gameCountDown == false) {
                  if (snake1.id == socket.id) {
                    snake1.direction = direction;
                  }
                  else {
                    snake2.direction = direction;
                  }
              }

          });

          //Pause Game Event called by client
          socket.on("pauseGame", function() {
              if (gamePaused == false) {
                //Pause Game
                gamePaused = true;
              }
              else {
                gamePaused = false;
              }
          });




    } //If check END for clients.length > 1

});

//Collision Detection
function collisionDetect() {

  //Set current coordinates to check
  var blueX = snake1.body[0].x;
  var blueY = snake1.body[0].y;

  var redX = snake2.body[0].x;
  var redY = snake2.body[0].y;



  var draw = false;
  var redDead = false;
  var blueDead = false;
  //Draw?
  if (blueX == redX && blueY == redY) {
      draw = true;
      io.emit('gameStatus', "DRAW!");
      resetRound();
  }
  //Not a draw. Snake1/Blue Check
  else {

      //BLUE
      if (blueDead == false) {


          //Blue hit himself
          for (var i = 1; i < snake1.body.length; i++) {
              var oldX = snake1.body[i].x;
              var oldY = snake1.body[i].y;

              if (blueX == oldX && blueY == oldY) {
                blueDead = true;
              }
          }

          //Blue hit REd
          for (var i = 1; i < snake2.body.length; i++) {
              var oldX = snake2.body[i].x;
              var oldY = snake2.body[i].y;

              if (blueX == oldX && blueY == oldY) {
                blueDead = true;
              }
          }

          //Blue is out of bounds?
          if (blueX < 0 || blueX >= canvasWidth || blueY < 0 || blueY >= canvasHeight) {
            blueDead = true;
          }

          if (blueDead == true) {
            snake2.score += 1;
            io.emit('gameStatus', "Red Wins!");
            resetRound();
            //return;
          }

      }

      //REd
      if (redDead == false) {

          //Red hit himself
          for (var i = 1; i < snake2.body.length; i++) {
              var oldX = snake2.body[i].x;
              var oldY = snake2.body[i].y;

              if (redX == oldX && redY == oldY) {
                redDead = true;
              }
          }

          //Red hit Blue
          for (var i = 1; i < snake1.body.length; i++) {
              var oldX = snake1.body[i].x;
              var oldY = snake1.body[i].y;

              if (redX == oldX && redY == oldY) {
                redDead = true;
              }
          }

          //Red is out of bounds?
          if (redX < 0 || redX >= canvasWidth || redY < 0 || redY >= canvasHeight) {
            redDead = true;
          }

          //Increase Red's Score if Blue is Dead
          if (redDead == true) {
            snake1.score += 1;
            io.emit('gameStatus', "Blue Wins!");
            resetRound();
            //return;
          }
      }

  }

  //Food Eaten


  var endblueX = snake1.body[snake1.body.length - 1].x;
  var endblueY = snake1.body[snake1.body.length - 1].y;

  var endredX = snake2.body[snake2.body.length - 1].x;
  var endredY = snake2.body[snake2.body.length - 1].y;

  //Testing
  //console.log("END X: " + endblueX + " END Y: " + endblueY + " OLDFOOD: " + oldFood);

  //Blue/Snake1
  if (blueX == mfood[0] && blueY == mfood[1]) {
    oldFood = mfood;
    oldDirection = snake1.direction;
    mfood = foodGenerator();
    io.emit("foodInfo", mfood);
    console.log("OLD FOOD: " + oldFood + "OLD Direction = " + oldDirection);
    console.log("NEW FOOD: " + mfood);

  }
  //Red/Snake2
  if (redX == mfood[0] && redY == mfood[1]) {
    oldFood = mfood;
    oldDirection = snake2.direction;
    mfood = foodGenerator();
    io.emit("foodInfo", mfood);
  }


  //Blue
  if (endblueX == oldFood[0] && endblueY == oldFood[1]) {

    //Left
    if (oldDirection == 1) {

        //Place extra body on the right
        snake1.addBody(endblueX + 10, endblueY);
    }

    //Right
    else if (oldDirection == 3) {

      //Place extra body on the left
      snake1.addBody(endblueX - 10, endblueY);
    }

    //Up
    else if (oldDirection == 2) {
      snake1.addBody(endblueX, endblueY + 10);
    }

    //Down
    else if (oldDirection == 4) {
        snake1.addBody(endblueX, endblueY - 10);
    }

    console.log("BODY ADDED! SIZE: " + snake1.body.length);
    //Reset
    oldDirection = -1;
    oldFood = [-10, -10];
  }

  //REd
  if (endredX == oldFood[0] && endredY == oldFood[1]) {

    //Left
    if (oldDirection == 1) {

        //Place extra body on the right
        snake2.addBody(endredX + 10, endredY);
    }

    //Right
    else if (oldDirection == 3) {

      //Place extra body on the left
      snake2.addBody(endredX - 10, endredY);
    }

    //Up
    else if (oldDirection == 2) {
      snake2.addBody(endredX, endredY + 10);
    }

    //Down
    else if (oldDirection == 4) {
        snake2.addBody(endredX, endredY - 10);
    }

    console.log("BODY ADDED! SIZE: " + snake2.body.length);
    //Reset
    oldDirection = -1;
    oldFood = [-10, -10];
  }




}   //End of collision Detection

//Increase Snake Size

//Boolean funciton that Validates Food Array
function validateCoordinates (food) {
    //check snake1
    for(var i = 0; i < snake1.body.length; i++) {
      if(snake1.body[i].x == food[0] && snake1.body[i].y == food[1]) {
        return false;
      }
    }
    //check snake2
    for(var i = 0; i < snake2.body.length; i++) {
      if(snake2.body[i].x == food[0] && snake2.body[i].y == food[1]) {
        return false;
      }
    }
    return true;
}

//Generates a random value based on Canvas Height and Weight
function generateRandomValue(x) {
    var temp = Math.floor(Math.random() * x);
    temp = temp - (temp % 10);
    return temp;
}

//Generates a Food Couple Array Containing 2 randomized Coordinates and returns it
function foodGenerator() {
    var food = [];
    var padding = 20;
    food[0] = generateRandomValue(canvasWidth - padding);
    food[1] = generateRandomValue(canvasHeight - padding);
    var bool = validateCoordinates(food);
    while(bool == false) {
      food[0] = generateRandomValue(canvasWidth - padding);
      food[1] = generateRandomValue(canvasHeight - padding);
      bool = validateCoordinates(food);
      console.log("Food: " + food[0] + " " + food[1]);
    }
    //console.log("Food: " + food[0] + " " + food[1]);
    return food;
}

/*
http.listen(3000, function(){
  console.log('listening on *:3000');
});*/
