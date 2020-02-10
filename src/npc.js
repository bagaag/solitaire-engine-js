// computer plays solitaire
class Npc {
  constructor(opts) {
    this.draw3 = opts.draw3 || false;
    this.passes = opts.passes || 0;
    this.cli = opts.cli || require('./cli.js');
  }

  playTurn() {
    let result = { 
      foundation: false, consolidated: false, played: false, 
      finished: false, won: false, draw: false, restock: false 
    };
    let cli = this.cli;
    let g = this.game;
    result.foundation = cli.autoMove();
    result.consolidated = this.consolidateTableaus();
    result.played = this.playDeck();
    if (!result.played) {
      // draw
      if (cli.draw()) {
        result.draw = true;
      } else {
        cli.pr('draw=false ' + g.stock.length + ',' + g.waste.length);
      }
    }
    if (result.moved || result.consolidated || result.played) {
      this.movedInPass = true;
    }
    cli.pr(g.stock.length + ',' + g.waste.length);
    if (g.stock.length == 0 && g.waste.length > 0) {
      if (!this.movedInPass) {
        cli.pr('Forfeit!');
        result.finished = true;
        result.won = false;
        return result;
      }
      cli.restock();
      cli.draw();
      this.movedInPass = false;
      result.draw = true;
      result.restock = true;
    }
    // forfeit if no moves in entire pass
    else if (cli.winCheck()) {
      cli.pr('You won!');
      result.finished = true;
      result.won = true;
    }
    return result;
  }

  playGame() {
    this.cli.newGame(this.draw3, this.passes);
    this.game = this.cli.game();
    this.cli.draw();
    this.movedInPass = false;
    while (true) {
      let result = this.playTurn();
      this.cli.pr(result);
      if (result.finished) break;
    }
  }

  // returns first face up card in a given array of Cards
  firstFaceUp(a) {
    for (let i = 0; i < a.length; i++) {
      let c = a[i];
      if (c.faceUp) return i;
    }
  }

  // attempt to expose tableau cards by consolidating stacks
  consolidateTableaus() {
    let g = this.game;
    let ts = g.tableau;
    let targetIx;
    // for each tableau stack
    for (let i = 0; i < ts.length; i++) {
      // get the lowest face up card
      let t = ts[i];
      if (t.length == 0) continue;
      let fix = this.firstFaceUp(t);
      let c = t[fix];
      targetIx = this.findTarget(c, i);
      if (targetIx) {
        let m = `m t${i+1},${t.length - fix} t${targetIx}`;
        if (this.move(m)) {
          this.consolidateTableaus();;
          return true;
        }
      }
    }
    return false;
  }

  move(cmd) {
    this.cli.pr('> ' + cmd);
    this.cli.move(cmd);
  }

  // attempt to play the top waste card in a way that will lead to tableau consolidation
  playDeck() {
    if (this.game.waste.length == 0) return false;
    let c = this.game.waste.last();
    let targetIx = this.findTarget(c);
    this.cli.pr('playDeck targetIx=' + targetIx);
    if (targetIx) {
      let rider = this.findRider(c, targetIx);
      this.cli.pr('playDeck rider=' + rider);
      if (rider != undefined)  {
        this.move('m w t' + targetIx);
        return true;
      }
    }
    return false;
  }
    
  // returns 1-based index of tableau that can accept the 
  // given card, or undefined; ignores the tableau at 
  // given 0 based index
  findTarget(card, ignoreIx) {
    let g = this.game;
    let ts = g.tableau;
    let targetIx;
    // for each tableau stack
    for (let i = 0; i < ts.length; i++) {
      if (i != ignoreIx) {
        let t = ts[i];
        let dest = t.last();
        // dest must exist
        if (dest != undefined) {
          // and be opposite color
          if (!g.sameColor(card, dest)) {
            // and be 1 rank smaller
            if (card.rank == dest.rank - 1) {
              //this.cli.pr(card, dest);
              return i+1;
            }
          }
        }
      }
    }
    return undefined;
  }

  // finds a tableau stack that can be a future consolidation if the given card is played from the deck
  findRider(card, ignoreIx) {
    let g = this.game;
    let riders = [];
    let shortestDistance = 13;
    let closestRider;
    for (let tix = 0; tix < g.tableau.length; tix++) {
      let t = g.tableau[tix];
      if (tix == ignoreIx) continue;
      if (t.length == 0) continue;
      let riderCard = t[this.firstFaceUp(t)];
      if (riderCard.rank >= card.rank) continue;
      if (!g.tableauCompatible(card, riderCard)) continue;
      let distance = card.rank - riderCard.rank;
      let closerHorse = this.findCloserHorse(riderCard, distance, tix, ignoreIx);
      if (closerHorse != undefined) continue;
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestRider = tix;
      }
    }
    return closestRider; 
  }

  findCloserHorse (rider, distance, ignoreIx, ignoreIx2) {
    let g = this.game;
    for (let tix = 0; tix < g.tableau.length; tix++) {
      let t = g.tableau[tix];
      if (tix == ignoreIx || tix == ignoreIx2) continue;
      if (t.length == 0) continue;
      let horse = t[this.firstFaceUp(t)];
      if (!g.tableauCompatible(horse, rider)) continue;
      if (horse.rank <= rider.rank) continue;
      if ((horse.rank - rider.rank) < distance) return tix;
    }
    return undefined;
  }
}

module.exports = {
  Npc: Npc
}
