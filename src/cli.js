// provides a command line ux for the game engine

let games = require('./game.js');
let game = new games.Game();
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
let pr = console.log;

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
    else if (ans == 'm') {
      move(args(ans));
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
  pr("m <from: s|f1-f4|t1-t7> <to: f1-f4|t1-t7>: moves a card from stock, a foundation or tableau to a foundation or tableau");
  pr("p: pass, move active card from stock to waste");
  pr("x: exit");
}
