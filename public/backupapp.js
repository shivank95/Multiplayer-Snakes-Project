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
var canvasWidth = 0;
var canvasHeight = 0;
var gamePaused = false;
var INITIALMAXSIZE = 10;

//Snake Classes
function SnakeBody(x, y) {
  this.x = x;
  this.y = y;
}
function Snake(body, size, color, direction, score){
  this.id = 0;
  this.size = size;
  this.score = score;
  this.maxSize = 10;
  this.body = [];
  for(var i = 0; i < size; i++) {
    this.body.push(body[i]);
  }
  this.color = color;
  this.direction = direction;
  this.addBody = function (x, y) {
    var obj = new SnakeBody(x, y);
    this.body.push(obj);
    this.size = this.size + 1;
  }
}

//1. IO.on connection for CanvasDimensions and pause Game
io.on('connection', function(socket) {
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
  });

  socket.on("pauseGame", function() {
      if (gamePaused == false) {
        //Pause Game
        gamePaused = true;
      }
      else {
        gamePaused = false;
      }
  });

});

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
  for(var i = snake.size - 1; i > 0; i--) {
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
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(0 + ((INITIALMAXSIZE - i - 1) * 10), 0);
    body.push(obj);
  }

  snake1 = new Snake(body, INITIALMAXSIZE, "blue", 4, 0);

  var body2 = [];
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(0 + ((INITIALMAXSIZE - i - 1) * 10), 0);
    body2.push(obj);
  }

  snake2 = new Snake(body2, INITIALMAXSIZE, "red", 3, 0);

  //Default
  canvasWidth = 1500;
  canvasHeight = 1500;
  //Get Canvas Info from Both
  io.emit("getCanvasInfo");
}

function resetRound() {

  //Snake 1
  var body = [];
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(0 + ((INITIALMAXSIZE - i - 1) * 10), 0);
    body.push(obj);
  }

  snake1.body = body;
  snake1.direction = 4;
  //snake1 = new Snake(body, 10, "blue", 4, 0);

  var body2 = [];
  for(var i = 0; i < INITIALMAXSIZE; i++) {
    var obj = new  SnakeBody(0 + ((INITIALMAXSIZE - i - 1) * 10), 0);
    body2.push(obj);
  }

  snake2.body = body2;
  snake2.direction = 3;

}

//intializing Snake1
var body = [];
for(var i = 0; i < INITIALMAXSIZE; i++) {
  var obj = new  SnakeBody(0 + ((INITIALMAXSIZE - i - 1) * 10), 0);
  body.push(obj);
}
var snake1 = new Snake(body, INITIALMAXSIZE, "blue", 4, 0);

//Initialize Snake2
var body2 = [];
for(var i = 0; i < INITIALMAXSIZE; i++) {
  var obj = new  SnakeBody(0 + ((INITIALMAXSIZE - i - 1) * 10), 0);
  body2.push(obj);
}
var snake2 = new Snake(body2, INITIALMAXSIZE, "red", 3, 0);
//sending snake to client
// io.sockets.on('connection', function(socket) {
//   socket.emit('snake1', snake1);
// });

var clients = [];

//2. IO connection for Directions, Disconnects,
//getting direction from snake
io.on('connection', function(socket) {

  //Maximum 2 clients
  if (clients.length == 2) {
    clients = [];
  }

  clients.push(socket.id);


    //Receive Direction Info from Client
  socket.on("direction", function(direction) {

    if (snake1.id == socket.id) {
      snake1.direction = direction;
    }
    else {
      snake2.direction = direction;
    }

  });
  socket.on("disconnect", function() {

    //Remove client Id from Array
    var index = clients.indexOf(socket.id);


    if (index > -1) {
      clients.splice(index, 1);
      console.log("Spliced at: " + index);
    }

    console.log('user disconnected');
    resetGame();
  });
});


//3. Io Connection for Starting Interval
var interval;
//move snake every few seconds
io.sockets.on('connection', function(socket) {


    //Wait for 2 clients
    if (clients.length > 1) {
      //Clear Timer to prevent increasing speed
      snake1.id = clients[0];
      snake2.id = clients[1];
      clearInterval(interval);

      //Get Canvas Info from Both
      io.emit("getCanvasInfo");

      //Set Interval

      interval = setInterval(function() {

          if (gamePaused == false && clients.length > 1) {
              move(snake1);
              move(snake2);

              //Testing
              //console.log("Canvas Width: " + canvasWidth + "Snake 1: " + snake1.body[0].x + " " + snake1.body[0].y);
              //console.log("Snake 2: " + snake2.body[0].x);

              //Send to everyone
              io.emit('snake1', snake1);
              io.emit('snake2', snake2);

              collisionDetect();
          }

      }, 100);
    }
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
            resetRound();
            //return;
          }
      }

  }



}

/*
http.listen(3000, function(){
  console.log('listening on *:3000');
});*/
