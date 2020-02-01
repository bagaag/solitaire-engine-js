// computer plays solitaire
class Npc {
  cli = require('./cli.js');
  constructor(opts) {
    let draw3 = opts.draw3 || false;
    let passes = opts.passes || 0;
  }

  play() {
    this.cli.newGame(this.draw3, this.passes);
    this.game = this.cli.game();
    while (true) {
      let movedInPass = 0;
      let moved = this.cli.autoMove();
      let consolidated = this.consolidateTableaus();
      let played = this.playWaste();
      if (!moved && !consolidated && !played) {
        // draw
        if (this.cli.draw()) {
          this.playWaste();
        }
        // forfeit if no moves in entire pass
        else if (movedInPass < this.game.pass) {
          break;
        }
        else {
          this.cli.restock();
        }
      }
      else {
        movedInPass = this.game.pass;
      }
    }
    if (!this.cli.winCheck()) {
      this.cli.pr('Forfeit!');
    }
    return;
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
    let g = this.game;
    if (g.waste.length > 0) {
      if (!this.cli.draw()) {
        return false;
      }
    }
    let c = g.waste.last();
    targetIx = this.findTarget(c);
    if (targetIx) {
      let rider = findRider(c, targetIx);
      return true;
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
              this.cli.pr(card, dest);
              return i+1;
            }
          }
        }
      }
    }
    return undefined;
  }

  // finds a tableau stack that can be a future consolidation if the given card is played from the deck
  findRider(card, ignoreIx, ignoreIx2) {
    let g = this.game;
    let riders = [];
    let shortestDistance = 13;
    let closestRider;
    g.tableau.forEach((t,tix) => {
      if (tix == ignoreIx) continue;
      if (ignoreIx2 != undefined && tix == ignoreIx2) continue;
      if (t.length == 0) continue;
      let riderCard = this.firstFaceUp(t);
      if (riderCard.rank >= card.rank) continue;
      if (!g.tableauCompatible(card, riderCard)) continue;
      let distance = card.rank - riderCard.rank;
      if (ignoreIx2 == undefined) {
        let betterOption = this.findRider(riderCard, tix, ignoreIx);
        if (betterOption != undefined) continue;
      }
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestRider = tix;
      }
    }
    if (closestRider != undefined)
  }

}

// potential future consolidations to compare with a 
// potential deck to tableau move
class Rider {
  targetTableau;
  targetDistance;
  closestTableau;
  closestDistance;
}

module.exports = {
  Npc: Npc
}
