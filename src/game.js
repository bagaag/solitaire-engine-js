let cards = require('./card.js');
let timers = require('./timer.js');

// add .last() method to arrays
if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
};

class Game {

  constructor() {
    this.events = [];
    this.deck = new cards.Deck();
    this.deck.shuffle();
    this.stock = this.deck.cards;
    this.tableau = this.arrays(7);
    this.foundations = this.arrays(4);
    this.waste = [];
    for (let i=0; i<7; i++) {
      for (let c=0; c<=i; c++) {
        this.tableau[i].push(this.stock.pop());
      }
      this.tableau[i].last().faceUp = true;
    }
    this.timer = new timers.Timer(() => { this._event('tick'); });
    this._event('start');
  }

  debug(...args) {
    console.log(args);
  }

  addEventListener(func) {
    this.events.push(func);
  }

  _event(type, data) {
    this.events.forEach((e) => { 
      e(type, data);
    });
  }

  // returns an array of N empty arrays
  arrays(count) {
    let arr = [];
    for (let i=0; i<count; i++) {
      arr.push([]);
    }
    return arr;
  }

  // checks input values and move feasability
  canMove(from, fromIx, fromCount, to, toIx) {
    // check 'to' values
    if (to == 'f') {
      if (toIx < 1 || toIx > 4) {
        return false;
      }
    }
    else if (to == 't') {
      if (toIx < 1 || toIx > 7) {
        return false;
      }
    }
    else if (to != 'w') {
      return false;
    }

    // check 'from' values
    if (from == 'f') {
      if (fromIx < 1 || fromIx > 4 || fromCount != 1) {
        return false;
      }
    }
    else if (from == 't') {
      if (fromIx < 1 || fromIx > 7 || fromCount < 1) {
        return false;
      }
    }
    else if (from != 'w' || fromCount != 1) {
      return false;
    }
    
    // get card to move
    let card = this.peek(from, fromIx, fromCount);
    if (!card || !card.faceUp) {
      return false;
    }

    // test move feasability
    let dest = this.peek(to, toIx);
    if (to == 't') {
      if (!dest) {
        // first tableau card must be a king
        if (card.rank != 13) {
          return false;
        }
      }
      else {
        // must alternate red/black suits
        if (card.suitVal()  % 2 == dest.suitVal() % 2) {
          return false;
        }
        // must be one rank smaller than the parent card
        if (card.rank != dest.rank - 1) {
          return false;
        }
      }
    }
    else {
      // first card must be an ace
      if (!dest) {
        if (card.rank != 1) {
          return false;
        }
      }
      else {
        // must be same suit and one rank higher than dest
        if (card.suit != dest.suit || card.rank != dest.rank + 1) {
          return false;
        }
      }
    }
    return true;
  }

  // returns a card from (s)tock, (t)ableau or (f)oundation without removing from its position
  peek(from, fromIx, fromCount=1) {
    if (from == 'w') {
      return this.waste.last();
    }
    if (from == 't') {
      let t = this.tableau[fromIx - 1];
      if (t) {
        return t[t.length - fromCount];
      }
    }
    if (from == 'f') {
      let f = this.foundations[fromIx - 1];
      if (f) {
        return f.last();
      }
    }
  }

  // moves a card from waste, tableau or foundation to a tableau or foundation. Returns true if successful
  move(from, fromIx, fromCount, to, toIx) {
    if (!this.canMove(from, fromIx, fromCount, to, toIx)) {
      return false;
    }
    let card = false;
    let dest = false;
    if (from == 'w') {
      card = this.waste.pop();
    } 
    else if (from == 'f') {
      card = this.foundations[fromIx - 1].pop();
    }
    else if (from == 't') {
      let t = this.tableau[fromIx - 1];
      card = t.slice(t.length - fromCount);
      t.length = t.length - fromCount;
    }
    if (to == 't') {
      dest = this.tableau[toIx - 1];
    }
    else if (to == 'f') {
      dest = this.foundations[toIx - 1];
    }
    if (!card || !dest) {
      return false;
    }
    if (Array.isArray(card)) {
      card.forEach((c) => { 
        dest.push(c); 
      });
    }
    else {
      dest.push(card);
    }
    if (from == 't') {
      let last = this.tableau[fromIx - 1].last();
      if (last && !last.faceUp) {
        last.faceUp = true;
        this._event('reveal', {
          tableau: fromIx,
          card: last
        });
      }
    }
    this._event('move', { 
      from: from, 
      fromIx: fromIx,
      fromCount: fromCount,
      to: to,
      toIx: toIx
    });
    return true;
  }

  // moves a card from stock to waste, returns false if stock is empty
  draw() {
    let card = this.stock.pop();
    if (card) {
      card.faceUp = true;
      this.waste.push(card);
      this._event('draw', { card: card });
      return true;
    } else {
      return false;
    }
  }

  // moves waste back into stock, returns false if nothing to restock or stock isnt empty
  restock() {
    if (this.waste.length == 0 || this.stock.length > 0) {
      return false;
    }
    else {
      while (this.waste.length > 0) {
        let card = this.waste.pop();
        card.faceUp = false;
        this.stock.push(card);
        this._event('restock');
      }
      return true;
    }
  }

  // adds the card to a foundation if possible and returns index of matched pile or 0 if 
  addToFoundation(card) {
    let ix, f;
    if (card != undefined) {
      for (const [ix, f] of this.foundations.entries()) {
        let head = f.last();
        let playAce = (f.length == 0 && card.rank == 1);
        let playOther = false;
        if (head != undefined) {
          playOther = (head.suit == card.suit && card.rank == head.rank + 1);
        }
        if (playAce || playOther) {
          f.push(card);
          return ix + 1;
        }
      }
    }
    return 0;
  }

  // plays what can be played to the foundations from tableau and waste
  autoMove() {
    let moves = [];
    let moved = false;
    debugger;
    while (true) {
      this.tableau.forEach((t,tix) => {
        let fix = this.addToFoundation(t.last());
        if (fix > 0) {
          moves.push(['t',tix + 1,'f', fix]);
          moved = true;
          t.pop();
          if (t.length > 0) {
            t.last().faceUp = true;
          }
        }
      });
      let c = this.waste.last();
      let ix = this.addToFoundation(c);
      if (ix > 0) {
        moves.push(['w',undefined,'f',ix]);
        moved = true;
        this.waste.pop();
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

  // tests for win and raises event
  hasWon() {
    this._event('won');
    let f = this.foundations;
    return [0].length == 13 && 
      f[1].length == 13 && 
      f[2].length == 13 && 
      f[3].length == 13;
  }

}

module.exports = {
  Game: Game
}
