// computer plays solitaire
class Npc {
  constructor(game) {
    this.game = game;
  }

  playTurn() {
    let result = { 
      foundation: false, 
      consolidated: false, 
      played: false, 
      finished: false, 
      won: false, 
      draw: false, 
      restock: false
    };
    let g = this.game;
    result.foundation = this.autoFoundation();
    result.consolidated = this.consolidateTableaus();
    result.played = this.playDeck();
    if (!result.played) {
      // draw
      if (g.draw() > 0) {
        result.draw = true;
      }
    }
    if (result.moved || result.consolidated || result.played) {
      this.movedInPass = true;
    }
    if (g.stock.length == 0 && g.waste.length > 0) {
      if (!this.movedInPass) {
        result.finished = true;
        result.won = false;
        return result;
      }
      g.restock();
      g.draw();
      this.movedInPass = false;
      result.draw = true;
      result.restock = true;
    }
    // forfeit if no moves in entire pass
    else if (g.hasWon()) {
      result.finished = true;
      result.won = true;
    }
    return result;
  }

  playGame() {
    this.game.draw();
    this.movedInPass = false;
    while (true) {
      let result = this.playTurn();
      if (result.finished) break;
    }
  }

  // plays what can be played to the foundations from tableau and waste
  autoFoundation() {
    let moves = [];
    let moved = false;
    let g = this.game;
    while (true) {
      for (const fix of g.foundations.keys()) {
        for (const tix of g.tableau.keys()) {
          if (g.canMove('t', tix + 1, 1, 'f', fix + 1)) {
            g.move('t', tix + 1, 1, 'f', fix + 1);
            moves.push(['t', tix + 1,'f', fix + 1]);
            moved = true;
          }
        }
        if (g.canMove('w', 0, 1, 'f', fix+1)) {
          g.move('w', 0, 1, 'f', fix+1);
          moves.push(['w', undefined, 'f', fix + 1]);
          moved = true;
        }
      }
      // exit if nothing more can be moved
      if (!moved) {
        break;
      } 
      else {
        moved = false;
      }
    }
    return moves;
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
      // don't bother moving a king that's at the top of the stack
      if (c.rank == 13 && t[0].rank == 13) continue; 
      // find a better home
      targetIx = this.findTarget(c, i);
      if (targetIx) {
        if (g.move('t', i+1, t.length - fix, 't', targetIx)) {
          this.consolidateTableaus();;
          return true;
        }
      }
    }
    return false;
  }

  // attempt to play the top waste card in a way that will lead to tableau consolidation
  playDeck() {
    if (this.game.waste.length == 0) return false;
    let c = this.game.waste.last();
    let targetIx = this.findTarget(c);
    if (targetIx) {
      let rider = this.findRider(c, targetIx);
      if (rider != undefined)  {
        this.game.move('w', undefined, 1, 't', targetIx);
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
        else if (card.rank == 13) {
          return i+1;
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
