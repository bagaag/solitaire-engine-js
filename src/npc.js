// computer plays solitaire
class Npc {
  movedInPass = false;
  won = false;

  constructor(game) {
    this.game = game;
    game.addEventListener(this.eventListener);
  }

  // plays game in response to card reveals
  eventListener(type, data) {
    if (type == 'reveal') {
      this.consolidateTableau(data.tableau);
      let fix = this.game.foundationMatch(data.card);
      if (fix > 0) {
        this.game.move('t', data.tableau, 1, 'f', fix);
      }
    }
    else if (type == 'draw') {
      let fix = this.game.foundationMatch(data.card);
      if (fix > 0) {
        this.game.move('w', 0, 1, 'f', fix);
        this.playDeck();
      }
    }
    if (type == 'move') {
      this.movedInPass = true;
      if (data.to == 'f') {
        this.won = this.game.hasWon();
      }
    }
  }

  // completes a single draw from the stock surrounded
  // by two attempts to play the foundation and consolidate
  // the tableaus
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
        result.foundation = result.foundation.concat(this.autoFoundation());
        result.consolidated = result.consolidated || this.consolidateTableaus();
        result.played = result.played || this.playDeck();
      }
    }
    if (result.foundation.length > 0 || result.consolidated || result.played) {
      this.movedInPass = true;
    }
    if (g.pass > 25) {
      // safety check
      result.finished = true;
      console.log('PASS > 25; FORCE QUITTING');
    }
    else if (g.stock.length == 0 && g.waste.length > 0) {
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

  // kicks things off with full foundation and tableau consolidation
  // checks, then runs through deck until a full run results in no
  // moves. tests for win status along the way
  playGame() {
    this.autoFoundation();
    this.consolidateTableaus();
    while (true) {
      // run through the deck
      while (this.game.stock.length > 0) {
        this.game.deal();
        if (this.won) return true;
      }
      if (this.movedInPass) {
        this.game.restock();
      }
      else {
        // exit if no movement in a full run through the deck
        return this.won;
      }
    }
  }

  // plays what can be played to the foundations from tableau and waste
  autoFoundation() {
    let g = this.game;
    for (const tix of g.tableau.keys()) {
      let t = g.tableau[tix];
      if (t.length > 0) {
        let fix = g.foundationMatch(t.last());
        if (fix > 0) {
          g.move('t', tix + 1, 1, 'f', fix + 1);
        }
      }
    }
    if (g.canMove('w', undefined, 1, 'f', fix+1)) {
      g.move('w', undefined, 1, 'f', fix+1);
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
    let len = this.game.tableau.length;
    for (let i = 0; i < len; i++) {
      this.consolidateTableau(i+1);
    }
  }

  consolidateTableau(tix) {
    let t = ts[tix-1];
    if (t.length == 0) return false;
    // get the lowest face up card
    let fix = this.firstFaceUp(t);
    let c = t[fix];
    // don't bother moving a king that's at the top of the stack
    if (c.rank == 13 && fix == 0) return false; 
    // find a better home
    let targetIx = this.findTarget(c, i);
    if (targetIx != undefined) {
      if (g.move('t', i+1, t.length - fix, 't', targetIx)) {
        return true;
      }
      else {
        console.log("ERROR: consolidateTableau(" + tix + ")");
      }
    }
    return false;
  }

  // attempt to play the top waste card in a way that will lead to tableau consolidation, failing that, try the foundations
  // recurses if successful to play revealed waste card
  playDeck() {
    if (this.game.waste.length == 0) return false;
    let c = this.game.waste.last();
    let targetIx = this.findTarget(c);
    if (targetIx != undefined) {
      let rider = this.findRider(c, targetIx);
      if (rider != undefined)  {
        this.game.move('w', undefined, 1, 't', targetIx);
        this.playDeck();
        return true;
      }
    }
    // try foundations
    let fix = this.game.foundationMatch(c);
    if (fix > 0) {
      this.game.move('w', undefined, 1, 'f', fix);
      this.playDeck();
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
        if (t.length > 0) {
          let dest = t.last();
          // and be opposite color
          if (!g.sameColor(card, dest)) {
            // and be 1 rank smaller
            if (card.rank == dest.rank - 1) {
              //this.cli.pr(card, dest);
              return i+1;
            }
          }
        }
        // only kings can target an empty tableau
        else if (card.rank == 13) {
          return i+1;
        }
      }
    }
    return undefined;
  }

  // finds a tableau stack that can be a future consolidation 
  // if the given card is played from the deck or foundation
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
