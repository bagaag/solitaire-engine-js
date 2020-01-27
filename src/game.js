let cards = require('./card.js');
let timers = require('./timer.js');

// add .last() method to arrays
if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
};

class Game {

  constructor(draw3 = false, passLimit = 0) {
    // if true, draw 3 at a time instead of 1
    this.draw3 = draw3;
    // how many times can we recycle the deck, 0=unlimited
    this.passLimit = passLimit;
    // current pass through deck
    this.pass = 1;
    // event listeners
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
    //this.debug('event',type,data);
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
    this._event('move', { 
      from: from, 
      fromIx: fromIx,
      fromCount: fromCount,
      to: to,
      toIx: toIx
    });
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
    return true;
  }

  // moves a card from stock to waste, returns false if stock is empty
  draw() {
    if (this.stock.length > 0) {
      let count = this.draw3 ? 3 : 1;
      let ret = 0;
      for (let i = 0; i < count; i++) {
        let card = this.stock.pop();
        if (card) {
          ret++;
          card.faceUp = true;
          this.waste.push(card);
          this._event('draw', { card: card, ix: i+1, count: count });
        }
      } 
      return ret;
    }
    else {
      return 0;
    }
  }

  // moves waste back into stock, returns false if nothing to restock or stock isnt empty
  restock() {
    if (this.pass >= this.passLimit || this.waste.length == 0 || this.stock.length > 0) {
      return false;
    }
    else {
      while (this.waste.length > 0) {
        let card = this.waste.pop();
        card.faceUp = false;
        this.stock.push(card);
        this._event('restock');
      }
      this.pass++;
      return true;
    }
  }

  // plays what can be played to the foundations from tableau and waste
  autoMove() {
    let moves = [];
    let moved = false;
    while (true) {
      for (const fix of this.foundations.keys()) {
        for (const tix of this.tableau.keys()) {
          if (this.move('t', tix + 1, 1, 'f', fix + 1)) {
            moves.push(['t', tix + 1,'f', fix + 1]);
            moved = true;
          }
        }
        if (this.move('w', 0, 1, 'f', fix+1)) {
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

  // tests for win and raises event
  hasWon() {
    let f = this.foundations;
    if ([0].length == 13 && 
        f[1].length == 13 && 
        f[2].length == 13 && 
        f[3].length == 13) {
      this._event('won');
      return true;
    }
    return false;
  }

}

module.exports = {
  Game: Game
}
