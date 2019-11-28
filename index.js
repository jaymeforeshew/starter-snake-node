const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

const board = null;

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game

  // Response data
  const data = {
    color: '#DFFF00',
  }

  nextMove = 'left';

  return response.json(data)
})

/*
let board = null;
function instantiateBoard() {
  board = new Array();
  for (let i = 0; i < 11; i++) {
    board[i] = new Array();
    for (let j = 0; j < 11; j++) {
      board[i][j] = '0';
    }
  }

  return;
}

function populateBoard(thisBoard, me) {
  // food
  const foodLocations = thisBoard.food;
  for (let foodLocation of foodLocations) {
    board[foodLocation.x][foodLocation.y] = 'food';
  }

  // other snakes
  const snakes = thisBoard.snakes;
  for (let snake of snakes) {
    for(let coordinate of snake.body) {
      board[coordinate.x][coordinate.y] = 'snake';
    }
  }

  // me
  for (let coordinate of me.body) {
    board[coordinate.x][coordinate.y] = 'me';
  }

  return;
}
*/

let lastMove = 'left';
function circle() {
  if (lastMove === 'up') {
    return 'right';
  }

  if (lastMove === 'right') {
    return 'down';
  }

  if (lastMove === 'down') {
    return 'left'
  }
  
  if (lastMove === 'left') {
    return 'up';
  }

  return 'down';
}

function generateNextMove(me, food) {
  return circle();
  
  /*
  // find shortest valid path to a food
  head_x = me.body[0].x
  head_y = me.body[0].y

  let min_food_x;
  let min_food_y;
  */
}

// Handle POST request to '/move'
app.post('/move', (request, response) => {
  // instantiate every turn. Previous state doesn't matter
  // instantiateBoard();
  // populateBoard(request.body.board, request.body.you);

  const nextMove = generateNextMove();

  // Response data
  const data = {
    move: nextMove, // one of: ['up','down','left','right']
  }

  lastMove = nextMove;

  return response.json(data)
})

app.post('/end', (request, response) => {
  // NOTE: Any cleanup when a game is complete.
  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
