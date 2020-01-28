// computer plays solitaire
class Npc {
  cli = require('./cli.js');
  constructor(opts) {
    let draw3 = opts.draw3 || false;
    let passes = opts.passes || 0;
  }

  play() {
    this.cli.newGame(this.draw3, this.passes);
    this.game = this.cli.game;
    while (true) {
      let g = this.game;
      let moved = this.cli.autoMove();
      let consolidated = this.consolidateTableaus();
      if (!moved && !consolidated) {
        break;
      }
    }
    if (!this.cli.hasWon()) {
      console.log('Forfeit!');
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
      let fix = this.firstFaceUp(t);
      let c = t[fix];
      targetIx = this.findTarget(c);
      if (targetIx) {
        this.cli.move(`m t${i+1},${t.length - fix} t${targetIx}`);
        consolidateTableaus();;
        return true;
      }
    }
    return false;
  }

  // attempt to play the top waste card in a way that will lead to tableau consolidation
  playDeck() {
    let g = this.game;
    if (g.waste.length > 0) {
      this.cli.draw();
    }
    if (g.waste.length > 0) {
      let c = g.waste.last();
      targetIx = this.findTarget(c);
      if (targetIx) {
        this.cli.move(`m w t${targetIx}`);
        return true;
      }
    }
    return false;
  }
    
  // returns 1-based index of tableau that can accept the given card, or undefined
  findTarget(card) {
    let g = this.game;
    let ts = g.tableau;
    let targetIx;
    // for each tableau stack
    for (let i = 0; i < ts.length; i++) {
      let t = ts[i];
      let dest = t.last();
      if (dest && 
          card.suitVal()  % 2 == dest.suitVal() % 2 &&
          card.rank != dest.rank - 1
      ) {
        return i+1;;
      }
    }
    return undefined;
  }

}

module.exports = {
  Npc: Npc
}
