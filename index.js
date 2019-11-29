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

function countOpenInDirection(me, direction) {

    let count = 0;

    if (direction === 'left') {
        for (let x = me.body[0].x - 1; x >= 0; x --) {
        for (let y = 0; y < 11; y++) {
            if (board[x][y] === '0') {
            count += 1;
            }
        }
        }
    } else if (direction === 'right') {
        for (let x = me.body[0].x + 1; x < 11; x++) {
        for (let y = 0; y < 11; y++) {
            if (board[x][y] === '0') {
            count += 1;
            }
        }
        }
    } else if (direction === 'up') {
        for(let y = me.body[0].y - 1; y >= 0; y--) {
        for(let x = 0; x < 11; x++) {
            if (board[x][y] === '0') {
            count += 1;
            }
        }
        }
    } else { // down
        for (let y = me.body[0].y + 1; y < 11; y++) {
        for(let x = 0; x < 11; x++) {
            if (board[x][y] === '0') {
            count += 1;
            }
        }
        }
    }

    return count;
}

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

function generateNextMove(me, foods) {
  // return circle();

  // find shortest path to a food
  headX = me.body[0].x
  headY = me.body[0].y

  let x, y;
  let minDistance = null;

  for (food of foods) {
    const thisDistance = Math.abs(headX - food.x) + Math.abs(headY - food.y);

    if (minDistance === null || thisDistance < minDistance) {
      minDistance = thisDistance;
      x = food.x;
      y = food.y;
    }
  }

  // move in the direction of closest food
  // @TODO handle if it's in opposite direction
  if (x < headX) {
    return 'left';
  }

  if (x > headX) {
    return 'right';
  }

  if (y > headY) {
    return 'down';
  }

  return 'up';
}

function isMoveSafe(me, move) {
  let x = me.body[0].x;
  let y = me.body[0].y;

  if (move === 'right') {
    x += 1;
  } else if (move === 'left') {
    x -= 1;
  } else if (move === 'up') {
    y -= 1;
  } else {
    y += 1;
  }

  if(x > board.length || x < 0 || y > board.length || y < 0) {
    return false
  }

  if (board[x][y] != '0' && board[x][y] != 'food') {
    return false;
  }

  return true;
}

function optimise_directions(me, directions) {
  let x = me.body[0].x;
  let y = me.body[0].y;
  console.log("HERE")

  if (directions.length > 1) {

    // compare weights
    count0 = countOpenInDirection(me, direction[0]);
    count1 = countOpenInDirection(me, direction[1]);

    console.log("Count ", directions[0], ": ", count0);
    console.log("Count ", directions[1], ": ", count1);

    if (count0 >= count1) return directions[0];
    return directions[1];
/*
    console.log("HERE2")
    direction = directions[1]
    console.log(direction)
    console.log(board)

    if (direction === 'left') {
      for (i = x-1; i >= 0; i-=1) {
        if (board[i][y] === 'me') {
          console.log("Saw Me")
          return directions[0]
        }
      }
    } else if (direction === 'right') {
      for (i = x+1; i <= 10; i+=1) {
        if (board[i][y] === 'me') {
          console.log("Saw Me")
          return directions[0]
        }
      }
    } else if (direction === 'up') {
      for (j = y-1; j >= 0; j-=1) {
        if (board[x][j] === 'me') {
          console.log("Saw Me")
          return directions[0]
        }
      }
    } else {
      for (j = y+1; j <= 10; j+=1) {
        if( board[x][j] === 'me') {
          console.log("Saw Me")
          return directions[0]
        }
      }
    }

    return direction[1];
*/
  }

  console.log("Only one direction <><><><><><><><><><><>");

  return directions[0];
}

function survivalMove(me) {
  // SAFETY
  let directions = [];
  // let direction = 'up';
  let x = me.body[0].x;
  let y = me.body[0].y;

  const move_up_is_safe = isMoveSafe(me, 'up');
  const move_down_is_safe = isMoveSafe(me, 'down');
  const move_left_is_safe = isMoveSafe(me, 'left');
  const move_right_is_safe = isMoveSafe(me, 'right');

  if (x === 10) {
    if (move_down_is_safe) {
      directions.push('down');
    }
    
    if (move_up_is_safe) {
      directions.push('up');
    }

    if (move_left_is_safe) {
      directions.push('left');
    }

    direction = optimise_directions(me, directions);
    return direction;
  }

  if (x === 0) {
    if (move_up_is_safe) {
      directions.push('up');
    }
    
    if (move_down_is_safe) {
      directions.push('down');
      
    }

    if (move_right_is_safe) {
      directions.push('right');
    }

    direction = optimise_directions(me, directions);
    return direction;
  }

  if (y === 0) {
    if (isMoveSafe(me, 'right')) {
      directions.push('right');
    } 
    
    if (move_left_is_safe) {
      directions.push('left');
    }
    
    if (move_down_is_safe) {
      directions.push('down');
    }

    direction = optimise_directions(me, directions);
    return direction;
  }

  if (y === 10) {
    if (isMoveSafe(me, 'right')) {
      directions.push('right');
    } 
    
    if (move_left_is_safe) {
      directions.push('left');
    }
    
    if (move_up_is_safe) {
      directions.push('up');
    }

    direction = optimise_directions(me, directions);
    return direction;
  }

  if (board[x+1][y] === '0') {
    directions.push('right');
  }

  if (board[x-1][y] === '0') {
    directions.push('left');
  }

  if (board[x][y+1] === '0') {
    directions.push('down');
  }

  direction = optimise_directions(me, directions);
  return direction;
}

// Handle POST request to '/move'
app.post('/move', (request, response) => {
  // instantiate every turn. Previous state doesn't matter
  instantiateBoard();
  populateBoard(request.body.board, request.body.you);

  // const nextMove = generateNextMove();
  let nextMove = generateNextMove(request.body.you, request.body.board.food);

  if (!isMoveSafe(request.body.you, nextMove)) {
    // forget the food, just survive!
    nextMove = survivalMove(request.body.you);
  }

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