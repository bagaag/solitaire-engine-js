// provides a command line ux for the game engine

const games = require('./game.js');
let game = new games.Game();
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const pr = console.log;

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
    else {
      help();
    }
    inputLoop();
  });
};

exports.run = function() {
  pr('Enter h for help.');
  inputLoop();
}

function printCard(c, prefix = '') {
  pr(`${prefix}Card [suit: ${c.suit}, rank: ${c.rank}]`);
}

function tableau() {
  game.tableau.forEach((t,ix) => {
    pr (`Tableau ${ix+1}`);
    if (t.length > 0) {
      let isFaceUp = (c) => c.faceUp;
      let firstFaceUp = t.findIndex(isFaceUp);
      if (firstFaceUp == -1) {
        pr(`  ${t.length} face down cards`);
      } else {
        pr(`  ${firstFaceUp} face down cards`);
        for (let i = firstFaceUp; i < t.length; i++) {
          printCard(t[i], '  ');
        }
      }
    } else {
      pr('  --');
    }
  });
}

function foundations() {
  game.foundations.forEach((f) => {
    if (f.length > 0) {
      printCard(f.last());
    } else {
      pr(" -- ");
    }
  });
}

function stock() {
  if (game.stock.length > 0) {
    printCard(game.stock.last());
    pr(game.stock.length-1 + " remaining");
  }
}

function waste() {
  pr(game.waste.length + " cards");
}

function help() {
  pr("t: show tableau");
  pr("f: show foundations");
  pr("s: show active card and stoc count");
  pr("w: show waste count");
  pr("n: new game");
  pr("m [from: s|f1-f4|t1-t7 to: f1-f4|t1-t7]]: moves a card from stock, a foundation or tableau to a foundation or tableau");
  pr("p: pass, move active card from stock to waste");
  pr("x: exit");
}

const moveRE = /m\s+([stf])([1-7])?\s+([tf])([1-7])/;

function move(args) {
  if (args == 'm') {
    moveAuto();
  }
  else {
    // parse arguments
    let m = args.match(moveRE);
    let from = m[1];
    let fromIx = m[2];
    let to = m[3];
    let toIx = m[4];
      
    // validate arguments
    if (!game.canMove(from, fromIx, to, toIx)) {
      pr('Invalid move.');
        return;
    }

    // move the card
    game.move(from, fromIx, to, toIx);

    // display result
    if (from =='t' || to == 't') {
      tableau();
    }
    if (from == 'f' || to == 'f') {
      foundations();
    }
    if (from == 's') {
      stock();
    }
  }
}
