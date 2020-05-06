// provides a command line ux for the game engine

const games = require('./game.js');
const scores = require('./score.js');
const npcs = require('./npc.js');
const readline = require('readline');

class Cli {
  game;
  scoreMS;
  scoreVegas;
  npc;
  pr = console.log;
  rl;
  moveRE = /m\s+([wtf])([1-7)?,?([1-9]*)\s+([tf])([1-7])/;
  silenceEvents = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.newGame();
  }

  // entry point
  run() {
    this.pr('Enter h for help.');
    this.inputLoop();
  }

  // input loop
  inputLoop () {
    this.rl.question('> ', (ans) => {
      if (ans == 'x') {
        process.exit();
      }
      else if (ans == 't') {
        this.table();
      }
      else if (ans.startsWith('m')) {
        this.move(ans);
      }
      else if (ans == 's') {
        this.npcStep();
      } 
      else if (ans == 'd') {
        this.draw();
      } 
      else if (ans == 'r') {
        this.restock();
      }
      else if (ans == 'f') {
        this.autoFoundation();
      }
      else if (ans == 'w') {
        this.npcWaste();
      }
      else if (ans == 'a') {
        this.npcGame();
      }
      else if (ans == 'N') {
        this.newGame();
      }
      else if (ans == 'h m') {
        this.helpMove();
      }
      else {
        this.help();
      }
      this.inputLoop();
    });
  }

  // output tableau display
  tableau() {
    this.pr ('Tableau');
    this.game.tableau.forEach((t,ix) => {
      let sb = ['  ',ix+1,'. '];
      if (t.length > 0) {
        let isFaceUp = (c) => c.faceUp;
        let firstFaceUp = t.findIndex(isFaceUp);
        // during a move there is no face up card between the move and the reveal, so assume the last card is face up in this case
        if (firstFaceUp == -1) firstFaceUp = t.length - 1;
        if (firstFaceUp > 0) {
          sb.push(firstFaceUp,' fd, ');
        }
        let dropTail = false;
        for (let i = 0; i < t.length; i++) {
          if (t[i].faceUp || i == t.length - 1) {
            sb.push(t[i],', ');
            dropTail = true;
          }
        }
        if (dropTail) {
          sb.pop(); // drop trailing comma
        }
      }
      this.pr(sb.join(''));
    });
  }

  // display foundations
  foundations() {
    this.pr('Foundations');
    let sb = [];
    this.game.foundations.forEach((f,ix) => {
      if (f.length > 0) {
        sb.push('  ');
        sb.push(f.last().toString());
      } else {
        sb.push("  [---]");
      }
    });
    this.pr(sb.join(''));
  }

  // display deck
  deck() {
    this.pr('Deck');
    let sb = [];
    let w = this.game.waste;
    if (w.length > 0) {
      sb.push('  ');
      let c = 0;
      let draw = this.game.draw3 ? 3 : 1;
      for (let i = w.length - 1; c < draw; i--) {
        if (w[i]) {
          sb.push(w[i].toString(), ', ');
        }
        c++;
      }
      sb.push(Math.max(w.length - draw, 0), ' waste, ');
    }
    else {
      sb.push('  No waste, ');
    }
    sb.push(this.game.stock.length);
    sb.push(' stock, pass ');
    sb.push(this.game.pass);
    this.pr(sb.join(''));
  }

  // display scores
  score() {
    this.pr(`Score: ${this.scoreMS.score}; $${this.scoreVegas.score}`);
  }

  // display the table
  table() {
      this.score();
      this.foundations();
      this.tableau();
      this.deck();
  }

  // display help
  help() {
    this.pr("t: show table");
    this.pr("d: draw the next card from stock");
    this.pr("m [from: w|f1-f4|t1-t7,n to: f1-f4|t1-t7]]: enter 'h m' for details");
    this.pr("r: restock from waste pile");
    this.pr('f: move cards from tableau and waste to foundations');
    this.pr('c: auto consolidate tableaus');
    this.pr('w: attempts to place cards from waste');
    this.pr('s: plays one step of auto mode');
    this.pr('a: plays the rest of the game in auto mode');
    this.pr("N: new game");
    this.pr("x: exit");
  }

  helpMove() {
    this.pr("Moving cards:");
    this.pr("> m [from] [to]");
    this.pr("'m' moves a card, or cards, from waste, a foundation or tableau to a foundation or tableau.");
    this.pr("[from]: w|f1-f4|t1-t7,n where w is the top waste card, f is one of the 4 foundations and t is one of the tableaus. ',n' optionally specifies how many cards to move from a tableau, default is 1");
    this.pr("[to]: f1-f4|t1-t7");
    this.pr("- ex. move the top waste card to the 2nd tableau: m w t2");
    this.pr("- ex. move two cards from the 1st tableau to the 3rd tableau: m t1,2 t3");
    this.pr("- ex. move one card from 4th tableau to the 2nd foundation: m t4 f2");
  }

  // validate m command and  moves a card
  move(args) {
    // parse arguments
    let m = args.match(this.moveRE);
    if (m == null) {
      this.pr('Invald move syntax.');
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
    if (this.game.move(from, fromIx, fromCount, to, toIx)) {
      this.pr('Moved ' + args);
    }
    else {
      this.pr('Illegal move.');
      return false;
    }

    // display result
    this.table();
    this.winCheck();
    return true;
  }

  // draws next card from stock
  draw() {
    this.silenceEvents = true;
    let c = this.game.draw();
    this.silenceEvents = false;
    if (c > 0) {
      this.deck();
      return true;
    }
    else {
      this.pr('Stock is empty.');
      return false;
    }
  }

  // resets the game
  newGame(passes=0, draw3=false) {
    this.game = new games.Game(draw3, passes);
    this.game.addEventListener((ev,data) => { this.gameEvent(ev,data); });
    this.scoreMS = new scores.ScoreMS(this.game, false);
    this.scoreVegas = new scores.ScoreVegas(this.game);
    this.npc = new npcs.Npc(this.game);
    this.table();
  }

  // repopulates stock from waste pile
  restock() {
    if (this.game.restock()) {
      this.deck();
      return true;
    } else if (this.game.waste.length == 0) {
      this.pr('Nothing to restock.')
    }
    else if (this.game.stock.length > 0) {
      this.pr('Stock is not empty.');
    }
    else {
      this.pr('Deck pass limit reached.');
    }
    return false;
  }

  // move cards from tableau and waste to foundations
  autoFoundation() {
    let result = false;
    this.silenceEvents = true;
    let moves = this.npc.autoFoundation();
    if (moves.length > 0) {
      this.pr('Auto Moves');
      moves.forEach((m) => {
        if (m[0] == 't') {
          this.pr(`  t${m[1]} f${m[3]}`);
        }
        else {
          this.pr(`  w f${m[3]}`);
        }
      });
      this.table();
      this.winCheck();
      result = true;
    }
    else {
      this.pr('No possible moves.');
    }
    this.silenceEvents = false;
    return result;
  }

  // attempts to play cards from waste
  npcWaste() {
    if (!this.npc.playDeck()) {
      this.pr('npc> No adventageous move available.');
    }
  }
  
  // plays one step of npc audo mode
  npcStep() {
    this.npc.playGame(true);
  }
  
  // plays the rest of the game via npc
  npcGame() {
    this.npc.playGame(false);
  }

  winCheck() {
    if (this.game.hasWon()) {
      this.pr('You won!');
      return true;
    }
    return false;
  }

  // responds to events raised by gae
  gameEvent(type, data) {
    if (this.silenceEvents) return;
    let showTable = false;
    if (type == 'move' && data.success) {
      if (data.from == 't') {
        this.pr('npc> m ' + data.from + data.fromIx + ',' + 
          data.fromCount + ' ' + data.to + data.toIx);
      } else if (data.from == 'w') {
        this.pr('npc> m ' + data.from + ' ' + 
          data.to + data.toIx);
      } else if (data.from == 'f') {
        this.pr('npc> m ' + data.from + data.fromIx + ' ' + 
          data.to + data.toIx);
      }
      showTable = true;
    } else if (type == 'draw') {
      this.pr('npc> d');
      showTable = false;
      this.deck();
    } else if (type == 'restock') {
      this.pr('npc> r');
      showTable = true;
    }
    if (showTable) {
      this.table();
    }
  }
}

module.exports = {
  Cli: Cli
}
