var direction = 4;
var currentX = 0;
var currentY = 0;
var edgeX = 0;
var edgeY = 0;

var socket = io();

var food = [0, 0];

// socket.on('chat message', function(msg){
// $('#messages').append($('<li>').text(msg));
// });
function start() {

}

function SnakeBody(x, y) {
  this.x = x;
  this.y = y;
}
function Snake(body, size, color, direct, score){
  this.size = size;
  this.body = [];
  this.score = score;
  for(var i = 0; i < size; i++) {
    this.body.push(body[i]);
  }
  this.color = color;
  this.direction = direct;
  this.addBody = function (x, y) {
    var obj = new SnakeBody(x, y);
    this.body.push(obj);
    this.size = this.size + 1;
  }
}

var snake1;
socket.on('snake1', function(snake){
  snake1 = snake;

  //socket.emit("direction", direction);
  //draw2(snake1);
  if (snake.id == socket.io.engine.id) {
    direction = snake.direction;
  }

});

var snake2;
socket.on('snake2', function(snake){
  //socket.emit("direction", direction);
  //console.log("Received Snake 2 Info: " + snake);

  if (snake.id == socket.io.engine.id) {
    direction = snake.direction;
  }

  //Testing
  var elem = document.getElementById("messages2");
  elem.innerHTML = socket.io.engine.id;
  elem.style.visibility = "hidden";

  snake2 = snake;
  draw2(snake1, snake2);

  //Back Color Properties
  if (snake1.id == socket.io.engine.id) {
    document.body.style.backgroundColor = snake1.color;
  }
  else if (snake2.id == socket.io.engine.id){
    document.body.style.backgroundColor = snake2.color;
  }

  //Score Updates
  var score = "Red: " + snake2.score + " Blue: " + snake1.score;
  document.getElementById("lblScore").innerHTML = score;

});

socket.on('canvasInfo', function(edge) {
  var canvas = document.getElementById('singlePlayerCanvas');

  canvas.width  = edge[0];
  canvas.height = edge[1];
});

socket.on('getCanvasInfo', function() {
  resizeCanvas();
  var canvas = document.getElementById('singlePlayerCanvas');
  edgeX = canvas.width;
  edgeY = canvas.height;
  edge = [edgeX, edgeY];
  socket.emit('canvasDimension', edge);
});

socket.on('setRoundInfo', function (info) {
  var infoLabel = document.getElementById('lblRoundInfo');
  infoLabel.innerHTML = info;
});

socket.on('countdownOver', function () {
  var infoLabel = document.getElementById('lblRoundInfo');
  infoLabel.innerHTML = "GAME STARTED!!!!!";
});

socket.on('connectionIssue', function() {
  var infoLabel = document.getElementById('lblRoundInfo');
  infoLabel.innerHTML = "Waiting for Connection..";
});

socket.on('foodInfo', function(f) {
  food = f;
});

socket.on('gameStatus', function (status) {
  var infoLabel = document.getElementById('lblGameStatus');
  infoLabel.innerHTML = status;
});


//Draw function with Snake Parameter
function draw2(snake, snake2) {
  var canvas = document.getElementById('singlePlayerCanvas');
  edgeX = canvas.height;
  edgeY = canvas.width;
  currentY = 0;
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  for(var i = 0; i < snake.body.length; i++) {
    context.beginPath();
    context.rect(snake.body[i].x, snake.body[i].y, 10, 10);
    context.fillStyle = snake.color;
    context.fill();
  }
  for(var i = 0; i < snake2.body.length; i++) {
    context.beginPath();
    context.rect(snake2.body[i].x, snake2.body[i].y, 10, 10);
    context.fillStyle = snake2.color;
    context.fill();
  }
  context.beginPath();
  context.rect(food[0], food[1], 10, 10);
  context.fillStyle = 'green';
  context.fill();
}

document.onkeydown = changeDirection;

function changeDirection(event) {
  event = event || window.event

  //socket.emit("direction", direction);

  if(event.keyCode == 37 && direction != 3) {
      direction = 1;
  }
  else if(event.keyCode == 38 && direction != 4) {
      direction = 2;
  }
	else if (event.keyCode == 39 && direction != 1) {
		direction = 3;
	}
	else if (event.keyCode == 40 && direction != 2) {
		direction = 4;
	}

  //Space Bar for Pause
  if (event.keyCode == 32) {
    socket.emit('pauseGame');
  }

  //This communication needs to be segregated based on different clients.
  //var directionInfo = socket.io.engine.id;
  //socket.emit("direction"+directionInfo, direction);
  console.log("DIRECTION: " + direction);
  socket.emit("direction", direction);

}

function resizeCanvas(){

  //var canvas = document.getElementById('singlePlayerCanvas');
  var canvas = document.getElementById('singlePlayerCanvas');

  var width  = window.innerWidth;
  var height = window.innerHeight;

  width = width - 200;
  var temp = width % 10;
  width = width - temp;

  height = height - 200;
  temp = height % 10;
  height = height - temp;

  canvas.width = width;
  canvas.height = height;

}
