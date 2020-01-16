// provides a command line ux for the game engine

const games = require('./game.js');
let game;
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const pr = console.log;

// entry point
exports.run = function() {
  newGame();
  pr('Enter h for help.');
  inputLoop();
}

// input loop
let inputLoop = function () {
  rl.question('> ', function (ans) {
    if (ans == 'x') {
      return rl.close();
    }
    else if (ans == 't') {
      tableau();
    }
    else if (ans == 'f') {
      foundations();
    }
    else if (ans == 's') {
      stock();
    }
    else if (ans == 'w') {
      waste();
    }
    else if (ans.startsWith('m')) {
      move(ans);
    }
    else if (ans == 'p') {
      pass();
    } 
    else if (ans == 'r') {
      restock();
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

// output tabkeau display
function tableau() {
  pr ('Tableau');
  game.tableau.forEach((t,ix) => {
    let sb = ['  ',ix+1,'. '];
    if (t.length > 0) {
      let isFaceUp = (c) => c.faceUp;
      let firstFaceUp = t.findIndex(isFaceUp);
      for (let i = t.length-1; i >= 0; i--) {
        if (t[i].faceUp) {
          sb.push(t[i],', ');
        }
      }
      if (firstFaceUp > 0) {
        sb.push(`${firstFaceUp} more`);
      }
      else {
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

// display stock
function stock() {
  pr('Stock');
  let sb = [];
  if (game.stock.length > 0) {
    sb.push('  ', game.stock.last().toString(), ', ');
  }
  sb.push(game.stock.length-1 + " remaining, " + game.waste.length + ' in waste');
  pr(sb.join(''));
}

// display help
function help() {
  pr("t: show tableau");
  pr("f: show foundations");
  pr("s: show active card and stock count");
  pr("N: new game");
  pr("m [from: s|f1-f4|t1-t7,n to: f1-f4|t1-t7]]: enter 'h m' for details");
  pr("p: pass, move active card from stock to waste");
  pr("r: restock from waste");
  pr("x: exit");
}

function helpMove() {
  pr("Moving cards:");
  pr("> m [from] [to]");
  pr("'m' moves a card, or cards, from stock, a foundation or tableau to a foundation or tableau.");
  pr("[from]: s|f1-f4|t1-t7,n where s is the stock card, f is one of the 4 foundations and t is one of the tableaus. ',n' optionally specifies how many cards to move from a tableau, default is 1");
  pr("[to]: f1-f4|t1-t7");
  pr("- ex. move the stock card to the 2nd tableau: m s t2");
  pr("- ex. move two cards from the 1st tableau to the 3rd tableau: m t1,2 t3");
  pr("- ex. move one card from 4th tableau to the 2nd foundation: m t4 f2");
}

// parser for move commands
const moveRE = /m\s+([stf])([1-7)?,?([1-9]*)\s+([tf])([1-7])/;

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
      return;
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
      return;
    }

    // display result
    foundations();
    tableau();
    stock();
  }
}

// moves current stock card to waste
function pass() {
  if (game.pass()) {
    stock();
  }
  else pr('Stock is empty.');
}

// resets the game
function newGame() {
  game = new games.Game();
  foundations();
  tableau();
  stock();
}

// repopulates stock from waste pile
function restock() {
  if (game.restock()) {
    pr('Next card:');
    stock();
  } else pr('Nothing to restock or stock is not empty.');
}

