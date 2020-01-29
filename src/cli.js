// provides a command line ux for the game engine

const games = require('./game.js');
const scores = require('./score.js');
let game, scoreMS, scoreVegas;
const pr = console.log;
let readline, rl;

// entry point
function run() {
  readline = require('readline');
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  newGame();
  pr('Enter h for help.');
  inputLoop();
}

// input loop
function inputLoop () {
  rl.question('> ', function (ans) {
    if (ans == 'x') {
      process.exit();
      //return rl.close();
    }
    else if (ans == 't') {
      table();
    }
    else if (ans.startsWith('m')) {
      move(ans);
    }
    else if (ans == 'd') {
      draw();
    } 
    else if (ans == 'r') {
      restock();
    }
    else if (ans == 'a') {
      autoMove();
    }
    else if (ans == 'N') {
      newGame();
    }
    else if (ans == 'h m') {
      helpMove();
    }
    else {
      help();
    }
    inputLoop();
  });
};

// output tableau display
function tableau() {
  pr ('Tableau');
  game.tableau.forEach((t,ix) => {
    let sb = ['  ',ix+1,'. '];
    if (t.length > 0) {
      let isFaceUp = (c) => c.faceUp;
      let firstFaceUp = t.findIndex(isFaceUp);
      if (firstFaceUp > 0) {
        sb.push(firstFaceUp,' fd, ');
      }
      let dropTail = false;
      for (let i = 0; i < t.length; i++) {
        if (t[i].faceUp) {
          sb.push(t[i],', ');
          dropTail = true;
        }
      }
      if (dropTail) {
        sb.pop(); // drop trailing comma
      }
    }
    pr(sb.join(''));
  });
}

// display foundations
function foundations() {
  pr('Foundations');
  let sb = [];
  game.foundations.forEach((f,ix) => {
    if (f.length > 0) {
      sb.push('  ');
      sb.push(f.last().toString());
    } else {
      sb.push("  [---]");
    }
  });
  pr(sb.join(''));
}

// display deck
function deck() {
  pr('Deck');
  let sb = [];
  let w = game.waste;
  if (game.waste.length > 0) {
    sb.push('  ');
    let c = 0;
    let draw = game.draw3 ? 3 : 1;
    for (let i = game.waste.length - 1; c < draw; i--) {
      if (game.waste[i]) {
        sb.push(game.waste[i].toString(), ', ');
      }
      c++;
    }
    sb.push(Math.max(w.length - draw, 0), ' waste, ');
  }
  else {
    sb.push('  No waste, ');
  }
  sb.push(game.stock.length + ' stock');
  pr(sb.join(''));
}

// display scores
function score() {
  pr(`Score: ${scoreMS.score}; $${scoreVegas.score}`);
}

// display the table
function table() {
    score();
    foundations();
    tableau();
    deck();
}

// display help
function help() {
  pr("t: show table");
  pr("d: draw the next card from stock");
  pr("m [from: w|f1-f4|t1-t7,n to: f1-f4|t1-t7]]: enter 'h m' for details");
  pr("r: restock from waste pile");
  pr('a: move cards from tableau and waste to foundations');
  pr("N: new game");
  pr("x: exit");
}

function helpMove() {
  pr("Moving cards:");
  pr("> m [from] [to]");
  pr("'m' moves a card, or cards, from waste, a foundation or tableau to a foundation or tableau.");
  pr("[from]: w|f1-f4|t1-t7,n where w is the top waste card, f is one of the 4 foundations and t is one of the tableaus. ',n' optionally specifies how many cards to move from a tableau, default is 1");
  pr("[to]: f1-f4|t1-t7");
  pr("- ex. move the top waste card to the 2nd tableau: m w t2");
  pr("- ex. move two cards from the 1st tableau to the 3rd tableau: m t1,2 t3");
  pr("- ex. move one card from 4th tableau to the 2nd foundation: m t4 f2");
}

// parser for move commands
const moveRE = /m\s+([wtf])([1-7)?,?([1-9]*)\s+([tf])([1-7])/;

// validate m command and  moves a card
function move(args) {
  if (args == 'm') {
    moveAuto();
  }
  else {
    // parse arguments
    let m = args.match(moveRE);
    if (m == null) {
      pr('Invald move syntax.');
      return false;
    }
    let from = m[1];
    let fromIx = m[2];
    let fromCount = 1;
    if (fromIx.indexOf(',') > 0) {
      let a = fromIx.split(',');
      fromIx = a[0];
      fromCount = a[1];
    }
    let to = m[3];
    let toIx = m[4];
      
    // move the card
    if (game.move(from, fromIx, fromCount, to, toIx)) {
      pr('Moved ' + args);
    }
    else {
      pr('Illegal move.');
      return false;
    }

    // display result
    table();
    winCheck();
    return true;
  }
}

// draws next card from stock
function draw() {
  let c = game.draw();
  if (c > 0) {
    deck();
    return true;
  }
  else {
    pr('Stock is empty.');
    return false;
  }
}

// resets the game
function newGame(passes=0, draw3=false) {
  game = new games.Game(draw3, passes);
  scoreMS = new scores.ScoreMS(game, false);
  scoreVegas = new scores.ScoreVegas(game);
  table();
}

// repopulates stock from waste pile
function restock() {
  if (game.restock()) {
    deck();
    return true;
  } else if (game.waste.length == 0) {
    pr('Nothing to restock.')
  }
  else if (game.stock.length > 0) {
    pr('Stock is not empty.');
  }
  else {
    pr('Deck pass limit reached.');
  }
  return false;
}

// move cards from tableau and waste to foundations
function autoMove() {
  let moves = game.autoMove();
  if (moves.length > 0) {
    pr('Auto Moves');
    moves.forEach((m) => {
      if (m[0] == 't') {
        pr(`  t${m[1]} f${m[3]}`);
      }
      else {
        pr(`  w f${m[3]}`);
      }
    });
    table();
    winCheck();
    return true;
  }
  else {
    pr('No possible moves.');
    return false;
  }
}

function winCheck() {
  if (game.hasWon()) {
    pr('You won!');
    return true;
  }
  return false;
}

module.exports = {
  run: run,
  move: move,
  autoMove: autoMove,
  draw: draw,
  winCheck: winCheck,
  newGame: newGame,
  game: () => { return game; },
  scoreMS: scoreMS,
  scoreVegas: scoreVegas,
  pr: pr
}
