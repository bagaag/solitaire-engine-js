let cards = require('./card.js');
let timers = require('./timer.js');

// add .last() method to arrays
if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
};

class Game {
  static EV = {
    TICK: 'tick',
    START: 'start',
    MOVE: 'move',
    REVEAL: 'reveal',
    DRAW: 'draw',
    RESTOCK: 'restock',
    WON: 'won'
  };
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
    this.timer = new timers.Timer(() => { this._event(Game.EV.TICK); });
    this._event(Game.EV.START);
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
        if (this.sameColor(card, dest)) {
          return false;
        }
        // must be one rank smaller than the parent card
        if (card.rank != dest.rank - 1) {
          return false;
        }
      }
    }
    else if (to == 'f') {
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
    else {
      return false;
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
    let evdata = {
      success: false,
      from: from, 
      fromIx: fromIx,
      fromCount: fromCount,
      to: to,
      toIx: toIx
    };
    if (!this.canMove(from, fromIx, fromCount, to, toIx)) {
      this._event(Game.EV.MOVE, evdata); 
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
      this._event(Game.EV.MOVE, evdata); 
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
    evdata.success = true;
    this._event(Game.EV.MOVE, evdata); 
    if (from == 't') {
      let last = this.tableau[fromIx - 1].last();
      if (last && !last.faceUp) {
        last.faceUp = true;
        this._event(Game.EV.REVEAL, {
          tableau: fromIx,
          card: last
        });
      }
    }
    return true;
  }

  // returns true if two cards' suites are of the same color
  sameColor(c1, c2) {
    return c1.suitVal() % 2 == c2.suitVal() % 2;
  }

  // returns true if two cards could live in the same tableau stack based on suit
  tableauCompatible(card1, card2) {
    let samePolarity = (card1.rank % 2) == (card2.rank % 2);
    let sameColor = this.sameColor(card1, card2);
    return samePolarity && sameColor;
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
          this._event(Game.EV.DRAW, { card: card, ix: i+1, count: count });
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
    if ((this.passLimit > 0 && this.pass >= this.passLimit) || this.waste.length == 0 || this.stock.length > 0) {
      this._event(Game.EV.RESTOCK, { success: false, pass: this.pass });
      return false;
    }
    else {
      while (this.waste.length > 0) {
        let card = this.waste.pop();
        card.faceUp = false;
        this.stock.push(card);
      }
      this.pass++;
      this._event(Game.EV.RESTOCK, { success: true, pass: this.pass});
      return true;
    }
  }

  // tests for win and raises event
  hasWon() {
    let f = this.foundations;
    if ([0].length == 13 && 
        f[1].length == 13 && 
        f[2].length == 13 && 
        f[3].length == 13) {
      this._event(Game.EV.WON);
      return true;
    }
    return false;
  }

}

module.exports = {
  Game: Game
}
